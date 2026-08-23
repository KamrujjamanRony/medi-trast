/**
 * Hardened client-side image validation.
 *
 * SECURITY NOTE: this runs in the browser and is therefore ONLY a usability /
 * cost-raising measure. An attacker can call the upload API directly and skip
 * every check in this file. The server MUST repeat all of these checks.
 * See SECURITY.md for the required server-side controls.
 */

export const MAX_IMAGE_BYTES = 3 * 1024 * 1024; // 3 MB

/** Extensions we are willing to send. Everything else is rejected. */
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'] as const;

/** Any of these appearing anywhere in a filename means it is not an image. */
const DANGEROUS_EXTENSIONS = [
  'php', 'php3', 'php4', 'php5', 'php7', 'phtml', 'phar',
  'asp', 'aspx', 'ashx', 'asmx', 'cshtml', 'config',
  'jsp', 'jspx', 'cgi', 'pl', 'py', 'rb', 'sh', 'bash',
  'exe', 'dll', 'com', 'bat', 'cmd', 'msi', 'scr', 'ps1', 'vbs', 'js', 'jar',
  'htaccess', 'htpasswd', 'svg', 'html', 'htm', 'xhtml',
];

interface Signature {
  readonly mime: string;
  readonly extensions: readonly string[];
  /** Byte sequences that must match, keyed by offset. */
  readonly magic: readonly { readonly offset: number; readonly bytes: readonly number[] }[];
}

const SIGNATURES: readonly Signature[] = [
  {
    mime: 'image/png',
    extensions: ['png'],
    magic: [{ offset: 0, bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] }],
  },
  {
    mime: 'image/jpeg',
    extensions: ['jpg', 'jpeg'],
    magic: [{ offset: 0, bytes: [0xff, 0xd8, 0xff] }],
  },
  {
    mime: 'image/webp',
    extensions: ['webp'],
    magic: [
      { offset: 0, bytes: [0x52, 0x49, 0x46, 0x46] }, // "RIFF"
      { offset: 8, bytes: [0x57, 0x45, 0x42, 0x50] }, // "WEBP"
    ],
  },
];

/**
 * Payload markers that must never appear inside an image we upload. Catches
 * "polyglot" files: a real PNG header with a webshell appended after the image
 * data, which is the standard way malware is smuggled past a magic-byte check.
 */
const PAYLOAD_MARKERS = [
  '<?php', '<?=', '<%', '<script', '<svg', '<!doctype html', '<html',
  '#!/bin/', 'shell_exec', 'base64_decode', 'eval(', 'system(', 'passthru(',
];

export type FileValidationResult =
  | { readonly ok: true; readonly file: File }
  | { readonly ok: false; readonly error: string };

/** Strips directory components and anything that is not a safe filename char. */
export function sanitizeFileName(rawName: string): string {
  const base = rawName.split(/[\/]/).pop() ?? '';
  const cleaned = base
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/[^A-Za-z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^\.+/, '');

  const lastDot = cleaned.lastIndexOf('.');
  const stem = (lastDot > 0 ? cleaned.slice(0, lastDot) : cleaned).slice(0, 80) || 'image';
  const ext = lastDot > 0 ? cleaned.slice(lastDot + 1).toLowerCase() : '';

  return ext ? `${stem}.${ext}` : stem;
}

function extensionOf(name: string): string {
  const lastDot = name.lastIndexOf('.');
  return lastDot > 0 ? name.slice(lastDot + 1).toLowerCase() : '';
}

/** True if ANY dot-segment of the name is a dangerous extension (evil.php.png). */
function hasDangerousSegment(name: string): boolean {
  return name
    .toLowerCase()
    .split('.')
    .slice(1)
    .some((segment) => DANGEROUS_EXTENSIONS.includes(segment));
}

function matchesSignature(bytes: Uint8Array, signature: Signature): boolean {
  return signature.magic.every(({ offset, bytes: expected }) =>
    expected.every((value, i) => bytes[offset + i] === value),
  );
}

function containsPayloadMarker(bytes: Uint8Array): boolean {
  // Latin-1 decode keeps byte offsets 1:1 so markers cannot be split.
  const text = new TextDecoder('latin1').decode(bytes).toLowerCase();
  return PAYLOAD_MARKERS.some((marker) => text.includes(marker));
}

/** Confirms the browser can actually decode the bytes as an image. */
async function isDecodableImage(file: File): Promise<boolean> {
  if (typeof createImageBitmap !== 'function') {
    return true; // Cannot verify here; server-side re-encode is the real check.
  }
  try {
    const bitmap = await createImageBitmap(file);
    const valid = bitmap.width > 0 && bitmap.height > 0;
    bitmap.close();
    return valid;
  } catch {
    return false;
  }
}

/**
 * Validates an uploaded image against extension, declared MIME type, real magic
 * bytes, embedded payload markers, size and decodability. Resolves with a File
 * carrying a sanitized name, or with an error message safe to show the user.
 */
export async function validateImageFile(file: File): Promise<FileValidationResult> {
  if (file.size === 0) {
    return { ok: false, error: 'That file is empty. Please choose a valid image.' };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    const limitMb = Math.round(MAX_IMAGE_BYTES / (1024 * 1024));
    return { ok: false, error: `That file is too large. Maximum size is ${limitMb} MB.` };
  }

  const safeName = sanitizeFileName(file.name);
  if (hasDangerousSegment(safeName)) {
    return { ok: false, error: 'That filename is not allowed. Please rename the file.' };
  }

  const extension = extensionOf(safeName);
  if (!ALLOWED_EXTENSIONS.includes(extension as (typeof ALLOWED_EXTENSIONS)[number])) {
    return { ok: false, error: 'Only JPG, PNG and WEBP images can be uploaded.' };
  }

  const signature = SIGNATURES.find((candidate) => candidate.extensions.includes(extension));
  if (!signature) {
    return { ok: false, error: 'Only JPG, PNG and WEBP images can be uploaded.' };
  }

  // The browser-declared type is attacker-controlled, but a mismatch is still a
  // clear signal something is wrong.
  if (file.type && file.type.toLowerCase() !== signature.mime) {
    return { ok: false, error: 'The file contents do not match its extension.' };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!matchesSignature(bytes, signature)) {
    return { ok: false, error: 'The file contents do not match its extension.' };
  }
  if (containsPayloadMarker(bytes)) {
    return { ok: false, error: 'That image contains embedded code and was rejected.' };
  }
  if (!(await isDecodableImage(file))) {
    return { ok: false, error: 'That image could not be decoded. Please choose another file.' };
  }

  return {
    ok: true,
    file: new File([bytes], safeName, { type: signature.mime, lastModified: file.lastModified }),
  };
}

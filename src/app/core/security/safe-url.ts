/**
 * Helpers for turning values that come back from the API into links.
 *
 * Contact/product records are attacker-writable (the API accepts unauthenticated
 * writes), so every URL derived from them is untrusted input. Building an href
 * as `'http://' + value` lets a stored value like `javascript:...`,
 * `evil.com#`, or `data:text/html,...` decide where the user is sent.
 */

const ALLOWED_PROTOCOLS = ['http:', 'https:'];

/**
 * Normalises an API-supplied link to an absolute https URL, or returns null if
 * it is missing or not a plain web address.
 */
export function toSafeExternalUrl(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  // Reject control characters, which are used to smuggle "java\nscript:".
  // eslint-disable-next-line no-control-regex
  if (!trimmed || /[\u0000-\u001f\u007f\s]/.test(trimmed)) {
    return null;
  }

  const candidate = /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return null;
  }

  if (!ALLOWED_PROTOCOLS.includes(parsed.protocol.toLowerCase())) {
    return null;
  }
  if (!parsed.hostname || !parsed.hostname.includes('.')) {
    return null;
  }

  // Reject embedded credentials. `https://trusted.com@evil.com` navigates to
  // evil.com while reading as trusted.com, which is the standard way a stored
  // link is disguised. It also catches a plain email address being saved in a
  // website field: `name@gmail.com` would otherwise parse as host gmail.com
  // with the username `name`, and render as a working link to Gmail.
  if (parsed.username || parsed.password) {
    return null;
  }

  // Prefer https even when the stored value said http.
  if (parsed.protocol.toLowerCase() === 'http:') {
    parsed.protocol = 'https:';
  }
  return parsed.toString();
}

/** Normalises an API-supplied address into a mailto: link, or null. */
export function toSafeMailto(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  const address = value.trim();
  if (!/^[^\s<>()[\]\,;:@"]+@[^\s<>()[\]\.,;:@"]+\.[^\s<>()[\]\.,;:@"]{2,}$/.test(address)) {
    return null;
  }
  return `mailto:${encodeURIComponent(address).replace(/%40/g, '@')}`;
}

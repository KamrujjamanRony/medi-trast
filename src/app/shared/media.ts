import { environment } from '@environments/environments';

/**
 * Builds the absolute URL for an image stored by the API.
 *
 * The old templates inlined `product.imageUrl !== '' ? ImageApi + product.imageUrl : emptyImg`,
 * which only guarded against the empty string — a `null` or missing `imageUrl`
 * produced a request for `.../Images/null` and a broken-image icon.
 */
export function imageUrl(path: string | null | undefined): string {
  const trimmed = path?.trim();
  if (!trimmed) {
    return environment.emptyImg;
  }
  return `${environment.ImageApi}${encodeURIComponent(trimmed)}`;
}

/** Placeholder used when an image URL is missing or fails to load. */
export const PLACEHOLDER_IMAGE = environment.emptyImg;

/**
 * Splits a stored phone field into individual numbers.
 *
 * Each `phoneNumberN` field holds a comma-separated list rather than one
 * number, e.g. `"+8801723340567,+8801726976029,+8801703821292"`. The old
 * templates printed the whole field as a single line.
 */
export function splitPhoneNumbers(value: string | null | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

/**
 * Turns a stored phone number into a `tel:` link, or null if it is not dialable.
 *
 * Handles the trailing-range notation used in the data
 * (`+8801897672580/81/82/…`) by dialling the first number in the range —
 * concatenating the whole string produced an unusable 40-digit `tel:` href.
 */
export function toTelHref(value: string | null | undefined): string | null {
  const first = (value ?? '').split(/[,/]/)[0] ?? '';
  const digits = first.replace(/[^\d+]/g, '');
  return digits.length >= 6 ? `tel:${digits}` : null;
}

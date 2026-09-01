import { environment } from '@environments/environments';
import { imageUrl, splitPhoneNumbers, toTelHref } from './media';

describe('imageUrl', () => {
  it('builds an absolute URL from a stored path', () => {
    expect(imageUrl('pump.png')).toBe(`${environment.ImageApi}pump.png`);
  });

  /**
   * The old templates only tested `imageUrl !== ''`, so a null or missing value
   * produced a request for `.../Images/null` and a broken-image icon.
   */
  it.each([null, undefined, '', '   '])('falls back to the placeholder for %p', (value) => {
    expect(imageUrl(value)).toBe(environment.emptyImg);
  });

  it('encodes characters that would otherwise break the URL', () => {
    expect(imageUrl('x ray & scan.png')).toBe(`${environment.ImageApi}x%20ray%20%26%20scan.png`);
  });
});

describe('splitPhoneNumbers', () => {
  /** The live data stores several numbers in one comma-separated field. */
  it('splits a comma-separated field into individual numbers', () => {
    expect(splitPhoneNumbers('+8801723340567,+8801726976029,+8801703821292')).toEqual([
      '+8801723340567',
      '+8801726976029',
      '+8801703821292',
    ]);
  });

  it.each([null, undefined, '', '  ,  ,'])('returns nothing for %p', (value) => {
    expect(splitPhoneNumbers(value)).toEqual([]);
  });
});

describe('toTelHref', () => {
  it('strips formatting from a dialable number', () => {
    expect(toTelHref('+880 1318-346607')).toBe('tel:+8801318346607');
  });

  /**
   * The live data uses a trailing range, `+8801897672580/81/82/…`. Keeping the
   * whole string produced a 40-digit href that no phone could dial.
   */
  it('dials the first number of a range', () => {
    expect(toTelHref('+8801897672580/81/82/83')).toBe('tel:+8801897672580');
  });

  it('dials the first number of a comma-separated field', () => {
    expect(toTelHref('+8801723340567,+8801726976029')).toBe('tel:+8801723340567');
  });

  it('rejects values that are not phone numbers', () => {
    expect(toTelHref('call us')).toBeNull();
    expect(toTelHref('123')).toBeNull();
    expect(toTelHref(null)).toBeNull();
  });
});

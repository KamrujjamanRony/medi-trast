import { toSafeExternalUrl, toSafeMailto } from './safe-url';

/**
 * These values come from an API that accepts unauthenticated writes, so they
 * are attacker-controlled. The footer, header and contact page all build hrefs
 * from them.
 */
describe('toSafeExternalUrl', () => {
  it('upgrades a bare host to https', () => {
    expect(toSafeExternalUrl('example.com')).toBe('https://example.com/');
  });

  it('rewrites http to https', () => {
    expect(toSafeExternalUrl('http://example.com/page')).toBe('https://example.com/page');
  });

  it.each([
    'javascript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'vbscript:msgbox(1)',
    'file:///etc/passwd',
  ])('rejects the dangerous scheme in %p', (value) => {
    expect(toSafeExternalUrl(value)).toBeNull();
  });

  it('rejects control characters used to smuggle a scheme', () => {
    expect(toSafeExternalUrl('java\nscript:alert(1)')).toBeNull();
    expect(toSafeExternalUrl('java\tscript:alert(1)')).toBeNull();
  });

  it.each([null, undefined, '', '   ', 'localhost', 'not a url'])(
    'rejects the unusable value %p',
    (value) => {
      expect(toSafeExternalUrl(value)).toBeNull();
    },
  );

  /**
   * `https://trusted.com@evil.com` navigates to evil.com while reading as
   * trusted.com. The same rule catches an email address saved in a website
   * field, which would otherwise have linked to the mail provider's homepage.
   */
  it.each([
    'https://google.com@evil.com',
    'trusted.com@evil.com',
    'https://user:pass@evil.com',
    'meditrustengineers@gmail.com',
  ])('rejects credentials embedded in %p', (value) => {
    expect(toSafeExternalUrl(value)).toBeNull();
  });
});

describe('toSafeMailto', () => {
  it('builds a mailto link for a real address', () => {
    expect(toSafeMailto('meditrust71@gmail.com')).toBe('mailto:meditrust71@gmail.com');
  });

  it.each(['not-an-email', 'a@b', 'a b@example.com', '<script>@example.com', null])(
    'rejects %p',
    (value) => {
      expect(toSafeMailto(value)).toBeNull();
    },
  );
});

# Security

## Read this first

This is a **frontend-only** application. It talks to an API at
`https://mec.supersoftbd.com/apiA/` that this repository does not control.

**The hardening in this repository cannot stop the attacker who is uploading
malware to your site.** Everything here runs in the visitor's browser, and the
visitor controls the browser. As long as the API accepts writes without
authentication, an attacker can skip this application entirely:

```
curl -X POST https://mec.supersoftbd.com/apiA/Product \
     -F "CompanyID=1" -F "ProductName=x" -F "ImageFormFile=@payload.php.png"
```

No amount of Angular code changes that. The section
[What the API must do](#what-the-api-must-do) is the actual fix, and it has to be
implemented by whoever runs `mec.supersoftbd.com`.

---

## What was wrong

| # | Issue | Severity | Status |
|---|-------|----------|--------|
| 1 | Admin password `11223` shipped as plain text in `main.js` | Critical | Fixed (frontend) |
| 2 | API accepts unauthenticated create/update/delete and file upload | Critical | **Server-side — NOT fixed** |
| 3 | Upload validation was client-side only, and the magic-byte check was bypassable | High | Mitigated |
| 4 | No Content-Security-Policy — injected script ran freely | High | Fixed |
| 5 | Remote, unversioned, unpinned `kit.fontawesome.com` script with full DOM access | High | Fixed |
| 6 | No security response headers (nosniff, frame options, HSTS, referrer) | High | Fixed |
| 7 | `bypassSecurityTrustResourceUrl` with an uninterpolated value | Medium | Fixed |
| 8 | `[href]="'http://' + apiValue"` — untrusted API data used to build links | Medium | Fixed |
| 9 | Deep links into `/mte12/*` were not guarded | Medium | Fixed |
| 10 | Production build shipped the wrong environment file and source maps | Medium | Fixed |
| 11 | 20 vulnerable npm dependencies | Medium | 14 remain (need major upgrades) |

### 1. Admin password in the bundle

`environment.authKey` was `"11223"`, compared in the browser:

```ts
this.pass === environment.authKey ? this.isAuthorized = true : ...
```

Anyone could run `curl https://yoursite/main-XXXX.js | grep -o '11223'` and read it.

Now `src/environments/*.ts` holds only a **PBKDF2-SHA256 salt and hash**
(310,000 iterations). The password is never compiled in. Verification happens in
`src/app/core/security/admin-auth.service.ts` via WebCrypto, with:

- a **constant-time** comparison,
- **5-attempt lockout** for 15 minutes,
- **20-minute idle auto-lock**,
- session state kept **in memory only** — nothing forgeable in `localStorage`.

Measured cost is ~116 ms per guess, against a 24-character password.

**Your new password is in `ADMIN-CREDENTIALS.txt`** (git-ignored). Save it in a
password manager and delete that file.

To change it:

```bash
node tools/generate-admin-hash.mjs "your new password"
# copy the adminAuth block into BOTH files in src/environments/
```

> Still only a speed bump. Someone with DevTools can set `unlockedUntil` by hand.
> Its real value is that your password is no longer published, and that the
> delete dialog can no longer be used as a brute-force oracle.

### 3. File upload validation

The old check converted bytes with `byte.toString(16)` — **no zero padding**, so
byte `0x0A` became `"a"` instead of `"0a"` and the hex string was misaligned for
any file containing a byte below `0x10`. It also read the entire file into
memory, and set `this.file` asynchronously so a fast submit uploaded nothing.

`src/app/core/security/file-validation.ts` replaces all four copies with checks for
extension allowlist, double extensions (`evil.php.png`), declared MIME type,
real magic bytes (PNG/JPEG/WEBP), **embedded payload markers** (`<?php`,
`<script`, `shell_exec`, …) which is how polyglot webshells get past magic-byte
checks, a 3 MB size cap, filename sanitisation, and a real decode via
`createImageBitmap`.

### 9. Admin route guard

The guard is applied **per child route**, never as the parent's
`canActivateChild`. The guard redirects to `/mte12`, and `/mte12` resolves to
the empty-path child — so guarding that child makes it redirect to itself in an
infinite synchronous loop that hangs the browser tab.

The empty-path child is safe unguarded because `AdminLayoutComponent` only
renders its `<router-outlet>` in the unlocked branch, so the routed component
is never constructed while the panel is locked.

> The admin panel URL is **`/#/mte12`**, with the hash. The app uses
> `withHashLocation()`, so `/mte12` without the `#` just loads the home page.

### 4 & 6. CSP and security headers

`script-src 'self'` is the single most valuable control here: injected inline
script and script from any other host will not execute. Verified against a real
headless Chrome — the app boots with **zero CSP violations**.

The policy lives in **two** places and they must be kept in sync:

- `web.config` — the authoritative response header (also carries `frame-ancestors`)
- `src/index.html` — a `<meta>` fallback for hosts that ignore `web.config`

`X-Content-Type-Options: nosniff` matters specifically for your problem: it stops
the browser from re-interpreting an uploaded "image" as HTML or JavaScript.

---

## What the API must do

Hand this list to whoever maintains `mec.supersoftbd.com/apiA`. Items 1 and 2
are what stop the malware uploads.

1. **Require authentication on every write.**
   `POST`/`PUT`/`DELETE` on `Product`, `Carousel`, `AboutUs` and `Address` must
   reject requests without a valid token (401). Reads may stay public.
   Log every write with a timestamp and source IP.

2. **Re-validate every upload server-side.** The browser checks are advisory.
   - Allowlist content types; reject everything else.
   - Verify magic bytes server-side.
   - **Re-encode the image** (decode and write a fresh file). This is the single
     most effective control: it destroys any appended payload.
   - **Generate a new random filename**; never trust the client's.
   - Force the extension from the detected type.
   - Enforce a size cap.

3. **Make the upload directory inert.** In IIS, for the `/Images` folder:
   - remove Execute permission,
   - remove all handler mappings (`<handlers><clear /></handlers>`),
   - serve with `X-Content-Type-Options: nosniff` and
     `Content-Disposition: attachment` where practical.
   A `.png` that is really a webshell is harmless if the server will never run it.

4. **Restrict CORS** to your own origins instead of `*`.

5. **Rate-limit** writes and login attempts.

6. **Audit what is already there.** Assume the attacker already uploaded
   something. List every file under `/Images`, and flag any whose real content
   does not match its extension:

   ```bash
   # Anything that is not actually an image:
   find /path/to/Images -type f -exec sh -c 'file --mime-type -b "$1" | grep -q "^image/" || echo "SUSPECT: $1"' _ {} \;

   # Anything containing PHP/ASP/script markers:
   grep -rlIE '<\?php|<%|<script' /path/to/Images
   ```

   Cleaning the frontend is pointless if a webshell is still sitting on the server.

---

## Remaining dependency vulnerabilities

`npm audit fix` was applied (20 → 14 in production dependencies). The rest need
major upgrades that would break the UI:

- `igniteui-angular` 16 → 22 (`uuid` advisory)
- `@angular/cdk` and `@angular/material` are on 16 while `@angular/core` is on 19

That peer mismatch is why `npm install` needs `--legacy-peer-deps`. Aligning
Material/CDK to 19 is worth scheduling, but it is a UI regression risk and was
deliberately left out of this pass.

## Known non-security breakage

The header logo (`src/app/components/header/header.component.html`) points at
`https://drive.google.com/uc?id=16joeL1nOPhRfLT6l1dM5byY4OzZeh_Qv`, which now
redirects to a Google sign-in page — the file is no longer publicly shared. This
was already broken before these changes. Host the logo in `src/assets/` instead;
you can then also drop the Google hosts from `img-src` in the CSP.

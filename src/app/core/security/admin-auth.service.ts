import { Injectable, computed, signal } from '@angular/core';
import { environment } from '@environments/environments';

/**
 * Gate for the /mte12 admin panel.
 *
 * SECURITY NOTE: this is a browser-side gate. It cannot be trusted, because the
 * user controls the browser. Its purpose is narrow but real:
 *
 *   - the admin password is no longer shipped in plain text inside main.js
 *     (only a PBKDF2-SHA256 salt + hash are, which is expensive to crack),
 *   - guessing is rate-limited and locked out,
 *   - an idle session expires instead of staying open forever.
 *
 * The API at environment.*Api still accepts unauthenticated writes, so an
 * attacker can bypass this entirely by calling it directly. Server-side
 * authentication is the only actual fix. See SECURITY.md.
 *
 * The unlocked state is exposed as a signal. Under Angular's zoneless change
 * detection the previous plain getter would not have re-rendered the panel when
 * the session expired — nothing told the framework the value had changed.
 */

const SESSION_TIMEOUT_MS = 20 * 60 * 1000; // auto-lock after 20 minutes idle
const CLOCK_TICK_MS = 15 * 1000;
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;
const LOCKOUT_STORAGE_KEY = 'mte.admin.lockout';

export type UnlockResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly error: string };

interface LockoutState {
  attempts: number;
  lockedUntil: number;
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Length-independent, branch-free comparison so timing leaks nothing. */
function constantTimeEquals(a: string, b: string): boolean {
  const length = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < length; i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  /**
   * Held in memory only. Deliberately NOT persisted: a flag in localStorage or
   * a cookie would just be another thing an attacker can set by hand, and it
   * would survive across tabs.
   */
  private readonly unlockedUntil = signal(0);

  /** Coarse clock so `isUnlocked` re-evaluates as the idle deadline passes. */
  private readonly clock = signal(Date.now());
  private ticker?: ReturnType<typeof setInterval>;

  /** True while the current session is unlocked and not idle-expired. */
  readonly isUnlocked = computed(() => this.unlockedUntil() > this.clock());

  /** True once an unlocked session has lapsed, so the UI can explain why. */
  readonly didTimeOut = signal(false);

  /**
   * Authoritative, non-reactive check. The cached `clock` can lag by up to
   * CLOCK_TICK_MS, which is fine for rendering but not for a route guard.
   */
  checkUnlocked(): boolean {
    this.clock.set(Date.now());
    return this.isUnlocked();
  }

  /** Extends the idle timeout. Call on meaningful admin activity. */
  touch(): void {
    if (this.unlockedUntil() !== 0) {
      this.unlockedUntil.set(Date.now() + SESSION_TIMEOUT_MS);
    }
  }

  lock(): void {
    this.unlockedUntil.set(0);
    this.stopTicker();
  }

  /** Milliseconds remaining on an active lockout, or 0 if not locked out. */
  lockoutRemainingMs(): number {
    return Math.max(0, this.readLockout().lockedUntil - Date.now());
  }

  async unlock(password: string): Promise<UnlockResult> {
    const remaining = this.lockoutRemainingMs();
    if (remaining > 0) {
      const minutes = Math.ceil(remaining / 60000);
      return { ok: false, error: `Too many failed attempts. Try again in ${minutes} minute(s).` };
    }

    if (!password) {
      return { ok: false, error: 'Please enter the security key.' };
    }

    const subtle = globalThis.crypto?.subtle;
    if (!subtle) {
      // Only available in secure contexts. Failing closed is the safe choice.
      return { ok: false, error: 'This page must be served over HTTPS to sign in.' };
    }

    const { salt, hash, iterations } = environment.adminAuth;
    const saltBytes = Uint8Array.from(salt.match(/.{2}/g) ?? [], (byte) => parseInt(byte, 16));

    const keyMaterial = await subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      'PBKDF2',
      false,
      ['deriveBits'],
    );
    const derived = await subtle.deriveBits(
      { name: 'PBKDF2', salt: saltBytes, iterations, hash: 'SHA-256' },
      keyMaterial,
      256,
    );

    if (!constantTimeEquals(toHex(derived), hash)) {
      this.recordFailure();
      const left = MAX_ATTEMPTS - this.readLockout().attempts;
      return {
        ok: false,
        error:
          left > 0
            ? `Incorrect security key. ${left} attempt(s) remaining.`
            : 'Too many failed attempts. This panel is locked for 15 minutes.',
      };
    }

    this.clearLockout();
    this.didTimeOut.set(false);
    this.clock.set(Date.now());
    this.unlockedUntil.set(Date.now() + SESSION_TIMEOUT_MS);
    this.startTicker();
    return { ok: true };
  }

  private startTicker(): void {
    this.stopTicker();
    this.ticker = setInterval(() => {
      this.clock.set(Date.now());
      if (!this.isUnlocked()) {
        this.didTimeOut.set(true);
        this.stopTicker();
      }
    }, CLOCK_TICK_MS);
  }

  private stopTicker(): void {
    if (this.ticker) {
      clearInterval(this.ticker);
      this.ticker = undefined;
    }
  }

  private readLockout(): LockoutState {
    try {
      const raw = sessionStorage.getItem(LOCKOUT_STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          const state = parsed as Partial<LockoutState>;
          return {
            attempts: typeof state.attempts === 'number' ? state.attempts : 0,
            lockedUntil: typeof state.lockedUntil === 'number' ? state.lockedUntil : 0,
          };
        }
      }
    } catch {
      // Storage disabled or corrupt; treat as a clean slate.
    }
    return { attempts: 0, lockedUntil: 0 };
  }

  private writeLockout(state: LockoutState): void {
    try {
      sessionStorage.setItem(LOCKOUT_STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Nothing to do; the in-request PBKDF2 cost still throttles guessing.
    }
  }

  private recordFailure(): void {
    const state = this.readLockout();
    state.attempts += 1;
    if (state.attempts >= MAX_ATTEMPTS) {
      state.lockedUntil = Date.now() + LOCKOUT_MS;
      state.attempts = MAX_ATTEMPTS;
    }
    this.writeLockout(state);
  }

  private clearLockout(): void {
    try {
      sessionStorage.removeItem(LOCKOUT_STORAGE_KEY);
    } catch {
      // Ignore.
    }
  }
}

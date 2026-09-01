import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormField, FormRoot, form, required } from '@angular/forms/signals';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AdminAuthService } from 'app/core/security/admin-auth.service';
import { AboutService } from 'app/features/services/about.service';
import { ContactService } from 'app/features/services/contact.service';
import { FieldError } from 'app/shared/ui/field-error';
import { Icon } from 'app/shared/ui/icon';

/**
 * Admin shell: the lock screen, or the panel chrome once unlocked.
 *
 * The unlocked state now comes from a signal on `AdminAuthService`. It was
 * previously a plain getter polled by a 30-second `setInterval`; under Angular's
 * zoneless change detection nothing would have told the framework the value had
 * changed, so an expired session would have kept rendering the panel until some
 * unrelated event happened to trigger a check.
 */
@Component({
  selector: 'app-admin-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, FormField, FormRoot, FieldError, Icon],
  host: {
    '(document:pointerdown)': 'onActivity()',
    '(document:keydown)': 'onActivity()',
  },
  template: `
    @if (!auth.isUnlocked()) {
      <div class="lock-screen">
        <div class="lock-card">
          <span class="lock-badge"><app-icon name="lock" [size]="22" /></span>
          <h1 class="mt-4 text-xl font-bold text-ink-900">Admin panel</h1>
          <p class="mt-1 text-sm text-ink-500">
            Enter the security key to manage products and carousel slides.
          </p>

          @if (auth.didTimeOut()) {
            <div class="alert alert-info mt-5">
              <app-icon name="info" [size]="17" />
              <span>Your session timed out after 20 minutes of inactivity.</span>
            </div>
          }

          <form [formRoot]="loginForm" class="mt-5 grid gap-4 text-left">
            <div class="field">
              <label class="field-label" for="security-key">Security key</label>
              <input
                id="security-key"
                type="password"
                class="input"
                [class.is-invalid]="loginForm.key().touched() && loginForm.key().invalid()"
                autocomplete="current-password"
                spellcheck="false"
                placeholder="Enter your security key"
                [formField]="loginForm.key"
              />
              <app-field-error [field]="loginForm.key" />
              @if (authError(); as message) {
                <p class="field-error" role="alert">
                  <app-icon name="alert" [size]="15" />
                  <span>{{ message }}</span>
                </p>
              }
            </div>

            <button type="submit" class="btn btn-primary btn-block" [disabled]="isChecking()">
              @if (isChecking()) {
                <span class="spinner"></span>
                <span>Checking…</span>
              } @else {
                <app-icon name="unlock" [size]="17" />
                <span>Unlock panel</span>
              }
            </button>
          </form>

          <a class="mt-5 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-brand-700" routerLink="/">
            <app-icon name="arrow-left" [size]="15" />
            <span>Back to the website</span>
          </a>
        </div>
      </div>
    } @else {
      <div class="admin-shell">
        <!-- Sidebar -->
        <aside class="sidebar" [class.is-open]="navOpen()">
          <a routerLink="/" class="sidebar-brand">
            <span class="sidebar-mark"><app-icon name="layers" [size]="18" /></span>
            <span class="grid">
              <span class="text-sm font-semibold text-white">Medi-Trust</span>
              <span class="text-[0.6875rem] tracking-wider text-white/50 uppercase">Admin</span>
            </span>
          </a>

          <nav class="grid gap-1 p-3" aria-label="Admin sections">
            <a class="side-link" routerLink="/mte12/products" routerLinkActive="is-active" (click)="closeNav()">
              <app-icon name="grid" [size]="18" />
              <span>Products</span>
            </a>
            <a class="side-link" routerLink="/mte12/carousel" routerLinkActive="is-active" (click)="closeNav()">
              <app-icon name="image" [size]="18" />
              <span>Carousel</span>
            </a>
            @if (aboutId(); as id) {
              <a class="side-link" [routerLink]="['/mte12/about-us', id]" routerLinkActive="is-active" (click)="closeNav()">
                <app-icon name="message" [size]="18" />
                <span>About Us</span>
              </a>
            }
            @if (contactId(); as id) {
              <a class="side-link" [routerLink]="['/mte12/contact-us', id]" routerLinkActive="is-active" (click)="closeNav()">
                <app-icon name="phone" [size]="18" />
                <span>Contact Us</span>
              </a>
            }

            <span class="my-2 border-t border-white/10"></span>

            <!-- The old sidebar's last item was an inert href="#" labelled Home. -->
            <a class="side-link" routerLink="/" (click)="closeNav()">
              <app-icon name="home" [size]="18" />
              <span>View website</span>
            </a>
          </nav>

          <p class="mt-auto p-4 text-center text-xs text-white/35">Built by SuperSoft</p>
        </aside>

        @if (navOpen()) {
          <button type="button" class="scrim lg:hidden" aria-label="Close menu" (click)="closeNav()"></button>
        }

        <div class="admin-main">
          <header class="admin-topbar">
            <button
              type="button"
              class="btn btn-ghost btn-icon lg:hidden"
              [attr.aria-expanded]="navOpen()"
              aria-label="Toggle admin menu"
              (click)="toggleNav()"
            >
              <app-icon [name]="navOpen() ? 'x' : 'menu'" [size]="22" />
            </button>
            <p class="text-sm font-medium text-ink-600">Admin panel</p>
            <button type="button" class="btn btn-outline btn-sm ml-auto" (click)="lock()">
              <app-icon name="lock" [size]="15" />
              <span>Lock panel</span>
            </button>
          </header>

          <main class="admin-content">
            <router-outlet />
          </main>
        </div>
      </div>
    }
  `,
  styles: `
    .lock-screen {
      display: grid;
      place-items: center;
      min-height: 100dvh;
      padding: 1.5rem;
      background: linear-gradient(150deg, var(--color-ink-900), var(--color-brand-900));
    }

    .lock-card {
      width: min(26rem, 100%);
      border-radius: var(--radius-card);
      background: var(--color-surface);
      padding: 2rem;
      text-align: center;
      box-shadow: var(--shadow-float);
    }

    .lock-badge {
      display: inline-grid;
      place-items: center;
      width: 3rem;
      height: 3rem;
      border-radius: 999px;
      background: var(--color-brand-50);
      color: var(--color-brand-600);
    }

    .admin-shell {
      min-height: 100dvh;
      background: var(--color-page);
    }

    .sidebar {
      position: fixed;
      inset-block: 0;
      left: 0;
      z-index: 40;
      display: flex;
      flex-direction: column;
      width: 15rem;
      background: var(--color-ink-900);
      transform: translateX(-100%);
      transition: transform 0.24s var(--ease-out-soft);
    }

    .sidebar.is-open {
      transform: none;
    }

    @media (min-width: 1024px) {
      .sidebar {
        transform: none;
      }

      .admin-main {
        margin-left: 15rem;
      }
    }

    .sidebar-brand {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      border-bottom: 1px solid rgb(255 255 255 / 0.08);
      padding: 1rem;
      text-decoration: none;
    }

    .sidebar-mark {
      display: grid;
      place-items: center;
      width: 2rem;
      height: 2rem;
      border-radius: 0.5rem;
      background: var(--color-brand-600);
      color: #fff;
    }

    .side-link {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      border-radius: var(--radius-control);
      padding: 0.625rem 0.75rem;
      font-size: 0.875rem;
      font-weight: 500;
      color: rgb(255 255 255 / 0.7);
      text-decoration: none;
      transition:
        background-color 0.18s var(--ease-out-soft),
        color 0.18s var(--ease-out-soft);
    }

    .side-link:hover {
      background: rgb(255 255 255 / 0.07);
      color: #fff;
    }

    .side-link.is-active {
      background: var(--color-brand-600);
      color: #fff;
    }

    .scrim {
      position: fixed;
      inset: 0;
      z-index: 30;
      border: 0;
      background: rgb(11 15 19 / 0.5);
      cursor: pointer;
    }

    .admin-topbar {
      position: sticky;
      top: 0;
      z-index: 20;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      border-bottom: 1px solid var(--color-ink-200);
      background: var(--color-surface);
      padding: 0.625rem 1rem;
    }

    .admin-content {
      padding-bottom: 3rem;
    }
  `,
})
export class AdminLayout {
  protected readonly auth = inject(AdminAuthService);

  private readonly router = inject(Router);
  private readonly aboutService = inject(AboutService);
  private readonly contactService = inject(ContactService);

  protected readonly aboutId = () => this.aboutService.about()?.id ?? null;
  protected readonly contactId = () => this.contactService.contact()?.id ?? null;

  protected readonly authError = signal('');
  protected readonly isChecking = signal(false);
  protected readonly navOpen = signal(false);

  private readonly model = signal({ key: '' });

  protected readonly loginForm = form(
    this.model,
    (path) => {
      required(path.key, { message: 'Enter the security key.' });
    },
    {
      submission: {
        action: async () => {
          await this.attemptUnlock();
          return undefined;
        },
      },
    },
  );

  private async attemptUnlock(): Promise<void> {
    if (this.isChecking()) {
      return;
    }
    this.isChecking.set(true);
    this.authError.set('');
    try {
      const result = await this.auth.unlock(this.model().key);
      if (!result.ok) {
        this.authError.set(result.error);
      }
    } catch {
      this.authError.set('Could not verify the security key. Please try again.');
    } finally {
      // Never leave the typed key sitting in component state.
      this.model.set({ key: '' });
      this.loginForm().reset();
      this.isChecking.set(false);
    }
  }

  /** Any interaction inside the panel pushes back the idle auto-lock. */
  protected onActivity(): void {
    this.auth.touch();
  }

  protected toggleNav(): void {
    this.navOpen.update((open) => !open);
  }

  protected closeNav(): void {
    this.navOpen.set(false);
  }

  protected lock(): void {
    this.auth.lock();
    void this.router.navigateByUrl('/');
  }
}

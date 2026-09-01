import { ChangeDetectionStrategy, Component, ElementRef, inject, output, signal, viewChild } from '@angular/core';
import { FormField, FormRoot, form, required } from '@angular/forms/signals';
import { AdminAuthService } from 'app/core/security/admin-auth.service';
import { Icon } from './icon';

/**
 * Delete confirmation, re-verified with the admin security key.
 *
 * Replaces the `MatDialog` version, which was the only reason the project
 * depended on `@angular/material` and `@angular/cdk` (both pinned at v16 and so
 * incompatible with Angular 22) and on Material's `purple-green` prebuilt theme,
 * a full stylesheet loaded on every page that also fought the site palette.
 *
 * A native `<dialog>` gives focus trapping, inert background, Escape-to-close
 * and correct AT semantics with no framework code. The old dialog was also
 * absolutely positioned at a fixed 50%/50% with no max-height, so on a short
 * viewport its buttons were unreachable.
 */
@Component({
  selector: 'app-confirm-delete',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, FormRoot, Icon],
  template: `
    <dialog #dialog class="confirm-dialog" (close)="onNativeClose()">
      <form [formRoot]="challenge" class="grid gap-5">
        <div class="flex items-start gap-3">
          <span
            class="grid size-10 flex-none place-items-center rounded-full bg-accent-50 text-accent-600"
          >
            <app-icon name="trash" [size]="20" />
          </span>
          <div class="grid gap-1">
            <h2 class="text-lg font-semibold text-ink-900">Delete this item?</h2>
            <p class="text-sm text-ink-500">
              {{ description() }} This cannot be undone.
            </p>
          </div>
        </div>

        <div class="field">
          <label class="field-label" for="confirm-key">Confirm with your security key</label>
          <input
            id="confirm-key"
            type="password"
            class="input"
            [class.is-invalid]="challenge.password().touched() && challenge.password().invalid()"
            autocomplete="current-password"
            spellcheck="false"
            placeholder="Security key"
            [formField]="challenge.password"
          />
          @if (errorText(); as message) {
            <p class="field-error" role="alert">
              <app-icon name="alert" [size]="15" />
              <span>{{ message }}</span>
            </p>
          }
        </div>

        <div class="flex justify-end gap-2">
          <button type="button" class="btn btn-outline" (click)="close()">Cancel</button>
          <button type="submit" class="btn btn-danger" [disabled]="isChecking()">
            @if (isChecking()) {
              <span class="spinner"></span>
              <span>Checking…</span>
            } @else {
              <app-icon name="trash" [size]="16" />
              <span>Delete</span>
            }
          </button>
        </div>
      </form>
    </dialog>
  `,
  styles: `
    .confirm-dialog {
      width: min(28rem, calc(100vw - 2rem));
      max-height: calc(100dvh - 2rem);
      overflow: auto;
      margin: auto;
      border: 1px solid var(--color-ink-200);
      border-radius: var(--radius-card);
      background: var(--color-surface);
      padding: 1.5rem;
      box-shadow: var(--shadow-float);
    }

    .confirm-dialog::backdrop {
      background: rgb(11 15 19 / 0.5);
      backdrop-filter: blur(2px);
    }

    .confirm-dialog[open] {
      animation: dialog-in 0.18s cubic-bezier(0.22, 1, 0.36, 1);
    }

    @keyframes dialog-in {
      from {
        opacity: 0;
        transform: translateY(8px) scale(0.98);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .confirm-dialog[open] {
        animation: none;
      }
    }
  `,
})
export class ConfirmDelete {
  /** Emitted with the payload passed to `open()` once the key is verified. */
  readonly confirmed = output<string>();

  private readonly auth = inject(AdminAuthService);
  private readonly dialogRef = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  protected readonly description = signal('');
  protected readonly errorText = signal('');
  protected readonly isChecking = signal(false);

  private payload = '';

  private readonly model = signal({ password: '' });

  protected readonly challenge = form(
    this.model,
    (path) => {
      required(path.password, { message: 'Enter the security key to confirm.' });
    },
    {
      submission: {
        action: async () => {
          await this.verify();
          return undefined;
        },
      },
    },
  );

  /** Opens the dialog. `label` names the item being deleted. */
  open(payload: string, label: string): void {
    this.payload = payload;
    this.description.set(label ? `“${label}” will be permanently removed.` : '');
    this.errorText.set('');
    this.model.set({ password: '' });
    this.challenge().reset();
    this.dialogRef().nativeElement.showModal();
  }

  close(): void {
    this.dialogRef().nativeElement.close();
  }

  /** Clears the typed key whenever the dialog goes away, including via Escape. */
  protected onNativeClose(): void {
    this.model.set({ password: '' });
    this.errorText.set('');
    this.isChecking.set(false);
  }

  private async verify(): Promise<void> {
    if (this.isChecking()) {
      return;
    }
    this.isChecking.set(true);
    this.errorText.set('');
    try {
      // Re-verifies against the PBKDF2 hash and shares the panel's lockout
      // counter, so this dialog is not a way to brute-force the key.
      const result = await this.auth.unlock(this.model().password);
      if (result.ok) {
        this.close();
        this.confirmed.emit(this.payload);
      } else {
        this.errorText.set(result.error);
      }
    } catch {
      this.errorText.set('Could not verify the security key. Please try again.');
    } finally {
      this.model.set({ password: '' });
      this.isChecking.set(false);
    }
  }
}

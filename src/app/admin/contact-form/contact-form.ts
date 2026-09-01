import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { FieldTree, FormField, FormRoot, email, form, maxLength, validate } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import { environment } from '@environments/environments';
import { Address } from 'app/features/models';
import { ContactService } from 'app/features/services/contact.service';
import { toSafeExternalUrl, toSafeMailto } from 'app/core/security/safe-url';
import { PageHeader } from 'app/shared/components/page-header';
import { EmptyState } from 'app/shared/ui/empty-state';
import { FieldError } from 'app/shared/ui/field-error';
import { Icon } from 'app/shared/ui/icon';

interface ContactFormValue {
  address1: string;
  address2: string;
  phoneNumber1: string;
  phoneNumber2: string;
  phoneNumber3: string;
  email: string;
  facebookLink: string;
  othersLink1: string;
  othersLink2: string;
}

const EMPTY: ContactFormValue = {
  address1: '',
  address2: '',
  phoneNumber1: '',
  phoneNumber2: '',
  phoneNumber3: '',
  email: '',
  facebookLink: '',
  othersLink1: '',
  othersLink2: '',
};

/**
 * Edits the contact details shown in the header, footer and Contact page.
 *
 * Link fields are validated here with the same `toSafeExternalUrl` helper the
 * public pages use to build hrefs. Previously anything could be saved, and the
 * public side silently dropped values it could not turn into a safe URL — so an
 * admin who typed a malformed address saw the field simply not appear, with no
 * explanation anywhere.
 */
@Component({
  selector: 'app-admin-contact-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, FormField, FormRoot, FieldError, PageHeader, EmptyState, Icon],
  template: `
    <app-page-header
      title="Contact Us"
      variant="admin"
      [crumbs]="[{ label: 'Dashboard', link: '/mte12' }, { label: 'Contact Us' }]"
    />

    <div class="shell shell-narrow -mt-8">
      @if (service.isLoading() && !existing()) {
        <div class="card card-pad grid gap-4">
          @for (row of [1, 2, 3, 4]; track row) {
            <div class="skeleton h-10"></div>
          }
        </div>
      } @else if (!existing()) {
        <div class="card">
          <app-empty-state
            icon="search"
            title="Content not found"
            message="No contact record exists for this company."
          >
            <a class="btn btn-primary" routerLink="/mte12/products">Back to the panel</a>
          </app-empty-state>
        </div>
      } @else {
        <form [formRoot]="contactForm" class="grid gap-6">
          <section class="card card-pad grid gap-4">
            <h2 class="text-base font-semibold text-ink-900">Address</h2>
            <div class="field">
              <label class="field-label" for="address1">Address line 1</label>
              <textarea id="address1" class="textarea" rows="3" [formField]="contactForm.address1"></textarea>
              <app-field-error [field]="contactForm.address1" />
            </div>
            <div class="field">
              <label class="field-label" for="address2">Address line 2</label>
              <textarea id="address2" class="textarea" rows="3" [formField]="contactForm.address2"></textarea>
              <app-field-error [field]="contactForm.address2" />
            </div>
          </section>

          <section class="card card-pad grid gap-4">
            <h2 class="text-base font-semibold text-ink-900">Phone numbers</h2>
            <div class="form-grid form-grid-2">
              <div class="field">
                <label class="field-label" for="phone1">Phone 1</label>
                <input id="phone1" type="tel" class="input" [formField]="contactForm.phoneNumber1" />
                <app-field-error [field]="contactForm.phoneNumber1" />
              </div>
              <div class="field">
                <label class="field-label" for="phone2">Phone 2</label>
                <input id="phone2" type="tel" class="input" [formField]="contactForm.phoneNumber2" />
                <app-field-error [field]="contactForm.phoneNumber2" />
              </div>
              <div class="field">
                <label class="field-label" for="phone3">Phone 3</label>
                <input id="phone3" type="tel" class="input" [formField]="contactForm.phoneNumber3" />
                <app-field-error [field]="contactForm.phoneNumber3" />
              </div>
            </div>
          </section>

          <section class="card card-pad grid gap-4">
            <h2 class="text-base font-semibold text-ink-900">Email &amp; links</h2>
            <div class="field">
              <label class="field-label" for="email">Email</label>
              <input
                id="email"
                type="email"
                class="input"
                [class.is-invalid]="invalid(contactForm.email)"
                autocomplete="email"
                [formField]="contactForm.email"
              />
              <app-field-error [field]="contactForm.email" />
            </div>
            <div class="field">
              <label class="field-label" for="facebook">Facebook page</label>
              <input
                id="facebook"
                type="url"
                class="input"
                [class.is-invalid]="invalid(contactForm.facebookLink)"
                placeholder="https://facebook.com/yourpage"
                [formField]="contactForm.facebookLink"
              />
              <app-field-error [field]="contactForm.facebookLink" />
            </div>
            <div class="field">
              <label class="field-label" for="other1">Website or email</label>
              <input
                id="other1"
                type="text"
                class="input"
                [class.is-invalid]="invalid(contactForm.othersLink1)"
                placeholder="https://example.com or name@example.com"
                [formField]="contactForm.othersLink1"
              />
              <app-field-error [field]="contactForm.othersLink1" />
            </div>
            <div class="field">
              <label class="field-label" for="other2">Additional link or email</label>
              <input
                id="other2"
                type="text"
                class="input"
                [class.is-invalid]="invalid(contactForm.othersLink2)"
                placeholder="https://example.com or name@example.com"
                [formField]="contactForm.othersLink2"
              />
              <app-field-error [field]="contactForm.othersLink2" />
            </div>
          </section>

          @if (submitError(); as message) {
            <div class="alert alert-error" role="alert">
              <app-icon name="alert" [size]="17" />
              <span>{{ message }}</span>
            </div>
          }
          @if (didSave()) {
            <div class="alert alert-success" role="status">
              <app-icon name="check" [size]="17" />
              <span>Saved. The website has been updated.</span>
            </div>
          }

          <div class="card card-pad">
            <div class="flex flex-wrap gap-3">
              <button type="submit" class="btn btn-primary" [disabled]="isSaving()">
                @if (isSaving()) {
                  <span class="spinner"></span>
                  <span>Saving…</span>
                } @else {
                  <app-icon name="check" [size]="17" />
                  <span>Save changes</span>
                }
              </button>
              <a class="btn btn-outline" routerLink="/contact">Preview page</a>
            </div>
          </div>
        </form>
      }
    </div>
  `,
})
export class AdminContactForm {
  /** Bound from the `:id` route param via `withComponentInputBinding()`. */
  readonly id = input<string>('');

  protected readonly service = inject(ContactService);

  protected readonly submitError = signal('');
  protected readonly didSave = signal(false);
  protected readonly isSaving = signal(false);

  private hydratedFor = '';

  protected readonly existing = computed<Address | undefined>(() => {
    const byId = this.service.resource.value().find((entry) => entry.id === this.id());
    return byId ?? this.service.contact();
  });

  private readonly model = signal<ContactFormValue>({ ...EMPTY });

  protected readonly contactForm = form(
    this.model,
    (path) => {
      maxLength(path.address1, 500, { message: 'Keep the address under 500 characters.' });
      maxLength(path.address2, 500, { message: 'Keep the address under 500 characters.' });

      for (const phone of [path.phoneNumber1, path.phoneNumber2, path.phoneNumber3]) {
        maxLength(phone, 40, { message: 'That phone number looks too long.' });
        validate(phone, ({ value }) => {
          const raw = value().trim();
          if (raw && !/^[+()\d][\d\s()+-]{5,}$/.test(raw)) {
            return { kind: 'phone', message: 'Use digits, spaces, +, - and brackets only.' };
          }
          return null;
        });
      }

      email(path.email, {
        message: 'Enter a valid email address.',
        when: ({ value }) => value().trim().length > 0,
      });

      validate(path.facebookLink, ({ value }) => {
        const raw = value().trim();
        if (raw && !toSafeExternalUrl(raw)) {
          return { kind: 'url', message: 'Enter a full web address, e.g. https://example.com' };
        }
        return null;
      });

      // These two are free-text fields and are used for either kind of contact
      // — othersLink1 currently holds an email address — so both are accepted.
      for (const link of [path.othersLink1, path.othersLink2]) {
        validate(link, ({ value }) => {
          const raw = value().trim();
          if (raw && !toSafeExternalUrl(raw) && !toSafeMailto(raw)) {
            return {
              kind: 'link',
              message: 'Enter a web address (https://example.com) or an email address.',
            };
          }
          return null;
        });
      }
    },
    {
      submission: {
        action: async () => {
          await this.save();
          return undefined;
        },
      },
    },
  );

  constructor() {
    effect(() => {
      const record = this.existing();
      if (record && this.hydratedFor !== record.id) {
        this.hydratedFor = record.id;
        this.model.set({
          address1: record.address1 ?? '',
          address2: record.address2 ?? '',
          phoneNumber1: record.phoneNumber1 ?? '',
          phoneNumber2: record.phoneNumber2 ?? '',
          phoneNumber3: record.phoneNumber3 ?? '',
          email: record.email ?? '',
          facebookLink: record.facebookLink ?? '',
          othersLink1: record.othersLink1 ?? '',
          othersLink2: record.othersLink2 ?? '',
        });
      }
    });
  }

  protected invalid<TValue>(field: FieldTree<TValue>): boolean {
    const state = field();
    return state.touched() && state.invalid();
  }

  private async save(): Promise<void> {
    const record = this.existing();
    if (this.isSaving() || !record) {
      return;
    }

    this.isSaving.set(true);
    this.submitError.set('');
    this.didSave.set(false);

    const value = this.model();
    const payload = new FormData();
    payload.append('companyID', environment.companyCode.toString());
    for (const [key, entry] of Object.entries(value)) {
      payload.append(key, entry);
    }

    try {
      await this.service.update(record.id, payload);
      this.service.reload();
      this.didSave.set(true);
    } catch {
      this.submitError.set('Could not save the changes. Please try again.');
    } finally {
      this.isSaving.set(false);
    }
  }
}

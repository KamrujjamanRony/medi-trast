import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormField, FormRoot, applyEach, form, maxLength } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import { environment } from '@environments/environments';
import { About } from 'app/features/models';
import { AboutService } from 'app/features/services/about.service';
import { PageHeader } from 'app/shared/components/page-header';
import { EmptyState } from 'app/shared/ui/empty-state';
import { FieldError } from 'app/shared/ui/field-error';
import { Icon } from 'app/shared/ui/icon';

const SECTION_COUNT = 5;

interface Section {
  title: string;
  description: string;
}

interface AboutFormValue {
  heading: string;
  sections: Section[];
}

/**
 * Edits the About Us page.
 *
 * The API stores the content as eleven flat fields (`heading`, then `title`…
 * `title5` and `description`…`description5`). The old template spelled out all
 * eleven inputs by hand; here the five pairs are modelled as an array and
 * validated with `applyEach`, so the markup is written once.
 */
@Component({
  selector: 'app-admin-about-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, FormField, FormRoot, FieldError, PageHeader, EmptyState, Icon],
  template: `
    <app-page-header
      title="About Us"
      variant="admin"
      [crumbs]="[{ label: 'Dashboard', link: '/mte12' }, { label: 'About Us' }]"
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
            message="No About Us record exists for this company."
          >
            <a class="btn btn-primary" routerLink="/mte12/products">Back to the panel</a>
          </app-empty-state>
        </div>
      } @else {
        <form [formRoot]="aboutForm" class="grid gap-6">
          <div class="card card-pad">
            <div class="field">
              <label class="field-label" for="heading">Page heading</label>
              <input
                id="heading"
                type="text"
                class="input"
                placeholder="e.g. About Medi-Trust Engineers"
                [formField]="aboutForm.heading"
              />
              <app-field-error [field]="aboutForm.heading" />
              <p class="field-hint">Shown as the banner title on the public About page.</p>
            </div>
          </div>

          @for (section of aboutForm.sections; track $index; let i = $index) {
            <div class="card card-pad grid gap-4">
              <div class="flex items-center gap-2">
                <span class="badge badge-neutral">Section {{ i + 1 }}</span>
                @if (i > 0) {
                  <span class="text-xs text-ink-400">Optional — leave the title empty to hide it</span>
                }
              </div>

              <div class="field">
                <label class="field-label" [attr.for]="'section-title-' + i">Title</label>
                <input
                  [id]="'section-title-' + i"
                  type="text"
                  class="input"
                  [formField]="section.title"
                />
                <app-field-error [field]="section.title" />
              </div>

              <div class="field">
                <label class="field-label" [attr.for]="'section-body-' + i">Description</label>
                <textarea
                  [id]="'section-body-' + i"
                  class="textarea"
                  rows="7"
                  [formField]="section.description"
                ></textarea>
                <app-field-error [field]="section.description" />
                <p class="field-hint">Line breaks are preserved on the public page.</p>
              </div>
            </div>
          }

          @if (submitError(); as message) {
            <div class="alert alert-error" role="alert">
              <app-icon name="alert" [size]="17" />
              <span>{{ message }}</span>
            </div>
          }
          @if (didSave()) {
            <div class="alert alert-success" role="status">
              <app-icon name="check" [size]="17" />
              <span>Saved. The public About page has been updated.</span>
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
              <a class="btn btn-outline" routerLink="/about">Preview page</a>
            </div>
          </div>
        </form>
      }
    </div>
  `,
})
export class AdminAboutForm {
  /** Bound from the `:id` route param via `withComponentInputBinding()`. */
  readonly id = input<string>('');

  protected readonly service = inject(AboutService);

  protected readonly submitError = signal('');
  protected readonly didSave = signal(false);
  protected readonly isSaving = signal(false);

  private hydratedFor = '';

  /**
   * Prefer the record named by the route, but fall back to this company's
   * record. The old component only ever loaded by id and rendered nothing at
   * all if the id in the URL was stale.
   */
  protected readonly existing = computed<About | undefined>(() => {
    const byId = this.service.resource.value().find((entry) => entry.id === this.id());
    return byId ?? this.service.about();
  });

  private readonly model = signal<AboutFormValue>({
    heading: '',
    sections: Array.from({ length: SECTION_COUNT }, () => ({ title: '', description: '' })),
  });

  protected readonly aboutForm = form(
    this.model,
    (path) => {
      maxLength(path.heading, 160, { message: 'Keep the heading under 160 characters.' });
      applyEach(path.sections, (section) => {
        maxLength(section.title, 160, { message: 'Keep the title under 160 characters.' });
        maxLength(section.description, 6000, {
          message: 'Keep the description under 6000 characters.',
        });
      });
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
          heading: record.heading ?? '',
          sections: [
            { title: record.title ?? '', description: record.description ?? '' },
            { title: record.title2 ?? '', description: record.description2 ?? '' },
            { title: record.title3 ?? '', description: record.description3 ?? '' },
            { title: record.title4 ?? '', description: record.description4 ?? '' },
            { title: record.title5 ?? '', description: record.description5 ?? '' },
          ],
        });
      }
    });
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
    payload.append('heading', value.heading);
    value.sections.forEach((section, index) => {
      const suffix = index === 0 ? '' : String(index + 1);
      payload.append(`title${suffix}`, section.title);
      payload.append(`description${suffix}`, section.description);
    });

    try {
      await this.service.update(record.id, payload);
      this.service.reload();
      this.didSave.set(true);
    } catch {
      // The old component navigated to /about on success and did nothing at all
      // on failure, so a rejected save looked like the page had simply not
      // responded to the click.
      this.submitError.set('Could not save the changes. Please try again.');
    } finally {
      this.isSaving.set(false);
    }
  }
}

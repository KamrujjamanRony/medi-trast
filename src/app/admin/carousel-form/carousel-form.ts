import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { FieldTree, FormField, FormRoot, form, maxLength, required } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { environment } from '@environments/environments';
import { validateImageFile } from 'app/core/security/file-validation';
import { CarouselService } from 'app/features/services/carousel.service';
import { PageHeader } from 'app/shared/components/page-header';
import { imageUrl } from 'app/shared/media';
import { EmptyState } from 'app/shared/ui/empty-state';
import { FieldError } from 'app/shared/ui/field-error';
import { Icon } from 'app/shared/ui/icon';

interface CarouselFormValue {
  title: string;
  description: string;
}

/**
 * Create or edit a carousel slide. Replaces `AddCarouselComponent` and
 * `EditCarouselComponent`, which shared the same duplicated form logic.
 */
@Component({
  selector: 'app-admin-carousel-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, FormField, FormRoot, FieldError, PageHeader, EmptyState, Icon],
  template: `
    <app-page-header
      [title]="isEdit() ? 'Edit slide' : 'Add slide'"
      variant="admin"
      [crumbs]="[
        { label: 'Dashboard', link: '/mte12' },
        { label: 'Carousel', link: '/mte12/carousel' },
        { label: isEdit() ? 'Edit' : 'Add' }
      ]"
    />

    <div class="shell shell-narrow -mt-8">
      @if (isEdit() && service.isLoading() && !existing()) {
        <div class="card card-pad grid gap-4">
          @for (row of [1, 2, 3]; track row) {
            <div class="skeleton h-10"></div>
          }
        </div>
      } @else if (isEdit() && !existing()) {
        <div class="card">
          <app-empty-state
            icon="search"
            title="Slide not found"
            message="This slide may already have been deleted."
          >
            <a class="btn btn-primary" routerLink="/mte12/carousel">Back to carousel</a>
          </app-empty-state>
        </div>
      } @else {
        <form [formRoot]="slideForm" class="card card-pad grid gap-6">
          <div class="field">
            <label class="field-label" for="title">
              Title <span class="field-required">*</span>
            </label>
            <input
              id="title"
              type="text"
              class="input"
              [class.is-invalid]="invalid(slideForm.title)"
              placeholder="Headline shown over the slide"
              [formField]="slideForm.title"
            />
            <app-field-error [field]="slideForm.title" />
          </div>

          <div class="field">
            <label class="field-label" for="imageFile">
              Slide image
              @if (!isEdit()) {
                <span class="field-required">*</span>
              }
            </label>

            <div class="grid gap-3">
              @if (previewSrc(); as preview) {
                <img class="preview" [src]="preview" alt="Selected slide image" />
              }
              <input
                id="imageFile"
                type="file"
                class="file-input"
                [class.is-invalid]="!!fileError()"
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                (change)="onFileChange($event)"
              />
            </div>

            @if (fileError(); as message) {
              <p class="field-error" role="alert">
                <app-icon name="alert" [size]="15" />
                <span>{{ message }}</span>
              </p>
            } @else {
              <p class="field-hint">
                Wide landscape images work best. JPG, PNG or WEBP, up to 3 MB.
              </p>
            }
            @if (isEdit()) {
              <p class="field-hint">Leave empty to keep the current image.</p>
            }
          </div>

          <div class="field">
            <label class="field-label" for="description">Description</label>
            <textarea
              id="description"
              class="textarea"
              rows="5"
              placeholder="Supporting text shown under the headline"
              [formField]="slideForm.description"
            ></textarea>
            <app-field-error [field]="slideForm.description" />
          </div>

          @if (submitError(); as message) {
            <div class="alert alert-error" role="alert">
              <app-icon name="alert" [size]="17" />
              <span>{{ message }}</span>
            </div>
          }

          <div class="form-actions">
            <button type="submit" class="btn btn-primary" [disabled]="isSaving()">
              @if (isSaving()) {
                <span class="spinner"></span>
                <span>Saving…</span>
              } @else {
                <app-icon name="check" [size]="17" />
                <span>{{ isEdit() ? 'Save changes' : 'Add slide' }}</span>
              }
            </button>
            <a class="btn btn-outline" routerLink="/mte12/carousel">Cancel</a>
          </div>
        </form>
      }
    </div>
  `,
  styles: `
    .preview {
      width: 100%;
      max-width: 28rem;
      aspect-ratio: 16 / 7;
      border: 1px solid var(--color-ink-200);
      border-radius: var(--radius-control);
      object-fit: cover;
      background: var(--color-ink-100);
    }
  `,
})
export class AdminCarouselForm {
  /** Bound from the optional `:id` route param via `withComponentInputBinding()`. */
  readonly id = input<string>('');

  protected readonly service = inject(CarouselService);
  private readonly router = inject(Router);

  protected readonly isEdit = computed(() => !!this.id());
  protected readonly existing = computed(() =>
    this.id() ? this.service.slides().find((slide) => slide.id === this.id()) : undefined,
  );

  protected readonly fileError = signal('');
  protected readonly submitError = signal('');
  protected readonly isSaving = signal(false);

  private readonly selectedFile = signal<File | null>(null);
  private readonly localPreview = signal<string | null>(null);
  private hydratedFor = '';

  private readonly model = signal<CarouselFormValue>({ title: '', description: '' });

  protected readonly previewSrc = computed(
    () => this.localPreview() ?? (this.existing() ? imageUrl(this.existing()!.imageUrl) : null),
  );

  protected readonly slideForm = form(
    this.model,
    (path) => {
      required(path.title, { message: 'A slide title is required.' });
      maxLength(path.title, 120, { message: 'Keep the title under 120 characters.' });
      maxLength(path.description, 500, { message: 'Keep the description under 500 characters.' });
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
          title: record.title ?? '',
          description: record.description ?? '',
        });
      }
    });
  }

  protected invalid<TValue>(field: FieldTree<TValue>): boolean {
    const state = field();
    return state.touched() && state.invalid();
  }

  protected async onFileChange(event: Event): Promise<void> {
    const element = event.currentTarget as HTMLInputElement;
    const selected = element.files?.[0];

    this.revokePreview();
    this.selectedFile.set(null);
    this.fileError.set('');

    if (!selected) {
      return;
    }

    const result = await validateImageFile(selected);
    if (result.ok) {
      this.selectedFile.set(result.file);
      this.localPreview.set(URL.createObjectURL(result.file));
    } else {
      this.fileError.set(result.error);
      element.value = '';
    }
  }

  private async save(): Promise<void> {
    if (this.isSaving() || this.fileError()) {
      return;
    }
    const file = this.selectedFile();
    if (!this.isEdit() && !file) {
      this.fileError.set('Choose a slide image before saving.');
      return;
    }

    this.isSaving.set(true);
    this.submitError.set('');

    const value = this.model();
    const payload = new FormData();
    payload.append('CompanyID', environment.companyCode.toString());
    payload.append('Title', value.title);
    payload.append('Description', value.description);

    if (file) {
      payload.append('ImageFormFile', file);
    } else if (this.existing()?.imageUrl) {
      payload.append('ImageUrl', this.existing()!.imageUrl!);
    }

    try {
      if (this.isEdit()) {
        await this.service.update(this.id(), payload);
      } else {
        await this.service.add(payload);
      }
      this.revokePreview();
      this.service.reload();
      await this.router.navigateByUrl('/mte12/carousel');
    } catch {
      this.submitError.set('Could not save the slide. Please try again.');
    } finally {
      this.isSaving.set(false);
    }
  }

  private revokePreview(): void {
    const url = this.localPreview();
    if (url) {
      URL.revokeObjectURL(url);
      this.localPreview.set(null);
    }
  }
}

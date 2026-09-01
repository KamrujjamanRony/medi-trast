import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { FieldTree, FormField, FormRoot, form, maxLength, pattern, required } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { environment } from '@environments/environments';
import { validateImageFile } from 'app/core/security/file-validation';
import { PRODUCT_CATEGORIES, Product } from 'app/features/models';
import { ProductService } from 'app/features/services/product.service';
import { PageHeader } from 'app/shared/components/page-header';
import { imageUrl } from 'app/shared/media';
import { EmptyState } from 'app/shared/ui/empty-state';
import { FieldError } from 'app/shared/ui/field-error';
import { Icon } from 'app/shared/ui/icon';

/** Google Drive file ids are URL-safe base64-ish tokens and nothing else. */
const DRIVE_ID = /^[A-Za-z0-9_-]{10,128}$/;

interface ProductFormValue {
  productName: string;
  productCategory: string;
  brand: string;
  model: string;
  origin: string;
  description: string;
  aditionalInformation: string;
  specialFeature: string;
  catalogUrl: string;
}

const EMPTY: ProductFormValue = {
  productName: '',
  productCategory: '',
  brand: '',
  model: '',
  origin: '',
  description: '',
  aditionalInformation: '',
  specialFeature: '',
  catalogUrl: '',
};

/**
 * Create or edit a product.
 *
 * Replaces `AddProductComponent` and `EditProductComponent`, which were two
 * ~130-line copies of the same template-driven form and the same
 * `FormData`-building logic. Merging them also fixed a divergence between the
 * pair: the edit form built its payload with the key `CatalogUrl` while the
 * request model declared `CatalogUr`, and only one of the two forms guarded
 * against submitting while a rejected image was still selected.
 */
@Component({
  selector: 'app-admin-product-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, FormField, FormRoot, FieldError, PageHeader, EmptyState, Icon],
  template: `
    <app-page-header
      [title]="isEdit() ? 'Edit product' : 'Add product'"
      variant="admin"
      [crumbs]="[
        { label: 'Dashboard', link: '/mte12' },
        { label: 'Products', link: '/mte12/products' },
        { label: isEdit() ? 'Edit' : 'Add' }
      ]"
    />

    <div class="shell shell-narrow -mt-8">
      @if (isEdit() && service.isLoading() && !existing()) {
        <div class="card card-pad grid gap-4">
          @for (row of [1, 2, 3, 4, 5, 6]; track row) {
            <div class="skeleton h-10"></div>
          }
        </div>
      } @else if (isEdit() && !existing()) {
        <div class="card">
          <app-empty-state
            icon="search"
            title="Product not found"
            message="This product may already have been deleted."
          >
            <a class="btn btn-primary" routerLink="/mte12/products">Back to products</a>
          </app-empty-state>
        </div>
      } @else {
        <form [formRoot]="productForm" class="card card-pad grid gap-6">
          <div class="form-grid form-grid-2">
            <div class="field md:col-span-2">
              <label class="field-label" for="productName">
                Product name <span class="field-required">*</span>
              </label>
              <input
                id="productName"
                type="text"
                class="input"
                [class.is-invalid]="invalid(productForm.productName)"
                placeholder="e.g. Operating Table OT-500"
                [formField]="productForm.productName"
              />
              <app-field-error [field]="productForm.productName" />
            </div>

            <div class="field">
              <label class="field-label" for="productCategory">
                Category <span class="field-required">*</span>
              </label>
              <select
                id="productCategory"
                class="select"
                [class.is-invalid]="invalid(productForm.productCategory)"
                [formField]="productForm.productCategory"
              >
                <option value="">Select a category…</option>
                @for (option of categoryOptions(); track option) {
                  <option [value]="option">{{ option }}</option>
                }
              </select>
              <app-field-error [field]="productForm.productCategory" />
              <!-- A free-text category was why the storefront's exact-string
                   filters silently dropped products with a typo'd category. -->
              <p class="field-hint">The website filters by this exact value.</p>
            </div>

            <div class="field">
              <label class="field-label" for="brand">Brand</label>
              <input id="brand" type="text" class="input" [formField]="productForm.brand" />
              <app-field-error [field]="productForm.brand" />
            </div>

            <div class="field">
              <label class="field-label" for="model">Model</label>
              <input id="model" type="text" class="input" [formField]="productForm.model" />
              <app-field-error [field]="productForm.model" />
            </div>

            <div class="field">
              <label class="field-label" for="origin">Origin</label>
              <input id="origin" type="text" class="input" [formField]="productForm.origin" />
              <app-field-error [field]="productForm.origin" />
            </div>
          </div>

          <!-- Image -->
          <div class="field">
            <label class="field-label" for="imageFile">
              Product image
              @if (!isEdit()) {
                <span class="field-required">*</span>
              }
            </label>

            <div class="flex flex-wrap items-center gap-4">
              @if (previewSrc(); as preview) {
                <img class="preview" [src]="preview" alt="Selected product image" />
              }
              <input
                id="imageFile"
                type="file"
                class="file-input flex-1"
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
              <p class="field-hint">JPG, PNG or WEBP, up to 3 MB.</p>
            }
            @if (isEdit()) {
              <p class="field-hint">Leave empty to keep the current image.</p>
            }
          </div>

          <div class="field">
            <label class="field-label" for="description">Description</label>
            <textarea id="description" class="textarea" rows="6" [formField]="productForm.description"></textarea>
            <app-field-error [field]="productForm.description" />
          </div>

          <div class="form-grid form-grid-2">
            <div class="field">
              <label class="field-label" for="aditionalInformation">Additional information</label>
              <textarea
                id="aditionalInformation"
                class="textarea"
                rows="5"
                [formField]="productForm.aditionalInformation"
              ></textarea>
              <app-field-error [field]="productForm.aditionalInformation" />
            </div>

            <div class="field">
              <label class="field-label" for="specialFeature">Special features</label>
              <textarea
                id="specialFeature"
                class="textarea"
                rows="5"
                [formField]="productForm.specialFeature"
              ></textarea>
              <app-field-error [field]="productForm.specialFeature" />
            </div>
          </div>

          <div class="field">
            <label class="field-label" for="catalogUrl">Catalogue (Google Drive file ID)</label>
            <input
              id="catalogUrl"
              type="text"
              class="input"
              [class.is-invalid]="invalid(productForm.catalogUrl)"
              placeholder="1AbCdEfGhIjKlMnOpQrStUvWxYz"
              [formField]="productForm.catalogUrl"
            />
            <app-field-error [field]="productForm.catalogUrl" />
            <p class="field-hint">
              Only the file ID, not the whole share link. Leave empty for no catalogue.
            </p>
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
                <span>{{ isEdit() ? 'Save changes' : 'Add product' }}</span>
              }
            </button>
            <a class="btn btn-outline" routerLink="/mte12/products">Cancel</a>
          </div>
        </form>
      }
    </div>
  `,
  styles: `
    .preview {
      width: 5.5rem;
      height: 5.5rem;
      flex: none;
      border: 1px solid var(--color-ink-200);
      border-radius: var(--radius-control);
      object-fit: contain;
      background: var(--color-surface);
      padding: 0.25rem;
    }
  `,
})
export class AdminProductForm {
  /** Bound from the optional `:id` route param via `withComponentInputBinding()`. */
  readonly id = input<string>('');

  protected readonly service = inject(ProductService);
  private readonly router = inject(Router);

  protected readonly isEdit = computed(() => !!this.id());
  protected readonly existing = computed(() => this.service.byId(this.id()));

  protected readonly fileError = signal('');
  protected readonly submitError = signal('');
  protected readonly isSaving = signal(false);

  private readonly selectedFile = signal<File | null>(null);
  private readonly localPreview = signal<string | null>(null);
  private hydratedFor = '';

  private readonly model = signal<ProductFormValue>({ ...EMPTY });

  /** Existing values stay selectable even if they predate the fixed list. */
  protected readonly categoryOptions = computed(() => {
    const known = PRODUCT_CATEGORIES.map((category) => category.apiValue);
    const current = this.existing()?.productCategory?.trim();
    return current && !known.includes(current as (typeof known)[number])
      ? [...known, current]
      : known;
  });

  protected readonly previewSrc = computed(
    () => this.localPreview() ?? (this.existing() ? imageUrl(this.existing()!.imageUrl) : null),
  );

  protected readonly productForm = form(
    this.model,
    (path) => {
      required(path.productName, { message: 'A product name is required.' });
      maxLength(path.productName, 200, { message: 'Keep the name under 200 characters.' });
      required(path.productCategory, { message: 'Choose a category.' });
      maxLength(path.brand, 120, { message: 'Keep the brand under 120 characters.' });
      maxLength(path.model, 120, { message: 'Keep the model under 120 characters.' });
      maxLength(path.origin, 120, { message: 'Keep the origin under 120 characters.' });
      maxLength(path.description, 4000, { message: 'Keep the description under 4000 characters.' });
      maxLength(path.aditionalInformation, 4000, { message: 'Keep this under 4000 characters.' });
      maxLength(path.specialFeature, 4000, { message: 'Keep this under 4000 characters.' });
      pattern(path.catalogUrl, DRIVE_ID, {
        message: 'That does not look like a Google Drive file ID.',
        // Optional field: only validated once something has been typed.
        when: ({ value }) => value().trim().length > 0,
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
    // Fill the form once the record arrives from the shared resource. Guarded by
    // the id it was hydrated for, so a later `reload()` cannot wipe out edits
    // the user has already typed.
    effect(() => {
      const record = this.existing();
      if (record && this.hydratedFor !== record.id) {
        this.hydratedFor = record.id;
        this.model.set(toFormValue(record));
      }
    });
  }

  /** True once the user has left a field that is failing validation. */
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
    if (this.isSaving()) {
      return;
    }
    // A rejected file must never reach the API.
    if (this.fileError()) {
      return;
    }
    const file = this.selectedFile();
    if (!this.isEdit() && !file) {
      this.fileError.set('Choose a product image before saving.');
      return;
    }

    this.isSaving.set(true);
    this.submitError.set('');

    const value = this.model();
    const payload = new FormData();
    payload.append('CompanyID', environment.companyCode.toString());
    payload.append('ProductCategory', value.productCategory);
    payload.append('ProductName', value.productName);
    payload.append('Brand', value.brand);
    payload.append('Model', value.model);
    payload.append('Origin', value.origin);
    payload.append('Description', value.description);
    payload.append('AditionalInformation', value.aditionalInformation);
    payload.append('SpecialFeature', value.specialFeature);
    payload.append('CatalogUrl', value.catalogUrl);

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
      await this.router.navigateByUrl('/mte12/products');
    } catch {
      // The old forms only logged this to the console, so a failed save looked
      // exactly like a successful one that had not navigated yet.
      this.submitError.set('Could not save the product. Please check the fields and try again.');
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

function toFormValue(product: Product): ProductFormValue {
  return {
    productName: product.productName ?? '',
    productCategory: product.productCategory ?? '',
    brand: product.brand ?? '',
    model: product.model ?? '',
    origin: product.origin ?? '',
    description: product.description ?? '',
    aditionalInformation: product.aditionalInformation ?? '',
    specialFeature: product.specialFeature ?? '',
    catalogUrl: product.catalogUrl ?? '',
  };
}

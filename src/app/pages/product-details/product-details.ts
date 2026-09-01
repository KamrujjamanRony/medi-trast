import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Product } from 'app/features/models';
import { ProductService } from 'app/features/services/product.service';
import { ProductCard } from 'app/shared/components/product-card';
import { PLACEHOLDER_IMAGE, imageUrl } from 'app/shared/media';
import { EmptyState } from 'app/shared/ui/empty-state';
import { Icon } from 'app/shared/ui/icon';

/** Google Drive file ids are URL-safe base64-ish tokens and nothing else. */
const DRIVE_ID = /^[A-Za-z0-9_-]{10,128}$/;

@Component({
  selector: 'app-product-details',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ProductCard, EmptyState, Icon],
  template: `
    @if (service.isLoading()) {
      <div class="section">
        <div class="shell grid gap-8 lg:grid-cols-2">
          <div class="skeleton aspect-4/3 w-full"></div>
          <div class="grid content-start gap-3">
            <div class="skeleton h-8 w-2/3"></div>
            <div class="skeleton h-4 w-1/3"></div>
            <div class="skeleton mt-4 h-4 w-full"></div>
            <div class="skeleton h-4 w-full"></div>
            <div class="skeleton h-4 w-4/5"></div>
          </div>
        </div>
      </div>
    } @else if (product(); as item) {
      <div class="section">
        <div class="shell">
          <nav aria-label="Breadcrumb" class="mb-6 flex flex-wrap items-center gap-1 text-sm text-ink-500">
            <a class="link" routerLink="/">Home</a>
            <app-icon name="chevron-right" [size]="14" />
            <a class="link" routerLink="/products/all">Products</a>
            <app-icon name="chevron-right" [size]="14" />
            <span class="text-ink-700" aria-current="page">{{ item.productName }}</span>
          </nav>

          <div class="grid gap-8 lg:grid-cols-2 lg:gap-12">
            <div class="viewer">
              <img
                [src]="heroSrc()"
                [alt]="item.productName"
                decoding="async"
                (error)="onImageError($event)"
              />
            </div>

            <div>
              @if (item.productCategory) {
                <span class="badge badge-brand">{{ item.productCategory }}</span>
              }
              <h1 class="mt-3 text-3xl font-bold lg:text-4xl">{{ item.productName }}</h1>

              @if (specs().length) {
                <dl class="spec-grid">
                  @for (spec of specs(); track spec.label) {
                    <div class="spec">
                      <dt>{{ spec.label }}</dt>
                      <dd>{{ spec.value }}</dd>
                    </div>
                  }
                </dl>
              }

              @if (catalogHref(); as href) {
                <a
                  class="btn btn-primary btn-lg mt-7"
                  [href]="href"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <app-icon name="download" [size]="18" />
                  <span>Download catalogue</span>
                </a>
              }

              <a class="btn btn-outline btn-lg mt-7 ml-0 sm:ml-3" routerLink="/contact">
                <span>Request a quote</span>
              </a>
            </div>
          </div>

          @if (sections().length) {
            <div class="mt-12 grid gap-6 lg:grid-cols-3">
              @for (section of sections(); track section.title) {
                <article class="card card-pad">
                  <h2 class="text-base font-semibold text-brand-700">{{ section.title }}</h2>
                  <p class="prose-block mt-2 text-sm">{{ section.body }}</p>
                </article>
              }
            </div>
          }
        </div>
      </div>

      @if (related().length) {
        <section class="section pt-0">
          <div class="shell">
            <div class="panel-heading">
              <h2 class="section-title">Related products</h2>
              <a class="btn btn-outline" routerLink="/products/all">
                <span>View all</span>
                <app-icon name="arrow-right" [size]="17" />
              </a>
            </div>
            <div class="product-grid">
              @for (other of related(); track other.id) {
                <app-product-card [product]="other" />
              }
            </div>
          </div>
        </section>
      }
    } @else {
      <div class="section">
        <div class="shell">
          <div class="card">
            <app-empty-state
              icon="search"
              title="Product not found"
              message="This product may have been removed from the catalogue."
            >
              <a class="btn btn-primary" routerLink="/products/all">Browse all equipment</a>
            </app-empty-state>
          </div>
        </div>
      </div>
    }
  `,
  styles: `
    .viewer {
      display: grid;
      place-items: center;
      border: 1px solid var(--color-ink-200);
      border-radius: var(--radius-card);
      background: var(--color-surface);
      padding: 1.5rem;
      box-shadow: var(--shadow-soft);
    }

    .viewer img {
      width: 100%;
      max-height: 28rem;
      object-fit: contain;
    }

    .spec-grid {
      display: grid;
      gap: 0;
      margin-top: 1.5rem;
      border: 1px solid var(--color-ink-200);
      border-radius: var(--radius-card);
      overflow: hidden;
    }

    .spec {
      display: grid;
      grid-template-columns: 9rem 1fr;
      gap: 1rem;
      border-bottom: 1px solid var(--color-ink-100);
      padding: 0.75rem 1rem;
      background: var(--color-surface);
    }

    .spec:last-child {
      border-bottom: 0;
    }

    .spec dt {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--color-ink-500);
    }

    .spec dd {
      margin: 0;
      font-size: 0.9375rem;
      color: var(--color-ink-900);
    }
  `,
})
export class ProductDetails {
  /** Bound from the `:id` route param via `withComponentInputBinding()`. */
  readonly id = input<string>('');

  protected readonly service = inject(ProductService);

  protected readonly product = computed(() => this.service.byId(this.id()));

  protected readonly heroSrc = computed(() => imageUrl(this.product()?.imageUrl));

  protected readonly specs = computed(() => {
    const item = this.product();
    if (!item) {
      return [];
    }
    return [
      { label: 'Brand', value: item.brand },
      { label: 'Model', value: item.model },
      { label: 'Origin', value: item.origin },
      { label: 'Category', value: item.productCategory },
    ].filter((spec): spec is { label: string; value: string } => !!spec.value?.trim());
  });

  protected readonly sections = computed(() => {
    const item = this.product();
    if (!item) {
      return [];
    }
    return [
      { title: 'Description', body: item.description },
      { title: 'Additional information', body: item.aditionalInformation },
      { title: 'Special features', body: item.specialFeature },
    ].filter((section): section is { title: string; body: string } => !!section.body?.trim());
  });

  /**
   * `catalogUrl` is stored through an API that accepts unauthenticated writes,
   * so it is untrusted. The old template concatenated it straight into a Drive
   * download URL; a stored value containing `&` or a path segment could
   * redirect the download anywhere. Only a bare Drive file id is accepted.
   */
  protected readonly catalogHref = computed(() => {
    const id = this.product()?.catalogUrl?.trim();
    return id && DRIVE_ID.test(id)
      ? `https://drive.google.com/uc?export=download&id=${encodeURIComponent(id)}`
      : null;
  });

  protected readonly related = computed(() => {
    const item = this.product();
    if (!item) {
      return [];
    }
    const sameCategory = this.service
      .products()
      .filter(
        (other) => other.id !== item.id && other.productCategory === item.productCategory,
      );
    const fill = this.service.products().filter((other) => other.id !== item.id);
    const pool: Product[] = sameCategory.length ? sameCategory : fill;
    return pool.slice(0, 5);
  });

  protected onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (!img.src.endsWith(PLACEHOLDER_IMAGE)) {
      img.src = PLACEHOLDER_IMAGE;
    }
  }
}

import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { PRODUCT_CATEGORIES, categoryBySlug } from 'app/features/models';
import { ProductService } from 'app/features/services/product.service';
import { PageHeader } from 'app/shared/components/page-header';
import { ProductCard } from 'app/shared/components/product-card';
import { EmptyState } from 'app/shared/ui/empty-state';
import { Icon } from 'app/shared/ui/icon';
import { SkeletonGrid } from 'app/shared/ui/skeleton-grid';

/**
 * Catalogue listing for one category (or all).
 *
 * The old version kept seven parallel arrays on the component — `surgical`,
 * `medicalFurniture`, `medical`, `laboratory`, `Dental`, `accessories` and
 * `products` — repopulated on every param change, and the template picked
 * between them with seven consecutive `@if` blocks. It is one derived list now.
 *
 * It also fixes two behavioural bugs: `loading` was only ever set back to
 * `false` inside the first subscription, so switching category while the first
 * request was still in flight could leave the spinner up forever; and an
 * unrecognised slug fell through to the title "all equipments" while rendering
 * nothing at all.
 */
@Component({
  selector: 'app-products',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    RouterLinkActive,
    PageHeader,
    ProductCard,
    SkeletonGrid,
    EmptyState,
    Icon,
  ],
  template: `
    <app-page-header
      [title]="title()"
      [subtitle]="subtitle()"
      [crumbs]="[{ label: 'Home', link: '/' }, { label: 'Products', link: '/products/all' }, { label: title() }]"
    />

    <div class="section">
      <div class="shell">
        <nav class="chips" aria-label="Filter by category">
          <a
            class="chip"
            routerLink="/products/all"
            routerLinkActive="is-active"
            [routerLinkActiveOptions]="{ exact: true }"
          >
            All Equipment
          </a>
          @for (option of categories; track option.slug) {
            <a
              class="chip"
              [routerLink]="['/products', option.slug]"
              routerLinkActive="is-active"
            >
              {{ option.label }}
            </a>
          }
        </nav>

        @if (service.isLoading()) {
          <div class="mt-8">
            <app-skeleton-grid [count]="10" />
          </div>
        } @else if (service.error()) {
          <div class="card mt-8">
            <app-empty-state
              icon="alert"
              tone="error"
              title="Could not load the catalogue"
              message="The product service did not respond. Check your connection and try again."
            >
              <button type="button" class="btn btn-primary" (click)="service.reload()">
                <app-icon name="refresh" [size]="17" />
                <span>Retry</span>
              </button>
            </app-empty-state>
          </div>
        } @else if (!isKnownCategory()) {
          <div class="card mt-8">
            <app-empty-state
              icon="search"
              title="Unknown category"
              message="That category does not exist. Browse the full catalogue instead."
            >
              <a class="btn btn-primary" routerLink="/products/all">View all equipment</a>
            </app-empty-state>
          </div>
        } @else if (visible().length) {
          <p class="mt-8 text-sm text-ink-500">
            Showing {{ visible().length }}
            {{ visible().length === 1 ? 'product' : 'products' }}
          </p>
          <div class="product-grid mt-4">
            @for (product of visible(); track product.id; let i = $index) {
              <app-product-card [product]="product" [delay]="i * 40" />
            }
          </div>
        } @else {
          <div class="card mt-8">
            <app-empty-state
              title="Nothing in this category yet"
              message="No products have been published under {{ title() }}."
            >
              <a class="btn btn-primary" routerLink="/products/all">View all equipment</a>
            </app-empty-state>
          </div>
        }
      </div>
    </div>
  `,
  styles: `
    .chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .chip {
      display: inline-flex;
      align-items: center;
      border: 1px solid var(--color-ink-200);
      border-radius: 999px;
      background: var(--color-surface);
      padding: 0.4375rem 0.9375rem;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--color-ink-600);
      text-decoration: none;
      transition:
        background-color 0.18s var(--ease-out-soft),
        border-color 0.18s var(--ease-out-soft),
        color 0.18s var(--ease-out-soft);
    }

    .chip:hover {
      border-color: var(--color-brand-300);
      color: var(--color-brand-700);
    }

    .chip.is-active {
      border-color: var(--color-brand-500);
      background: var(--color-brand-500);
      color: #fff;
    }
  `,
})
export class Products {
  /** Bound from the `:category` route param via `withComponentInputBinding()`. */
  readonly category = input<string>('all');

  protected readonly categories = PRODUCT_CATEGORIES;
  protected readonly service = inject(ProductService);

  private readonly matched = computed(() => categoryBySlug(this.category()));

  protected readonly isKnownCategory = computed(
    () => this.category() === 'all' || this.matched() !== null,
  );

  protected readonly title = computed(() => this.matched()?.label ?? 'All Equipment');

  protected readonly subtitle = computed(() =>
    this.matched()
      ? `Browse our ${this.matched()!.label.toLowerCase()} range.`
      : 'The complete Medi-Trust Engineers catalogue.',
  );

  protected readonly visible = computed(() => {
    const target = this.matched();
    const products = this.service.products();
    return target
      ? products.filter((product) => product.productCategory === target.apiValue)
      : products;
  });
}

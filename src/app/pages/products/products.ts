import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  linkedSignal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { categoryBySlug } from 'app/features/models';
import { ProductService } from 'app/features/services/product.service';
import { PageHeader } from 'app/shared/components/page-header';
import { ProductCard } from 'app/shared/components/product-card';
import { EmptyState } from 'app/shared/ui/empty-state';
import { Icon } from 'app/shared/ui/icon';
import { SkeletonGrid } from 'app/shared/ui/skeleton-grid';

/** Cards shown per page in the public catalogue. */
const PAGE_SIZE = 12;

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
 *
 * Categories are reached from the header dropdown and the footer, so the
 * duplicate chip row that used to sit above the grid is gone; the grid is
 * paginated instead, which is what a category of forty-plus items needed.
 */
@Component({
  selector: 'app-products',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, PageHeader, ProductCard, SkeletonGrid, EmptyState, Icon],
  template: `
    <app-page-header
      [title]="title()"
      [subtitle]="subtitle()"
      [crumbs]="[{ label: 'Home', link: '/' }, { label: 'Products', link: '/products/all' }, { label: title() }]"
    />

    <div class="section">
      <div class="shell" #results>
        @if (service.isLoading()) {
          <app-skeleton-grid [count]="10" />
        } @else if (service.error()) {
          <div class="card">
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
          <div class="card">
            <app-empty-state
              icon="search"
              title="Unknown category"
              message="That category does not exist. Browse the full catalogue instead."
            >
              <a class="btn btn-primary" routerLink="/products/all">View all equipment</a>
            </app-empty-state>
          </div>
        } @else if (total()) {
          <p class="text-sm text-ink-500">
            Showing {{ rangeStart() }}–{{ rangeEnd() }} of {{ total() }}
            {{ total() === 1 ? 'product' : 'products' }}
          </p>
          <div class="product-grid mt-4">
            @for (product of visible(); track product.id; let i = $index) {
              <app-product-card [product]="product" [delay]="i * 40" />
            }
          </div>

          @if (totalPages() > 1) {
            <nav class="pager" aria-label="Product pages">
              <button
                type="button"
                class="btn btn-outline btn-sm"
                [disabled]="page() === 1"
                (click)="goTo(page() - 1)"
              >
                <app-icon name="chevron-left" [size]="15" />
                <span>Previous</span>
              </button>

              <ul class="pager-pages">
                @for (item of pages(); track $index) {
                  <li>
                    @if (item === null) {
                      <span class="pager-gap" aria-hidden="true">…</span>
                    } @else {
                      <button
                        type="button"
                        class="pager-page"
                        [class.is-current]="item === page()"
                        [attr.aria-current]="item === page() ? 'page' : null"
                        (click)="goTo(item)"
                      >
                        <span class="sr-only">Page </span>{{ item }}
                      </button>
                    }
                  </li>
                }
              </ul>

              <button
                type="button"
                class="btn btn-outline btn-sm"
                [disabled]="page() === totalPages()"
                (click)="goTo(page() + 1)"
              >
                <span>Next</span>
                <app-icon name="chevron-right" [size]="15" />
              </button>
            </nav>
          }
        } @else {
          <div class="card">
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
    /* Paging scrolls back here, clear of the sticky masthead. */
    .shell {
      scroll-margin-top: 7rem;
    }

    .pager {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      margin-top: 2rem;
    }

    .pager-pages {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.25rem;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .pager-page {
      min-width: 2.25rem;
      border: 1px solid transparent;
      border-radius: var(--radius-control);
      background: transparent;
      padding: 0.375rem 0.5rem;
      font: inherit;
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--color-ink-600);
      cursor: pointer;
      transition:
        background-color 0.15s ease,
        color 0.15s ease,
        border-color 0.15s ease;
    }

    .pager-page:hover {
      background: var(--color-brand-50);
      color: var(--color-brand-700);
    }

    .pager-page.is-current {
      border-color: var(--color-brand-500);
      background: var(--color-brand-500);
      color: #fff;
    }

    .pager-gap {
      display: inline-block;
      padding: 0 0.25rem;
      color: var(--color-ink-400);
    }
  `,
})
export class Products {
  /** Bound from the `:category` route param via `withComponentInputBinding()`. */
  readonly category = input<string>('all');

  protected readonly service = inject(ProductService);

  private readonly resultsTop = viewChild.required<ElementRef<HTMLElement>>('results');

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

  protected readonly filtered = computed(() => {
    const target = this.matched();
    const products = this.service.products();
    return target
      ? products.filter((product) => product.productCategory === target.apiValue)
      : products;
  });

  protected readonly total = computed(() => this.filtered().length);

  /**
   * The page the user asked for. It resets to 1 whenever the route category
   * changes, and is read back through `page()`, which clamps it — so a slow
   * catalogue that arrives shorter than expected cannot leave an empty grid on
   * screen.
   */
  private readonly requestedPage = linkedSignal<string, number>({
    source: this.category,
    computation: () => 1,
  });

  protected readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total() / PAGE_SIZE)));

  protected readonly page = computed(() => Math.min(this.requestedPage(), this.totalPages()));

  protected readonly visible = computed(() => {
    const start = (this.page() - 1) * PAGE_SIZE;
    return this.filtered().slice(start, start + PAGE_SIZE);
  });

  protected readonly rangeStart = computed(() =>
    this.total() ? (this.page() - 1) * PAGE_SIZE + 1 : 0,
  );

  protected readonly rangeEnd = computed(
    () => (this.page() - 1) * PAGE_SIZE + this.visible().length,
  );

  /** Page buttons, with `null` standing in for an elided run of pages. */
  protected readonly pages = computed<(number | null)[]>(() => {
    const total = this.totalPages();
    const current = this.page();
    if (total <= 7) {
      return Array.from({ length: total }, (_, index) => index + 1);
    }

    const items: (number | null)[] = [1];
    const first = Math.max(2, current - 1);
    const last = Math.min(total - 1, current + 1);
    if (first > 2) {
      items.push(null);
    }
    for (let page = first; page <= last; page++) {
      items.push(page);
    }
    if (last < total - 1) {
      items.push(null);
    }
    items.push(total);
    return items;
  });

  protected goTo(page: number): void {
    const target = Math.min(Math.max(1, page), this.totalPages());
    if (target === this.page()) {
      return;
    }
    this.requestedPage.set(target);
    // The pager sits below the fold; without this the next page opens
    // mid-grid, showing its last row first.
    this.resultsTop().nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

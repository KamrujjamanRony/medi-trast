import { ChangeDetectionStrategy, Component, computed, inject, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductService } from 'app/features/services/product.service';
import { PageHeader } from 'app/shared/components/page-header';
import { PLACEHOLDER_IMAGE, imageUrl } from 'app/shared/media';
import { ConfirmDelete } from 'app/shared/ui/confirm-delete';
import { EmptyState } from 'app/shared/ui/empty-state';
import { Icon } from 'app/shared/ui/icon';

/** Rows shown per page in the admin table. */
const PAGE_SIZE = 10;

/**
 * Admin product table.
 *
 * The previous template had unresolved git conflict markers committed into it
 * (`<<<<<<< HEAD`, `=======`, `>>>>>>> 378eda1…`) inside the `<thead>` and
 * `<tbody>`. Browsers rendered them as literal text above the table, and the
 * table shipped both sides of the conflict — a nine-column header over a
 * six-column body, so every cell after "Category" was misaligned.
 */
@Component({
  selector: 'app-admin-product-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, PageHeader, ConfirmDelete, EmptyState, Icon],
  template: `
    <app-page-header
      title="Products"
      variant="admin"
      [crumbs]="[{ label: 'Dashboard', link: '/mte12' }, { label: 'Products' }]"
    />

    <div class="shell -mt-8">
      <div class="card card-pad">
        <div class="panel-heading">
          <div class="search-box">
            <span class="search-box-icon"><app-icon name="search" [size]="17" /></span>
            <label class="sr-only" for="admin-product-search">Filter products</label>
            <input
              id="admin-product-search"
              type="search"
              class="input pl-10"
              placeholder="Filter by name, brand or category…"
              [value]="filter()"
              (input)="onFilter($event)"
            />
          </div>
          <a class="btn btn-primary" routerLink="/mte12/products/new">
            <app-icon name="plus" [size]="17" />
            <span>Add product</span>
          </a>
        </div>

        @if (service.isLoading()) {
          <div class="grid gap-2" role="status" aria-busy="true">
            <span class="sr-only">Loading…</span>
            @for (row of [1, 2, 3, 4, 5]; track row) {
              <div class="skeleton h-14"></div>
            }
          </div>
        } @else if (service.error()) {
          <app-empty-state
            icon="alert"
            tone="error"
            title="Could not load products"
            message="The product service did not respond."
          >
            <button type="button" class="btn btn-primary" (click)="service.reload()">
              <app-icon name="refresh" [size]="17" />
              <span>Retry</span>
            </button>
          </app-empty-state>
        } @else if (filtered().length) {
          <p class="mb-3 text-sm text-ink-500">
            Showing {{ rangeStart() }}–{{ rangeEnd() }} of {{ filtered().length }} products
            @if (filtered().length !== service.products().length) {
              <span>(filtered from {{ service.products().length }})</span>
            }
          </p>

          <div class="table-wrap">
            <table class="data-table">
              <caption class="sr-only">Products, with edit and delete actions</caption>
              <thead>
                <tr>
                  <th scope="col">Image</th>
                  <th scope="col">Name</th>
                  <th scope="col">Brand</th>
                  <!-- <th scope="col">Model</th> -->
                  <th scope="col">Origin</th>
                  <th scope="col">Category</th>
                  <!-- <th scope="col">Description</th> -->
                  <th scope="col"><span class="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                @for (product of visible(); track product.id) {
                  <tr>
                    <td>
                      <img
                        class="thumb"
                        [src]="thumb(product.imageUrl)"
                        [alt]="product.productName"
                        loading="lazy"
                        decoding="async"
                        (error)="onImageError($event)"
                      />
                    </td>
                    <td class="font-medium text-ink-900">{{ product.productName }}</td>
                    <td>{{ product.brand || '—' }}</td>
                    <!-- <td>{{ product.model || '—' }}</td> -->
                    <td>{{ product.origin || '—' }}</td>
                    <td>
                      @if (product.productCategory) {
                        <span class="badge badge-neutral">{{ product.productCategory }}</span>
                      } @else {
                        —
                      }
                    </td>
                    <!-- <td><span class="cell-clamp">{{ product.description || '—' }}</span></td> -->
                    <td>
                      <div class="flex justify-end gap-2">
                        <a
                          class="btn btn-outline btn-sm"
                          [routerLink]="['/mte12/products', product.id, 'edit']"
                        >
                          <app-icon name="edit" [size]="15" />
                          <span>Edit</span>
                        </a>
                        <button
                          type="button"
                          class="btn btn-danger btn-sm"
                          (click)="askDelete(product.id, product.productName)"
                        >
                          <app-icon name="trash" [size]="15" />
                          <span class="sr-only">Delete {{ product.productName }}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
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
        } @else if (service.products().length) {
          <app-empty-state
            icon="search"
            title="No matches"
            message="No product matches “{{ filter() }}”."
          >
            <button type="button" class="btn btn-outline" (click)="clearFilter()">
              Clear filter
            </button>
          </app-empty-state>
        } @else {
          <app-empty-state
            title="No products yet"
            message="Add your first product to publish it on the website."
          >
            <a class="btn btn-primary" routerLink="/mte12/products/new">
              <app-icon name="plus" [size]="17" />
              <span>Add product</span>
            </a>
          </app-empty-state>
        }

        @if (deleteError(); as message) {
          <div class="alert alert-error mt-4" role="alert">
            <app-icon name="alert" [size]="17" />
            <span>{{ message }}</span>
          </div>
        }
      </div>
    </div>

    <app-confirm-delete #confirm (confirmed)="remove($event)" />
  `,
  styles: `
    .thumb {
      width: 3rem;
      height: 3rem;
      border-radius: 0.5rem;
      border: 1px solid var(--color-ink-200);
      object-fit: contain;
      background: var(--color-surface);
      padding: 0.125rem;
    }

    .search-box {
      position: relative;
      flex: 1 1 16rem;
      max-width: 26rem;
    }

    .search-box-icon {
      position: absolute;
      left: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      color: var(--color-ink-400);
      pointer-events: none;
    }

    .pager {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      margin-top: 1.25rem;
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
export class AdminProductList {
  protected readonly service = inject(ProductService);

  protected readonly filter = signal('');
  protected readonly deleteError = signal('');

  /**
   * The page the user asked for. It is read back through `page()`, which clamps
   * it, so deleting the last row of the last page falls back to the new last
   * page instead of leaving an empty table on screen.
   */
  private readonly requestedPage = signal(1);

  private readonly confirmDialog = viewChild.required(ConfirmDelete);

  protected readonly filtered = computed(() => {
    const term = this.filter().trim().toLowerCase();
    const products = this.service.products();
    if (!term) {
      return products;
    }
    return products.filter((product) =>
      [product.productName, product.brand, product.model, product.productCategory]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(term)),
    );
  });

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filtered().length / PAGE_SIZE)),
  );

  protected readonly page = computed(() => Math.min(this.requestedPage(), this.totalPages()));

  protected readonly visible = computed(() => {
    const start = (this.page() - 1) * PAGE_SIZE;
    return this.filtered().slice(start, start + PAGE_SIZE);
  });

  protected readonly rangeStart = computed(() =>
    this.filtered().length ? (this.page() - 1) * PAGE_SIZE + 1 : 0,
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
    this.requestedPage.set(Math.min(Math.max(1, page), this.totalPages()));
  }

  protected onFilter(event: Event): void {
    this.filter.set((event.target as HTMLInputElement).value);
    this.requestedPage.set(1);
  }

  protected clearFilter(): void {
    this.filter.set('');
    this.requestedPage.set(1);
  }

  protected thumb(path: string | null): string {
    return imageUrl(path);
  }

  protected askDelete(id: string, name: string): void {
    this.deleteError.set('');
    this.confirmDialog().open(id, name);
  }

  protected async remove(id: string): Promise<void> {
    try {
      await this.service.remove(id);
      this.service.reload();
    } catch {
      // The old code passed no error callback, so a failed delete silently left
      // the row on screen with no indication anything had gone wrong.
      this.deleteError.set('Could not delete that product. Please try again.');
    }
  }

  protected onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (!img.src.endsWith(PLACEHOLDER_IMAGE)) {
      img.src = PLACEHOLDER_IMAGE;
    }
  }
}

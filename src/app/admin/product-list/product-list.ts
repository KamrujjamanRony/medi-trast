import { ChangeDetectionStrategy, Component, computed, inject, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductService } from 'app/features/services/product.service';
import { PageHeader } from 'app/shared/components/page-header';
import { PLACEHOLDER_IMAGE, imageUrl } from 'app/shared/media';
import { ConfirmDelete } from 'app/shared/ui/confirm-delete';
import { EmptyState } from 'app/shared/ui/empty-state';
import { Icon } from 'app/shared/ui/icon';

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
        } @else if (visible().length) {
          <p class="mb-3 text-sm text-ink-500">
            {{ visible().length }} of {{ service.products().length }} products
          </p>

          <div class="table-wrap">
            <table class="data-table">
              <caption class="sr-only">Products, with edit and delete actions</caption>
              <thead>
                <tr>
                  <th scope="col">Image</th>
                  <th scope="col">Name</th>
                  <th scope="col">Brand</th>
                  <th scope="col">Model</th>
                  <th scope="col">Origin</th>
                  <th scope="col">Category</th>
                  <th scope="col">Description</th>
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
                    <td>{{ product.model || '—' }}</td>
                    <td>{{ product.origin || '—' }}</td>
                    <td>
                      @if (product.productCategory) {
                        <span class="badge badge-neutral">{{ product.productCategory }}</span>
                      } @else {
                        —
                      }
                    </td>
                    <td><span class="cell-clamp">{{ product.description || '—' }}</span></td>
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
        } @else if (service.products().length) {
          <app-empty-state
            icon="search"
            title="No matches"
            message="No product matches “{{ filter() }}”."
          >
            <button type="button" class="btn btn-outline" (click)="filter.set('')">
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
  `,
})
export class AdminProductList {
  protected readonly service = inject(ProductService);

  protected readonly filter = signal('');
  protected readonly deleteError = signal('');

  private readonly confirmDialog = viewChild.required(ConfirmDelete);

  protected readonly visible = computed(() => {
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

  protected onFilter(event: Event): void {
    this.filter.set((event.target as HTMLInputElement).value);
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

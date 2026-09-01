import { HttpClient, httpResource } from '@angular/common/http';
import { Injectable, computed, inject } from '@angular/core';
import { environment } from '@environments/environments';
import { firstValueFrom } from 'rxjs';
import { Product } from '../models';

/**
 * Products are fetched once into a single application-wide resource.
 *
 * Previously the navbar, the home page, the products page and the product
 * details page each created their own subscription to `getAllProducts()`, so
 * opening a product ran the same full-catalogue request four times. They now
 * all read this one resource, and a write simply calls `reload()`.
 */
@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);

  readonly resource = httpResource<Product[]>(() => environment.ProductApi, {
    defaultValue: [],
    // The API is not guaranteed to answer with an array (an error page or a
    // null body would otherwise crash every `.filter()` downstream).
    parse: (raw) => (Array.isArray(raw) ? (raw as Product[]) : []),
  });

  /** Products belonging to this deployment's company. */
  readonly products = computed(() =>
    this.resource.value().filter((product) => product.companyID === environment.companyCode),
  );

  readonly isLoading = this.resource.isLoading;
  readonly error = this.resource.error;

  reload(): void {
    this.resource.reload();
  }

  byId(id: string | null): Product | undefined {
    return id ? this.products().find((product) => product.id === id) : undefined;
  }

  add(payload: FormData): Promise<void> {
    return firstValueFrom(this.http.post<void>(environment.ProductApi, payload));
  }

  update(id: string, payload: FormData): Promise<Product> {
    return firstValueFrom(
      this.http.put<Product>(`${environment.ProductApi}/EditProduct/${id}`, payload),
    );
  }

  remove(id: string): Promise<Product> {
    return firstValueFrom(
      this.http.delete<Product>(
        `${environment.ProductApi}/DeleteProduct?id=${encodeURIComponent(id)}`,
      ),
    );
  }

  fetchOne(id: string): Promise<Product> {
    return firstValueFrom(
      this.http.get<Product>(
        `${environment.ProductApi}/GetProductById?id=${encodeURIComponent(id)}`,
      ),
    );
  }
}

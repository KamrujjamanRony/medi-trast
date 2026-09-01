import { HttpClient, httpResource } from '@angular/common/http';
import { Injectable, computed, inject } from '@angular/core';
import { environment } from '@environments/environments';
import { firstValueFrom } from 'rxjs';
import { About } from '../models';

@Injectable({ providedIn: 'root' })
export class AboutService {
  private readonly http = inject(HttpClient);

  readonly resource = httpResource<About[]>(() => environment.AboutApi, {
    defaultValue: [],
    parse: (raw) => (Array.isArray(raw) ? (raw as About[]) : []),
  });

  /**
   * The record for this deployment's company. The old code hard-coded
   * `companyID === 1` in two components, so any deployment with a different
   * `companyCode` rendered an empty hero and About page.
   */
  readonly about = computed(() =>
    this.resource.value().find((entry) => entry.companyID === environment.companyCode),
  );

  readonly isLoading = this.resource.isLoading;
  readonly error = this.resource.error;

  reload(): void {
    this.resource.reload();
  }

  update(id: string, payload: FormData): Promise<About> {
    return firstValueFrom(
      this.http.put<About>(`${environment.AboutApi}/EditAboutUs/${id}`, payload),
    );
  }

  fetchOne(id: string): Promise<About> {
    return firstValueFrom(
      this.http.get<About>(`${environment.AboutApi}/GetAboutUsById?id=${encodeURIComponent(id)}`),
    );
  }
}

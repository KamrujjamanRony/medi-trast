import { HttpClient, httpResource } from '@angular/common/http';
import { Injectable, computed, inject } from '@angular/core';
import { environment } from '@environments/environments';
import { firstValueFrom } from 'rxjs';
import { Carousel } from '../models';

@Injectable({ providedIn: 'root' })
export class CarouselService {
  private readonly http = inject(HttpClient);

  readonly resource = httpResource<Carousel[]>(() => environment.CarouselApi, {
    defaultValue: [],
    parse: (raw) => (Array.isArray(raw) ? (raw as Carousel[]) : []),
  });

  readonly slides = computed(() =>
    this.resource.value().filter((slide) => slide.companyID === environment.companyCode),
  );

  readonly isLoading = this.resource.isLoading;
  readonly error = this.resource.error;

  reload(): void {
    this.resource.reload();
  }

  add(payload: FormData): Promise<void> {
    return firstValueFrom(this.http.post<void>(environment.CarouselApi, payload));
  }

  update(id: string, payload: FormData): Promise<Carousel> {
    return firstValueFrom(
      this.http.put<Carousel>(`${environment.CarouselApi}/EditCarousel/${id}`, payload),
    );
  }

  remove(id: string): Promise<Carousel> {
    return firstValueFrom(
      this.http.delete<Carousel>(
        `${environment.CarouselApi}/DeleteCarousel?id=${encodeURIComponent(id)}`,
      ),
    );
  }

  fetchOne(id: string): Promise<Carousel> {
    return firstValueFrom(
      this.http.get<Carousel>(
        `${environment.CarouselApi}/GetCarouselById?id=${encodeURIComponent(id)}`,
      ),
    );
  }
}

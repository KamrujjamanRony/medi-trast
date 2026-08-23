import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@environments/environments';
import { Observable, map } from 'rxjs';
import { AddCarouselRequest, CarouselModel, UpdateCarouselRequest } from '../model/carousel.model';

@Injectable({
  providedIn: 'root'
})
export class CarouselService {

  constructor(private http: HttpClient) { }

  addCarousel(model: AddCarouselRequest | FormData): Observable<void>{
    return this.http.post<void>(environment.CarouselApi, model)
  }

  getAllCarousel(): Observable<CarouselModel[]> {
    return this.http.get<CarouselModel[]>(environment.CarouselApi);
  }

  getCompanyCarousel(companyID: number): Observable<CarouselModel[]> {
    return this.getAllCarousel().pipe(
      map(carousel => carousel.filter(a => a.companyID === companyID))
    );
  }

  getCarousel(id: string): Observable<CarouselModel>{
    return this.http.get<CarouselModel>(`${environment.CarouselApi}/GetCarouselById?id=${id}`);
  }

  updateCarousel(id: string, updateCarouselRequest: UpdateCarouselRequest | FormData): Observable<CarouselModel>{
    return this.http.put<CarouselModel>(`${environment.CarouselApi}/EditCarousel/${id}`, updateCarouselRequest);
  }

  deleteCarousel(id: string): Observable<CarouselModel>{
    return this.http.delete<CarouselModel>(`${environment.CarouselApi}/DeleteCarousel?id=${id}`);
  }
}

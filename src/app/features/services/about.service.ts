import { AboutModel } from './../model/about.model';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@environments/environments';
import { Observable } from 'rxjs';
import { UpdateAboutRequest } from '../model/Update-about-request.model';

@Injectable({
  providedIn: 'root'
})
export class AboutService {

  constructor(private http: HttpClient) {}

  
  getAllAbout(): Observable<AboutModel[]> {
    return this.http.get<AboutModel[]>(environment.AboutApi);
  }

  getAbout(id: string): Observable<AboutModel>{
    return this.http.get<AboutModel>(`${environment.AboutApi}/GetAboutUsById?id=${id}`);
  }

  updateAbout(id: string, updateAboutRequest: UpdateAboutRequest | FormData): Observable<AboutModel>{
    return this.http.put<AboutModel>(`${environment.AboutApi}/EditAboutUs/${id}`, updateAboutRequest);
  }
}

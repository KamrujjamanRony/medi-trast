import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@environments/environments';
import { Observable } from 'rxjs';
import { AddressModel } from '../model/address.model';
import { UpdateAddressRequest } from '../model/update-address-request.model';

@Injectable({
  providedIn: 'root'
})
export class ContactService {

  constructor(private http: HttpClient) {}

  
  getAllContact(): Observable<AddressModel[]> {
    return this.http.get<AddressModel[]>(environment.ContactApi);
  }

  getContact(id: string): Observable<AddressModel>{
    return this.http.get<AddressModel>(`${environment.ContactApi}/GetAddressById?id=${id}`);
  }

  updateContact(id: string, updateAddressRequest: UpdateAddressRequest | FormData): Observable<AddressModel>{
    return this.http.put<AddressModel>(`${environment.ContactApi}/EditAddress/${id}`, updateAddressRequest);
  }
}

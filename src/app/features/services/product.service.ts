import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ProductModel } from '../model/product.model';
import { AddProductRequest } from '../model/add-poduct-request.model';
import { environment } from '@environments/environments';
import { UpdateProductRequest } from '../model/update-product-request.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  constructor(private http: HttpClient) { }

  addProduct(model: AddProductRequest | FormData): Observable<void>{
    return this.http.post<void>(environment.ProductApi, model)
  }

  getAllProducts(): Observable<ProductModel[]> {
    return this.http.get<ProductModel[]>(environment.ProductApi);
  }

  getCompanyProducts(companyID: number): Observable<ProductModel[]> {
    return this.getAllProducts().pipe(
      map(products => products.filter(product => product.companyID === companyID))
    );
  }

  getProduct(id: string): Observable<ProductModel>{
    return this.http.get<ProductModel>(`${environment.ProductApi}/GetProductById?id=${id}`);
  }

  updateProduct(id: string, updateProductRequest: UpdateProductRequest | FormData): Observable<ProductModel>{
    return this.http.put<ProductModel>(`${environment.ProductApi}/EditProduct/${id}`, updateProductRequest);
  }

  deleteProduct(id: string): Observable<ProductModel>{
    return this.http.delete<ProductModel>(`${environment.ProductApi}/DeleteProduct?id=${id}`);
  }
}

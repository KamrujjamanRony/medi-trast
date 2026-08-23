import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { environment } from '@environments/environments';
import { ProductModel } from 'app/features/model/product.model';
import { ProductService } from 'app/features/services/product.service';
import { Observable, Subscription } from 'rxjs';
import { ProductCardComponent } from '../product-card/product-card.component';

@Component({
    selector: 'app-product-details',
    templateUrl: './product-details.component.html',
    styleUrls: ['./product-details.component.css'],
    imports: [CommonModule, ProductCardComponent]
})
export class ProductDetailsComponent implements OnInit, OnDestroy {
  id!: string | null;
  products$?: Observable<ProductModel[]>;
  product: any | undefined = undefined;
  paramsSubscription?: Subscription;
  loading: boolean = true;
  ImageApi: string = environment.ImageApi;
  emptyImg: string = environment.emptyImg;;

  constructor( private productService: ProductService, private route: ActivatedRoute ) {
    if (!this.products$) {
      this.products$ = productService.getCompanyProducts(environment.companyCode);
    }
   }
  
  ngOnInit(): void {
    // this.products$ = this.productService.getCompanyProducts(environment.companyCode);
    this.paramsSubscription = this.route.paramMap.subscribe(params => {
      this.id = params.get('id');
      this.products$?.subscribe(products => {
        this.product =  products?.find(p => p.id == this.id);
        this.loading = false;
      });
    });
  }

  ngOnDestroy(): void {
    this.paramsSubscription?.unsubscribe();
  };

}

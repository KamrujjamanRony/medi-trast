import { Component, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { environment } from '@environments/environments';
import { CoverComponent } from 'app/components/cover/cover.component';
import { ProductCardComponent } from 'app/components/product-card/product-card.component';
import { ProductModel } from 'app/features/model/product.model';
import { ProductService } from 'app/features/services/product.service';
import { Observable, Subscription } from 'rxjs';

@Component({
    selector: 'app-products',
    templateUrl: './products.component.html',
    styleUrls: ['./products.component.css'],
    imports: [CoverComponent, ProductCardComponent]
})
export class ProductsComponent implements OnInit, OnDestroy {
  yourTitle!: string;
  yourSub1: string = 'Home';
  yourSub2: string = 'Products';
  category: string | null = null;
  paramsSubscription?: Subscription;
  products: any[] | undefined;
  categoryProducts: any[] | undefined;
  surgical: any[] | undefined;
  medicalFurniture: any[] | undefined;
  medical: any[] | undefined;
  laboratory: any[] | undefined;
  Dental: any[] | undefined;
  accessories: any[] | undefined;
  products$?: Observable<ProductModel[]>;
  companyID: number = environment.companyCode;
  loading: boolean = true;

  constructor(
    private productService: ProductService,
    private route: ActivatedRoute,
    private renderer: Renderer2
  ) {
    if (!this.products$) {
      this.products$ = productService.getCompanyProducts(this.companyID);
    }
  }

  ngOnInit(): void {
    this.loading = true;
    this.paramsSubscription = this.route.paramMap.subscribe((params) => {
      this.category = params.get('category');
      if (this.category === 'se') {
        this.yourTitle = 'surgical equipment';
      } else if (this.category === 'mf') {
        this.yourTitle = 'medical furniture';
      } else if (this.category === 'me') {
        this.yourTitle = 'medical equipment';
      } else if (this.category === 'le') {
        this.yourTitle = 'laboratory equipment';
      } else if (this.category === 'de') {
        this.yourTitle = 'dental equipment';
      } else if (this.category === 'ao') {
        this.yourTitle = 'accessories & others';
      } else {
        this.yourTitle = 'all equipments';
      }
      if (!this.products) {
        // this.products$ = this.productService.getCompanyProducts(this.companyID);
        this.products$?.subscribe((products) => {
          this.loading = false;
          this.categoryProducts = products;
          this.filterByParams(products);
        });
      } else {
        // Products are already loaded, filter them
        this.filterByParams(this.products);
      }
    });
  }

  ngOnDestroy(): void {
    this.paramsSubscription?.unsubscribe();
  }

  filterByParams(products: ProductModel[]): void {
        this.surgical = products.filter(
          (product) => product?.productCategory === 'SURGICAL EQUIPMENT'
        );
        this.medicalFurniture = products.filter(
          (product) => product?.productCategory === 'MEDICAL FURNITURE'
        );
        this.medical = products.filter(
          (product) => product?.productCategory === 'MEDICAL EQUIPMENT'
        );
        this.laboratory = products.filter(
          (product) => product?.productCategory === 'LABORATORY EQUIPMENT'
        );
        this.Dental = products.filter(
          (product) => product?.productCategory === 'DENTAL EQUIPMENT'
        );
        this.accessories = products.filter(
          (product) => product?.productCategory === 'ACCESSORIES & OTHERS'
        );
        this.products = products;
  }

  scrollToTop() {
    // Scroll to the top of the page
    this.renderer.setProperty(document.documentElement, 'scrollTop', 0);
  }
}

import { Component, OnInit } from '@angular/core';
import { environment } from '@environments/environments';
import { ProductModel } from 'app/features/model/product.model';
import { ProductService } from 'app/features/services/product.service';
import { Observable } from 'rxjs';
import { DropdownMenuComponent } from '../dropdown-menu/dropdown-menu.component';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-navbar',
    templateUrl: './navbar.component.html',
    styleUrls: ['./navbar.component.css'],
    imports: [DropdownMenuComponent, FormsModule, RouterLink]
})
export class NavbarComponent implements OnInit {
  menuItems = [
    {
      label: 'Home',
      link: '/'
    },
    {
      label: 'Doctor',
      link: '/doctors'
    },
    {
      label: 'Gallery',
      subItems: [
        {
          label: 'Instrument Gallery',
          link: '/gallery/instrument'
        },
        {
          label: 'Hospital Gallery',
          link: '/gallery/hospital'
        }
      ]
    },
    {
      label: 'News',
      subItems: [
        {
          label: 'Latest News',
          link: '/news/latest'
        },
        {
          label: 'Health Magazines',
          link: '/news/magazines'
        }
      ]
    },
    {
      label: 'About Us',
      link: '/about'
    }
  ];
  products$?: Observable<ProductModel[]>;
  originalProducts: ProductModel[] = [];
  products: ProductModel[] = [];

  companyID: number = environment.companyCode;
  searchTerm: string = '';

  constructor(private productService: ProductService) { 
    if (!this.products$) {
      this.products$ = productService.getCompanyProducts(this.companyID);
    }
  }

  ngOnInit(): void {
    // this.products$ = this.productService.getCompanyProducts(this.companyID);

    // Check if products$ is defined before subscribing
    if (this.products$) {
      this.products$.subscribe(products => {
        if (products) {
          this.originalProducts = products;
          this.products = products;
          this.applySearchFilter();
        }
      });
    }
  }

  onSearch() {
    this.applySearchFilter();
  }

  onProductClick() {
    this.searchTerm = '';
    this.applySearchFilter();
  }

  applySearchFilter() {
    if (this.originalProducts.length > 0 && this.searchTerm.trim() !== '') {
      const searchTermLower = this.searchTerm.toLowerCase();
      this.products = this.originalProducts.filter(a =>
        (a.productName && a.productName.toLowerCase().includes(searchTermLower)) ||
        (a.brand && a.brand.toLowerCase().includes(searchTermLower))
      );
    } else {
      // If the search term is empty, reset the product list
      this.products = this.originalProducts;
    }
  }
}

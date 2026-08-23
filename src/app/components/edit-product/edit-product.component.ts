import { CommonModule } from '@angular/common';
import { validateImageFile } from 'app/core/security/file-validation';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '@environments/environments';
import { ProductModel } from 'app/features/model/product.model';
import { ProductService } from 'app/features/services/product.service';
import { Subscription } from 'rxjs';
import { CoverComponent } from '../cover/cover.component';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-edit-product',
    templateUrl: './edit-product.component.html',
    styleUrls: ['./edit-product.component.css'],
    imports: [CoverComponent, FormsModule]
})
export class EditProductComponent implements OnInit, OnDestroy {
  yourTitle: string = 'Update Product information';
  yourSub1: string = 'Dashboard';
  yourSub2: string = 'Edit Product';
  err: string = '';
  id: string | null = null;
  url!: string;
  ImageApi: string = environment.ImageApi;
  emptyImg: string = environment.emptyImg;
  private file?: File;
  productInfo?: ProductModel;
  paramsSubscription?: Subscription;
  editProductSubscription?: Subscription;
  constructor(private route: ActivatedRoute, private router: Router, private productService: ProductService) { }
  ngOnInit(): void {
    this.paramsSubscription = this.route.paramMap.subscribe({
      next: (params) => {
        this.id = params.get('id');
        if (this.id) {
          this.productService.getProduct(this.id)
            .subscribe({
              next: (response) => {
                this.productInfo = response;
                this.url = this.productInfo.imageUrl;
              }
            });
        }
      }
    });
  }

  onFormSubmit(): void {
    // A rejected file must never reach the API.
    if (this.err) {
      return;
    }

    const formData = new FormData();

    formData.append('CompanyID', environment.companyCode.toString());
    formData.append('ProductCategory', this.productInfo?.productCategory ?? '');
    formData.append('ProductName', this.productInfo?.productName ?? '');
    formData.append('Brand', this.productInfo?.brand ?? '');
    formData.append('Model', this.productInfo?.model ?? '');
    formData.append('Origin', this.productInfo?.origin ?? '');
    formData.append('Description', this.productInfo?.description ?? '');
    formData.append('AditionalInformation', this.productInfo?.aditionalInformation ?? '');
    formData.append('SpecialFeature', this.productInfo?.specialFeature ?? '');
    formData.append('CatalogUrl', this.productInfo?.catalogUrl ?? '');
    if (this.file instanceof File) {
      formData.append('ImageFormFile', this.file);
    } 
    else {
      formData.append('ImageUrl', this.url ?? '');
    }

    if (this.id) {
      this.editProductSubscription = this.productService.updateProduct(this.id, formData)
        .subscribe({
          next: (response) => {
            this.router.navigate(['mte12/products']);
          }
        });
    }
  };

  ngOnDestroy(): void {
    this.paramsSubscription?.unsubscribe();
    this.editProductSubscription?.unsubscribe();
  }

  async onFileChange(event: Event): Promise<void> {
    const element = event.currentTarget as HTMLInputElement;
    const selected = element.files?.[0];

    this.file = undefined;
    this.err = '';

    if (!selected) {
      return;
    }

    const result = await validateImageFile(selected);
    if (result.ok) {
      this.file = result.file;
    } else {
      this.err = result.error;
      element.value = '';
    }
  }
}

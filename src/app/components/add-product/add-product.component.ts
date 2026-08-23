// Import necessary modules and services
import { Component, OnDestroy } from '@angular/core';
import { validateImageFile } from 'app/core/security/file-validation';
import { Router } from '@angular/router';
import { environment } from '@environments/environments';
import { AddProductRequest } from 'app/features/model/add-poduct-request.model';
import { ProductService } from 'app/features/services/product.service';
import { Subscription } from 'rxjs';
import { CoverComponent } from '../cover/cover.component';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-add-product',
    templateUrl: './add-product.component.html',
    styleUrls: ['./add-product.component.css'],
    imports: [CoverComponent, FormsModule]
})
export class AddProductComponent implements OnDestroy {
  // Component properties
  yourTitle: string = 'add a product';
  yourSub1: string = 'Dashboard';
  yourSub2: string = 'Add Product';
  err: string = '';
  model: AddProductRequest;
  private file?: File;
  private addProductSubscription?: Subscription;
  fileInput: any;

  constructor(private productService: ProductService, private router: Router) {
    // Initialize model properties
    this.model = {
      CompanyID: environment.companyCode,
      ProductCategory: '',
      ProductName: '',
      Brand: '',
      Model: '',
      Origin: '',
      Description: '',
      AditionalInformation: '',
      SpecialFeature: '',
      ImageUrl: '',
      ImageFormFile: null,
      CatalogUrl: '',
    };
  }

  // Handle form submission
  onFormSubmit(): void {
    // A rejected file must never reach the API.
    if (this.err) {
      return;
    }
    if (!this.file) {
      this.err = 'Please choose a valid image before saving.';
      return;
    }
    const formData = new FormData();

    formData.append('CompanyID', this.model.CompanyID.toString());
    formData.append('ProductCategory', this.model.ProductCategory);
    formData.append('ProductName', this.model.ProductName);
    formData.append('Brand', this.model.Brand);
    formData.append('Model', this.model.Model);
    formData.append('Origin', this.model.Origin);
    formData.append('Description', this.model.Description);
    formData.append('AditionalInformation', this.model.AditionalInformation);
    formData.append('SpecialFeature', this.model.SpecialFeature);
    formData.append('CatalogUrl', this.model.CatalogUrl);
    if (this.file instanceof File) {
      formData.append('ImageFormFile', this.file);
    }

    this.addProductSubscription = this.productService.addProduct(formData)
      .subscribe({
        next: (response) => {
          this.router.navigateByUrl('mte12/products');
        },
        error: (error) => {
          console.error('Error adding product:', error);
        }
      });
  }

  // Unsubscribe from the subscription to avoid memory leaks
  ngOnDestroy(): void {
    this.addProductSubscription?.unsubscribe();
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

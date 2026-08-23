import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { environment } from '@environments/environments';
import { Observable, Subscription } from 'rxjs';
import { DeleteConfirmationModalComponent } from '../delete-confirmation-modal/delete-confirmation-modal.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { ProductModel } from 'app/features/model/product.model';
import { ProductService } from 'app/features/services/product.service';
import { CoverComponent } from '../cover/cover.component';


@Component({
    selector: 'app-product-list',
    templateUrl: './product-list.component.html',
    styleUrls: ['./product-list.component.css'],
    imports: [CommonModule, CoverComponent, RouterLink, MatDialogModule]
})



export class ProductListComponent implements OnInit, OnDestroy {
  yourTitle: string = 'all products list';
  yourSub1: string = 'Dashboard';
  yourSub2: string = 'Products';
  emptyImg: string = environment.emptyImg;
  loading: boolean = true;
  products$?: Observable<ProductModel[]>;
  deleteProductSubscription?: Subscription;
  companyID: number = environment.companyCode;
  ImageApi: string = environment.ImageApi;
  isModalOpen = false;
  constructor(private productService: ProductService, private router: Router, private dialog: MatDialog) {
    if (!this.products$) {
      this.products$ = productService.getCompanyProducts(this.companyID);
      this.products$.subscribe(() => {
        this.loading = false;
      });
    }
   }

  ngOnInit(): void {
    // this.products$ = this.productService.getCompanyProducts(this.companyID);

    // this.products$.subscribe(() => {
    //   this.loading = false;
    // });
  }
  
  onDelete(id: string): void {
    const dialogRef = this.dialog.open(DeleteConfirmationModalComponent);

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        this.confirmDelete(id)
      }
    });
  }

  confirmDelete(id: string): void {
    this.deleteProductSubscription = this.productService.deleteProduct(id).subscribe({
      next: () => {
        this.products$ = this.productService.getCompanyProducts(this.companyID);
        this.closeModal();
      },
    });
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  ngOnDestroy(): void {
    this.deleteProductSubscription?.unsubscribe();
  }
}
import { Observable, Subscription } from 'rxjs';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { environment } from '@environments/environments';
import { Router, RouterLink } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DeleteConfirmationModalComponent } from '../delete-confirmation-modal/delete-confirmation-modal.component';
import { CommonModule } from '@angular/common';
import { CarouselModel } from 'app/features/model/carousel.model';
import { CarouselService } from 'app/features/services/carousel.service';
import { CoverComponent } from '../cover/cover.component';

@Component({
    selector: 'app-carousel-list',
    templateUrl: './carousel-list.component.html',
    styleUrls: ['./carousel-list.component.css'],
    imports: [CommonModule, CoverComponent, RouterLink, MatDialogModule]
})
export class CarouselListComponent implements OnInit, OnDestroy {
  yourTitle: string = 'all carousel information';
  yourSub1: string = 'Dashboard';
  yourSub2: string = 'Carousel';
  emptyImg: string = environment.emptyImg;
  loading: boolean = true;
  carousels$?: Observable<CarouselModel[]>;
  deleteCarouselSubscription?: Subscription;
  companyID: number = environment.companyCode;
  ImageApi: string = environment.ImageApi;
  isModalOpen = false;
  constructor(private carouselService: CarouselService, private router: Router, private dialog: MatDialog) { 
    if (!this.carousels$) {
      this.loading = false;
      this.carousels$ = carouselService.getCompanyCarousel(this.companyID);
    }
  }

  ngOnInit(): void {
    // this.carousels$ = this.carouselService.getCompanyCarousel(this.companyID);

    // this.carousels$.subscribe(() => {
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
    this.deleteCarouselSubscription = this.carouselService.deleteCarousel(id).subscribe({
      next: () => {
        this.carousels$ = this.carouselService.getCompanyCarousel(this.companyID);
        this.closeModal();
      },
    });
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  ngOnDestroy(): void {
    this.deleteCarouselSubscription?.unsubscribe();
  }
}

import { Component, OnDestroy, OnInit } from '@angular/core';
import { validateImageFile } from 'app/core/security/file-validation';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '@environments/environments';
import { CarouselModel } from 'app/features/model/carousel.model';
import { CarouselService } from 'app/features/services/carousel.service';
import { Subscription } from 'rxjs';
import { CoverComponent } from '../cover/cover.component';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-edit-carousel',
    templateUrl: './edit-carousel.component.html',
    styleUrls: ['./edit-carousel.component.css'],
    imports: [CoverComponent, FormsModule]
})
export class EditCarouselComponent implements OnInit, OnDestroy {
  yourTitle: string = 'Update Carousel information';
  yourSub1: string = 'Dashboard';
  yourSub2: string = 'Edit Carousel';
  id: string | null = null;
  url!: string;
  err: string = '';
  ImageApi: string = environment.ImageApi;
  emptyImg: string = environment.emptyImg;
  private file?: File;
  carouselInfo?: CarouselModel;
  paramsSubscription?: Subscription;
  editCarouselSubscription?: Subscription;
  constructor(private route: ActivatedRoute, private router: Router, private carouselService: CarouselService) { }
  ngOnInit(): void {
    this.paramsSubscription = this.route.paramMap.subscribe({
      next: (params) => {
        this.id = params.get('id');
        if (this.id) {
          this.carouselService.getCarousel(this.id)
            .subscribe({
              next: (response) => {
                this.carouselInfo = response;
                this.url = response.imageUrl;
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
    formData.append('Title', this.carouselInfo?.title ?? '');
    formData.append('Description', this.carouselInfo?.description ?? '');
    if (this.file instanceof File) {
      formData.append('ImageFormFile', this.file);
    } 
    else {
      formData.append('ImageUrl', this.url ?? '');
    }

    if (this.id) {
      this.editCarouselSubscription = this.carouselService.updateCarousel(this.id, formData)
        .subscribe({
          next: (response) => {
            this.router.navigate(['mte12/carousel']);
          }
        });
    }
  };

  ngOnDestroy(): void {
    this.paramsSubscription?.unsubscribe();
    this.editCarouselSubscription?.unsubscribe();
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

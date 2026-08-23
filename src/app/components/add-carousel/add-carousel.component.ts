import { Component, OnDestroy } from '@angular/core';
import { validateImageFile } from 'app/core/security/file-validation';
import { Router } from '@angular/router';
import { environment } from '@environments/environments';
import { AddCarouselRequest } from 'app/features/model/carousel.model';
import { CarouselService } from 'app/features/services/carousel.service';
import { Subscription } from 'rxjs';
import { CoverComponent } from '../cover/cover.component';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-add-carousel',
    templateUrl: './add-carousel.component.html',
    styleUrls: ['./add-carousel.component.css'],
    imports: [CoverComponent, FormsModule]
})
export class AddCarouselComponent implements OnDestroy {
  // Component properties
  yourTitle: string = 'add a carousel';
  yourSub1: string = 'Dashboard';
  yourSub2: string = 'Add Carousel';
  err: string = '';
  model: AddCarouselRequest;
  private file?: File;
  private addCarouselSubscription?: Subscription;

  constructor(private carouselService: CarouselService, private router: Router) {
    // Initialize model properties
    this.model = {
      companyID: environment.companyCode,
      title: '',
      description: '',
      imageUrl: '',
      imageFile: null,
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

    formData.append('CompanyID', this.model.companyID.toString());
    formData.append('Title', this.model.title);
    formData.append('Description', this.model.description);
    formData.append('ImageUrl', this.model.imageUrl);
    if (this.file instanceof File) {
      formData.append('ImageFormFile', this.file);
    }

    this.addCarouselSubscription = this.carouselService.addCarousel(formData)
      .subscribe({
        next: (response) => {
          this.router.navigateByUrl('mte12/carousel');
        },
        error: (error) => {
          console.error('Error adding carousel:', error);
        }
      });
  }

  // Unsubscribe from the subscription to avoid memory leaks
  ngOnDestroy(): void {
    this.addCarouselSubscription?.unsubscribe();
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

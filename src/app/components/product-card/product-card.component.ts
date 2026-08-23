import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '@environments/environments';

@Component({
  selector: 'app-product-card',
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.css'],
  imports: []
})
export class ProductCardComponent {
  @Input() product: any;
  ImageApi: string = environment.ImageApi;
  emptyImg: string = environment.emptyImg;

  constructor(private router: Router) { }


  scrollToTopAndNavigate(route: any): void {
    // Scroll to the top of the page
    window.scrollTo(0, 0);

    // Navigate to the specified route
    this.router.navigateByUrl(route);
  }
}

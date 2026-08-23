import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { CarouselComponent } from 'app/components/carousel/carousel.component';
import { HeroComponent } from "../../components/hero/hero.component";
import { OurProductsComponent } from "../../components/our-products/our-products.component";

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.css'],
    imports: [CarouselComponent, HeroComponent, OurProductsComponent]
})
export class HomeComponent {

}

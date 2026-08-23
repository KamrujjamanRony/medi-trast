import { Routes } from "@angular/router";
import { adminGuard } from "./core/security/admin.guard";
import { AboutUsComponent } from "./components/about-us/about-us.component";
import { AddCarouselComponent } from "./components/add-carousel/add-carousel.component";
import { AddProductComponent } from "./components/add-product/add-product.component";
import { CarouselListComponent } from "./components/carousel-list/carousel-list.component";
import { ContactUsComponent } from "./components/contact-us/contact-us.component";
import { EditCarouselComponent } from "./components/edit-carousel/edit-carousel.component";
import { EditProductComponent } from "./components/edit-product/edit-product.component";
import { ProductDetailsComponent } from "./components/product-details/product-details.component";
import { ProductListComponent } from "./components/product-list/product-list.component";
import { AdminLayoutComponent } from "./layouts/admin-layout/admin-layout.component";
import { MainLayoutComponent } from "./layouts/main-layout/main-layout.component";
import { AboutComponent } from "./pages/about/about.component";
import { ContactComponent } from "./pages/contact/contact.component";
import { HomeComponent } from "./pages/home/home.component";
import { ProductsComponent } from "./pages/products/products.component";


export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      {
        path: '',
        component: HomeComponent
      },
      {
        path: 'about',
        component: AboutComponent
      },
      {
        path: 'contact',
        component: ContactComponent
      },
      {
        path: 'products/:category',
        component: ProductsComponent,
      },
      {
        path: 'product/:id',
        component: ProductDetailsComponent,
      },
    ],
  },
  {
    path: 'mte12',
    component: AdminLayoutComponent,
    children: [
      // The default child is the panel landing page. It must NOT carry the
      // guard: the guard redirects here, so guarding it would redirect to
      // itself forever. It is still safe, because AdminLayoutComponent only
      // renders its <router-outlet> once the panel is unlocked, so this
      // component is never constructed while locked.
      { path: '', component: ProductListComponent },

      // Every other child is guarded, so deep links such as
      // /#/mte12/add-product bounce back to the lock screen.
      { path: 'products', component: ProductListComponent, canActivate: [adminGuard] },
      { path: 'add-product', component: AddProductComponent, canActivate: [adminGuard] },
      { path: 'products/add-product', component: AddProductComponent, canActivate: [adminGuard] },
      { path: 'edit-product/:id', component: EditProductComponent, canActivate: [adminGuard] },
      { path: 'products/edit-product/:id', component: EditProductComponent, canActivate: [adminGuard] },
      { path: 'about-us/:id', component: AboutUsComponent, canActivate: [adminGuard] },
      { path: 'contact-us/:id', component: ContactUsComponent, canActivate: [adminGuard] },
      { path: 'carousel', component: CarouselListComponent, canActivate: [adminGuard] },
      { path: 'carousel/add-carousel', component: AddCarouselComponent, canActivate: [adminGuard] },
      { path: 'carousel/edit-carousel/:id', component: EditCarouselComponent, canActivate: [adminGuard] },
    ],
  },
];

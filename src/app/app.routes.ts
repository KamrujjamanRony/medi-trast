import { Routes } from '@angular/router';
import { adminGuard } from './core/security/admin.guard';

/**
 * Routes are lazily loaded per component. The previous table imported all
 * twenty components eagerly at the top of this file, so the admin panel — which
 * almost no visitor ever opens — was part of the initial bundle on every page.
 */
export const routes: Routes = [
  // The admin shell MUST come before the public shell. The public route below
  // has `path: ''`, which matches every URL as a prefix, so its `**` child
  // would otherwise swallow /mte12 and render the 404 page instead of the
  // lock screen.
  {
    path: 'mte12',
    loadComponent: () =>
      import('./layouts/admin-layout/admin-layout').then((m) => m.AdminLayout),
    children: [
      // The default child is the panel landing page. It must NOT carry the
      // guard: the guard redirects here, so guarding it would redirect to
      // itself forever. It is still safe, because AdminLayout only renders its
      // <router-outlet> once the panel is unlocked, so this component is never
      // constructed while locked.
      {
        path: '',
        loadComponent: () =>
          import('./admin/product-list/product-list').then((m) => m.AdminProductList),
      },

      // Every other child is guarded, so deep links such as
      // /#/mte12/products/new bounce back to the lock screen.
      {
        path: 'products',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./admin/product-list/product-list').then((m) => m.AdminProductList),
      },
      {
        path: 'products/new',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./admin/product-form/product-form').then((m) => m.AdminProductForm),
      },
      {
        path: 'products/:id/edit',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./admin/product-form/product-form').then((m) => m.AdminProductForm),
      },
      {
        path: 'carousel',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./admin/carousel-list/carousel-list').then((m) => m.AdminCarouselList),
      },
      {
        path: 'carousel/new',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./admin/carousel-form/carousel-form').then((m) => m.AdminCarouselForm),
      },
      {
        path: 'carousel/:id/edit',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./admin/carousel-form/carousel-form').then((m) => m.AdminCarouselForm),
      },
      {
        path: 'about-us/:id',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./admin/about-form/about-form').then((m) => m.AdminAboutForm),
      },
      {
        path: 'contact-us/:id',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./admin/contact-form/contact-form').then((m) => m.AdminContactForm),
      },

      // Legacy URLs from the previous routing table, kept so existing
      // bookmarks and the browser's history do not 404.
      { path: 'add-product', redirectTo: 'products/new' },
      { path: 'products/add-product', redirectTo: 'products/new' },
      { path: 'edit-product/:id', redirectTo: 'products/:id/edit' },
      { path: 'products/edit-product/:id', redirectTo: 'products/:id/edit' },
      { path: 'carousel/add-carousel', redirectTo: 'carousel/new' },
      { path: 'carousel/edit-carousel/:id', redirectTo: 'carousel/:id/edit' },

      { path: '**', redirectTo: '' },
    ],
  },
  {
    path: '',
    loadComponent: () =>
      import('./layouts/main-layout/main-layout').then((m) => m.MainLayout),
    children: [
      {
        path: '',
        title: 'Medi-Trust Engineers — Medical Equipment Supplier',
        loadComponent: () => import('./pages/home/home').then((m) => m.Home),
      },
      {
        path: 'about',
        title: 'About Us — Medi-Trust Engineers',
        loadComponent: () => import('./pages/about/about').then((m) => m.About),
      },
      {
        path: 'contact',
        title: 'Contact Us — Medi-Trust Engineers',
        loadComponent: () => import('./pages/contact/contact').then((m) => m.Contact),
      },
      {
        path: 'products',
        pathMatch: 'full',
        redirectTo: 'products/all',
      },
      {
        path: 'products/:category',
        title: 'Products — Medi-Trust Engineers',
        loadComponent: () => import('./pages/products/products').then((m) => m.Products),
      },
      {
        path: 'product/:id',
        title: 'Product — Medi-Trust Engineers',
        loadComponent: () =>
          import('./pages/product-details/product-details').then((m) => m.ProductDetails),
      },
      {
        path: '**',
        title: 'Page not found — Medi-Trust Engineers',
        loadComponent: () => import('./pages/not-found/not-found').then((m) => m.NotFound),
      },
    ],
  },
];

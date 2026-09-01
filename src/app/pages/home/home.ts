import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RevealDirective } from 'app/core/directives/reveal.directive';
import { PRODUCT_CATEGORIES } from 'app/features/models';
import { AboutService } from 'app/features/services/about.service';
import { CarouselService } from 'app/features/services/carousel.service';
import { ProductService } from 'app/features/services/product.service';
import { HeroCarousel } from 'app/shared/components/hero-carousel';
import { ProductCard } from 'app/shared/components/product-card';
import { EmptyState } from 'app/shared/ui/empty-state';
import { Icon } from 'app/shared/ui/icon';
import { SkeletonGrid } from 'app/shared/ui/skeleton-grid';

const FEATURED_COUNT = 10;

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    RevealDirective,
    HeroCarousel,
    ProductCard,
    SkeletonGrid,
    EmptyState,
    Icon,
  ],
  template: `
    <!--
      The page's single h1. The visible hero heading is a carousel slide title,
      which rotates and can be absent entirely, so it cannot be the h1 — the old
      home page ended up with no h1 at all, leaving the document outline
      headless for screen readers and search engines.
    -->
    <h1 class="sr-only">
      Medi-Trust Engineers — all kinds of medical solutions from one source
    </h1>

    @if (carousel.isLoading()) {
      <div class="skeleton h-[clamp(20rem,52vw,34rem)] rounded-none"></div>
    } @else if (slides().length) {
      <app-hero-carousel [slides]="slides()" />
    } @else {
      <!-- No slides configured: a static banner rather than a blank gap. -->
      <section class="fallback-hero">
        <div class="shell py-20 text-center lg:py-28">
          <p class="eyebrow justify-center text-brand-200">Medi-Trust Engineers</p>
          <p class="mt-3 font-display text-4xl font-extrabold text-white lg:text-6xl">
            All kinds of medical solutions from one source
          </p>
          <p class="mx-auto mt-4 max-w-2xl text-white/75">
            Surgical, laboratory, dental and hospital equipment supplied and
            serviced across Bangladesh.
          </p>
          <div class="mt-8 flex flex-wrap justify-center gap-3">
            <a class="btn btn-primary btn-lg" routerLink="/products/all">Browse equipment</a>
            <a class="btn btn-on-dark btn-lg" routerLink="/contact">Contact us</a>
          </div>
        </div>
      </section>
    }

    <!-- Category shortcuts -->
    <section class="section">
      <div class="shell">
        <div class="text-center">
          <p class="eyebrow">What we supply</p>
          <h2 class="section-title mt-2">Equipment categories</h2>
          <p class="section-lead mx-auto">
            Six product lines covering the operating theatre, the ward, the lab
            and the dental chair.
          </p>
        </div>

        <div class="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          @for (category of categories; track category.slug; let i = $index) {
            <a
              class="category-card"
              [routerLink]="['/products', category.slug]"
              [appReveal]="i * 60"
            >
              <span class="category-icon">
                <app-icon name="layers" [size]="20" />
              </span>
              <span class="grid gap-0.5">
                <span class="category-name">{{ category.label }}</span>
                <span class="category-count">{{ countFor(category.apiValue) }} products</span>
              </span>
              <app-icon name="arrow-right" [size]="18" class="category-arrow" />
            </a>
          }
        </div>
      </div>
    </section>

    <!-- Company introduction -->
    @if (about(); as info) {
      <section class="section bg-white">
        <div class="shell grid items-center gap-12 lg:grid-cols-2">
          <div appReveal>
            <p class="eyebrow">Who we are</p>
            <h2 class="section-title mt-2">{{ info.title || 'About Medi-Trust Engineers' }}</h2>
            @if (info.description) {
              <p class="prose-block mt-4">{{ info.description }}</p>
            }
            <a class="btn btn-primary mt-7" routerLink="/about">
              <span>Read more about us</span>
              <app-icon name="arrow-right" [size]="17" />
            </a>
          </div>
          <div class="portrait" [appReveal]="120">
            <img
              src="assets/ceo.png"
              alt="Medi-Trust Engineers leadership"
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
      </section>
    }

    <!-- Featured products -->
    <section class="section">
      <div class="shell">
        <div class="panel-heading">
          <div>
            <p class="eyebrow">Catalogue</p>
            <h2 class="section-title mt-2">Featured products</h2>
          </div>
          <a class="btn btn-outline" routerLink="/products/all">
            <span>View all</span>
            <app-icon name="arrow-right" [size]="17" />
          </a>
        </div>

        @if (products.isLoading()) {
          <app-skeleton-grid [count]="10" />
        } @else if (products.error()) {
          <div class="card">
            <app-empty-state
              icon="alert"
              tone="error"
              title="Could not load the catalogue"
              message="The product service did not respond. Check your connection and try again."
            >
              <button type="button" class="btn btn-primary" (click)="products.reload()">
                <app-icon name="refresh" [size]="17" />
                <span>Retry</span>
              </button>
            </app-empty-state>
          </div>
        } @else if (featured().length) {
          <div class="product-grid">
            @for (product of featured(); track product.id; let i = $index) {
              <app-product-card [product]="product" [delay]="i * 45" />
            }
          </div>
        } @else {
          <div class="card">
            <app-empty-state
              title="No products published yet"
              message="Once products are added in the admin panel they will appear here."
            />
          </div>
        }
      </div>
    </section>
  `,
  styles: `
    .fallback-hero {
      background: linear-gradient(160deg, var(--color-brand-900), var(--color-brand-700));
    }

    .category-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      border: 1px solid var(--color-ink-200);
      border-radius: var(--radius-card);
      background: var(--color-surface);
      padding: 1.25rem;
      text-decoration: none;
      box-shadow: var(--shadow-soft);
      transition:
        transform 0.22s var(--ease-out-soft),
        border-color 0.22s var(--ease-out-soft),
        box-shadow 0.22s var(--ease-out-soft);
    }

    .category-card:hover {
      transform: translateY(-2px);
      border-color: var(--color-brand-300);
      box-shadow: var(--shadow-raised);
    }

    .category-icon {
      display: grid;
      place-items: center;
      width: 2.75rem;
      height: 2.75rem;
      flex: none;
      border-radius: 0.75rem;
      background: var(--color-brand-50);
      color: var(--color-brand-600);
    }

    .category-name {
      font-family: var(--font-display);
      font-weight: 600;
      color: var(--color-ink-900);
    }

    .category-count {
      font-size: 0.8125rem;
      color: var(--color-ink-500);
    }

    .category-arrow {
      margin-left: auto;
      color: var(--color-ink-300);
      transition:
        transform 0.22s var(--ease-out-soft),
        color 0.22s var(--ease-out-soft);
    }

    .category-card:hover .category-arrow {
      transform: translateX(3px);
      color: var(--color-brand-500);
    }

    .portrait {
      position: relative;
      border-radius: var(--radius-card);
      background: linear-gradient(150deg, var(--color-brand-50), var(--color-ink-100));
      padding: 1.5rem;
      overflow: hidden;
    }

    .portrait img {
      width: 100%;
      max-width: 26rem;
      margin-inline: auto;
      object-fit: contain;
    }
  `,
})
export class Home {
  protected readonly categories = PRODUCT_CATEGORIES;

  protected readonly products = inject(ProductService);
  protected readonly carousel = inject(CarouselService);

  private readonly aboutService = inject(AboutService);

  protected readonly slides = this.carousel.slides;
  protected readonly about = this.aboutService.about;

  protected readonly featured = computed(() => this.products.products().slice(0, FEATURED_COUNT));

  protected countFor(apiValue: string): number {
    return this.products.products().filter((product) => product.productCategory === apiValue)
      .length;
  }
}

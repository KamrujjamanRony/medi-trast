import { ChangeDetectionStrategy, Component, ElementRef, computed, effect, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { PRODUCT_CATEGORIES } from 'app/features/models';
import { ContactService } from 'app/features/services/contact.service';
import { ProductService } from 'app/features/services/product.service';
import { toTelHref } from 'app/shared/media';
import { Icon } from '../ui/icon';

/**
 * Site masthead: brand, primary navigation and product search.
 *
 * Merges the old `app-header` (a logo band) and `app-navbar` into one sticky
 * bar, and fixes what was broken in both:
 *
 *  - `app-header` used `routerLink` on its logo but never imported `RouterLink`,
 *    so the attribute was inert and the logo was not clickable at all. Its logo
 *    was also hot-linked from a Google Drive `uc?id=` URL, which is rate-limited
 *    and serves an HTML interstitial rather than an image; it is an inline SVG now.
 *  - the products dropdown called `toggleDropdown()` from `mouseenter`,
 *    `mouseleave` *and* `click`, so clicking it flipped the state twice and
 *    moving the pointer away flipped it again. It is now an explicit button with
 *    `aria-expanded`, closing on Escape, outside click and navigation.
 *  - search results were `<li [routerLink]>` elements: not focusable, not
 *    announced as links, and unusable without a mouse.
 */
@Component({
  selector: 'app-site-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, Icon],
  host: {
    '(document:keydown.escape)': 'closeAll()',
    '(document:click)': 'onDocumentClick($event)',
  },
  template: `
    <a class="skip-link" href="#main">Skip to content</a>

    <!-- Utility bar: real contact details, so they are reachable from any page. -->
    <div class="utility-bar">
      <div class="shell flex flex-wrap items-center justify-between gap-x-6 gap-y-1">
        <p class="hidden sm:block">All kinds of medical solutions from one source</p>
        <div class="flex flex-wrap items-center gap-x-5 gap-y-1">
          @if (primaryPhoneHref(); as tel) {
            <a class="utility-link" [href]="tel">
              <app-icon name="phone" [size]="14" />
              <span>{{ primaryPhone() }}</span>
            </a>
          }
          @if (links().email; as mailto) {
            <a class="utility-link" [href]="mailto">
              <app-icon name="mail" [size]="14" />
              <span>{{ contact()?.email }}</span>
            </a>
          }
        </div>
      </div>
    </div>

    <header class="masthead">
      <div class="shell flex items-center gap-4 py-3">
        <a routerLink="/" class="brand" aria-label="Medi-Trust Engineers — home">
          <svg viewBox="0 0 44 44" class="brand-mark" aria-hidden="true">
            <rect width="44" height="44" rx="12" fill="var(--color-brand-600)" />
            <path
              d="M14 22h4l2.5-6 3 12 2.5-6h4"
              fill="none"
              stroke="#fff"
              stroke-width="2.4"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <span class="brand-text">
            <span class="brand-name">
              <span class="brand-name-accent">Medi</span>-Trust Engineers
            </span>
            <span class="brand-tagline">Medical Equipment Supplier</span>
          </span>
        </a>

        <!-- Desktop navigation -->
        <nav class="ml-auto hidden lg:block" aria-label="Primary">
          <ul class="flex items-center gap-1">
            <li>
              <a class="nav-link" routerLink="/" routerLinkActive="is-active"
                 [routerLinkActiveOptions]="{ exact: true }">Home</a>
            </li>
            <li class="relative">
              <button
                type="button"
                class="nav-link"
                [class.is-active]="productsOpen()"
                [attr.aria-expanded]="productsOpen()"
                aria-haspopup="true"
                (click)="toggleProducts()"
              >
                <span>Products</span>
                <app-icon name="chevron-down" [size]="15" class="transition-transform"
                          [style.transform]="productsOpen() ? 'rotate(180deg)' : ''" />
              </button>
              @if (productsOpen()) {
                <ul class="dropdown">
                  <li>
                    <a class="dropdown-item" routerLink="/products/all" (click)="closeAll()">
                      All Equipment
                    </a>
                  </li>
                  @for (category of categories; track category.slug) {
                    <li>
                      <a class="dropdown-item" [routerLink]="['/products', category.slug]" (click)="closeAll()">
                        {{ category.label }}
                      </a>
                    </li>
                  }
                </ul>
              }
            </li>
            <li>
              <a class="nav-link" routerLink="/about" routerLinkActive="is-active">About Us</a>
            </li>
            <li>
              <a class="nav-link" routerLink="/contact" routerLinkActive="is-active">Contact Us</a>
            </li>
          </ul>
        </nav>

        <!-- Search -->
        <div class="search ml-auto lg:ml-0">
          <label class="sr-only" for="product-search">Search products</label>
          <span class="search-icon"><app-icon name="search" [size]="17" /></span>
          <input
            id="product-search"
            type="search"
            class="search-input"
            placeholder="Search products…"
            autocomplete="off"
            role="combobox"
            aria-controls="search-results"
            [attr.aria-expanded]="showResults()"
            [value]="query()"
            (input)="onQuery($event)"
          />

          @if (showResults()) {
            <div id="search-results" class="search-panel">
              @if (results().length) {
                <ul>
                  @for (product of results(); track product.id) {
                    <li>
                      <a class="search-item" [routerLink]="['/product', product.id]" (click)="clearSearch()">
                        <span class="search-item-name">{{ product.productName }}</span>
                        @if (product.brand) {
                          <span class="search-item-meta">{{ product.brand }}</span>
                        }
                      </a>
                    </li>
                  }
                </ul>
                @if (totalMatches() > results().length) {
                  <a class="search-more" routerLink="/products/all" (click)="clearSearch()">
                    View all {{ totalMatches() }} matches
                  </a>
                }
              } @else {
                <p class="search-empty">No products match “{{ query() }}”.</p>
              }
            </div>
          }
        </div>

        <button
          type="button"
          class="btn btn-ghost btn-icon lg:hidden"
          [attr.aria-expanded]="menuOpen()"
          aria-controls="mobile-nav"
          [attr.aria-label]="menuOpen() ? 'Close menu' : 'Open menu'"
          (click)="toggleMenu()"
        >
          <app-icon [name]="menuOpen() ? 'x' : 'menu'" [size]="22" />
        </button>
      </div>

      <!-- Mobile navigation -->
      @if (menuOpen()) {
        <nav id="mobile-nav" class="mobile-nav lg:hidden" aria-label="Primary">
          <div class="shell grid gap-1 py-3">
            <a class="mobile-link" routerLink="/" (click)="closeAll()">Home</a>
            <p class="mobile-heading">Products</p>
            <a class="mobile-link mobile-sub" routerLink="/products/all" (click)="closeAll()">
              All Equipment
            </a>
            @for (category of categories; track category.slug) {
              <a class="mobile-link mobile-sub" [routerLink]="['/products', category.slug]" (click)="closeAll()">
                {{ category.label }}
              </a>
            }
            <a class="mobile-link" routerLink="/about" (click)="closeAll()">About Us</a>
            <a class="mobile-link" routerLink="/contact" (click)="closeAll()">Contact Us</a>
          </div>
        </nav>
      }
    </header>
  `,
  styles: `
    :host {
      position: sticky;
      top: 0;
      z-index: 50;
      display: block;
    }

    .skip-link {
      position: absolute;
      left: 0.5rem;
      top: 0.5rem;
      z-index: 60;
      transform: translateY(-200%);
      border-radius: 0.5rem;
      background: var(--color-ink-900);
      padding: 0.5rem 1rem;
      color: #fff;
      font-weight: 600;
      text-decoration: none;
      transition: transform 0.18s var(--ease-out-soft);
    }

    .skip-link:focus-visible {
      transform: none;
    }

    .utility-bar {
      background: var(--color-brand-900);
      color: rgb(255 255 255 / 0.85);
      font-size: 0.8125rem;
      padding-block: 0.4rem;
    }

    .utility-link {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      color: inherit;
      text-decoration: none;
      transition: color 0.18s ease;
    }

    .utility-link:hover {
      color: #fff;
    }

    .masthead {
      background: var(--color-surface);
      border-bottom: 1px solid var(--color-ink-200);
      box-shadow: var(--shadow-soft);
    }

    .brand {
      display: inline-flex;
      align-items: center;
      gap: 0.75rem;
      text-decoration: none;
      flex: none;
    }

    .brand-mark {
      width: 2.5rem;
      height: 2.5rem;
      flex: none;
    }

    .brand-text {
      display: none;
      flex-direction: column;
      line-height: 1.2;
    }

    @media (min-width: 480px) {
      .brand-text {
        display: flex;
      }
    }

    .brand-name {
      font-family: var(--font-display);
      font-size: 1.0625rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: var(--color-ink-900);
      white-space: nowrap;
    }

    .brand-name-accent {
      color: var(--color-accent-600);
    }

    .brand-tagline {
      font-size: 0.6875rem;
      font-weight: 500;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--color-ink-400);
    }

    .nav-link {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      border-radius: var(--radius-control);
      padding: 0.5rem 0.75rem;
      font-size: 0.9375rem;
      font-weight: 500;
      color: var(--color-ink-600);
      text-decoration: none;
      background: none;
      border: 0;
      cursor: pointer;
      white-space: nowrap;
      transition:
        color 0.18s var(--ease-out-soft),
        background-color 0.18s var(--ease-out-soft);
    }

    .nav-link:hover,
    .nav-link.is-active {
      color: var(--color-brand-700);
      background-color: var(--color-brand-50);
    }

    .dropdown {
      position: absolute;
      left: 0;
      top: calc(100% + 0.5rem);
      z-index: 40;
      min-width: 15rem;
      overflow: hidden;
      border: 1px solid var(--color-ink-200);
      border-radius: var(--radius-card);
      background: var(--color-surface);
      padding: 0.375rem;
      box-shadow: var(--shadow-float);
      animation: pop-in 0.16s var(--ease-out-soft);
    }

    @keyframes pop-in {
      from {
        opacity: 0;
        transform: translateY(-4px);
      }
    }

    .dropdown-item {
      display: block;
      border-radius: 0.5rem;
      padding: 0.5rem 0.75rem;
      font-size: 0.875rem;
      color: var(--color-ink-600);
      text-decoration: none;
      transition:
        background-color 0.15s var(--ease-out-soft),
        color 0.15s var(--ease-out-soft);
    }

    .dropdown-item:hover {
      background-color: var(--color-brand-50);
      color: var(--color-brand-700);
    }

    .search {
      position: relative;
      flex: 1 1 auto;
      min-width: 0;
      max-width: 18rem;
    }

    .search-icon {
      position: absolute;
      left: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      color: var(--color-ink-400);
      pointer-events: none;
    }

    .search-input {
      width: 100%;
      border: 1px solid var(--color-ink-300);
      border-radius: 999px;
      background: var(--color-ink-50);
      padding: 0.5rem 0.875rem 0.5rem 2.375rem;
      font: inherit;
      font-size: 0.875rem;
      color: var(--color-ink-900);
      transition:
        border-color 0.18s var(--ease-out-soft),
        box-shadow 0.18s var(--ease-out-soft),
        background-color 0.18s var(--ease-out-soft);
    }

    .search-input::placeholder {
      color: var(--color-ink-400);
    }

    .search-input:focus {
      outline: none;
      background: var(--color-surface);
      border-color: var(--color-brand-500);
      box-shadow: 0 0 0 3px var(--color-brand-100);
    }

    .search-panel {
      position: absolute;
      left: 0;
      right: 0;
      top: calc(100% + 0.5rem);
      z-index: 40;
      max-height: min(60vh, 24rem);
      overflow-y: auto;
      border: 1px solid var(--color-ink-200);
      border-radius: var(--radius-card);
      background: var(--color-surface);
      padding: 0.375rem;
      box-shadow: var(--shadow-float);
    }

    .search-item {
      display: grid;
      gap: 0.125rem;
      border-radius: 0.5rem;
      padding: 0.5rem 0.75rem;
      text-decoration: none;
      transition: background-color 0.15s var(--ease-out-soft);
    }

    .search-item:hover {
      background-color: var(--color-brand-50);
    }

    .search-item-name {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--color-ink-900);
    }

    .search-item-meta {
      font-size: 0.75rem;
      color: var(--color-ink-500);
    }

    .search-more {
      display: block;
      border-top: 1px solid var(--color-ink-100);
      margin-top: 0.25rem;
      padding: 0.625rem 0.75rem 0.375rem;
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--color-brand-700);
      text-decoration: none;
    }

    .search-empty {
      padding: 0.875rem 0.75rem;
      font-size: 0.875rem;
      color: var(--color-ink-500);
    }

    .mobile-nav {
      border-top: 1px solid var(--color-ink-200);
      background: var(--color-surface);
      max-height: calc(100dvh - 8rem);
      overflow-y: auto;
    }

    .mobile-link {
      display: block;
      border-radius: var(--radius-control);
      padding: 0.625rem 0.75rem;
      font-weight: 500;
      color: var(--color-ink-700);
      text-decoration: none;
    }

    .mobile-link:hover {
      background-color: var(--color-brand-50);
      color: var(--color-brand-700);
    }

    .mobile-sub {
      padding-left: 1.5rem;
      font-weight: 400;
      font-size: 0.9375rem;
      color: var(--color-ink-600);
    }

    .mobile-heading {
      padding: 0.75rem 0.75rem 0.25rem;
      font-size: 0.6875rem;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--color-ink-400);
    }
  `,
})
export class SiteHeader {
  protected readonly categories = PRODUCT_CATEGORIES;

  private readonly products = inject(ProductService);
  private readonly contactService = inject(ContactService);
  private readonly router = inject(Router);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly contact = this.contactService.contact;
  protected readonly links = this.contactService.links;
  protected readonly primaryPhone = computed(() => this.contactService.phones()[0] ?? null);
  protected readonly primaryPhoneHref = computed(() => toTelHref(this.primaryPhone()));

  protected readonly menuOpen = signal(false);
  protected readonly productsOpen = signal(false);
  protected readonly query = signal('');

  /** Every navigation closes whatever was open — including a back/forward move. */
  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: '' },
  );

  private readonly matches = computed(() => {
    const term = this.query().trim().toLowerCase();
    if (term.length < 2) {
      return [];
    }
    return this.products
      .products()
      .filter(
        (product) =>
          product.productName?.toLowerCase().includes(term) ||
          product.brand?.toLowerCase().includes(term),
      );
  });

  protected readonly totalMatches = computed(() => this.matches().length);
  protected readonly results = computed(() => this.matches().slice(0, 8));
  protected readonly showResults = computed(() => this.query().trim().length >= 2);

  constructor() {
    effect(() => {
      // Reading the router event stream keeps this effect subscribed; the menus
      // must not stay open across a navigation triggered from anywhere.
      this.currentUrl();
      this.menuOpen.set(false);
      this.productsOpen.set(false);
    });
  }

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
    this.productsOpen.set(false);
  }

  protected toggleProducts(): void {
    this.productsOpen.update((open) => !open);
  }

  protected onQuery(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  protected clearSearch(): void {
    this.query.set('');
    this.closeAll();
  }

  protected closeAll(): void {
    this.menuOpen.set(false);
    this.productsOpen.set(false);
  }

  /** Clicking anywhere outside the header dismisses the dropdown and results. */
  protected onDocumentClick(event: MouseEvent): void {
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.productsOpen.set(false);
      this.query.set('');
    }
  }
}

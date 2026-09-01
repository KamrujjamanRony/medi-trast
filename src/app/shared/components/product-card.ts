import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RevealDirective } from 'app/core/directives/reveal.directive';
import { Product } from 'app/features/models';
import { PLACEHOLDER_IMAGE, imageUrl } from 'app/shared/media';

/**
 * Product tile.
 *
 * The old card wrapped everything in an `<a>` with no `href` and navigated from
 * a click handler that also called `window.scrollTo(0, 0)`. That made it
 * unreachable by keyboard, impossible to open in a new tab, and invisible to
 * search engines. It is a real router link now; scroll restoration is handled
 * once by the router instead.
 */
@Component({
  selector: 'app-product-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RevealDirective],
  template: `
    <a class="tile" [routerLink]="['/product', product().id]" [appReveal]="delay()">
      <span class="tile-media">
        <img
          [src]="src()"
          [alt]="product().productName"
          loading="lazy"
          decoding="async"
          (error)="onImageError($event)"
        />
      </span>
      <span class="tile-body">
        @if (product().productCategory) {
          <span class="badge badge-brand self-start">{{ product().productCategory }}</span>
        }
        <span class="tile-name">{{ product().productName }}</span>
        @if (product().brand) {
          <span class="tile-meta">{{ product().brand }}</span>
        }
      </span>
    </a>
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
    }

    .tile {
      display: grid;
      grid-template-rows: auto 1fr;
      height: 100%;
      overflow: hidden;
      border: 1px solid var(--color-ink-200);
      border-radius: var(--radius-card);
      background: var(--color-surface);
      box-shadow: var(--shadow-soft);
      text-decoration: none;
      color: inherit;
      transition:
        box-shadow 0.22s var(--ease-out-soft),
        transform 0.22s var(--ease-out-soft),
        border-color 0.22s var(--ease-out-soft);
    }

    .tile:hover {
      transform: translateY(-3px);
      border-color: var(--color-brand-300);
      box-shadow: var(--shadow-raised);
    }

    .tile-media {
      display: block;
      aspect-ratio: 4 / 3;
      overflow: hidden;
      background: var(--color-ink-100);
    }

    .tile-media img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      padding: 0.875rem;
      transition: transform 0.35s var(--ease-out-soft);
    }

    .tile:hover .tile-media img {
      transform: scale(1.04);
    }

    .tile-body {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
      padding: 1rem 1.125rem 1.25rem;
    }

    .tile-name {
      font-family: var(--font-display);
      font-size: 1rem;
      font-weight: 600;
      line-height: 1.35;
      color: var(--color-ink-900);
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
      line-clamp: 2;
      overflow: hidden;
    }

    .tile-meta {
      font-size: 0.8125rem;
      color: var(--color-ink-500);
    }
  `,
})
export class ProductCard {
  readonly product = input.required<Product>();
  /** Stagger for the reveal animation when rendered in a grid. */
  readonly delay = input<number | ''>('');

  protected readonly src = computed(() => imageUrl(this.product().imageUrl));

  /** A dead image URL falls back to the placeholder instead of a broken icon. */
  protected onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (!img.src.endsWith(PLACEHOLDER_IMAGE)) {
      img.src = PLACEHOLDER_IMAGE;
    }
  }
}

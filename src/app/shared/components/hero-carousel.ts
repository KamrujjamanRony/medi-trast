import { ChangeDetectionStrategy, Component, computed, effect, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Carousel } from 'app/features/models';
import { imageUrl } from 'app/shared/media';
import { Icon } from '../ui/icon';

const AUTOPLAY_MS = 6000;

/**
 * Home page hero carousel.
 *
 * Replaces `igx-carousel`. `igniteui-angular` was pinned at v16 (incompatible
 * with Angular 22) and pulled in `hammerjs`, `fflate` and a full component
 * stylesheet — a large dependency tree for one slideshow.
 *
 * This version also fixes behaviour the old one lacked: autoplay pauses on
 * hover, focus and when the tab is hidden, motion is skipped entirely under
 * `prefers-reduced-motion`, slides are swipeable and arrow-key navigable, and
 * the slide images carry real alt text.
 */
@Component({
  selector: 'app-hero-carousel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon],
  host: {
    '(mouseenter)': 'pause(true)',
    '(mouseleave)': 'pause(false)',
    '(focusin)': 'pause(true)',
    '(focusout)': 'pause(false)',
    '(document:visibilitychange)': 'onVisibilityChange()',
  },
  template: `
    <section
      class="carousel"
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured highlights"
      tabindex="0"
      (keydown.arrowleft)="previous()"
      (keydown.arrowright)="next()"
      (touchstart)="onTouchStart($event)"
      (touchend)="onTouchEnd($event)"
    >
      <div class="track" [style.transform]="'translateX(-' + index() * 100 + '%)'">
        @for (slide of slides(); track slide.id; let i = $index) {
          <div
            class="slide"
            role="group"
            aria-roledescription="slide"
            [attr.aria-label]="'Slide ' + (i + 1) + ' of ' + slides().length"
            [attr.aria-hidden]="i === index() ? null : 'true'"
            [attr.inert]="i === index() ? null : ''"
          >
            <!--
              A slide whose image is missing falls back to the brand gradient
              rather than a stretched placeholder graphic. Every slide image in
              the live data currently 404s, and object-fit:cover on the
              placeholder SVG blew it up to fill the hero.
            -->
            @if (!failed().has(slide.id)) {
              <img
                class="slide-image"
                [src]="src(slide)"
                [alt]="slide.title || 'Medi-Trust Engineers'"
                [attr.loading]="i === 0 ? 'eager' : 'lazy'"
                [attr.fetchpriority]="i === 0 ? 'high' : 'auto'"
                decoding="async"
                (error)="onImageError(slide.id)"
              />
            }
            <div class="slide-scrim" [class.slide-scrim--bare]="failed().has(slide.id)"></div>
            <div class="slide-content">
              <div class="shell">
                <div class="max-w-2xl">
                  <!-- Three of the four live slides have a null title, which
                       left the hero as two buttons floating on an image. -->
                  <h2 class="slide-title">
                    {{ slide.title || 'All kinds of medical solutions from one source' }}
                  </h2>
                  <p class="slide-text">
                    {{ slide.description || defaultDescription }}
                  </p>
                  <div class="mt-6 flex flex-wrap gap-3">
                    <a class="btn btn-primary btn-lg" routerLink="/products/all">
                      <span>Browse equipment</span>
                      <app-icon name="arrow-right" [size]="18" />
                    </a>
                    <a class="btn btn-on-dark btn-lg" routerLink="/contact">Contact us</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        }
      </div>

      @if (slides().length > 1) {
        <button type="button" class="nav-arrow nav-prev" (click)="previous()" aria-label="Previous slide">
          <app-icon name="chevron-left" [size]="22" />
        </button>
        <button type="button" class="nav-arrow nav-next" (click)="next()" aria-label="Next slide">
          <app-icon name="chevron-right" [size]="22" />
        </button>

        <div class="dots" role="tablist" aria-label="Choose slide">
          @for (slide of slides(); track slide.id; let i = $index) {
            <button
              type="button"
              class="dot"
              role="tab"
              [class.is-active]="i === index()"
              [attr.aria-selected]="i === index()"
              [attr.aria-label]="'Go to slide ' + (i + 1)"
              (click)="goTo(i)"
            ></button>
          }
        </div>
      }
    </section>
  `,
  styles: `
    .carousel {
      position: relative;
      overflow: hidden;
      background: var(--color-ink-900);
      height: clamp(20rem, 52vw, 34rem);
    }

    .carousel:focus-visible {
      outline-offset: -3px;
    }

    .track {
      display: flex;
      height: 100%;
      transition: transform 0.6s var(--ease-out-soft);
    }

    @media (prefers-reduced-motion: reduce) {
      .track {
        transition: none;
      }
    }

    .slide {
      position: relative;
      flex: 0 0 100%;
      height: 100%;
    }

    .slide-image {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    /* A scrim rather than a flat overlay: the old version dropped a uniform 40%
       black over the whole image, muddying it while still leaving light photos
       with unreadable white text at the bottom. */
    .slide-scrim {
      position: absolute;
      inset: 0;
      background:
        linear-gradient(to top, rgb(11 15 19 / 0.85) 0%, rgb(11 15 19 / 0.35) 45%, rgb(11 15 19 / 0.1) 100%),
        linear-gradient(to right, rgb(11 15 19 / 0.6), transparent 65%);
    }

    /* No image behind it, so the scrim becomes the backdrop itself. */
    .slide-scrim--bare {
      background:
        radial-gradient(120% 120% at 15% 0%, rgb(255 255 255 / 0.1), transparent 55%),
        linear-gradient(150deg, var(--color-brand-900), var(--color-brand-700) 55%, var(--color-brand-600));
    }

    .slide-content {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: flex-end;
      padding-bottom: 3.5rem;
    }

    @media (min-width: 1024px) {
      .slide-content {
        align-items: center;
        padding-bottom: 0;
      }
    }

    .slide-title {
      font-size: clamp(1.5rem, 1rem + 3vw, 3.25rem);
      font-weight: 800;
      color: #fff;
      text-shadow: 0 2px 12px rgb(0 0 0 / 0.3);
    }

    .slide-text {
      margin-top: 0.875rem;
      max-width: 36rem;
      font-size: clamp(0.9375rem, 0.85rem + 0.4vw, 1.125rem);
      color: rgb(255 255 255 / 0.85);
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 3;
      line-clamp: 3;
      overflow: hidden;
    }

    .nav-arrow {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      display: grid;
      place-items: center;
      width: 2.75rem;
      height: 2.75rem;
      border: 1px solid rgb(255 255 255 / 0.35);
      border-radius: 999px;
      background: rgb(11 15 19 / 0.35);
      color: #fff;
      cursor: pointer;
      backdrop-filter: blur(6px);
      transition:
        background-color 0.2s var(--ease-out-soft),
        color 0.2s var(--ease-out-soft);
    }

    .nav-arrow:hover {
      background: #fff;
      color: var(--color-ink-900);
    }

    .nav-prev {
      left: 0.75rem;
    }

    .nav-next {
      right: 0.75rem;
    }

    @media (min-width: 1024px) {
      .nav-prev {
        left: 1.5rem;
      }

      .nav-next {
        right: 1.5rem;
      }
    }

    .dots {
      position: absolute;
      left: 50%;
      bottom: 1.25rem;
      transform: translateX(-50%);
      display: flex;
      gap: 0.5rem;
    }

    .dot {
      width: 0.5rem;
      height: 0.5rem;
      border: 0;
      border-radius: 999px;
      background: rgb(255 255 255 / 0.45);
      cursor: pointer;
      padding: 0;
      transition:
        width 0.25s var(--ease-out-soft),
        background-color 0.25s var(--ease-out-soft);
    }

    .dot.is-active {
      width: 1.75rem;
      background: #fff;
    }
  `,
})
export class HeroCarousel {
  readonly slides = input.required<readonly Carousel[]>();

  protected readonly index = signal(0);

  /** Ids of slides whose image failed to load, so they render the gradient. */
  protected readonly failed = signal<ReadonlySet<string>>(new Set());

  protected readonly defaultDescription =
    'Surgical, laboratory, dental and hospital equipment supplied and serviced across Bangladesh.';

  private readonly isPaused = signal(false);
  private readonly isHidden = signal(false);
  private touchStartX = 0;

  private readonly prefersReducedMotion =
    typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  private readonly shouldAutoplay = computed(
    () =>
      this.slides().length > 1 &&
      !this.isPaused() &&
      !this.isHidden() &&
      !this.prefersReducedMotion,
  );

  constructor() {
    effect((onCleanup) => {
      if (!this.shouldAutoplay()) {
        return;
      }
      const timer = setInterval(() => this.next(), AUTOPLAY_MS);
      onCleanup(() => clearInterval(timer));
    });

    // A slide being deleted in the admin panel must not leave the index past
    // the end of the list, which would show an empty frame.
    effect(() => {
      const count = this.slides().length;
      if (count > 0 && this.index() >= count) {
        this.index.set(0);
      }
    });
  }

  protected src(slide: Carousel): string {
    return imageUrl(slide.imageUrl);
  }

  protected next(): void {
    const count = this.slides().length;
    if (count) {
      this.index.update((i) => (i + 1) % count);
    }
  }

  protected previous(): void {
    const count = this.slides().length;
    if (count) {
      this.index.update((i) => (i - 1 + count) % count);
    }
  }

  protected goTo(i: number): void {
    this.index.set(i);
  }

  protected pause(paused: boolean): void {
    this.isPaused.set(paused);
  }

  protected onVisibilityChange(): void {
    this.isHidden.set(document.visibilityState === 'hidden');
  }

  protected onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.changedTouches[0]?.clientX ?? 0;
  }

  protected onTouchEnd(event: TouchEvent): void {
    const delta = (event.changedTouches[0]?.clientX ?? 0) - this.touchStartX;
    if (Math.abs(delta) < 40) {
      return;
    }
    if (delta < 0) {
      this.next();
    } else {
      this.previous();
    }
  }

  protected onImageError(id: string): void {
    this.failed.update((ids) => new Set(ids).add(id));
  }
}

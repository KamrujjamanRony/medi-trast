import { Directive, ElementRef, OnDestroy, effect, inject, input } from '@angular/core';

/**
 * Fades content in as it scrolls into view.
 *
 * Replaces the `aos` package, which was an unmaintained CommonJS dependency
 * (requiring an `allowedCommonJsDependencies` exception) that set inline
 * opacity on elements. With `once: true` plus client-side routing, AOS did not
 * re-scan after a navigation, so animated elements on a second visit to a route
 * could stay permanently at `opacity: 0`.
 *
 * This directive cannot fail that way: the element is only hidden after the
 * observer is confirmed to exist, so if `IntersectionObserver` is unavailable
 * the content simply renders. The `.reveal` class also resets to visible under
 * `prefers-reduced-motion`.
 */
@Directive({
  selector: '[appReveal]',
  host: { class: 'reveal' },
})
export class RevealDirective implements OnDestroy {
  /** Delay in milliseconds, for staggering a row of cards. */
  readonly appReveal = input<number | ''>('');

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private observer?: IntersectionObserver;

  constructor() {
    effect((onCleanup) => {
      const delay = this.appReveal();
      const element = this.host.nativeElement;

      if (typeof IntersectionObserver === 'undefined') {
        element.classList.add('is-visible');
        return;
      }

      if (typeof delay === 'number' && delay > 0) {
        element.style.transitionDelay = `${delay}ms`;
      }

      this.observer = new IntersectionObserver(
        (entries, observer) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              // Reveal once, then stop observing so scrolling stays cheap.
              observer.unobserve(entry.target);
            }
          }
        },
        { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
      );

      this.observer.observe(element);
      onCleanup(() => this.observer?.disconnect());
    });
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}

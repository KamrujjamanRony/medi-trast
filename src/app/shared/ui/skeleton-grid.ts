import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Placeholder cards shown while the catalogue loads.
 *
 * Replaces the old spinner, which in several components could never appear:
 * `loading` was initialised to `true` and then set to `false` synchronously in
 * the constructor, before the request had even been sent.
 */
@Component({
  selector: 'app-skeleton-grid',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="product-grid" role="status" aria-busy="true">
      <span class="sr-only">Loading…</span>
      @for (item of slots(); track $index) {
        <div class="card overflow-hidden" aria-hidden="true">
          <div class="skeleton aspect-4/3 rounded-none"></div>
          <div class="grid gap-2 p-4">
            <div class="skeleton h-4 w-20 rounded-full"></div>
            <div class="skeleton h-4 w-full"></div>
            <div class="skeleton h-4 w-2/3"></div>
          </div>
        </div>
      }
    </div>
  `,
})
export class SkeletonGrid {
  readonly count = input(8);
  protected readonly slots = computed(() => Array.from({ length: this.count() }));
}

import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Icon, IconName } from './icon';

/**
 * The panel shown when a list is empty or a request failed.
 *
 * The old pages had neither: a failed request rendered an empty grid with no
 * explanation, and an empty catalogue looked identical to a still-loading one.
 */
@Component({
  selector: 'app-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  template: `
    <div class="grid justify-items-center gap-3 px-6 py-14 text-center">
      <span
        class="grid size-14 place-items-center rounded-full"
        [class]="tone() === 'error' ? 'bg-accent-50 text-accent-600' : 'bg-ink-100 text-ink-400'"
      >
        <app-icon [name]="icon()" [size]="26" />
      </span>
      <h2 class="text-lg font-semibold text-ink-900">{{ title() }}</h2>
      @if (message()) {
        <p class="max-w-md text-sm text-ink-500">{{ message() }}</p>
      }
      <div class="mt-1 flex flex-wrap justify-center gap-2">
        <ng-content />
      </div>
    </div>
  `,
})
export class EmptyState {
  readonly title = input.required<string>();
  readonly message = input('');
  readonly icon = input<IconName>('inbox');
  readonly tone = input<'neutral' | 'error'>('neutral');
}

import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { FieldTree } from '@angular/forms/signals';
import { Icon } from './icon';

/**
 * Shows the first validation message for a signal-forms field, but only once
 * the field has been touched — an untouched empty input is not yet an error, so
 * a freshly opened form should not be covered in red.
 */
@Component({
  selector: 'app-field-error',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  template: `
    @if (message(); as text) {
      <p class="field-error" role="alert">
        <app-icon name="alert" [size]="15" />
        <span>{{ text }}</span>
      </p>
    }
  `,
})
export class FieldError<TValue> {
  readonly field = input.required<FieldTree<TValue>>();

  protected readonly message = computed(() => {
    const state = this.field()();
    if (!state.touched() || !state.invalid()) {
      return '';
    }
    return state.errors()[0]?.message ?? 'Please check this value.';
  });
}

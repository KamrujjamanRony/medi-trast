import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormField, FormRoot, form, maxLength, required } from '@angular/forms/signals';
import { FieldError } from './field-error';

/**
 * Verifies the signal-forms wiring the whole admin panel depends on:
 * `[formRoot]` on the <form>, `[formField]` on inputs, selects and textareas,
 * and that touched/invalid state drives the error UI.
 */
@Component({
  imports: [FormField, FormRoot, FieldError],
  template: `
    <form [formRoot]="testForm">
      <input id="name" [formField]="testForm.name" />
      <select id="category" [formField]="testForm.category">
        <option value="">None</option>
        <option value="a">A</option>
      </select>
      <textarea id="notes" [formField]="testForm.notes"></textarea>
      <app-field-error [field]="testForm.name" />
      <button type="submit">Save</button>
    </form>
  `,
})
class HostComponent {
  readonly submitted = signal(0);
  readonly model = signal({ name: '', category: '', notes: '' });

  readonly testForm = form(
    this.model,
    (path) => {
      required(path.name, { message: 'A name is required.' });
      maxLength(path.notes, 5, { message: 'Too long.' });
    },
    {
      submission: {
        action: async () => {
          this.submitted.update((count) => count + 1);
          return undefined;
        },
      },
    },
  );
}

describe('signal forms binding', () => {
  async function setup() {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();
    return fixture;
  }

  it('writes an input value back into the model signal', async () => {
    const fixture = await setup();
    const input = fixture.nativeElement.querySelector('#name') as HTMLInputElement;

    input.value = 'Operating table';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    expect(fixture.componentInstance.model().name).toBe('Operating table');
  });

  // The product form's category picker is a <select>. FormField subscribes to
  // 'input', which a browser fires on a select alongside 'change'; both are
  // dispatched here so the test reflects what actually reaches the directive.
  it('binds a <select> to its field', async () => {
    const fixture = await setup();
    const select = fixture.nativeElement.querySelector('#category') as HTMLSelectElement;

    select.value = 'a';
    select.dispatchEvent(new Event('input', { bubbles: true }));
    select.dispatchEvent(new Event('change', { bubbles: true }));
    await fixture.whenStable();

    expect(fixture.componentInstance.model().category).toBe('a');
  });

  it('binds a <textarea> to its field', async () => {
    const fixture = await setup();
    const textarea = fixture.nativeElement.querySelector('#notes') as HTMLTextAreaElement;

    textarea.value = 'hello';
    textarea.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    expect(fixture.componentInstance.model().notes).toBe('hello');
  });

  it('reports required and maxLength failures on the field state', async () => {
    const fixture = await setup();
    const host = fixture.componentInstance;

    expect(host.testForm.name().invalid()).toBe(true);
    expect(host.testForm.name().errors()[0]?.message).toBe('A name is required.');

    host.model.set({ name: 'ok', category: '', notes: 'far too long' });
    await fixture.whenStable();

    expect(host.testForm.name().invalid()).toBe(false);
    expect(host.testForm.notes().errors()[0]?.message).toBe('Too long.');
  });

  it('hides the error message until the field is touched', async () => {
    const fixture = await setup();
    const errorText = () =>
      (fixture.nativeElement as HTMLElement).querySelector('.field-error')?.textContent ?? '';

    expect(errorText()).toBe('');

    fixture.componentInstance.testForm.name().markAsTouched();
    await fixture.whenStable();

    expect(errorText()).toContain('A name is required.');
  });

  it('does not run the submit action while the form is invalid', async () => {
    const fixture = await setup();
    const host = fixture.componentInstance;
    const formEl = fixture.nativeElement.querySelector('form') as HTMLFormElement;

    formEl.dispatchEvent(new Event('submit', { cancelable: true }));
    await fixture.whenStable();
    expect(host.submitted()).toBe(0);

    host.model.set({ name: 'valid', category: '', notes: '' });
    await fixture.whenStable();

    formEl.dispatchEvent(new Event('submit', { cancelable: true }));
    await fixture.whenStable();
    expect(host.submitted()).toBe(1);
  });
});

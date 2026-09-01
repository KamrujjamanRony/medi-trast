import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from 'app/shared/ui/icon';

/**
 * Wildcard route. The old routing table had no catch-all, so any unknown URL
 * rendered the layout with a completely blank content area and no way back.
 */
@Component({
  selector: 'app-not-found',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon],
  template: `
    <div class="section">
      <div class="shell shell-narrow text-center">
        <p class="text-7xl font-extrabold text-brand-200">404</p>
        <h1 class="mt-2 text-3xl font-bold">This page could not be found</h1>
        <p class="mx-auto mt-3 max-w-md text-ink-500">
          The link may be out of date, or the page may have been moved.
        </p>
        <div class="mt-8 flex flex-wrap justify-center gap-3">
          <a class="btn btn-primary" routerLink="/">
            <app-icon name="home" [size]="17" />
            <span>Back to home</span>
          </a>
          <a class="btn btn-outline" routerLink="/products/all">Browse equipment</a>
        </div>
      </div>
    </div>
  `,
})
export class NotFound {}

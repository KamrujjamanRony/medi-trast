import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SiteFooter } from 'app/shared/components/site-footer';
import { SiteHeader } from 'app/shared/components/site-header';

@Component({
  selector: 'app-main-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, SiteHeader, SiteFooter],
  template: `
    <div class="flex min-h-dvh flex-col">
      <app-site-header />
      <!-- Named landmark so the header's skip link has somewhere to go. -->
      <main id="main" class="flex-1">
        <router-outlet />
      </main>
      <app-site-footer />
    </div>
  `,
})
export class MainLayout {}

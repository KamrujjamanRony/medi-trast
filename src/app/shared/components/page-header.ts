import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '../ui/icon';

export interface Crumb {
  readonly label: string;
  readonly link?: string;
}

/**
 * Page banner with breadcrumbs.
 *
 * Replaces `app-cover`, which took three loose strings and decided its own text
 * colour from `sub2 === 'Dashboard'` — a condition that never matched, because
 * every caller passed 'Dashboard' as `sub1`. Every admin page therefore rendered
 * dark-on-dark. Crumbs are also real links now instead of inert text.
 */
@Component({
  selector: 'app-page-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon],
  template: `
    <header class="page-header" [class.page-header--admin]="variant() === 'admin'">
      <div class="shell">
        @if (crumbs().length) {
          <nav aria-label="Breadcrumb">
            <ol class="flex flex-wrap items-center gap-1 text-sm">
              @for (crumb of crumbs(); track crumb.label; let last = $last) {
                <li class="flex items-center gap-1">
                  @if (crumb.link && !last) {
                    <a class="crumb-link" [routerLink]="crumb.link">{{ crumb.label }}</a>
                  } @else {
                    <span [attr.aria-current]="last ? 'page' : null" class="crumb-current">
                      {{ crumb.label }}
                    </span>
                  }
                  @if (!last) {
                    <app-icon name="chevron-right" [size]="14" class="crumb-sep" />
                  }
                </li>
              }
            </ol>
          </nav>
        }

        <h1 class="page-title">{{ title() }}</h1>

        @if (subtitle()) {
          <p class="page-subtitle">{{ subtitle() }}</p>
        }

        <ng-content />
      </div>
    </header>
  `,
  styles: `
    .page-header {
      background: linear-gradient(160deg, var(--color-brand-900), var(--color-brand-700) 55%, var(--color-brand-600));
      color: #fff;
      padding-block: 2.5rem 2.75rem;
    }

    @media (min-width: 1024px) {
      .page-header {
        padding-block: 3.5rem 3.75rem;
      }
    }

    .page-header--admin {
      background: linear-gradient(160deg, var(--color-ink-900), var(--color-ink-800));
    }

    .page-title {
      margin-top: 0.625rem;
      font-size: clamp(1.75rem, 1.2rem + 2.4vw, 3rem);
      font-weight: 700;
      color: #fff;
    }

    .page-subtitle {
      margin-top: 0.75rem;
      max-width: 46rem;
      color: rgb(255 255 255 / 0.78);
    }

    .crumb-link {
      color: rgb(255 255 255 / 0.75);
      text-decoration: none;
      transition: color 0.18s ease;
    }

    .crumb-link:hover {
      color: #fff;
      text-decoration: underline;
      text-underline-offset: 3px;
    }

    .crumb-current {
      color: #fff;
      font-weight: 500;
    }

    .crumb-sep {
      color: rgb(255 255 255 / 0.45);
    }
  `,
})
export class PageHeader {
  readonly title = input.required<string>();
  readonly subtitle = input('');
  readonly crumbs = input<readonly Crumb[]>([]);
  readonly variant = input<'site' | 'admin'>('site');
}

import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RevealDirective } from 'app/core/directives/reveal.directive';
import { AboutService } from 'app/features/services/about.service';
import { PageHeader } from 'app/shared/components/page-header';
import { EmptyState } from 'app/shared/ui/empty-state';
import { Icon } from 'app/shared/ui/icon';

interface Chapter {
  readonly title: string;
  readonly body: string;
}

@Component({
  selector: 'app-about',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, PageHeader, EmptyState, Icon, RevealDirective],
  template: `
    <app-page-header
      [title]="about()?.heading || 'About Us'"
      subtitle="Who we are, what we stand for, and how we support the medical
                professionals we supply."
      [crumbs]="[{ label: 'Home', link: '/' }, { label: 'About Us' }]"
    />

    <div class="section">
      <div class="shell shell-narrow">
        @if (service.isLoading()) {
          <div class="card card-pad grid gap-4">
            @for (row of [1, 2, 3, 4, 5, 6]; track row) {
              <div class="skeleton h-4" [style.width]="row % 3 === 0 ? '60%' : '100%'"></div>
            }
          </div>
        } @else if (service.error()) {
          <div class="card">
            <app-empty-state
              icon="alert"
              tone="error"
              title="Could not load this page"
              message="The content service did not respond. Please try again."
            >
              <button type="button" class="btn btn-primary" (click)="service.reload()">
                <app-icon name="refresh" [size]="17" />
                <span>Retry</span>
              </button>
            </app-empty-state>
          </div>
        } @else if (chapters().length) {
          <div class="grid gap-6">
            @for (chapter of chapters(); track chapter.title; let i = $index) {
              <article class="card card-pad" [appReveal]="i * 70">
                <h2 class="chapter-title">{{ chapter.title }}</h2>
                <p class="prose-block mt-3">{{ chapter.body }}</p>
              </article>
            }
          </div>

          <div class="cta">
            <div>
              <h2 class="text-xl font-semibold text-white">Looking for a specific instrument?</h2>
              <p class="mt-1 text-sm text-white/75">
                Tell us what you need and we will source it for you.
              </p>
            </div>
            <a class="btn btn-on-dark" routerLink="/contact">
              <span>Talk to us</span>
              <app-icon name="arrow-right" [size]="17" />
            </a>
          </div>
        } @else {
          <div class="card">
            <app-empty-state
              title="Nothing published yet"
              message="The About Us content has not been filled in from the admin panel."
            />
          </div>
        }
      </div>
    </div>
  `,
  styles: `
    .chapter-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--color-brand-700);
      white-space: pre-line;
    }

    .cta {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 1.5rem;
      margin-top: 2.5rem;
      border-radius: var(--radius-card);
      background: linear-gradient(140deg, var(--color-brand-800), var(--color-brand-600));
      padding: 2rem;
    }
  `,
})
export class About {
  protected readonly service = inject(AboutService);
  protected readonly about = this.service.about;

  /**
   * The API stores up to five title/description pairs in flat, numbered fields.
   * Collapsing them into a list here means the template has one loop instead of
   * five near-identical copies of the same block.
   */
  protected readonly chapters = computed<Chapter[]>(() => {
    const info = this.about();
    if (!info) {
      return [];
    }
    const pairs: readonly (readonly [string | null, string | null])[] = [
      [info.title, info.description],
      [info.title2, info.description2],
      [info.title3, info.description3],
      [info.title4, info.description4],
      [info.title5, info.description5],
    ];
    return pairs
      .filter(([title]) => !!title?.trim())
      .map(([title, body]) => ({ title: title!.trim(), body: body?.trim() ?? '' }));
  });
}

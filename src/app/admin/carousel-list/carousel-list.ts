import { ChangeDetectionStrategy, Component, inject, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CarouselService } from 'app/features/services/carousel.service';
import { PageHeader } from 'app/shared/components/page-header';
import { PLACEHOLDER_IMAGE, imageUrl } from 'app/shared/media';
import { ConfirmDelete } from 'app/shared/ui/confirm-delete';
import { EmptyState } from 'app/shared/ui/empty-state';
import { Icon } from 'app/shared/ui/icon';

@Component({
  selector: 'app-admin-carousel-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, PageHeader, ConfirmDelete, EmptyState, Icon],
  template: `
    <app-page-header
      title="Carousel"
      variant="admin"
      [crumbs]="[{ label: 'Dashboard', link: '/mte12' }, { label: 'Carousel' }]"
    />

    <div class="shell -mt-8">
      <div class="card card-pad">
        <div class="panel-heading">
          <div>
            <h2 class="text-lg font-semibold text-ink-900">Home page slides</h2>
            <p class="text-sm text-ink-500">Shown in order on the website hero.</p>
          </div>
          <a class="btn btn-primary" routerLink="/mte12/carousel/new">
            <app-icon name="plus" [size]="17" />
            <span>Add slide</span>
          </a>
        </div>

        @if (service.isLoading()) {
          <div class="grid gap-2" role="status" aria-busy="true">
            <span class="sr-only">Loading…</span>
            @for (row of [1, 2, 3]; track row) {
              <div class="skeleton h-20"></div>
            }
          </div>
        } @else if (service.error()) {
          <app-empty-state
            icon="alert"
            tone="error"
            title="Could not load slides"
            message="The carousel service did not respond."
          >
            <button type="button" class="btn btn-primary" (click)="service.reload()">
              <app-icon name="refresh" [size]="17" />
              <span>Retry</span>
            </button>
          </app-empty-state>
        } @else if (service.slides().length) {
          <div class="table-wrap">
            <table class="data-table">
              <caption class="sr-only">Carousel slides, with edit and delete actions</caption>
              <thead>
                <tr>
                  <th scope="col">Image</th>
                  <th scope="col">Title</th>
                  <th scope="col">Description</th>
                  <th scope="col"><span class="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                @for (slide of service.slides(); track slide.id) {
                  <tr>
                    <td>
                      <img
                        class="thumb"
                        [src]="thumb(slide.imageUrl)"
                        [alt]="slide.title || 'Carousel slide'"
                        loading="lazy"
                        decoding="async"
                        (error)="onImageError($event)"
                      />
                    </td>
                    <td class="font-medium text-ink-900">{{ slide.title || '—' }}</td>
                    <td><span class="cell-clamp">{{ slide.description || '—' }}</span></td>
                    <td>
                      <div class="flex justify-end gap-2">
                        <a
                          class="btn btn-outline btn-sm"
                          [routerLink]="['/mte12/carousel', slide.id, 'edit']"
                        >
                          <app-icon name="edit" [size]="15" />
                          <span>Edit</span>
                        </a>
                        <button
                          type="button"
                          class="btn btn-danger btn-sm"
                          (click)="askDelete(slide.id, slide.title || 'this slide')"
                        >
                          <app-icon name="trash" [size]="15" />
                          <span class="sr-only">Delete slide</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        } @else {
          <app-empty-state
            icon="image"
            title="No slides yet"
            message="Add a slide to show a hero carousel on the home page."
          >
            <a class="btn btn-primary" routerLink="/mte12/carousel/new">
              <app-icon name="plus" [size]="17" />
              <span>Add slide</span>
            </a>
          </app-empty-state>
        }

        @if (deleteError(); as message) {
          <div class="alert alert-error mt-4" role="alert">
            <app-icon name="alert" [size]="17" />
            <span>{{ message }}</span>
          </div>
        }
      </div>
    </div>

    <app-confirm-delete #confirm (confirmed)="remove($event)" />
  `,
  styles: `
    .thumb {
      width: 6rem;
      height: 3.5rem;
      border-radius: 0.5rem;
      border: 1px solid var(--color-ink-200);
      object-fit: cover;
      background: var(--color-ink-100);
    }
  `,
})
export class AdminCarouselList {
  protected readonly service = inject(CarouselService);
  protected readonly deleteError = signal('');

  private readonly confirmDialog = viewChild.required(ConfirmDelete);

  protected thumb(path: string | null): string {
    return imageUrl(path);
  }

  protected askDelete(id: string, label: string): void {
    this.deleteError.set('');
    this.confirmDialog().open(id, label);
  }

  protected async remove(id: string): Promise<void> {
    try {
      await this.service.remove(id);
      this.service.reload();
    } catch {
      this.deleteError.set('Could not delete that slide. Please try again.');
    }
  }

  protected onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (!img.src.endsWith(PLACEHOLDER_IMAGE)) {
      img.src = PLACEHOLDER_IMAGE;
    }
  }
}

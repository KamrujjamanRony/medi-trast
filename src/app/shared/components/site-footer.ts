import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PRODUCT_CATEGORIES } from 'app/features/models';
import { ContactService } from 'app/features/services/contact.service';
import { toTelHref } from 'app/shared/media';
import { Icon } from '../ui/icon';

/**
 * Site footer.
 *
 * Every outbound href comes from `ContactService.links`, which runs each stored
 * value through `toSafeExternalUrl` / `toSafeMailto` first. The API accepts
 * unauthenticated writes, so a stored `javascript:` or `data:` value would
 * otherwise decide where a visitor is sent.
 */
@Component({
  selector: 'app-site-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon],
  template: `
    <footer class="footer">
      <div class="shell grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div class="grid content-start gap-4">
          <p class="footer-brand">
            <span class="text-accent-400">Medi</span>-Trust Engineers
          </p>
          <p class="footer-text">
            To become the most trusted and reliable channel in the market of
            professional medical equipment.
          </p>
          @if (links().facebook; as facebook) {
            <a
              class="social"
              [href]="facebook"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Medi-Trust Engineers on Facebook"
            >
              <app-icon name="facebook" [size]="18" />
            </a>
          }
        </div>

        <nav class="grid content-start gap-3" aria-labelledby="footer-products">
          <h2 class="footer-title" id="footer-products">Products</h2>
          <ul class="grid gap-2">
            @for (category of categories; track category.slug) {
              <li>
                <a class="footer-link" [routerLink]="['/products', category.slug]">
                  {{ category.label }}
                </a>
              </li>
            }
          </ul>
        </nav>

        <div class="grid content-start gap-3">
          <h2 class="footer-title">Get in touch</h2>
          <ul class="grid gap-2">
            @for (phone of phones(); track phone) {
              <li>
                @if (telHref(phone); as tel) {
                  <a class="footer-link inline-flex items-center gap-2" [href]="tel">
                    <app-icon name="phone" [size]="15" />
                    <span>{{ phone }}</span>
                  </a>
                } @else {
                  <span class="footer-text">{{ phone }}</span>
                }
              </li>
            }
            @if (links().email; as mailto) {
              <li>
                <a class="footer-link inline-flex items-center gap-2" [href]="mailto">
                  <app-icon name="mail" [size]="15" />
                  <span>{{ contact()?.email }}</span>
                </a>
              </li>
            }
            <!-- The old footer rendered othersLink1 twice and never showed
                 othersLink2 at all, so a second stored link was invisible.
                 These fields are free text, so each one is classified as a
                 mail address or a web address before it is linked. -->
            @for (other of otherLinks(); track other.href) {
              <li>
                <a
                  class="footer-link inline-flex items-center gap-2"
                  [href]="other.href"
                  [attr.target]="other.isEmail ? null : '_blank'"
                  [attr.rel]="other.isEmail ? null : 'noopener noreferrer'"
                >
                  <app-icon [name]="other.isEmail ? 'mail' : 'globe'" [size]="15" />
                  <span>{{ other.label }}</span>
                </a>
              </li>
            }
          </ul>
        </div>

        <div class="grid content-start gap-3">
          <h2 class="footer-title">Visit us</h2>
          @if (contact()?.address1) {
            <p class="footer-text whitespace-pre-line">{{ contact()?.address1 }}</p>
          }
          @if (contact()?.address2) {
            <p class="footer-text whitespace-pre-line">{{ contact()?.address2 }}</p>
          }
          <div class="mt-1 grid gap-1">
            <p class="footer-title text-xs">Customer care hours</p>
            <p class="footer-text">Saturday – Thursday, 9:00 am – 8:00 pm</p>
          </div>
        </div>
      </div>

      <div class="footer-base">
        <div class="shell flex flex-wrap items-center justify-between gap-3 py-5">
          <p class="text-sm text-white/60">
            © {{ year }} Medi-Trust Engineers. All rights reserved.
          </p>
          <p class="text-sm text-white/45">Built by SuperSoft</p>
        </div>
      </div>
    </footer>
  `,
  styles: `
    .footer {
      background: var(--color-ink-900);
      color: rgb(255 255 255 / 0.72);
    }

    .footer-brand {
      font-family: var(--font-display);
      font-size: 1.125rem;
      font-weight: 800;
      color: #fff;
    }

    .footer-title {
      font-family: var(--font-display);
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #fff;
    }

    .footer-text {
      font-size: 0.875rem;
      line-height: 1.6;
    }

    .footer-link {
      font-size: 0.875rem;
      color: rgb(255 255 255 / 0.72);
      text-decoration: none;
      overflow-wrap: anywhere;
      transition: color 0.18s var(--ease-out-soft);
    }

    .footer-link:hover {
      color: var(--color-brand-300);
    }

    .social {
      display: inline-grid;
      place-items: center;
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 999px;
      background: rgb(255 255 255 / 0.08);
      color: #fff;
      transition:
        background-color 0.18s var(--ease-out-soft),
        color 0.18s var(--ease-out-soft);
    }

    .social:hover {
      background: var(--color-brand-500);
      color: #fff;
    }

    .footer-base {
      border-top: 1px solid rgb(255 255 255 / 0.1);
    }
  `,
})
export class SiteFooter {
  protected readonly categories = PRODUCT_CATEGORIES;
  protected readonly year = new Date().getFullYear();

  private readonly contactService = inject(ContactService);

  protected readonly contact = this.contactService.contact;
  protected readonly links = this.contactService.links;
  protected readonly phones = computed(() => this.contactService.phones());

  /** The two free-text "other link" fields, paired with their display text. */
  protected readonly otherLinks = computed(() => {
    const contact = this.contact();
    const links = this.links();
    return [
      { link: links.other1, label: contact?.othersLink1 },
      { link: links.other2, label: contact?.othersLink2 },
    ]
      .filter((entry) => entry.link !== null)
      .map((entry) => ({
        href: entry.link!.href,
        isEmail: entry.link!.isEmail,
        label: entry.label ?? '',
      }));
  });

  protected telHref(value: string): string | null {
    return toTelHref(value);
  }
}

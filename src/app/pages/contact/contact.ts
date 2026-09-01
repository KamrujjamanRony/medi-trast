import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { environment } from '@environments/environments';
import { ContactService } from 'app/features/services/contact.service';
import { PageHeader } from 'app/shared/components/page-header';
import { toTelHref } from 'app/shared/media';
import { Icon } from 'app/shared/ui/icon';

@Component({
  selector: 'app-contact',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageHeader, Icon],
  template: `
    <app-page-header
      title="Contact Us"
      subtitle="Reach the team for quotations, servicing, spare parts or a site visit."
      [crumbs]="[{ label: 'Home', link: '/' }, { label: 'Contact Us' }]"
    />

    <div class="section">
      <div class="shell grid gap-6 lg:grid-cols-5">
        <div class="grid gap-4 lg:col-span-2">
          <article class="card card-pad">
            <span class="info-icon"><app-icon name="map-pin" [size]="20" /></span>
            <h2 class="info-title">Our address</h2>
            @if (contact()?.address1) {
              <p class="prose-block mt-1 text-sm">{{ contact()?.address1 }}</p>
            }
            @if (contact()?.address2) {
              <p class="prose-block mt-1 text-sm">{{ contact()?.address2 }}</p>
            }
            @if (!contact()?.address1 && !contact()?.address2) {
              <p class="mt-1 text-sm text-ink-500">{{ fallbackLocation }}</p>
            }
          </article>

          <article class="card card-pad">
            <span class="info-icon"><app-icon name="phone" [size]="20" /></span>
            <h2 class="info-title">Support</h2>
            <ul class="mt-2 grid gap-1.5 text-sm">
              @for (phone of phones(); track phone) {
                <li>
                  @if (telHref(phone); as tel) {
                    <a class="link" [href]="tel">{{ phone }}</a>
                  } @else {
                    <span>{{ phone }}</span>
                  }
                </li>
              }
              @if (links().email; as mailto) {
                <li><a class="link" [href]="mailto">{{ contact()?.email }}</a></li>
              }
              @if (links().facebook; as facebook) {
                <li>
                  <a class="link" [href]="facebook" target="_blank" rel="noopener noreferrer">
                    {{ contact()?.facebookLink }}
                  </a>
                </li>
              }
              <!-- The old page labelled this "Others Like", then repeated
                   othersLink1 a second time under it and never rendered
                   othersLink2. Both now show, once each, and each is linked
                   as a mail or web address depending on what was stored. -->
              @for (other of otherLinks(); track other.href) {
                <li>
                  <a
                    class="link"
                    [href]="other.href"
                    [attr.target]="other.isEmail ? null : '_blank'"
                    [attr.rel]="other.isEmail ? null : 'noopener noreferrer'"
                  >
                    {{ other.label }}
                  </a>
                </li>
              }
            </ul>
          </article>

          <article class="card card-pad">
            <span class="info-icon"><app-icon name="clock" [size]="20" /></span>
            <h2 class="info-title">Customer care hours</h2>
            <p class="mt-1 text-sm text-ink-500">Saturday – Thursday, 9:00 am – 8:00 pm</p>
          </article>

          <article class="card card-pad">
            <span class="info-icon"><app-icon name="briefcase" [size]="20" /></span>
            <h2 class="info-title">Careers</h2>
            <p class="mt-1 text-sm text-ink-500">
              Interested in working with us? Write to
              <a class="link" href="mailto:meditrust71&#64;gmail.com">meditrust71&#64;gmail.com</a>.
            </p>
          </article>
        </div>

        <div class="card overflow-hidden lg:col-span-3">
          <iframe
            [src]="mapUrl"
            class="map"
            title="Map showing the Medi-Trust Engineers office"
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
            allowfullscreen
          ></iframe>
        </div>
      </div>
    </div>
  `,
  styles: `
    .info-icon {
      display: grid;
      place-items: center;
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 0.75rem;
      background: var(--color-brand-50);
      color: var(--color-brand-600);
      margin-bottom: 0.875rem;
    }

    .info-title {
      font-size: 1rem;
      font-weight: 600;
      color: var(--color-ink-900);
    }

    .map {
      display: block;
      width: 100%;
      height: 100%;
      min-height: 26rem;
      border: 0;
    }
  `,
})
export class Contact {
  protected readonly fallbackLocation = environment.location;

  private readonly service = inject(ContactService);
  private readonly sanitizer = inject(DomSanitizer);

  protected readonly contact = this.service.contact;
  protected readonly links = this.service.links;
  protected readonly phones = computed(() => this.service.phones());

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

  /**
   * bypassSecurityTrustResourceUrl disables Angular's URL sanitizer, so the
   * interpolated value must be URL-encoded or it can break out of the query
   * string and control the iframe src.
   */
  protected readonly mapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
    `https://maps.google.com/maps?q=${encodeURIComponent(environment.location)}&t=&z=15&ie=UTF8&iwloc=&output=embed`,
  );

  protected telHref(value: string): string | null {
    return toTelHref(value);
  }
}

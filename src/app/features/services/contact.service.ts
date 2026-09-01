import { HttpClient, httpResource } from '@angular/common/http';
import { Injectable, computed, inject } from '@angular/core';
import { environment } from '@environments/environments';
import { toSafeExternalUrl, toSafeMailto } from 'app/core/security/safe-url';
import { splitPhoneNumbers } from 'app/shared/media';
import { firstValueFrom } from 'rxjs';
import { Address } from '../models';

@Injectable({ providedIn: 'root' })
export class ContactService {
  private readonly http = inject(HttpClient);

  readonly resource = httpResource<Address[]>(() => environment.ContactApi, {
    defaultValue: [],
    parse: (raw) => (Array.isArray(raw) ? (raw as Address[]) : []),
  });

  readonly contact = computed(() =>
    this.resource.value().find((entry) => entry.companyID === environment.companyCode),
  );

  /**
   * Links derived from the record, validated once here.
   *
   * The API accepts unauthenticated writes, so every URL that comes back from
   * it is untrusted input. Validating centrally means no template ever builds
   * an `[href]` by concatenating a stored value.
   */
  readonly links = computed(() => {
    const contact = this.contact();
    return {
      email: toSafeMailto(contact?.email),
      facebook: toSafeExternalUrl(contact?.facebookLink),
      other1: this.asLink(contact?.othersLink1),
      other2: this.asLink(contact?.othersLink2),
    };
  });

  /**
   * The "other link" fields are free text and are not always web addresses —
   * `othersLink1` currently holds an email address. Classify before linking, so
   * an address becomes a `mailto:` rather than a bogus `https://` link.
   */
  private asLink(value: string | null | undefined): { href: string; isEmail: boolean } | null {
    const mailto = toSafeMailto(value);
    if (mailto) {
      return { href: mailto, isEmail: true };
    }
    const url = toSafeExternalUrl(value);
    return url ? { href: url, isEmail: false } : null;
  }

  /**
   * Every stored number, flattened. Each `phoneNumberN` field holds a
   * comma-separated list, which the old templates printed as one long line.
   */
  readonly phones = computed(() => {
    const contact = this.contact();
    return [contact?.phoneNumber1, contact?.phoneNumber2, contact?.phoneNumber3].flatMap(
      splitPhoneNumbers,
    );
  });

  readonly isLoading = this.resource.isLoading;
  readonly error = this.resource.error;

  reload(): void {
    this.resource.reload();
  }

  update(id: string, payload: FormData): Promise<Address> {
    return firstValueFrom(
      this.http.put<Address>(`${environment.ContactApi}/EditAddress/${id}`, payload),
    );
  }

  fetchOne(id: string): Promise<Address> {
    return firstValueFrom(
      this.http.get<Address>(
        `${environment.ContactApi}/GetAddressById?id=${encodeURIComponent(id)}`,
      ),
    );
  }
}

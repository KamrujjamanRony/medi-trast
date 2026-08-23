import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { environment } from '@environments/environments';
import { faFacebook, faInstagram, faTwitter } from '@fortawesome/free-brands-svg-icons';
import { AddressModel } from 'app/features/model/address.model';
import { ContactService } from 'app/features/services/contact.service';
import { toSafeExternalUrl, toSafeMailto } from 'app/core/security/safe-url';
import { Observable } from 'rxjs';

@Component({
    selector: 'app-footer',
    templateUrl: './app-footer.component.html',
    styleUrls: ['./app-footer.component.css'],
    imports: [CommonModule, RouterLink]
})
export class AppFooterComponent implements OnInit {
  // Define FontAwesome icons
  faFacebook = faFacebook;
  faInstagram = faInstagram;
  faTwitter = faTwitter;
  allContact$?: Observable<AddressModel[]>;
  contact!: any;

  // Hrefs are validated once here rather than concatenated in the template,
  // so an untrusted value can never end up inside an [href] binding.
  emailHref: string | null = null;
  facebookHref: string | null = null;
  othersLink1Href: string | null = null;
  othersLink2Href: string | null = null;
  constructor(private contactService: ContactService, private router: Router) {}

  ngOnInit(): void {
    this.allContact$ = this.contactService.getAllContact();
    this.allContact$.subscribe(contactUs => {
      if (contactUs) {
        this.contact = contactUs.find(a => a.companyID === environment.companyCode);
        this.emailHref = toSafeMailto(this.contact?.email);
        this.facebookHref = toSafeExternalUrl(this.contact?.facebookLink);
        this.othersLink1Href = toSafeExternalUrl(this.contact?.othersLink1);
        this.othersLink2Href = toSafeExternalUrl(this.contact?.othersLink2);
      }
    });
  }


  navigateToExternalLink(url: string | undefined): void {
    const safe = toSafeExternalUrl(url);
    if (safe) {
      // noopener/noreferrer stops the opened page reaching back via window.opener.
      window.open(safe, '_blank', 'noopener,noreferrer');
    }
  }
}

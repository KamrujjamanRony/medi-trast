import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { environment } from '@environments/environments';
import { CoverComponent } from 'app/components/cover/cover.component';
import { AddressModel } from 'app/features/model/address.model';
import { ContactService } from 'app/features/services/contact.service';
import { Observable } from 'rxjs';
import { Carousel, Dropdown, initTE } from 'tw-elements';

@Component({
    selector: 'app-contact',
    templateUrl: './contact.component.html',
    styleUrls: ['./contact.component.css'],
    imports: [CoverComponent]
})
export class ContactComponent implements OnInit {
  yourTitle: string = 'Contact Us';
  yourSub1: string = 'Home';
  yourSub2: string = 'Contact Us';
  allContact$?: Observable<AddressModel[]>;
  location: string = environment.location;
  mapUrl: SafeResourceUrl;
  contact!: any;

  constructor(private contactService: ContactService, private router: Router, private sanitizer: DomSanitizer) {
    // bypassSecurityTrustResourceUrl disables Angular's URL sanitizer, so the
    // interpolated value must be URL-encoded here or it can break out of the
    // query string and control the iframe src.
    const query = encodeURIComponent(this.location);
    this.mapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://maps.google.com/maps?q=${query}&t=&z=13&ie=UTF8&iwloc=&output=embed`,
    );
   }
  
  ngOnInit(): void {
    initTE({ Carousel, Dropdown });
    this.allContact$ = this.contactService.getAllContact();
    this.allContact$.subscribe(contactUs => {
      if (contactUs) {
        this.contact = contactUs.find(a => a.companyID === environment.companyCode);
      }
    });
  }
}

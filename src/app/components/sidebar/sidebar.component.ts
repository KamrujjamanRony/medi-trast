import { Observable } from 'rxjs';
import { Component, OnInit } from '@angular/core';
import { environment } from '@environments/environments';
import { AboutModel } from 'app/features/model/about.model';
import { AddressModel } from 'app/features/model/address.model';
import { AboutService } from 'app/features/services/about.service';
import { ContactService } from 'app/features/services/contact.service';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-sidebar',
    templateUrl: './sidebar.component.html',
    styleUrls: ['./sidebar.component.css'],
    imports: [RouterLink]
})
export class SidebarComponent implements OnInit {
  companyID: string = environment.companyCode.toString();
  allAbout$?: Observable<AboutModel[]>;
  allAddress$?: Observable<AddressModel[]>;
  about!: any;
  address!: any;
  constructor(private aboutService: AboutService, private contactService: ContactService) { }
  ngOnInit(): void {
    this.allAbout$ = this.aboutService.getAllAbout();
    this.allAbout$.subscribe(aboutUs => {
      if (aboutUs) {
        this.about = aboutUs.find(a => a.companyID === environment.companyCode);
      }
    });
    this.allAddress$ = this.contactService.getAllContact();
    this.allAddress$.subscribe(addressUs => {
      if (addressUs) {
        this.address = addressUs.find(a => a.companyID === environment.companyCode);
      }
    });
  }

}

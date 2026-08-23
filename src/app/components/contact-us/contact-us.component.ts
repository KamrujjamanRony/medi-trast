import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '@environments/environments';
import { AddressModel } from 'app/features/model/address.model';
import { ContactService } from 'app/features/services/contact.service';
import { Subscription } from 'rxjs';
import { CoverComponent } from '../cover/cover.component';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-contact-us',
    templateUrl: './contact-us.component.html',
    styleUrls: ['./contact-us.component.css'],
    imports: [CoverComponent, FormsModule]
})
export class ContactUsComponent implements OnInit, OnDestroy {
  yourTitle: string = 'Update Contact Us';
  yourSub1: string = 'Dashboard';
  yourSub2: string = 'Contact Us';
  id: string | null = null;
  addressInfo?: AddressModel;
  paramsSubscription?: Subscription;
  editAddressSubscription?: Subscription;
  constructor(private route: ActivatedRoute, private router: Router, private contactService: ContactService) { }

  ngOnInit(): void {
    this.paramsSubscription = this.route.paramMap.subscribe({
      next: (params) => {
        this.id = params.get('id');
        if (this.id) {
          this.contactService.getContact(this.id)
            .subscribe({
              next: (response) => {
                this.addressInfo = response;
              }
            });
        }
      }
    });
  }

  onFormSubmit(): void {

    const formData = new FormData();

    formData.append('companyID', environment.companyCode.toString());
    formData.append('address1', this.addressInfo?.address1 ?? '');
    formData.append('address2', this.addressInfo?.address2 ?? '');
    formData.append('phoneNumber1', this.addressInfo?.phoneNumber1 ?? '');
    formData.append('phoneNumber2', this.addressInfo?.phoneNumber2 ?? '');
    formData.append('phoneNumber3', this.addressInfo?.phoneNumber3 ?? '');
    formData.append('email', this.addressInfo?.email ?? '');
    formData.append('facebookLink', this.addressInfo?.facebookLink ?? '');
    formData.append('othersLink1', this.addressInfo?.othersLink1 ?? '');
    formData.append('othersLink2', this.addressInfo?.othersLink2 ?? '');

    if (this.id) {
      this.editAddressSubscription = this.contactService.updateContact(this.id, formData)
        .subscribe({
          next: (response) => {
            this.router.navigate(['contact']);
          }
        });
    }
  };

  ngOnDestroy(): void {
    this.paramsSubscription?.unsubscribe();
    this.editAddressSubscription?.unsubscribe();
  }
}

import { Component, OnInit } from '@angular/core';
import { CoverComponent } from 'app/components/cover/cover.component';
import { AboutModel } from 'app/features/model/about.model';
import { AboutService } from 'app/features/services/about.service';
import { Observable } from 'rxjs';

@Component({
    selector: 'app-about',
    templateUrl: './about.component.html',
    styleUrls: ['./about.component.css'],
    imports: [CoverComponent]
})
export class AboutComponent implements OnInit {
  yourTitle: string = "";
  yourSub1: string = 'Home';
  yourSub2: string = 'About Us';
  
  allAbout$?: Observable<AboutModel[]>;
  about!: any;

  constructor(private aboutService: AboutService) { }
  
  ngOnInit(): void {
    this.allAbout$ = this.aboutService.getAllAbout();
      this.allAbout$.subscribe(aboutUs => {
        if (aboutUs) {
          this.about = aboutUs.find(a=>a.companyID=== 1);
        }
      });
  };
}

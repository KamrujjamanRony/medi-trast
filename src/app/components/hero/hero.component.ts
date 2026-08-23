import { Observable } from 'rxjs';
import { Component, OnInit } from '@angular/core';
import { AboutModel } from 'app/features/model/about.model';
import { AboutService } from 'app/features/services/about.service';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-hero',
    templateUrl: './hero.component.html',
    styleUrls: ['./hero.component.css'],
    imports: [RouterLink]
})
export class HeroComponent implements OnInit {
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

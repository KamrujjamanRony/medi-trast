import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppFooterComponent } from 'app/components/app-footer/app-footer.component';
import { HeaderComponent } from 'app/components/header/header.component';
import { NavbarComponent } from 'app/components/navbar/navbar.component';

@Component({
    selector: 'app-main-layout',
    templateUrl: './main-layout.component.html',
    styleUrls: ['./main-layout.component.css'],
    imports: [RouterOutlet, HeaderComponent, NavbarComponent, AppFooterComponent]
})
export class MainLayoutComponent {

}

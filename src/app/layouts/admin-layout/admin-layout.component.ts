import { Component, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterOutlet } from '@angular/router';
import { AdminAuthService } from 'app/core/security/admin-auth.service';
import { SidebarComponent } from 'app/components/sidebar/sidebar.component';

@Component({
    selector: 'app-admin-layout',
    templateUrl: './admin-layout.component.html',
    styleUrls: ['./admin-layout.component.css'],
    imports: [RouterOutlet, FormsModule, SidebarComponent]
})
export class AdminLayoutComponent implements OnDestroy {
  pass: string = '';
  err: string = '';
  checking: boolean = false;

  private idleTimer?: ReturnType<typeof setInterval>;

  constructor(private auth: AdminAuthService, private router: Router) {}

  get isAuthorized(): boolean {
    return this.auth.isUnlocked();
  }

  async onSubmitAuth(event: Event): Promise<void> {
    event.preventDefault();
    if (this.checking) {
      return;
    }

    this.checking = true;
    this.err = '';
    try {
      const result = await this.auth.unlock(this.pass);
      if (result.ok) {
        this.startIdleWatch();
      } else {
        this.err = result.error;
      }
    } catch {
      this.err = 'Could not verify the security key. Please try again.';
    } finally {
      // Never leave the typed key sitting in component state.
      this.pass = '';
      this.checking = false;
    }
  }

  /** Any interaction inside the panel pushes back the idle auto-lock. */
  onAdminActivity(): void {
    this.auth.touch();
  }

  lock(): void {
    this.auth.lock();
    this.stopIdleWatch();
    this.router.navigateByUrl('/');
  }

  ngOnDestroy(): void {
    this.stopIdleWatch();
  }

  /** Re-renders the login form as soon as the idle timeout elapses. */
  private startIdleWatch(): void {
    this.stopIdleWatch();
    this.idleTimer = setInterval(() => {
      if (!this.auth.isUnlocked()) {
        this.stopIdleWatch();
        this.err = 'Your session timed out. Please enter the security key again.';
      }
    }, 30_000);
  }

  private stopIdleWatch(): void {
    if (this.idleTimer) {
      clearInterval(this.idleTimer);
      this.idleTimer = undefined;
    }
  }
}

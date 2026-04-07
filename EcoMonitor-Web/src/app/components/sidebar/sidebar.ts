import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, UserSession } from '../../services/auth.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-sidebar',
  standalone: false,
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  session$: Observable<UserSession>;

  constructor(
    public router: Router,
    private authService: AuthService,
  ) {
    this.session$ = this.authService.session$;
  }

  async logout() {
    await this.authService.logout();
  }

  getIndicatorTransform(role: string): string {
    const url = this.router.url;
    const isAdmin = role === 'admin';

    if (url === '/dashboard') {
      return 'translateX(0px)';
    } else if (url === '/sensores-iot') {
      return isAdmin ? 'translateX(calc(33.33vw - 5px))' : 'translateX(calc(50vw - 5px))';
    } else if (url === '/admin-panel' && isAdmin) {
      return 'translateX(calc(66.66vw - 5px))';
    }

    return 'translateX(0px)';
  }
}

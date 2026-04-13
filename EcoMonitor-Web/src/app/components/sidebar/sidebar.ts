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

  getIndicatorLeft(role: string): string {
    const url = this.router.url;
    const isAdmin = role === 'admin';
    const totalItems = isAdmin ? 4 : 3;
    let activeIndex = 0;

    if (url.includes('/dashboard')) {
      activeIndex = 0;
    } else if (url.includes('/sensores-iot')) {
      activeIndex = 1;
    } else if (url.includes('/admin-panel') && isAdmin) {
      activeIndex = 2;
    }

    const itemWidth = 100 / totalItems;
    const centerPosition = (itemWidth * activeIndex) + (itemWidth / 2);

    return `calc(${centerPosition}% - 35px)`;
  }
}

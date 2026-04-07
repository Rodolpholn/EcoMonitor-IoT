import { Component } from '@angular/core';
import { AuthService, UserSession } from '../../services/auth.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: false,
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  session$: Observable<UserSession>;

  constructor(private authService: AuthService) {
    this.session$ = this.authService.session$;
  }
}

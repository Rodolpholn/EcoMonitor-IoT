import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router'; 
import { AuthService, UserSession } from './services/auth.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: false,
  styleUrl: './app.scss',
})
export class App implements OnInit {
  session$: Observable<UserSession>;

  constructor(public router: Router, private authService: AuthService) {
    this.session$ = this.authService.session$;
  }

  ngOnInit() {}

  async logout() {
    await this.authService.logout();
  }

  setActive(event: MouseEvent) {
    const listItems = document.querySelectorAll('.navigation ul li');
    listItems.forEach((item) => {
      item.classList.remove('active');
    });
    const clickedElement = event.currentTarget as HTMLElement;
    clickedElement.classList.add('active');
  }
}


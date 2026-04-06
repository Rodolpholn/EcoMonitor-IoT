import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { take, map } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  canActivate(): Observable<boolean> {
    // Aguarda a sessão ser restaurada (initialized = true) antes de decidir
    return this.authService.sessionReady$.pipe(
      take(1),
      map((session) => {
        if (session.user) {
          return true;
        }
        this.router.navigate(['/login']);
        return false;
      }),
    );
  }
}

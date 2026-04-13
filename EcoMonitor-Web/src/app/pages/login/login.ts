import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  email = '';
  password = '';
  errorMessage = '';
  isLoading = false;

  constructor(private authService: AuthService, private router: Router) {}

  async onSubmit() {
    if (!this.email || !this.password) {
      this.errorMessage = 'Preencha email e senha.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const { error } = await this.authService.login(this.email, this.password);

    if (error) {
      this.isLoading = false;
      this.errorMessage = 'Erro no login: ' + error.message;
    } else {
      // O login foi concluído com sucesso, mas damos um pequeno delay (meio segundo)
      // para garantir que o Supabase atualizou o token no navegador e o Interceptor já consegue lê-lo.
      setTimeout(() => {
        this.isLoading = false;
        this.router.navigate(['/dashboard']);
      }, 500);
    }
  }
}

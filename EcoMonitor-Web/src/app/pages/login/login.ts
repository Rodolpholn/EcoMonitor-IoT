import { Component } from '@angular/core';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  onSubmit() {
    console.log('Tentando logar...');
    // Amanhã chamaremos o serviço de autenticação aqui!
  }
}

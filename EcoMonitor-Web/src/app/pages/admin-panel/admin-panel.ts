import { Component } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-panel',
  standalone: false,
  templateUrl: './admin-panel.html',
  styleUrl: './admin-panel.scss',
})
export class AdminPanel {
  // Controle de abas
  activeTab: 'usuarios' | 'iot' | 'sobre' = 'usuarios';

  // Formulário de criação de usuário
  email = '';
  password = '';
  role = 'client';

  message = '';
  isError = false;
  isLoading = false;

  // Ajustado para o prefixo do Controller
  private apiUrl = 'https://localhost:7047/api/Admin';

  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) {}

  setTab(tab: 'usuarios' | 'iot' | 'sobre') {
    this.activeTab = tab;
    this.message = '';
    this.isError = false;
  }

  async onSubmit() {
    if (!this.email || !this.password) {
      this.showMessage('Preencha email e senha', true);
      return;
    }

    this.isLoading = true;
    this.message = '';

    try {
      // Pega o token para autenticar a requisição Admin
      const token = await this.authService.getSessionToken();

      const headers = new HttpHeaders({
        Authorization: `Bearer ${token}`,
      });

      // Payload conforme o CreateUserRequest do C#
      const payload = {
        email: this.email,
        password: this.password,
        role: this.role,
      };

      // Chamada para api/Admin/User
      this.http.post(`${this.apiUrl}/User`, payload, { headers }).subscribe({
        next: (res: any) => {
          this.showMessage('Usuário criado com sucesso!', false);
          this.limparFormulario();
          this.isLoading = false;
        },
        error: (err: any) => {
          console.error('Erro na API:', err);
          // Tenta pegar a mensagem detalhada que enviamos do C#
          const msgErro = err.error?.detalhe || err.error?.mensagem || 'Erro ao criar usuário';
          this.showMessage(msgErro, true);
          this.isLoading = false;
        },
      });
    } catch (e: any) {
      this.showMessage('Falha na autenticação: ' + e.message, true);
      this.isLoading = false;
    }
  }

  limparFormulario() {
    this.email = '';
    this.password = '';
    this.role = 'client';
  }

  showMessage(msg: string, isError: boolean) {
    this.message = msg;
    this.isError = isError;
    // Opcional: limpa a mensagem após 5 segundos
    setTimeout(() => {
      if (this.message === msg) this.message = '';
    }, 5000);
  }
}

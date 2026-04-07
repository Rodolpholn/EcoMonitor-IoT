import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-panel',
  standalone: false,
  templateUrl: './admin-panel.html',
  styleUrl: './admin-panel.scss',
})
export class AdminPanel implements OnInit {
  // Controle de abas
  activeTab: 'usuarios' | 'iot' | 'sobre' = 'usuarios';

  // Lista de usuários para a tabela
  userList: any[] = [];

  // Formulário de criação de usuário
  email = '';
  password = '';
  role = 'client';

  message = '';
  isError = false;
  isLoading = false;

  private apiUrl = 'https://ecomonitor-iot-production.up.railway.app/api/Admin';

  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) {}

  // Carrega os usuários assim que o componente inicia
  ngOnInit() {
    this.loadUsers();
  }

  setTab(tab: 'usuarios' | 'iot' | 'sobre') {
    this.activeTab = tab;
    this.message = '';
    this.isError = false;
    // Se voltar para a aba de usuários, garante que a lista está fresca
    if (tab === 'usuarios') this.loadUsers();
  }

  // --- BUSCAR LISTA DE USUÁRIOS ---
  async loadUsers() {
    try {
      const token = await this.authService.getSessionToken();
      const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

      this.http.get(`${this.apiUrl}/Users`, { headers }).subscribe({
        next: (res: any) => {
          this.userList = res;
        },
        error: (err) => {
          console.error('Erro ao carregar usuários:', err);
        },
      });
    } catch (e) {
      console.error('Erro de sessão:', e);
    }
  }

  // --- CRIAR NOVO USUÁRIO ---
  async onSubmit() {
    if (!this.email || !this.password) {
      this.showMessage('Preencha email e senha', true);
      return;
    }

    this.isLoading = true;
    this.message = '';

    try {
      const token = await this.authService.getSessionToken();
      const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

      const payload = {
        email: this.email,
        password: this.password,
        role: this.role,
      };

      this.http.post(`${this.apiUrl}/User`, payload, { headers }).subscribe({
        next: (res: any) => {
          this.showMessage('Usuário criado com sucesso!', false);
          this.limparFormulario();
          this.loadUsers(); // RECARREGA A LISTA APÓS CRIAR
          this.isLoading = false;
        },
        error: (err: any) => {
          console.error('Erro na API:', err);
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

  // --- EXCLUIR USUÁRIO ---
  async deleteUser(id: string) {
    if (
      !confirm('Deseja realmente excluir este usuário? Esta ação removerá o acesso e a permissão.')
    ) {
      return;
    }

    this.isLoading = true;
    try {
      const token = await this.authService.getSessionToken();
      const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

      this.http.delete(`${this.apiUrl}/User/${id}`, { headers }).subscribe({
        next: () => {
          this.showMessage('Usuário removido com sucesso!', false);
          this.loadUsers(); // RECARREGA A LISTA APÓS EXCLUIR
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Erro ao excluir:', err);
          this.showMessage('Erro ao excluir usuário.', true);
          this.isLoading = false;
        },
      });
    } catch (e) {
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
    setTimeout(() => {
      if (this.message === msg) this.message = '';
    }, 5000);
  }
}

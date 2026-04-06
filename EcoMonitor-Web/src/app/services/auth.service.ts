import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { BehaviorSubject, Observable, filter, take } from 'rxjs';
import { Router } from '@angular/router';

export interface UserSession {
  user: User | null;
  role: string | null;
  initialized: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private supabase: SupabaseClient;
  private sessionSubject = new BehaviorSubject<UserSession>({
    user: null,
    role: null,
    initialized: false,
  });
  public session$ = this.sessionSubject.asObservable();

  /** Emite apenas quando a sessão já foi restaurada (initialized = true) */
  public sessionReady$ = this.session$.pipe(filter((s) => s.initialized));

  constructor(private router: Router) {
    const supabaseUrl = 'https://eznsxbjdssojayrqetry.supabase.co';
    const supabaseKey = 'sb_publishable_EWmGpALIJD2IzpS9o0nvWg_qz5zsgWR';

    this.supabase = createClient(supabaseUrl, supabaseKey);

    // Restaurar sessão ao recarregar a página
    this.supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        this.fetchRole(session.user);
      } else {
        // Sem sessão ativa — marca como inicializado sem usuário
        this.sessionSubject.next({ user: null, role: null, initialized: true });
      }
    });

    // Ouvir mudanças de estado da autenticação
    this.supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        this.fetchRole(session.user);
      } else if (event === 'SIGNED_OUT') {
        this.sessionSubject.next({ user: null, role: null, initialized: true });
        this.router.navigate(['/login']);
      }
    });
  }

  private async fetchRole(user: User) {
    try {
      const { data, error } = await this.supabase
        .from('user_roles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      this.sessionSubject.next({ user, role: data.role, initialized: true });
    } catch (error) {
      console.error('Erro ao buscar role:', error);
      // Se não achar role, assume client como fallback seguro
      this.sessionSubject.next({ user, role: 'client', initialized: true });
    }
  }

  get currentUserSession(): UserSession {
    return this.sessionSubject.value;
  }

  public getSessionToken(): Promise<string | null> {
    return this.supabase.auth.getSession().then(({ data }) => data.session?.access_token || null);
  }

  async login(email: string, password: string): Promise<{ error: any }> {
    const { error } = await this.supabase.auth.signInWithPassword({ email, password });
    return { error };
  }

  async logout() {
    await this.supabase.auth.signOut();
  }
}

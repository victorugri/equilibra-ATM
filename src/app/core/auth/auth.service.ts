import { InjectionToken, Service, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import type { SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

export interface SupabaseConfig {
  url: string;
  publishableKey: string;
}

export const SUPABASE_CONFIG = new InjectionToken<SupabaseConfig | null>('SUPABASE_CONFIG', {
  factory: () => (environment.supabase.url ? environment.supabase : null),
});

export interface AuthUser {
  id: string;
  email: string;
  createdAt: Date | null;
}

export type SignUpResult = 'signed-in' | 'confirm-email';

/**
 * Conta (opcional) no Supabase: criar, entrar, sair, recuperar a senha e apagar.
 * O cliente do Supabase é carregado sob demanda, fora do pacote inicial do app.
 */
@Service()
export class AuthService {
  private readonly config = inject(SUPABASE_CONFIG);
  private readonly router = inject(Router);
  private clientPromise: Promise<SupabaseClient> | null = null;

  readonly user = signal<AuthUser | null>(null);
  readonly signedIn = computed(() => this.user() !== null);
  /** false quando o app foi montado sem Supabase configurado (ex.: um fork). */
  readonly available = this.config !== null;
  /** Resolve quando a sessão guardada no aparelho foi lida. */
  readonly ready: Promise<void> = this.restoreSession();

  /** Cliente do Supabase (carregado na primeira chamada). */
  client(): Promise<SupabaseClient> {
    if (!this.config) return Promise.reject(new Error('Supabase não configurado.'));
    this.clientPromise ??= this.createClient(this.config);
    return this.clientPromise;
  }

  async signUp(email: string, password: string): Promise<SignUpResult> {
    const client = await this.client();
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${location.origin}/conta/entrar` },
    });
    if (error) throw error;
    return data.session ? 'signed-in' : 'confirm-email';
  }

  async signIn(email: string, password: string): Promise<void> {
    const client = await this.client();
    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async signOut(): Promise<void> {
    const client = await this.client();
    const { error } = await client.auth.signOut({ scope: 'local' });
    if (error) throw error;
    this.user.set(null);
  }

  /** Envia o e-mail com o link para criar uma nova senha. */
  async requestPasswordReset(email: string): Promise<void> {
    const client = await this.client();
    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/redefinir-senha`,
    });
    if (error) throw error;
  }

  async updatePassword(password: string): Promise<void> {
    const client = await this.client();
    const { error } = await client.auth.updateUser({ password });
    if (error) throw error;
  }

  /** Apaga a conta e todos os dados dela no servidor (LGPD: eliminação). */
  async deleteAccount(): Promise<void> {
    const client = await this.client();
    const { error } = await client.rpc('delete_my_account');
    if (error) throw error;
    await client.auth.signOut({ scope: 'local' }).catch(() => undefined);
    this.user.set(null);
  }

  private async createClient(config: SupabaseConfig): Promise<SupabaseClient> {
    const { createClient } = await import('@supabase/supabase-js');
    const client = createClient(config.url, config.publishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    });
    client.auth.onAuthStateChange((event, session) => {
      this.user.set(session?.user ? toAuthUser(session.user) : null);
      // Link do e-mail de recuperação: leva para a tela de nova senha.
      if (event === 'PASSWORD_RECOVERY') void this.router.navigateByUrl('/redefinir-senha');
    });
    return client;
  }

  private async restoreSession(): Promise<void> {
    // Quem usa o app sem conta não precisa baixar o cliente do Supabase.
    if (!this.config || !mayHaveSession()) return;
    try {
      const client = await this.client();
      const { data } = await client.auth.getSession();
      const user = data.session?.user;
      this.user.set(user ? toAuthUser(user) : null);
    } catch {
      // Sem rede ou sem sessão: o app segue sem conta.
    }
  }
}

function toAuthUser(user: { id: string; email?: string; created_at?: string }): AuthUser {
  return {
    id: user.id,
    email: user.email ?? '',
    createdAt: user.created_at ? new Date(user.created_at) : null,
  };
}

/** Há sessão guardada ou um retorno de link de e-mail (confirmação ou nova senha)? */
function mayHaveSession(): boolean {
  try {
    const stored = Object.keys(globalThis.localStorage ?? {}).some(
      (key) => key.startsWith('sb-') && key.includes('-auth-token'),
    );
    const params = new URLSearchParams(globalThis.location?.search ?? '');
    return (
      stored || params.has('code') || (globalThis.location?.hash ?? '').includes('access_token')
    );
  } catch {
    return false;
  }
}

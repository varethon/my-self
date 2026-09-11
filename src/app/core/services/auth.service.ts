import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { getSupabaseClient } from '../../data-access/supabase/supabase.client';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly ready = signal(false);
  readonly authenticated = signal(false);
  readonly email = signal('');
  readonly demoMode = getSupabaseClient() === null;
  private readonly supabase = getSupabaseClient();
  private readonly readyPromiseValue: Promise<void>;

  constructor(private readonly router: Router) {
    this.readyPromiseValue = this.restore();
  }

  whenReady(): Promise<void> {
    return this.readyPromiseValue;
  }

  async signIn(email: string, password: string): Promise<{ error?: string }> {
    if (this.demoMode) {
      if (!email.trim() || password.length < 4) return { error: 'Nhập email và mật khẩu hợp lệ để tiếp tục.' };
      localStorage.setItem('varethon_demo_session', email.trim());
      this.authenticated.set(true);
      this.email.set(email.trim());
      await this.routeAfterAuthentication();
      return {};
    }
    const result = await this.supabase!.auth.signInWithPassword({ email, password });
    if (result.error) return { error: result.error.message };
    this.authenticated.set(true);
    this.email.set(result.data.user?.email ?? email);
    await this.routeAfterAuthentication();
    return {};
  }

  async signUp(email: string, password: string): Promise<{ error?: string }> {
    if (this.demoMode) return this.signIn(email, password);
    const result = await this.supabase!.auth.signUp({ email, password });
    if (result.error) return { error: result.error.message };
    if (result.data.session) await this.routeAfterAuthentication();
    return { error: result.data.session ? undefined : 'Kiểm tra email để xác nhận tài khoản.' };
  }

  async signOut(): Promise<void> {
    if (this.supabase) await this.supabase.auth.signOut();
    localStorage.removeItem('varethon_demo_session');
    this.authenticated.set(false);
    this.email.set('');
    await this.router.navigateByUrl('/login');
  }

  needsOnboarding(): boolean {
    return !Boolean(localStorage.getItem('varethon_onboarding_completed'));
  }

  async completeOnboarding(displayName: string): Promise<void> {
    localStorage.setItem('varethon_onboarding_completed', 'true');
    if (this.supabase) {
      const user = (await this.supabase.auth.getUser()).data.user;
      if (user) {
        await this.supabase.from('profiles').upsert({ id: user.id, display_name: displayName, onboarding_completed: true });
        await this.supabase.rpc('create_default_workspace', { p_user_id: user.id });
      }
    }
    await this.router.navigateByUrl('/app/dashboard');
  }

  private async restore(): Promise<void> {
    if (this.supabase) {
      const { data } = await this.supabase.auth.getSession();
      this.authenticated.set(Boolean(data.session));
      this.email.set(data.session?.user.email ?? '');
      this.supabase.auth.onAuthStateChange((_event, session) => {
        this.authenticated.set(Boolean(session));
        this.email.set(session?.user.email ?? '');
      });
    } else {
      const demoEmail = localStorage.getItem('varethon_demo_session');
      this.authenticated.set(Boolean(demoEmail));
      this.email.set(demoEmail ?? '');
    }
    this.ready.set(true);
  }

  private async routeAfterAuthentication(): Promise<void> {
    await this.router.navigateByUrl(this.needsOnboarding() ? '/onboarding' : '/app/dashboard');
  }
}

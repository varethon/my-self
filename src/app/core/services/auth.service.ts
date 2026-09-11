import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';

const SESSION_KEY = 'varethon_hardcoded_session';
const ACCOUNT_USERNAME = 'daovanhung';
const ACCOUNT_PASSWORD = '0346782752';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly ready = signal(false);
  readonly authenticated = signal(false);
  readonly username = signal('');
  private readonly readyPromiseValue: Promise<void>;

  constructor(private readonly router: Router) {
    this.readyPromiseValue = this.restore();
  }

  whenReady(): Promise<void> {
    return this.readyPromiseValue;
  }

  async signIn(username: string, password: string): Promise<{ error?: string }> {
    if (username.trim() !== ACCOUNT_USERNAME || password !== ACCOUNT_PASSWORD) {
      return { error: 'Tài khoản hoặc mật khẩu không đúng.' };
    }

    localStorage.setItem(SESSION_KEY, 'active');
    this.authenticated.set(true);
    this.username.set(ACCOUNT_USERNAME);
    await this.router.navigateByUrl('/app/dashboard');
    return {};
  }

  async signOut(): Promise<void> {
    localStorage.removeItem(SESSION_KEY);
    this.authenticated.set(false);
    this.username.set('');
    await this.router.navigateByUrl('/login');
  }

  private async restore(): Promise<void> {
    const active = localStorage.getItem(SESSION_KEY) === 'active';
    this.authenticated.set(active);
    this.username.set(active ? ACCOUNT_USERNAME : '');
    this.ready.set(true);
  }
}

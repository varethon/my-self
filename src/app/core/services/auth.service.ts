import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';

const SESSION_KEY = 'varethon_hardcoded_session';
const ACCOUNT_PASSWORD = '0346782752';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly ready = signal(false);
  readonly authenticated = signal(false);
  private readonly readyPromiseValue: Promise<void>;

  constructor(private readonly router: Router) {
    this.readyPromiseValue = this.restore();
  }

  whenReady(): Promise<void> {
    return this.readyPromiseValue;
  }

  async unlock(password: string, returnUrl?: string): Promise<{ error?: string }> {
    if (password !== ACCOUNT_PASSWORD) {
      return { error: 'Mật khẩu không đúng.' };
    }

    localStorage.setItem(SESSION_KEY, 'active');
    this.authenticated.set(true);
    await this.router.navigateByUrl(this.safeReturnUrl(returnUrl));
    return {};
  }

  async signOut(): Promise<void> {
    localStorage.removeItem(SESSION_KEY);
    this.authenticated.set(false);
    await this.router.navigateByUrl('/login');
  }

  private async restore(): Promise<void> {
    const active = localStorage.getItem(SESSION_KEY) === 'active';
    this.authenticated.set(active);
    this.ready.set(true);
  }

  private safeReturnUrl(returnUrl?: string): string {
    return returnUrl && /^\/app(?:\/|$)/.test(returnUrl) ? returnUrl : '/app/dashboard';
  }
}

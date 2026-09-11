import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <main class="auth-page">
      <div class="auth-orbit orbit-one"></div><div class="auth-orbit orbit-two"></div>
      <section class="auth-card">
        <div class="brand auth-brand"><span class="brand-mark">V</span><span class="brand-copy"><strong>VARETHON</strong><small>ASCEND OS</small></span></div>
        <div class="eyebrow">PERSONAL OPERATING SYSTEM</div>
        <h1>Biến mục tiêu thành <em>đà tiến bộ.</em></h1>
        <p class="auth-intro">Một workspace có chủ đích cho kế hoạch, lịch thực thi và những lần review giúp bạn tiến xa hơn.</p>
        @if (auth.demoMode) { <div class="demo-banner"><span>✦</span> Demo mode đang bật — nhập bất kỳ email và mật khẩu từ 4 ký tự để trải nghiệm.</div> }
        <form [formGroup]="form" (ngSubmit)="submit()">
          <label>Email<input type="email" formControlName="email" placeholder="you@example.com" autocomplete="email" /></label>
          <label>Mật khẩu<input type="password" formControlName="password" placeholder="••••••••" autocomplete="current-password" /></label>
          @if (error()) { <p class="form-error" role="alert">{{ error() }}</p> }
          <button class="primary-button full-width" type="submit" [disabled]="form.invalid || loading()">{{ loading() ? 'Đang mở workspace…' : 'Mở workspace' }} <span>→</span></button>
        </form>
        <div class="auth-footer"><span>VARETHON ASCEND · v1.0</span><span>Goal → Plan → Execute → Review</span></div>
      </section>
    </main>
  `,
})
export class LoginPage {
  private readonly fb = inject(FormBuilder);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly form = this.fb.nonNullable.group({ email: ['', [Validators.required, Validators.email]], password: ['', [Validators.required, Validators.minLength(4)]] });

  constructor(readonly auth: AuthService) {}

  async submit(): Promise<void> {
    if (this.form.invalid) return;
    this.loading.set(true); this.error.set('');
    const value = this.form.getRawValue();
    const result = await this.auth.signIn(value.email, value.password);
    this.error.set(result.error ?? ''); this.loading.set(false);
  }
}

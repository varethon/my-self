import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
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
        <h1>Không gian <em>riêng tư.</em></h1>
        <p class="auth-intro">Nhập mật khẩu để mở workspace cá nhân và tiếp tục kế hoạch, lịch thực thi, review cùng thư viện khóa học.</p>
        <form [formGroup]="form" (ngSubmit)="submit()">
          <label>Mật khẩu<input type="password" formControlName="password" placeholder="••••••••" autocomplete="current-password" inputmode="numeric" /></label>
          @if (error()) { <p class="form-error" role="alert">{{ error() }}</p> }
          <button class="primary-button full-width" type="submit" [disabled]="form.invalid || loading()">{{ loading() ? 'Đang kiểm tra…' : 'Mở workspace' }} <span>→</span></button>
        </form>
        <p class="auth-note">Workspace cá nhân · chỉ người có mật khẩu mới có thể truy cập.</p>
        <div class="auth-footer"><span>VARETHON ASCEND · v1.0</span><span>Goal → Plan → Execute → Review</span></div>
      </section>
    </main>
  `,
})
export class LoginPage {
  private readonly fb = inject(FormBuilder);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly form = this.fb.nonNullable.group({ password: ['', Validators.required] });

  constructor(readonly auth: AuthService, private readonly route: ActivatedRoute) {}

  async submit(): Promise<void> {
    if (this.form.invalid) return;
    this.loading.set(true); this.error.set('');
    const value = this.form.getRawValue();
    const result = await this.auth.unlock(value.password, this.route.snapshot.queryParamMap.get('returnUrl') ?? undefined);
    this.error.set(result.error ?? ''); this.loading.set(false);
  }
}

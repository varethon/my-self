import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-onboarding-page',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <main class="auth-page onboarding-page"><section class="auth-card onboarding-card"><div class="brand auth-brand"><span class="brand-mark">V</span><span class="brand-copy"><strong>VARETHON</strong><small>ASCEND OS</small></span></div><div class="eyebrow">FIRST SETUP · 01 / 01</div><h1>Thiết lập nhịp <em>của bạn.</em></h1><p class="auth-intro">Một vài thông tin để ASCEND đưa ra gợi ý phù hợp, không ép bạn vào một khuôn cố định.</p><div class="setup-points"><span>✓</span><div><strong>Goal → Plan → Execute → Review</strong><small>Workspace mẫu đã sẵn sàng để bạn chỉnh sửa.</small></div></div><div class="setup-points"><span>◷</span><div><strong>Asia/Ho_Chi_Minh · 08:00 — 20:00</strong><small>Scheduler sẽ giữ buffer và tôn trọng lịch bận.</small></div></div><form [formGroup]="form" (ngSubmit)="finish()"><label>Bạn muốn được gọi là<input formControlName="displayName" placeholder="Tên của bạn" autocomplete="name" /></label><button class="primary-button full-width" type="submit" [disabled]="form.invalid || saving()">{{ saving() ? 'Đang lưu…' : 'Bắt đầu workspace →' }}</button></form></section></main>
  `,
})
export class OnboardingPage {
  private readonly fb = inject(FormBuilder);
  readonly form = this.fb.nonNullable.group({ displayName: ['Hùng', Validators.required] });
  readonly saving = signal(false);
  constructor(private readonly auth: AuthService) {}
  async finish(): Promise<void> { if (this.form.invalid) return; this.saving.set(true); await this.auth.completeOnboarding(this.form.getRawValue().displayName); this.saving.set(false); }
}

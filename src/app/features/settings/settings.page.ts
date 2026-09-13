import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  template: `
    <div class="page-header"><div><div class="eyebrow">WORKSPACE CONTROL</div><h1>Cài đặt <em>của bạn.</em></h1><p class="page-subtitle">Giữ hệ thống phù hợp với năng lượng, múi giờ và cách bạn làm việc.</p></div></div>
    @if (saved()) { <div class="success-banner"><span>✓</span> Cài đặt đã được lưu trên thiết bị này.</div> }
    <div class="settings-grid"><section class="panel settings-section"><div class="card-kicker">PROFILE</div><h3>Hồ sơ workspace</h3><label>Display name<input value="Hùng" /></label><label>Chế độ truy cập<input value="Mật khẩu cá nhân" readonly /></label><label>Timezone<select><option>Asia/Ho_Chi_Minh (UTC+7)</option><option>Asia/Singapore (UTC+8)</option></select></label></section><section class="panel settings-section"><div class="card-kicker">PLANNING DEFAULTS</div><h3>Quy tắc lập lịch</h3><label class="toggle-row"><span><strong>Giữ 20% buffer</strong><small>Không lấp đầy toàn bộ capacity.</small></span><input type="checkbox" checked /></label><label class="toggle-row"><span><strong>Cho phép chia task</strong><small>Scheduler chia theo min/max session.</small></span><input type="checkbox" checked /></label><label class="toggle-row"><span><strong>Nhắc review cuối tuần</strong><small>Hiển thị prompt vào thứ Sáu.</small></span><input type="checkbox" checked /></label></section></div>
    <div class="form-actions settings-actions"><button class="primary-button" type="button" (click)="saved.set(true)">Lưu thay đổi <span>→</span></button></div>
  `,
})
export class SettingsPage {
  readonly saved = signal(false);
}

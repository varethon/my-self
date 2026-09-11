import { Component, signal } from '@angular/core';
import { WorkspaceStore } from '../../core/services/workspace-store.service';

@Component({
  selector: 'app-reviews-page',
  standalone: true,
  template: `
    <div class="page-header"><div><div class="eyebrow">REFLECT → ADJUST</div><h1>Weekly <em>Review.</em></h1><p class="page-subtitle">Không phán xét. Chỉ quan sát, học và điều chỉnh nhịp tiếp theo.</p></div><button class="primary-button" type="button" (click)="saved.set(true)">Lưu review <span>→</span></button></div>
    @if (saved()) {<div class="success-banner"><span>✓</span> Review đã lưu. Tuần mới bắt đầu với một hướng đi rõ hơn.</div>}
    <div class="review-score panel"><div><div class="card-kicker">WEEK 37 · 07 — 13 SEP</div><h2>Tuần này bạn đã giữ được nhịp.</h2><p>Điều chỉnh nhỏ, đều đặn đang tạo ra khác biệt lớn.</p></div><div class="score-ring"><strong>{{ completion() }}%</strong><small>completion</small></div></div>
    <div class="review-metrics"><div><span>TASK HOÀN THÀNH</span><strong>{{ store.completedTasks().length }}/{{ store.tasks().length }}</strong><small>↑ 12% tuần trước</small></div><div><span>FOCUS TIME</span><strong>{{ store.totalFocusMinutes() }}<small> phút</small></strong><small>↑ 18% tuần trước</small></div><div><span>HABIT CONSISTENCY</span><strong>86<small>%</small></strong><small>Ổn định</small></div><div><span>OVERDUE</span><strong>{{ overdue() }}</strong><small [class.warn-text]="overdue() > 0">Cần chú ý</small></div></div>
    <div class="review-columns"><section class="panel reflection-panel"><div class="card-kicker">REFLECTION</div><h3>Điều gì đã hiệu quả?</h3><textarea placeholder="Viết vài dòng để nhận ra pattern…"></textarea><h3>Điều gì cần điều chỉnh?</h3><textarea placeholder="Một constraint, một thói quen, hoặc một task…"></textarea></section><section class="panel"><div class="panel-heading"><div><div class="card-kicker">AI SUMMARY</div><h3>Góc nhìn tuần này</h3></div><span class="ai-badge small">✧ AI</span></div><div class="insight-block"><span class="insight-icon cyan">↗</span><p>Deep work đang là đòn bẩy tốt nhất của bạn. Hai phiên focus dài hơn tạo ra phần lớn tiến độ.</p></div><div class="insight-block"><span class="insight-icon violet">!</span><p>Task UI đang đứng trong backlog 4 ngày. Hãy chia nó thành một session 30 phút để giảm ma sát bắt đầu.</p></div><button class="secondary-button full-width" type="button">Phân tích sâu hơn →</button></section></div>
  `,
})
export class ReviewsPage {
  readonly saved = signal(false);
  constructor(readonly store: WorkspaceStore) {}
  completion(): number { return this.store.tasks().length ? Math.round(this.store.completedTasks().length / this.store.tasks().length * 100) : 0; }
  overdue(): number { return this.store.openTasks().filter((task) => Boolean(task.deadline && Date.parse(task.deadline) < Date.now())).length; }
}

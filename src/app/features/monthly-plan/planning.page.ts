import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { WorkspaceStore } from '../../core/services/workspace-store.service';

@Component({
  selector: 'app-planning-page',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="page-header"><div><div class="eyebrow">PLAN-DRIVEN EXECUTION</div><h1>Kế hoạch <em>tháng 09.</em></h1><p class="page-subtitle">Một tháng tốt là tháng biết mình cần nói “không” với điều gì.</p></div><a class="primary-button" routerLink="/app/ai">✧ Nhờ AI gợi ý</a></div>
    <section class="capacity-banner"><div class="capacity-icon">◒</div><div><strong>Capacity tháng này đang ở mức khỏe.</strong><p>18 giờ đã cam kết trên 32 giờ khả dụng · còn 14 giờ để điều chỉnh.</p></div><span class="capacity-badge">HEALTHY · 56%</span></section>
    <div class="section-title"><h2>Monthly goals</h2><button class="ghost-button" type="button">+ Thêm mục tiêu</button></div>
    <div class="monthly-goals-grid">@for (goal of plan()?.monthlyGoals ?? []; track goal.id) {<article class="monthly-goal-card"><div class="goal-card-top"><div class="small-goal-icon">◎</div><div class="goal-title"><span class="card-kicker">{{ goal.priority === 0 ? 'CORE OUTCOME' : 'SUPPORTING' }}</span><h3>{{ goal.title }}</h3></div><span class="goal-percent">{{ goal.progress }}%</span></div><div class="progress-line large"><span [style.width.%]="goal.progress"></span></div><div class="goal-meta"><span>{{ Math.round(goal.estimatedMinutes / 60) }} giờ dự kiến</span><span>{{ goal.unit ? goal.targetValue + ' ' + goal.unit : 'Goal linked' }}</span></div></article>}</div>
    <div class="planning-columns"><section class="panel"><div class="panel-heading"><div><div class="card-kicker">THIS MONTH</div><h3>Trọng tâm thực thi</h3></div><a routerLink="/app/tasks">Mở tasks →</a></div><div class="focus-list"><div class="focus-list-item"><span class="focus-number">01</span><div><strong>Giữ nhịp deep work</strong><small>4 sessions / tuần · không đặt sau 21:00</small></div><span class="status-pill done">On track</span></div><div class="focus-list-item"><span class="focus-number">02</span><div><strong>Học đủ, không học dồn</strong><small>25–50 phút mỗi session</small></div><span class="status-pill done">On track</span></div><div class="focus-list-item"><span class="focus-number">03</span><div><strong>Review vào cuối tuần</strong><small>Để điều chỉnh capacity trước khi quá tải</small></div><span class="status-pill warning">Friday</span></div></div></section><section class="panel carry-panel"><div class="card-kicker">CARRY-OVER</div><h3>2 task từ tuần trước</h3><p>Hãy chọn một hành động để tránh task trở thành “stale”.</p><div class="carry-actions"><button class="secondary-button" type="button">Giảm scope</button><button class="secondary-button" type="button">Giữ lại</button></div></section></div>
  `,
})
export class PlanningPage {
  readonly Math = Math;
  constructor(readonly store: WorkspaceStore) {}
  plan() { return this.store.monthlyPlans()[0]; }
}

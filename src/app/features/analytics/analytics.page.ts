import { DecimalPipe } from '@angular/common';
import { Component } from '@angular/core';
import { WorkspaceStore } from '../../core/services/workspace-store.service';

@Component({
  selector: 'app-analytics-page',
  standalone: true,
  imports: [DecimalPipe],
  template: `
    <div class="page-header"><div><div class="eyebrow">MEASURE WHAT MATTERS</div><h1>Analytics <em>rõ ràng.</em></h1><p class="page-subtitle">Số liệu để ra quyết định, không phải để tạo thêm áp lực.</p></div><span class="date-selector">01 — 30 SEP 2026⌄</span></div>
    <div class="analytics-kpis"><div class="kpi-card"><span>GOAL COMPLETION</span><strong>64<small>%</small></strong><em class="up">↑ 8.4%</em></div><div class="kpi-card"><span>PLANNED HOURS</span><strong>18<small>h</small></strong><em class="up">↑ 2.1h</em></div><div class="kpi-card"><span>ACTUAL FOCUS</span><strong>{{ store.totalFocusMinutes() / 60 | number:'1.1-1' }}<small>h</small></strong><em class="up">↑ 18%</em></div><div class="kpi-card"><span>PLANNING ACCURACY</span><strong>82<small>%</small></strong><em>Healthy</em></div></div>
    <div class="analytics-columns"><section class="panel chart-panel"><div class="panel-heading"><div><div class="card-kicker">FOCUS VOLUME</div><h3>Tiến độ theo tuần</h3></div><span class="tag tag-cyan">Phút focus</span></div><div class="chart"><div class="chart-y"><span>600</span><span>400</span><span>200</span><span>0</span></div><div class="chart-main"><div class="chart-grid"><i></i><i></i><i></i><i></i></div><div class="chart-bars">@for (bar of bars; track $index) {<div class="chart-bar-wrap"><div class="chart-bar" [style.height.%]="bar"><span>{{ bar * 6 }}</span></div><small>W{{ $index + 34 }}</small></div>}</div></div></div></section><section class="panel"><div class="card-kicker">GOAL MIX</div><h3>Phân bổ năng lượng</h3><div class="donut-wrap"><div class="donut"><strong>3</strong><small>active goals</small></div><div class="donut-legend"><span><i class="violet"></i>VARETHON <b>48%</b></span><span><i class="cyan"></i>English <b>32%</b></span><span><i class="lime"></i>Health <b>20%</b></span></div></div></section></div>
    <section class="panel decision-panel"><div class="panel-heading"><div><div class="card-kicker">OPERATING SIGNALS</div><h3>Điều hệ thống đang nói</h3></div></div><div class="signal-row"><span class="signal-icon lime">✓</span><div><strong>Capacity đang khỏe</strong><p>Đang dùng 56% thời gian khả dụng. Bạn còn buffer cho việc bất ngờ.</p></div><span class="signal-label good">Healthy</span></div><div class="signal-row"><span class="signal-icon violet">↗</span><div><strong>Deep work tạo ra 72% tiến độ</strong><p>Giữ những block dài ở thời điểm năng lượng cao nhất.</p></div><span class="signal-label">Insight</span></div></section>
  `,
})
export class AnalyticsPage {
  readonly bars = [42, 55, 38, 68, 58, 82, 64];
  constructor(readonly store: WorkspaceStore) {}
}

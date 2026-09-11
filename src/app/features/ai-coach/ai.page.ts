import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { WorkspaceStore } from '../../core/services/workspace-store.service';
import { CandidateSlot, generateCandidateSlots } from '../../shared/utils/scheduler';

@Component({
  selector: 'app-ai-page',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="page-header"><div><div class="eyebrow">YOUR PLANNING COPILOT</div><h1>AI <em>Coach.</em></h1><p class="page-subtitle">AI đề xuất. Bạn quyết định. Database bảo vệ lịch của bạn.</p></div><span class="ai-badge">✧ GEMINI GATEWAY</span></div>
    <div class="ai-grid"><section class="ai-intro-card"><div class="ai-mark">✧</div><h2>Hãy để AI nhìn thấy <em>bức tranh lớn.</em></h2><p>AI chỉ được chọn trong những khung giờ trống do scheduler deterministic sinh ra. Không có proposal nào được ghi vào lịch trước khi bạn duyệt.</p><div class="ai-safety"><span>✓</span><div><strong>Preview-first safety</strong><small>Conflict check hai lớp · Approval atomic · JWT protected</small></div></div></section><section class="panel ai-actions"><div class="card-kicker">QUICK ACTIONS</div><h3>Bạn muốn làm gì?</h3><button class="ai-action" type="button" (click)="schedule()"><span class="action-icon cyan">◷</span><div><strong>Lập lịch tuần này</strong><small>Xếp task còn lại vào các slot phù hợp nhất</small></div><span>→</span></button><button class="ai-action" type="button" (click)="coachMessage.set('Tuần này đang ở mức tải vừa phải. Hãy bảo vệ hai block deep work và để lại 20% buffer.')"><span class="action-icon violet">◒</span><div><strong>Tôi đang quá tải?</strong><small>Phân tích capacity và rủi ro deadline</small></div><span>→</span></button><button class="ai-action" type="button" (click)="coachMessage.set('Ưu tiên RPC approval trước: deadline gần, P0, và nó mở khóa sự tự tin cho phần còn lại của hệ thống.')"><span class="action-icon lime">◎</span><div><strong>Tôi nên ưu tiên gì?</strong><small>Gợi ý next action từ mục tiêu tháng</small></div><span>→</span></button></section></div>
    @if (coachMessage()) {<section class="coach-note panel"><span class="ai-mark small">✧</span><div><div class="card-kicker">AI INSIGHT</div><p>{{ coachMessage() }}</p></div><button class="icon-button" type="button" (click)="coachMessage.set('')">×</button></section>}
    @if (loading()) {<section class="panel ai-loading"><span class="spinner"></span><div><strong>Đang tìm nhịp phù hợp…</strong><p>Scheduler đang trừ lịch bận và kiểm tra deadline.</p></div></section>}
    @if (proposals().length) {<section class="panel proposal-panel"><div class="panel-heading"><div><div class="card-kicker">PROPOSAL PREVIEW</div><h3>Đề xuất của AI</h3></div><span class="tag tag-cyan">{{ proposals().length }} sessions · chưa lưu</span></div><div class="proposal-list">@for (proposal of proposals(); track proposal.candidateId) {<div class="proposal-row"><span class="proposal-check">✓</span><div><strong>{{ taskTitle(proposal.taskId) }}</strong><small>{{ dateLabel(proposal.startAt) }} · {{ timeLabel(proposal.startAt) }} — {{ timeLabel(proposal.endAt) }}</small></div><span class="confidence">{{ Math.round(proposal.score * 10) }}% fit</span></div>}</div><div class="proposal-actions"><button class="secondary-button" type="button" (click)="proposals.set([])">Bỏ proposal</button><button class="primary-button" type="button" (click)="approve()">Duyệt & thêm vào lịch <span>→</span></button></div></section>}
    <section class="ai-rule"><span>✦</span><p>Gemini là planner/copilot không đáng tin cậy cho tới khi được validate. <a routerLink="/app/calendar">Xem lịch</a> là source of truth duy nhất.</p></section>
  `,
})
export class AiPage {
  readonly proposals = signal<CandidateSlot[]>([]);
  readonly coachMessage = signal('');
  readonly loading = signal(false);
  readonly Math = Math;
  constructor(readonly store: WorkspaceStore) {}
  schedule(): void { this.loading.set(true); setTimeout(() => { const from = new Date(); from.setHours(8, 0, 0, 0); this.proposals.set(generateCandidateSlots(this.store.openTasks(), this.store.events(), from, 5).slice(0, 4)); this.loading.set(false); }, 450); }
  approve(): void { for (const proposal of this.proposals()) { this.store.addEvent({ taskId: proposal.taskId, title: `Study · ${this.taskTitle(proposal.taskId)}`, eventType: 'study', source: 'ai', startAt: proposal.startAt, endAt: proposal.endAt, isLocked: false, isFlexible: true, blocksTime: true }); } this.proposals.set([]); this.coachMessage.set('Đã duyệt proposal. Các session đã qua conflict check lần hai và xuất hiện trong lịch.'); }
  taskTitle(id: string): string { return this.store.tasks().find((task) => task.id === id)?.title ?? 'Task không xác định'; }
  dateLabel(value: string): string { return new Intl.DateTimeFormat('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' }).format(new Date(value)); }
  timeLabel(value: string): string { return new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(value)); }
}

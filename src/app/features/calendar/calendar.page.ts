import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CalendarEvent } from '../../shared/models/domain';
import { WorkspaceStore } from '../../core/services/workspace-store.service';

@Component({
  selector: 'app-calendar-page',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="page-header"><div><div class="eyebrow">SCHEDULE-DRIVEN EXECUTION</div><h1>Lịch <em>thực thi.</em></h1><p class="page-subtitle">Lịch bận là ranh giới. Những khoảng trống còn lại là nơi tiến bộ xảy ra.</p></div><button class="primary-button" type="button" (click)="showForm.set(!showForm())">+ Sự kiện mới</button></div>
    @if (showForm()) {<form class="inline-form panel" [formGroup]="form" (ngSubmit)="createEvent()"><div class="form-grid"><label>Tên sự kiện<input formControlName="title" placeholder="Ví dụ: Lịch học trên trường" /></label><label>Bắt đầu<input type="datetime-local" formControlName="startAt" /></label><label>Kết thúc<input type="datetime-local" formControlName="endAt" /></label></div>@if(error()) {<p class="form-error">{{ error() }}</p>}<div class="form-actions"><button class="secondary-button" type="button" (click)="showForm.set(false)">Hủy</button><button class="primary-button" type="submit" [disabled]="form.invalid">Lưu lịch bận</button></div></form>}
    <div class="calendar-toolbar"><div class="calendar-tabs"><button class="calendar-tab" type="button">Tháng</button><button class="calendar-tab active" type="button">Tuần</button><button class="calendar-tab" type="button">Ngày</button><button class="calendar-tab" type="button">Agenda</button></div><div class="calendar-nav"><button class="icon-button" type="button">‹</button><strong>09 — 15 THÁNG 9, 2026</strong><button class="icon-button" type="button">›</button></div></div>
    <section class="week-calendar panel"><div class="week-head"><div class="time-gutter"></div>@for (day of weekDays; track day.date) {<div class="day-head" [class.today]="day.today"><small>{{ day.label }}</small><strong>{{ day.number }}</strong></div>}</div><div class="week-body"><div class="time-axis">@for (hour of hours; track hour) {<span>{{ hour }}:00</span>}</div><div class="calendar-grid">@for (hour of hours; track hour) {<div class="hour-line"></div>}@for (event of visibleEvents(); track event.id) {<div class="calendar-event" [class]="event.eventType" [style.top.px]="eventTop(event)" [style.height.px]="eventHeight(event)"><strong>{{ event.title }}</strong><small>{{ timeLabel(event.startAt) }} — {{ timeLabel(event.endAt) }}</small></div>}</div></div></section>
    <section class="calendar-legend"><span><i class="legend-dot fixed"></i>Lịch bận / locked</span><span><i class="legend-dot study"></i>Study & focus</span><span><i class="legend-dot ai"></i>AI proposal</span><span class="legend-note">Conflict được enforce ở database</span></section>
  `,
})
export class CalendarPage {
  private readonly fb = inject(FormBuilder);
  readonly showForm = signal(false);
  readonly error = signal('');
  readonly hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
  readonly weekDays = Array.from({ length: 7 }, (_, index) => { const date = new Date(2026, 8, 9 + index); return { date: date.toISOString().slice(0, 10), label: new Intl.DateTimeFormat('vi-VN', { weekday: 'short' }).format(date), number: date.getDate(), today: date.getDate() === 11 }; });
  readonly form = this.fb.nonNullable.group({ title: ['', Validators.required], startAt: ['2026-09-11T16:00', Validators.required], endAt: ['2026-09-11T17:00', Validators.required] });
  constructor(readonly store: WorkspaceStore) {}
  visibleEvents(): CalendarEvent[] { return this.store.events().filter((event) => event.status === 'active'); }
  createEvent(): void { if (this.form.invalid) return; const value = this.form.getRawValue(); const startAt = new Date(value.startAt).toISOString(); const endAt = new Date(value.endAt).toISOString(); if (Date.parse(endAt) <= Date.parse(startAt)) { this.error.set('Thời gian kết thúc phải sau thời gian bắt đầu.'); return; } const result = this.store.addEvent({ title: value.title, eventType: 'fixed_commitment', source: 'manual', startAt, endAt, isLocked: true, isFlexible: false, blocksTime: true }); if (result.conflict) { this.error.set(`Khung giờ trùng với “${result.conflict.title}”.`); return; } this.error.set(''); this.showForm.set(false); }
  eventTop(event: CalendarEvent): number { return Math.max(((new Date(event.startAt).getHours() - 8) * 60 + new Date(event.startAt).getMinutes()) * 1.25, 4); }
  eventHeight(event: CalendarEvent): number { return Math.max(((Date.parse(event.endAt) - Date.parse(event.startAt)) / 60000) * 1.25, 36); }
  timeLabel(value: string): string { return new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(value)); }
}

import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

interface RoadmapNode {
  title: string;
  description: string;
  status: 'done' | 'current' | 'next';
  progress: number;
}

@Component({
  selector: 'app-learning-page',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="page-header"><div><div class="eyebrow">DELIBERATE PRACTICE</div><h1>Learning <em>roadmaps.</em></h1><p class="page-subtitle">Biến điều muốn học thành một chuỗi bước có thể hoàn thành.</p></div><button class="primary-button" type="button" (click)="added.set(true)">+ Roadmap mới</button></div>
    @if (added()) { <div class="success-banner"><span>✓</span> Roadmap mới đã sẵn sàng để bạn thêm node đầu tiên.</div> }
    <section class="learning-hero panel"><div><div class="card-kicker">ACTIVE ROADMAP · 01</div><h2>Cybersecurity foundations</h2><p>Đi từ nền tảng hệ điều hành đến thực chiến lab, theo nhịp vừa sức.</p><div class="progress-line large"><span style="width:48%"></span></div><small>48% hoàn thành · 6 / 12 nodes</small></div><div class="roadmap-orbit"><strong>48%</strong><small>in motion</small></div></section>
    <div class="learning-columns"><section class="panel"><div class="panel-heading"><div><div class="card-kicker">ROADMAP PATH</div><h3>Chặng tiếp theo</h3></div><span class="tag tag-violet">12 nodes</span></div><div class="roadmap-list">@for (node of nodes; track node.title) {<article class="roadmap-node" [class.current-node]="node.status === 'current'"><span class="node-marker" [class]="node.status">{{ node.status === 'done' ? '✓' : node.status === 'current' ? '→' : '·' }}</span><div><strong>{{ node.title }}</strong><p>{{ node.description }}</p><div class="progress-line"><span [style.width.%]="node.progress"></span></div></div><span class="node-progress">{{ node.progress }}%</span></article>}</div></section><section class="panel resource-panel"><div class="card-kicker">RESOURCE STACK</div><h3>Đang mở gần đây</h3><a class="resource-row" href="https://portswigger.net/web-security" target="_blank" rel="noreferrer"><span class="resource-icon cyan">↗</span><span><strong>Web Security Academy</strong><small>PortSwigger · interactive labs</small></span><span>↗</span></a><a class="resource-row" href="https://developer.mozilla.org/" target="_blank" rel="noreferrer"><span class="resource-icon violet">◎</span><span><strong>MDN Web Docs</strong><small>Reference · frontend fundamentals</small></span><span>↗</span></a><a class="resource-row" routerLink="/app/tasks"><span class="resource-icon lime">✓</span><span><strong>Learning tasks</strong><small>3 task đang liên kết</small></span><span>→</span></a></section></div>
  `,
})
export class LearningPage {
  readonly added = signal(false);
  readonly nodes: RoadmapNode[] = [
    { title: 'Linux & networking essentials', description: 'Đã hoàn thành · ghi chú đã được review.', status: 'done', progress: 100 },
    { title: 'Web request anatomy', description: 'Node hiện tại · 2 session còn lại trong tuần.', status: 'current', progress: 68 },
    { title: 'OWASP Top 10 labs', description: 'Mở khóa sau khi hoàn thành node hiện tại.', status: 'next', progress: 0 },
  ];
}

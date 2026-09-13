import { DOCUMENT } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Course, CourseCatalogService, CourseLesson } from '../../core/services/course-catalog.service';

const SELECTION_KEY = 'varethon_course_selection';

interface CourseSelection {
  courseId: string;
  lessonId: string;
}

@Component({
  selector: 'app-courses-page',
  standalone: true,
  template: `
    <div class="page-header">
      <div><div class="eyebrow">PERSONAL COURSE LIBRARY</div><h1>Khóa học <em>của bạn.</em></h1><p class="page-subtitle">Học trực tiếp từ thư viện video cá nhân, theo đúng thứ tự bài đã được sắp xếp.</p></div>
      @if (courses().length) { <span class="tag tag-cyan course-total">{{ totalLessons() }} bài học</span> }
    </div>

    @if (catalog.loading()) {
      <section class="panel course-state"><span class="spinner"></span><div><h3>Đang tải thư viện khóa học</h3><p>Đang đọc danh sách video trong public/courses…</p></div></section>
    } @else if (catalog.error()) {
      <section class="panel course-state course-state-error"><span class="resource-icon violet">!</span><div><h3>Không thể tải khóa học</h3><p>{{ catalog.error() }}</p></div></section>
    } @else if (!courses().length) {
      <section class="panel course-state"><span class="resource-icon cyan">∅</span><div><h3>Chưa có khóa học</h3><p>Thêm video .mp4 vào public/courses rồi chạy lại ứng dụng.</p></div></section>
    } @else {
      <section class="course-switcher" aria-label="Chọn khóa học">
        @for (course of courses(); track course.id) {
          <button class="course-card" type="button" [class.selected]="course.id === selectedCourse()?.id" [attr.aria-pressed]="course.id === selectedCourse()?.id" (click)="selectCourse(course)">
            <span class="course-card-icon">▶</span><span class="course-card-copy"><strong>{{ course.title }}</strong><small>{{ course.lessons.length }} bài học<span aria-hidden="true"> · </span>{{ course.category || 'Video cá nhân' }}</small></span><span class="course-card-arrow">→</span>
          </button>
        }
      </section>

      <div class="courses-layout">
        <section class="panel course-video-panel">
          <div class="panel-heading"><div><div class="card-kicker">NOW LEARNING</div><h3>{{ selectedLesson()?.title || 'Chọn một bài học' }}</h3></div><span class="tag tag-violet">Bài {{ selectedLesson()?.number || '—' }}</span></div>
          @if (selectedLesson()) {
            <div class="course-video-frame"><video [src]="selectedVideoUrl()" controls preload="metadata" playsinline [attr.aria-label]="selectedLesson()?.title"></video></div>
            <div class="course-video-meta"><span class="card-kicker">{{ selectedCourse()?.title }}</span><p>Tiếp tục bài học bất cứ lúc nào; bài đang chọn sẽ được ghi nhớ trên thiết bị này.</p></div>
          } @else {
            <div class="course-video-empty"><span>▶</span><p>Chọn một bài học bên cạnh để bắt đầu xem.</p></div>
          }
        </section>

        <section class="panel course-lessons-panel">
          <div class="panel-heading"><div><div class="card-kicker">LESSON LIST</div><h3>{{ selectedCourse()?.title }}</h3></div><span>{{ selectedCourse()?.lessons?.length || 0 }} bài</span></div>
          <div class="course-lesson-list" aria-label="Danh sách bài học">
            @for (lesson of selectedCourse()?.lessons || []; track lesson.id) {
              <button class="course-lesson" type="button" [class.active]="lesson.id === selectedLesson()?.id" [attr.aria-pressed]="lesson.id === selectedLesson()?.id" (click)="selectLesson(lesson)">
                <span class="lesson-number">{{ lesson.number }}</span><span class="lesson-copy"><strong>{{ lesson.number }}. {{ lesson.title }}</strong><small>Video bài {{ lesson.number }}</small></span><span class="lesson-action">{{ lesson.id === selectedLesson()?.id ? 'Đang xem' : '▶' }}</span>
              </button>
            }
          </div>
        </section>
      </div>
    }
  `,
})
export class CoursesPage {
  private readonly document = inject(DOCUMENT);
  readonly catalog = inject(CourseCatalogService);

  readonly courses = computed(() => this.catalog.manifest()?.courses ?? []);
  readonly selectedCourseId = signal(this.readSelection()?.courseId ?? '');
  readonly selectedLessonId = signal(this.readSelection()?.lessonId ?? '');
  readonly selectedCourse = computed(() => this.courses().find((course) => course.id === this.selectedCourseId()) ?? this.courses()[0] ?? null);
  readonly selectedLesson = computed(() => {
    const course = this.selectedCourse();
    return course?.lessons.find((lesson) => lesson.id === this.selectedLessonId()) ?? course?.lessons[0] ?? null;
  });
  readonly selectedVideoUrl = computed(() => {
    const lesson = this.selectedLesson();
    if (!lesson) return '';
    const encodedPath = lesson.filePath.split('/').map((part) => encodeURIComponent(part)).join('/');
    return new URL(`courses/${encodedPath}`, this.document.baseURI).toString();
  });
  readonly totalLessons = computed(() => this.courses().reduce((total, course) => total + course.lessons.length, 0));

  selectCourse(course: Course): void {
    this.selectedCourseId.set(course.id);
    this.selectedLessonId.set(course.lessons[0]?.id ?? '');
    this.saveSelection();
  }

  selectLesson(lesson: CourseLesson): void {
    this.selectedLessonId.set(lesson.id);
    this.saveSelection();
  }

  private readSelection(): CourseSelection | null {
    try {
      const stored = localStorage.getItem(SELECTION_KEY);
      if (!stored) return null;
      const selection = JSON.parse(stored) as Partial<CourseSelection>;
      return typeof selection.courseId === 'string' && typeof selection.lessonId === 'string'
        ? { courseId: selection.courseId, lessonId: selection.lessonId }
        : null;
    } catch {
      return null;
    }
  }

  private saveSelection(): void {
    localStorage.setItem(SELECTION_KEY, JSON.stringify({ courseId: this.selectedCourseId(), lessonId: this.selectedLessonId() } satisfies CourseSelection));
  }
}

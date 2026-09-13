import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';

export interface CourseLesson {
  id: string;
  number: number;
  title: string;
  filePath: string;
}

export interface Course {
  id: string;
  title: string;
  category?: string;
  lessons: CourseLesson[];
}

export interface CourseManifest {
  version: number;
  generatedAt?: string;
  courses: Course[];
}

@Injectable({ providedIn: 'root' })
export class CourseCatalogService {
  readonly manifest = signal<CourseManifest | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');

  private readonly http = inject(HttpClient);
  private readonly document = inject(DOCUMENT);

  constructor() {
    this.load();
  }

  private load(): void {
    const manifestUrl = new URL('courses/manifest.json', this.document.baseURI).toString();
    this.http.get<CourseManifest>(manifestUrl).subscribe({
      next: (manifest) => {
        if (!manifest || !Array.isArray(manifest.courses)) {
          this.error.set('Danh sách khóa học không đúng định dạng.');
        } else {
          this.manifest.set(manifest);
        }
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Không tải được danh sách khóa học. Hãy kiểm tra thư mục public/courses và thử lại.');
        this.loading.set(false);
      },
    });
  }
}

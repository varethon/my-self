import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CourseCatalogService } from './course-catalog.service';

describe('CourseCatalogService', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [CourseCatalogService, provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads the generated course manifest', () => {
    const catalog = TestBed.inject(CourseCatalogService);
    const request = http.expectOne((req) => req.url.endsWith('/courses/manifest.json'));

    request.flush({
      version: 1,
      courses: [{ id: 'linux', title: 'Linux', lessons: [{ id: 'lesson-1', number: 1, title: 'Giới thiệu', filePath: 'Linux/1.Giới thiệu.mp4' }] }],
    });

    expect(catalog.loading()).toBe(false);
    expect(catalog.error()).toBe('');
    expect(catalog.manifest()?.courses[0].lessons).toHaveLength(1);
  });

  it('exposes a useful error when the manifest cannot be loaded', () => {
    const catalog = TestBed.inject(CourseCatalogService);
    const request = http.expectOne((req) => req.url.endsWith('/courses/manifest.json'));

    request.flush('not found', { status: 404, statusText: 'Not Found' });

    expect(catalog.loading()).toBe(false);
    expect(catalog.manifest()).toBeNull();
    expect(catalog.error()).toContain('Không tải được danh sách khóa học');
  });
});

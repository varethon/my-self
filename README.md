# VARETHON ASCEND

VARETHON ASCEND là Angular 22 personal operating system: Goal → Plan → Execute → Review.
Bản GitHub Pages chạy local-only, dùng một cổng mật khẩu hardcode duy nhất và lưu toàn bộ workspace trong localStorage của trình duyệt.

## Mở workspace

Trang mở khóa chỉ chấp nhận mật khẩu `0346782752`, được cấu hình trong `src/app/core/services/auth.service.ts`.
Không có username, Supabase Auth, signup hay API tạo tài khoản. Session chỉ là một cờ local trong trình duyệt và được giữ đến khi bấm Đăng xuất.

Vì đây là SPA tĩnh, thông tin hardcode có thể bị xem trong JavaScript build. Cấu hình chỉ phù hợp cho workspace cá nhân/demo, không dùng để bảo vệ dữ liệu nhạy cảm.

## Khóa học

Các video `.mp4` trong `public/courses` được quét tự động thành `public/courses/manifest.json` trước khi chạy dev hoặc build. Trang `Khóa học` tại `/app/courses` hiển thị danh sách khóa, phát video trực tiếp trong app và nhớ bài đang xem trên thiết bị.

`manifest.json` là file sinh tự động và không cần chỉnh tay. Khi thêm video mới, đặt file vào thư mục khóa học rồi chạy lại `npm start` hoặc `npm run build`.

Toàn bộ nội dung `public` được copy vào build artifact để trình duyệt có thể tải manifest và video. Hiện thư viện video khoảng 3,51 GB, vì vậy cần kiểm tra giới hạn artifact/hosting trước khi deploy. Cổng mật khẩu frontend không ngăn được người biết URL video truy cập trực tiếp.

## Chạy local

```bash
npm install
npm start
```

Mở `http://localhost:4200`. Dữ liệu tạo trong app được lưu lại khi reload cùng trình duyệt. Xóa site data/localStorage để khôi phục workspace mẫu.

## Kiến trúc local-only

- `AuthService` xác thực một mật khẩu cố định và điều hướng vào Dashboard hoặc deep-link được yêu cầu.
- `CourseCatalogService` tải manifest tĩnh; `CoursesPage` quản lý khóa/bài đang chọn và phát video local.
- `WorkspaceStore` là nguồn dữ liệu duy nhất cho goals, milestones, plans, tasks, calendar, habits, focus và reviews.
- AI Coach dùng deterministic scheduler local với quy trình Preview → Approve; không gọi Gemini hay Supabase Edge Functions.
- GitHub Pages workflow chỉ build Angular, tạo `404.html` cho deep link và deploy artifact thực tế.

## Backend dự phòng

Các migrations và Edge Functions trong `supabase/` được giữ lại như backend artifact của kiến trúc ban đầu. Bản static local-only không khởi tạo Supabase client, không đọc runtime key và không gọi backend này.

## Kiểm thử

```bash
npm run build
npm test -- --watch=false
npm run e2e
npm audit --audit-level=high
```
# my-self
# my-self

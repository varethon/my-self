# VARETHON ASCEND

VARETHON ASCEND là Angular 22 personal operating system: Goal → Plan → Execute → Review.
Bản GitHub Pages chạy local-only, dùng một tài khoản hardcode duy nhất và lưu toàn bộ workspace trong localStorage của trình duyệt.

## Đăng nhập

Trang login chỉ chấp nhận tài khoản cố định đã cấu hình trong `src/app/core/services/auth.service.ts`.
Không có Supabase Auth, không có signup và không có API tạo tài khoản. Session chỉ là một cờ local trong trình duyệt.

Vì đây là SPA tĩnh, thông tin hardcode có thể bị xem trong JavaScript build. Cấu hình chỉ phù hợp cho workspace cá nhân/demo, không dùng để bảo vệ dữ liệu nhạy cảm.

## Chạy local

```bash
npm install
npm start
```

Mở `http://localhost:4200`. Dữ liệu tạo trong app được lưu lại khi reload cùng trình duyệt. Xóa site data/localStorage để khôi phục workspace mẫu.

## Kiến trúc local-only

- `AuthService` xác thực username/password cố định và điều hướng thẳng vào Dashboard.
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

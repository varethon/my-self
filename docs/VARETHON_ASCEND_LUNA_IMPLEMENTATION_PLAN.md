# VARETHON ASCEND — MASTER IMPLEMENTATION PLAN FOR GPT LUNA

> **Mục tiêu:** Luna tự triển khai toàn bộ hệ thống VARETHON ASCEND từ source code đến Supabase production, tự build, tự kiểm thử, tự deploy Edge Functions, tự cấu hình GitHub Pages và tự push GitHub.  
> **Frontend:** Angular 22 + TypeScript + SCSS  
> **Backend:** Supabase Auth + PostgreSQL + RLS + RPC + Edge Functions  
> **AI:** Gemini API qua Supabase Edge Functions  
> **Hosting frontend:** GitHub Pages  
> **Nguồn nghiệp vụ:** `VARETHON_ASCEND_BD.md`  
> **Repository mặc định:** `varethon-ascend`  
> **Supabase project ref:** `qphzagsrntgjktnqiyaz`  
> **Supabase URL:** `https://qphzagsrntgjktnqiyaz.supabase.co`

---

# 0. EXECUTION CONTRACT — LUẬT BẮT BUỘC CHO LUNA

Luna phải coi tài liệu này là **execution plan**, không phải tài liệu tham khảo.

## 0.1. Mục tiêu cuối cùng

Chỉ được coi là hoàn thành khi đồng thời đạt:

- Source code hoàn chỉnh đã được push lên GitHub.
- Nhánh mặc định là `main`.
- GitHub Actions build PASS.
- GitHub Pages đã deploy và truy cập được.
- Angular production build không có error.
- Supabase migrations đã push lên đúng project.
- RLS đã bật cho toàn bộ bảng private.
- Edge Functions đã deploy.
- Gemini key được cấu hình trong Supabase Secrets.
- Không có Gemini key, Supabase secret key, DB password hoặc credential nhạy cảm trong Git history.
- Login hoạt động.
- CRUD mục tiêu, monthly plan, task, calendar, habit hoạt động.
- AI scheduler hoạt động theo cơ chế Preview → Approve.
- Không cho phép AI ghi trực tiếp calendar trước khi user approve.
- Conflict lịch được enforce ở backend.
- Mobile và desktop đều usable.
- Refresh deep-link trên GitHub Pages không làm ứng dụng chết.
- Smoke test production PASS.

## 0.2. Quy tắc tự chủ

Luna phải:

1. Tự inspect máy và repository.
2. Tự cài dependency cần thiết.
3. Tự tạo project nếu repository chưa tồn tại.
4. Tự chọn default hợp lý khi BD không chỉ rõ.
5. Tự sửa lỗi build/type/lint/test trước khi sang phase tiếp theo.
6. Không hỏi người dùng cho các quyết định kỹ thuật nhỏ.
7. Không bỏ qua lỗi bằng cách comment code, disable type checking hoặc xóa test.
8. Không dùng `any` bừa bãi để qua TypeScript.
9. Không tắt RLS để “cho chạy”.
10. Không đưa service/secret key vào Angular.
11. Không dùng Gemini trực tiếp từ browser.
12. Không commit `.env`, token CLI hoặc file credential.
13. Không push code nếu production build chưa PASS.
14. Không báo hoàn thành khi Pages URL chưa truy cập được.

## 0.3. External-auth boundary

Luna phải tự thử theo thứ tự:

```text
Supabase:
1. Kiểm tra session CLI hiện tại.
2. Nếu chưa auth → `supabase login`.
3. Nếu runtime có SUPABASE_ACCESS_TOKEN → dùng token đó thay interactive login.
4. Chỉ khi nền tảng yêu cầu MFA/browser approval mà Luna không thể thao tác mới coi là external-auth blocker.

GitHub:
1. `gh auth status`
2. Nếu đã login → dùng session hiện tại.
3. Nếu chưa login → `gh auth login` hoặc auth mechanism có sẵn trong môi trường.
```

Không được dùng Supabase publishable/secret API key thay cho Supabase CLI account access token. Đó là hai loại credential khác nhau.

## 0.4. Secret policy

Các credential đã được cung cấp trong task context phải được dùng **chỉ trong secure runtime**.

### Được phép commit

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`

Đây là public browser configuration và vẫn phải được bảo vệ bởi RLS.

### Tuyệt đối không commit

- `GEMINI_API_KEY`
- `SUPABASE_SECRET_KEY`
- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_DB_PASSWORD`
- Project/database password
- GitHub PAT/token
- `.env`
- `.env.local`
- `supabase/functions/.env`

### Luật xử lý

- Không echo secret ra terminal nếu không cần.
- Không đưa secret vào README.
- Không đưa secret vào Angular environment.
- Không đưa secret vào GitHub Pages build artifact.
- Không hardcode secret trong Edge Function.
- Gemini key phải được đưa lên bằng `supabase secrets set`.
- Supabase Edge Functions production sử dụng environment/default Supabase keys do platform cấp; không hardcode secret key.
- Sau khi dùng temp env file phải xóa file đó.
- Nếu phát hiện secret đã xuất hiện trong Git history: dừng push, purge history rồi rotate secret.

---

# 1. TARGET ARCHITECTURE

```text
┌────────────────────────────────────────────┐
│             GitHub Pages                   │
│          Angular 22 SPA                    │
│                                            │
│ Public config only:                        │
│ - SUPABASE_URL                             │
│ - SUPABASE_PUBLISHABLE_KEY                 │
└──────────────────────┬─────────────────────┘
                       │
                       │ User JWT + Publishable Key
                       ▼
┌────────────────────────────────────────────┐
│               Supabase                     │
│                                            │
│ Auth                                       │
│ PostgreSQL                                 │
│ RLS                                        │
│ RPC / DB Functions                         │
│ Edge Functions                             │
└───────────────┬────────────────────────────┘
                │
                │ Server-side secret
                ▼
┌────────────────────────────────────────────┐
│             Gemini API                     │
│        `gemini-3.8-flash`                  │
│      Structured JSON output only           │
└────────────────────────────────────────────┘
```

## 1.1. Nguyên tắc AI Scheduler

Không để Gemini tự “nghĩ giờ rồi insert”.

Thiết kế an toàn hơn:

```text
DB dữ liệu thật
     ↓
Deterministic Scheduler Engine
     ↓
Sinh candidate free slots
     ↓
Gemini chỉ lựa chọn / xếp hạng candidate
     ↓
JSON Schema validation
     ↓
Ownership validation
     ↓
Conflict validation lần 1
     ↓
Preview trên Angular
     ↓
User Approve
     ↓
DB transaction + conflict validation lần 2
     ↓
Calendar Events
```

---

# 2. TECH STACK LOCK

## 2.1. Runtime

Ưu tiên:

```text
Angular: 22.x
Node: 24.x LTS compatible with Angular 22
npm: version đi kèm Node runtime
TypeScript: version do Angular 22 yêu cầu
```

Nếu máy đã có Node tương thích Angular 22 thì giữ nguyên.

Nếu chưa tương thích:

```bash
node --version
npm --version
```

Nếu có `nvm`:

```bash
nvm install 24
nvm use 24
```

Tạo:

```text
.nvmrc
```

với Node major đã dùng thực tế.

## 2.2. Angular

Bắt buộc:

- Standalone components.
- Strict mode.
- Lazy loaded feature routes.
- Signals cho local/application state.
- Reactive Forms.
- OnPush/default signal-friendly design.
- SCSS.
- Angular Material/CDK cho dialog, menu, accessibility, controls.
- Không SSR.
- Build output static.

## 2.3. Core packages

Cài tối thiểu:

```text
@supabase/supabase-js
@angular/material
@angular/cdk
zod
date-fns
```

Calendar:

Ưu tiên FullCalendar nếu version hiện tại tương thích Angular 22:

```text
@fullcalendar/angular
@fullcalendar/core
@fullcalendar/daygrid
@fullcalendar/timegrid
@fullcalendar/interaction
@fullcalendar/list
```

Nếu dependency conflict nghiêm trọng với Angular 22:
- Không downgrade Angular.
- Không `--legacy-peer-deps` như giải pháp mặc định.
- Implement calendar grid native Angular.

Testing:

```text
Angular test runner mặc định
@playwright/test
```

---

# 3. PHASE 0 — PRE-FLIGHT

## 3.1. Kiểm tra workspace

Chạy:

```bash
pwd
git status || true
node --version || true
npm --version || true
npx @angular/cli@22 version || true
npx supabase --version || true
gh --version || true
gh auth status || true
```

## 3.2. Nếu folder đã có code

Không overwrite mù.

Luna phải:

```bash
git status
git log --oneline -10
find . -maxdepth 2 -type f | sort | head -200
```

Đọc:

```text
README.md
package.json
angular.json
supabase/config.toml
VARETHON_ASCEND_BD.md
```

Nếu project đã có code:
- Giữ code tốt.
- Refactor theo architecture plan.
- Không `rm -rf` repository trừ khi repo rõ ràng mới/trống.

## 3.3. Security pre-scan

Trước commit đầu tiên:

```bash
git grep -nE 'sb_secret_|SUPABASE_SECRET_KEY|GEMINI_API_KEY|SUPABASE_ACCESS_TOKEN|DB_PASSWORD' || true
```

Nếu thấy secret hardcode:
1. Di chuyển sang secret store.
2. Xóa khỏi file.
3. Nếu đã commit, purge history.
4. Chỉ tiếp tục sau khi scan sạch.

## 3.4. `.gitignore`

Phải có:

```gitignore
node_modules/
dist/
.angular/
coverage/
playwright-report/
test-results/

.env
.env.*
!.env.example

supabase/functions/.env
supabase/.branches/
supabase/.temp/

.DS_Store
*.log
```

---

# 4. PHASE 1 — REPOSITORY + ANGULAR BOOTSTRAP

## 4.1. Repository

Tên mặc định:

```text
varethon-ascend
```

Nếu current repository đã có tên thì không đổi tùy tiện.

Nếu chưa có git repo:

```bash
git init
git branch -M main
```

## 4.2. Tạo Angular app

Nếu workspace trống:

```bash
npx @angular/cli@22 new varethon-ascend \
  --directory . \
  --routing \
  --style scss \
  --standalone \
  --strict \
  --ssr=false \
  --skip-git \
  --package-manager npm
```

Sau đó:

```bash
npm install
npm install @supabase/supabase-js zod date-fns
ng add @angular/material
```

Với Material:
- chọn theme custom.
- bật typography.
- bật animations.

## 4.3. Production-static build

Đảm bảo application build là static/client-side.

Không bật SSR/hybrid rendering.

Kiểm tra:

```bash
npm run build
```

Expected output với application builder:

```text
dist/<project-name>/browser/
```

## 4.4. Folder architecture

Tạo:

```text
src/app/
├── core/
│   ├── auth/
│   ├── config/
│   ├── guards/
│   ├── interceptors/
│   ├── layout/
│   ├── services/
│   └── error/
│
├── shared/
│   ├── components/
│   ├── directives/
│   ├── pipes/
│   ├── models/
│   ├── utils/
│   └── validators/
│
├── data-access/
│   ├── supabase/
│   ├── repositories/
│   ├── dto/
│   └── mappers/
│
└── features/
    ├── auth/
    ├── onboarding/
    ├── dashboard/
    ├── life-areas/
    ├── goals/
    ├── monthly-plan/
    ├── tasks/
    ├── calendar/
    ├── habits/
    ├── focus/
    ├── learning/
    ├── resources/
    ├── reviews/
    ├── analytics/
    ├── ai-coach/
    └── settings/
```

Feature:

```text
feature/
├── pages/
├── components/
├── services/
├── models/
└── feature.routes.ts
```

## 4.5. Route lazy loading

Không import toàn bộ feature ở startup.

Root routes:

```text
/login
/register
/forgot-password

/app
/app/dashboard
/app/goals
/app/month
/app/tasks
/app/calendar
/app/habits
/app/focus
/app/learning
/app/resources
/app/reviews
/app/analytics
/app/ai
/app/settings
```

`/app/*` bắt buộc AuthGuard.

---

# 5. PHASE 2 — DESIGN SYSTEM + UX FOUNDATION

## 5.1. Visual direction

Phong cách:

```text
Professional
Clean
Focused
Dark/Light ready
Không cyber-neon quá mức
Không dashboard overload
```

## 5.2. Design tokens

Tạo:

```text
src/styles/
├── _tokens.scss
├── _theme.scss
├── _mixins.scss
├── _utilities.scss
└── _responsive.scss
```

Token:

- spacing scale.
- radius scale.
- typography.
- surface.
- border.
- primary/secondary.
- success/warning/error.
- focus ring.
- shadow.

Không hardcode màu rải rác trong component.

## 5.3. App shell

Desktop:

```text
Sidebar + Topbar + Main Content
```

Mobile:

```text
Topbar
Content
Bottom Navigation:
Today | Calendar | Goals | Tasks | More
```

## 5.4. UX states bắt buộc

Mỗi data page phải có:

- loading.
- skeleton.
- empty state.
- error.
- success feedback.
- disabled action.
- retry.
- validation error.
- mobile state.

## 5.5. Accessibility

- Semantic HTML.
- Label tất cả form control.
- Keyboard navigation.
- Dialog focus trap.
- Escape đóng dialog.
- Visible focus ring.
- Touch target >= 44px.
- Không dùng màu là tín hiệu duy nhất.
- `aria-live` cho async feedback phù hợp.

---

# 6. PHASE 3 — SUPABASE CLI AUTH + PROJECT LINK

## 6.1. Install / use project-scoped CLI

Ưu tiên:

```bash
npm install --save-dev supabase
```

Sau đó dùng:

```bash
npx supabase ...
```

## 6.2. Auth

Kiểm tra:

```bash
npx supabase projects list
```

Nếu fail do chưa auth:

```bash
npx supabase login
```

Nếu environment có `SUPABASE_ACCESS_TOKEN`, CLI có thể dùng token đó thay login interactive.

Sau auth:

```bash
npx supabase projects list
```

Xác minh project ref:

```text
qphzagsrntgjktnqiyaz
```

## 6.3. Init

Nếu chưa có:

```bash
npx supabase init
```

## 6.4. Link

```bash
npx supabase link --project-ref qphzagsrntgjktnqiyaz
```

Nếu CLI yêu cầu database password:
- dùng credential đã cung cấp trong secure task context.
- ưu tiên `SUPABASE_DB_PASSWORD` trong process environment.
- không viết literal password vào shell script được commit.
- unset sau khi hoàn tất.

Ví dụ nguyên tắc:

```bash
export SUPABASE_DB_PASSWORD='...secure runtime value...'
npx supabase link --project-ref qphzagsrntgjktnqiyaz
unset SUPABASE_DB_PASSWORD
```

## 6.5. Kiểm tra remote trước khi thay đổi

Chạy:

```bash
npx supabase migration list
npx supabase functions list
```

Nếu remote đã có schema:
- pull/baseline trước.
- không drop bảng lạ.
- không reset remote database.
- migration mới phải additive hoặc có migration-safe transformation.

Tuyệt đối không chạy production:

```text
supabase db reset
DROP SCHEMA public CASCADE
```

trừ khi có bằng chứng project hoàn toàn disposable và task yêu cầu.

---

# 7. PHASE 4 — DATABASE MIGRATIONS

Tất cả schema phải nằm trong:

```text
supabase/migrations/
```

Không tạo bảng production chỉ bằng Dashboard rồi quên migration.

## 7.1. Migration order

Tạo theo thứ tự:

```text
0001_extensions_and_helpers.sql
0002_profiles_and_preferences.sql
0003_life_areas.sql
0004_goals_and_milestones.sql
0005_monthly_planning.sql
0006_tasks.sql
0007_calendar.sql
0008_habits_and_focus.sql
0009_learning_and_resources.sql
0010_reviews_and_ai.sql
0011_rls_policies.sql
0012_rpc_and_transactions.sql
0013_indexes.sql
0014_triggers.sql
0015_seed_defaults.sql
```

Tên timestamp thực tế do CLI tạo:

```bash
npx supabase migration new extensions_and_helpers
```

## 7.2. Tables bắt buộc

```text
profiles
user_preferences
life_areas

goals
goal_milestones

monthly_plans
monthly_goals

tasks

calendar_events
recurrence_rules

habits
habit_logs

focus_sessions

learning_roadmaps
roadmap_nodes
resources

weekly_reviews
monthly_reviews

ai_requests
ai_schedule_batches
ai_schedule_proposals
```

Có thể thêm:

```text
audit_events
```

chỉ cho security-sensitive actions.

## 7.3. Common columns

User-owned table:

```sql
id uuid primary key default gen_random_uuid(),
user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
created_at timestamptz not null default now(),
updated_at timestamptz not null default now()
```

Soft-delete khi cần:

```sql
deleted_at timestamptz null
```

## 7.4. Check constraints

Không chỉ validate ở frontend.

Ví dụ:

```sql
check (priority between 0 and 3)
check (estimated_minutes >= 0)
check (actual_minutes >= 0)
check (end_at > start_at)
check (month between 1 and 12)
check (confidence between 0 and 1)
```

Status text phải có `CHECK (... IN (...))`.

## 7.5. Unique constraints

Ít nhất:

```text
monthly_plans:
UNIQUE(user_id, year, month)

habit_logs:
UNIQUE(user_id, habit_id, log_date)
```

## 7.6. Calendar overlap protection

Bật:

```sql
create extension if not exists btree_gist;
```

`calendar_events` cần:

```text
blocks_time boolean default true
status text
```

Dùng exclusion constraint cho active time-blocking events của cùng user:

```sql
EXCLUDE USING gist (
  user_id WITH =,
  tstzrange(start_at, end_at, '[)') WITH &&
)
WHERE (blocks_time = true AND status = 'active');
```

Mục tiêu:
- backend không thể insert 2 blocking event overlap dù UI/AI bị race.
- `[start, end)` cho phép event sau bắt đầu đúng lúc event trước kết thúc.

Nếu recurrence sinh instance:
- instance phải qua cùng constraint.

## 7.7. Ownership immutability

Không cho user chuyển record sang owner khác.

Tạo trigger/function để:
- `user_id` set từ `auth.uid()` khi insert nếu null/default.
- không cho đổi `user_id` sau insert.

## 7.8. Updated-at trigger

Dùng helper chung:

```text
set_updated_at()
```

Gắn cho mutable tables.

## 7.9. Index

Index tối thiểu:

```text
(user_id)
(user_id, created_at)
(user_id, status)
(user_id, start_at)
(user_id, deadline)
(goal_id)
(monthly_plan_id)
(task_id)
(habit_id, log_date)
```

Không index vô tội vạ.

---

# 8. PHASE 5 — RLS HARDENING

## 8.1. Enable RLS

Mọi user-owned table:

```sql
ALTER TABLE ... ENABLE ROW LEVEL SECURITY;
```

## 8.2. Policy chuẩn

Select/update/delete:

```sql
USING (user_id = auth.uid())
```

Insert/update:

```sql
WITH CHECK (user_id = auth.uid())
```

`profiles`:

```text
profiles.id = auth.uid()
```

## 8.3. Không cho policy kiểu

```sql
USING (true)
```

trên dữ liệu private.

## 8.4. Test RLS

Luna phải test ít nhất:

```text
User A đọc record A → PASS
User A sửa record A → PASS
User A đọc record B → DENY
User A sửa record B → DENY
Anonymous đọc private table → DENY
Anonymous insert private table → DENY
```

Không chỉ đọc SQL bằng mắt.

## 8.5. Service/admin client

Chỉ dùng admin client khi thực sự cần.

User-facing Edge Functions:
- ưu tiên user JWT.
- query bằng context user để RLS vẫn chạy.
- không bypass RLS cho CRUD thường.

---

# 9. PHASE 6 — DATABASE RPC / ATOMIC LOGIC

## 9.1. `accept_ai_schedule_batch`

Tạo RPC/DB function atomic.

Input:

```text
batch_id
```

Flow:

1. Xác minh `auth.uid()`.
2. Lock batch.
3. Lock/serialize scheduling của user.
4. Verify batch = proposed, not expired.
5. Load all proposal rows.
6. Re-check ownership.
7. Re-check task status.
8. Re-check deadline.
9. Re-check conflicts.
10. Insert all calendar events trong transaction.
11. Mark proposals accepted.
12. Mark batch accepted.
13. Return created events.

Nếu 1 item fail:
- rollback toàn bộ batch.
- không half-accept.

Có thể dùng advisory transaction lock theo `auth.uid()` để tránh 2 approve đồng thời.

## 9.2. `complete_focus_session`

Atomic:

1. close session.
2. validate ended_at > started_at.
3. calculate duration server-side.
4. update task actual duration.
5. không tin `duration` do frontend tự gửi.

## 9.3. Progress calculation

Goal progress:

```text
Nếu có milestones:
weighted milestone completion
Nếu không:
manual_progress hoặc derived task/monthly metrics
```

Không để Angular tự quyết định source-of-truth.

---

# 10. PHASE 7 — ANGULAR DATA ACCESS

## 10.1. Supabase client

Tạo singleton:

```text
core/config/supabase.config.ts
data-access/supabase/supabase.client.ts
```

Frontend chỉ dùng:

```text
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
```

Không import secret.

## 10.2. Environment

`environment.ts` / build config chỉ chứa public values.

Không dùng Gemini key.

## 10.3. Repository layer

Không để component gọi Supabase lung tung.

Tạo:

```text
ProfileRepository
GoalRepository
MonthlyPlanRepository
TaskRepository
CalendarRepository
HabitRepository
FocusRepository
LearningRepository
ReviewRepository
AiRepository
```

Component → Feature service/store → Repository → Supabase.

## 10.4. DTO mapping

DB snake_case không phát tán khắp UI.

Có mapper rõ ràng:

```text
DbTask → Task
TaskFormValue → TaskInsert
```

---

# 11. PHASE 8 — AUTH + PROFILE + ONBOARDING

## 11.1. Auth screens

Implement:

- Login.
- Register nếu project cho phép signup.
- Forgot password.
- Reset password.
- Logout.
- Session restore.
- Auth loading state.

## 11.2. AuthGuard

Không flash protected page khi auth state chưa xác định.

State:

```text
initializing
authenticated
anonymous
```

## 11.3. Profile auto-create

Sau first auth:
- tạo profile nếu chưa có.
- id = auth.uid().
- timezone default từ browser nếu hợp lệ.

## 11.4. Onboarding

Flow:

```text
Timezone
→ Sleep schedule
→ Default work/study availability
→ Life areas
→ 1–3 long-term goals
→ Current month plan
→ Dashboard
```

Có:
- skip optional step.
- progress indicator.
- resume onboarding.

---

# 12. PHASE 9 — LIFE AREAS + GOALS + MILESTONES

## 12.1. Life Areas

CRUD:
- name.
- icon.
- description.
- semantic color key.
- priority.
- active/inactive.

Seed suggested values:
- Learning.
- Work.
- Cybersecurity.
- English.
- Health.
- Finance.
- Personal Projects.
- Skills.

Không hardcode chúng như enum; user được tạo mới.

## 12.2. Long-term Goals

CRUD đầy đủ.

Fields:
- title.
- description.
- why.
- life area.
- start date.
- target date.
- priority.
- status.
- success criteria.
- risks.
- notes.

Validation:
- target >= start.
- title required.
- priority 0–3.
- completed goal không tự động reopen nếu không confirm.

## 12.3. Milestone

- reorder.
- weight.
- due date.
- measurable result.
- status.

Weight:
- UI hiển thị tổng.
- backend normalize hoặc reject nếu tổng invalid theo rule đã chọn.
- nhất quán toàn app.

---

# 13. PHASE 10 — MONTHLY PLANNING + TASKS

## 13.1. Monthly Plan

Một user chỉ có 1 plan / year / month.

Actions:
- create.
- open.
- close.
- copy previous.
- carry over.
- reopen với confirm.

## 13.2. Monthly Goals

Có thể:
- link long-term goal.
- independent.
- set metric target.
- estimated hours.
- priority.

## 13.3. Task

Fields theo BD:

```text
title
description
goal
monthly_goal
life_area
priority
deadline
estimated_minutes
actual_minutes
difficulty
energy_required
status
is_splittable
min_session_minutes
max_session_minutes
```

## 13.4. Task rules

- `done` không được AI schedule.
- `cancelled` không được AI schedule.
- deadline quá khứ → overdue state.
- estimate không âm.
- `min_session <= max_session`.
- non-splittable task chỉ 1 study session.
- remaining duration = max(estimated - scheduled/completed, 0).

## 13.5. Task UI

Views:
- Today.
- Upcoming.
- Backlog.
- By goal.
- By life area.
- Overdue.

Không cần Kanban nếu không tạo giá trị rõ.

---

# 14. PHASE 11 — CALENDAR + FIXED COMMITMENTS

## 14.1. Calendar views

- Month.
- Week.
- Day.
- Agenda/List.

Week view là primary planning screen.

## 14.2. Event types

```text
fixed_commitment
study
work
personal
sleep
focus
break
other
```

Source:

```text
manual
ai
recurrence
system
```

## 14.3. Fixed event

Default:

```text
is_locked = true
is_flexible = false
blocks_time = true
```

AI không được move.

## 14.4. Create event

Flow:

```text
Select time
→ Fill form
→ Client validate
→ Backend insert
→ DB overlap constraint
→ Success / friendly conflict message
```

## 14.5. Conflict UI

Không show raw PostgreSQL exclusion error.

Map thành:

```text
"Khung giờ này đang trùng với một lịch bận khác."
```

Nếu có thể query conflicting event:
- show event name.
- start/end.
- suggest next free slots.

## 14.6. Recurrence

Support:
- daily.
- weekly.
- weekdays.
- monthly.
- until date.

Mô hình:
- `recurrence_rules` lưu rule.
- materialize instance theo planning horizon.
- generated event có parent/rule reference.
- edit this occurrence.
- edit future occurrences.
- delete this occurrence.
- delete series.

Không generate vô hạn.

Planning horizon mặc định:
- current month ± 1 month.
- extend when user opens future month.

---

# 15. PHASE 12 — DETERMINISTIC SCHEDULER ENGINE

Tạo shared backend module:

```text
supabase/functions/_shared/scheduler/
├── types.ts
├── intervals.ts
├── availability.ts
├── split-task.ts
├── candidates.ts
├── validation.ts
└── scoring.ts
```

## 15.1. Interval representation

Luôn dùng:

```text
[start, end)
```

Conflict:

```text
A.start < B.end AND A.end > B.start
```

## 15.2. Input

- timezone.
- date range.
- sleep/unavailable windows.
- fixed commitments.
- locked events.
- flexible events.
- incomplete tasks.
- deadline.
- remaining minutes.
- priority.
- energy requirement.
- preferred time.
- max daily study.
- break policy.

## 15.3. Generate availability

Algorithm:

1. Generate allowed working windows.
2. Subtract sleep.
3. Subtract fixed commitments.
4. Subtract existing blocking calendar events.
5. Subtract required breaks.
6. Normalize intervals.
7. Discard intervals shorter than minimum session.

## 15.4. Split tasks

Splittable task:
- split theo min/max session.
- không tạo fragment vô lý.
- ưu tiên session 45–90 phút nếu preference không override.

Non-splittable:
- cần 1 slot đủ dài.

## 15.5. Candidate slots

Scheduler tạo candidate IDs:

```json
{
  "candidate_id": "uuid",
  "task_id": "uuid",
  "start_at": "...",
  "end_at": "...",
  "score_inputs": {
    "deadline": 0.9,
    "energy_fit": 0.8,
    "preference_fit": 0.7
  }
}
```

Gemini chỉ được trả `candidate_id`, không được tạo arbitrary timestamp nếu mode candidate-based.

---

# 16. PHASE 13 — GEMINI + EDGE FUNCTIONS

## 16.1. Model

Production default:

```text
gemini-3.8-flash
```

Lưu model name trong server config/secret:

```text
GEMINI_MODEL
```

Nếu không set:
- fallback stable model đã kiểm chứng trong code.

## 16.2. Gemini secret

Dùng credential Gemini từ secure task context.

Không viết key vào file committed.

Set production secret:

```bash
npx supabase secrets set GEMINI_API_KEY="$GEMINI_API_KEY" \
  --project-ref qphzagsrntgjktnqiyaz
```

Set model:

```bash
npx supabase secrets set GEMINI_MODEL="gemini-3.8-flash" \
  --project-ref qphzagsrntgjktnqiyaz
```

Verify name only:

```bash
npx supabase secrets list --project-ref qphzagsrntgjktnqiyaz
```

Không log value.

## 16.3. Không cần custom-set Supabase secret key

Hosted Supabase Functions có Supabase environment riêng.

Code không hardcode `sb_secret_...`.

Ưu tiên Supabase server integration/context hiện hành thay vì tự copy admin key vào source.

## 16.4. Functions

Tạo:

```text
ai-schedule
accept-ai-schedule
ai-breakdown-goal
ai-review
ai-reschedule
```

Có thể chuyển `accept-ai-schedule` thành thin Edge Function gọi atomic RPC.

## 16.5. Auth

Tất cả function ở trên là authenticated-user endpoint.

- yêu cầu user JWT.
- không public `verify_jwt=false` vô lý.
- không trust `user_id` từ request body.
- user id lấy từ verified auth context.

## 16.6. `_shared`

```text
supabase/functions/_shared/
├── auth/
├── cors.ts
├── errors.ts
├── responses.ts
├── schemas/
├── gemini/
├── scheduler/
└── supabase/
```

## 16.7. `ai-schedule`

### Request

Chỉ cần parameters user được phép chọn:

```json
{
  "range_start": "...",
  "range_end": "...",
  "task_ids": ["uuid"],
  "mode": "balanced"
}
```

Không nhận arbitrary owner/user id.

### Backend flow

```text
Verify user JWT
→ Validate request Zod
→ Load profile/preferences
→ Load selected tasks by auth user
→ Load calendar constraints
→ Generate candidate slots deterministically
→ Build minimal AI context
→ Gemini structured output
→ Zod validate output
→ Verify every candidate ID existed
→ Re-check task ownership/status/deadline
→ Re-check conflicts
→ Save ai_request
→ Save proposal batch + items
→ Return preview
```

### Gemini output

```json
{
  "summary": "string",
  "assignments": [
    {
      "task_id": "uuid",
      "candidate_id": "uuid",
      "reason": "string",
      "confidence": 0.92
    }
  ],
  "warnings": []
}
```

Không yêu cầu AI trả raw timestamps nếu candidate-based mode dùng được.

## 16.8. `accept-ai-schedule`

Flow:

```text
JWT
→ Zod
→ Call atomic RPC
→ Return created events
```

Backend revalidates everything.

## 16.9. `ai-breakdown-goal`

AI output chỉ là proposals:

```text
milestones
monthly goals
tasks
```

Không insert trực tiếp.

UI:
- checkbox chọn proposal.
- edit before accept.
- approve.

## 16.10. `ai-review`

Backend tính:
- planned time.
- actual focus time.
- completion.
- overdue.
- habit ratio.
- productive periods.

Chỉ gửi aggregate + user notes cho Gemini.

Gemini không tự tính số liệu source-of-truth.

## 16.11. `ai-reschedule`

Chỉ xét:

```text
is_flexible = true
OR source = 'ai'
```

Không move:
- fixed.
- locked.
- sleep.
- manually locked.

## 16.12. Rate limiting

Dùng `ai_requests` để enforce per-user.

Default gợi ý:
- schedule: 10 requests / 10 min.
- breakdown: 10 / 10 min.
- review: 10 / 30 min.

Không cần quá phức tạp nhưng phải server-side.

## 16.13. AI resilience

- Timeout.
- limited retry.
- parse failure retry tối đa 1.
- structured output.
- no infinite retry.
- fallback message.
- no DB corruption.
- manual scheduler luôn usable khi AI down.

---

# 17. PHASE 14 — DEPLOY + TEST EDGE FUNCTIONS

## 17.1. Local function tests

Nếu local Supabase/Docker available:

```bash
npx supabase start
npx supabase functions serve --env-file <temporary-local-env>
```

Nếu Docker không available:
- test pure modules bằng unit tests.
- dùng API-based deployment.
- smoke test function remote sau deploy.

## 17.2. Deploy migrations

Trước:

```bash
npx supabase migration list
```

Sau đó:

```bash
npx supabase db push
```

Nếu fail:
- đọc exact migration.
- fix forward migration.
- không sửa production history tùy tiện nếu migration đã applied.

## 17.3. Deploy all functions

```bash
npx supabase functions deploy --project-ref qphzagsrntgjktnqiyaz
```

CLI hiện hành có thể deploy API-based nếu Docker không có.

## 17.4. Verify

```bash
npx supabase functions list --project-ref qphzagsrntgjktnqiyaz
npx supabase secrets list --project-ref qphzagsrntgjktnqiyaz
```

Function smoke test phải cover:
- no token → 401.
- valid token + invalid payload → 400.
- valid request → 200.
- foreign task id → denied/not found.
- Gemini error → controlled AI error.
- accept stale/conflicting proposal → rejected.
- valid proposal → event inserted.

---

# 18. PHASE 15 — HABITS + FOCUS

## 18.1. Habit

CRUD:
- title.
- frequency.
- target count.
- target minutes.
- preferred time.
- start/end.
- active.

## 18.2. Habit Log

- one row per habit/day.
- idempotent toggle/update.
- streak derived.
- timezone aware.

## 18.3. Focus Timer

Modes:
- 25/5.
- 50/10.
- custom.

Lifecycle:

```text
idle
running
paused
completed
cancelled
```

Server records trustworthy timestamps.

UI timer may use client clock for display but final duration must be verified from session timestamps.

---

# 19. PHASE 16 — LEARNING ROADMAP + RESOURCES

## 19.1. Roadmaps

CRUD.

Roadmap nodes:
- title.
- description.
- status.
- prerequisite.
- estimated hours.
- level.
- order.

## 19.2. Prerequisite logic

Không hard-block learning nếu user muốn override, nhưng:
- warn if prerequisite incomplete.

## 19.3. Resources

Support:
- link.
- book.
- course.
- video.
- repo.
- note.

Link to:
- goal.
- task.
- roadmap node.

Validate URL.

---

# 20. PHASE 17 — DASHBOARD

Dashboard chỉ hiển thị thông tin giúp hành động.

## 20.1. Sections

Theo thứ tự:

1. Next Action.
2. Today Timeline.
3. Overdue / At Risk.
4. Today Focus Goal.
5. Habit status.
6. Active monthly goals.
7. Long-term progress.
8. AI insight tối đa 1–3 cards.

## 20.2. Primary CTA

```text
BẮT ĐẦU VIỆC TIẾP THEO
```

Nếu không có task:
- CTA lập kế hoạch hoặc chọn backlog.

---

# 21. PHASE 18 — WEEKLY / MONTHLY REVIEW

## 21.1. Weekly review

Backend-derived metrics:
- planned tasks.
- completed tasks.
- planned minutes.
- focus minutes.
- overdue.
- habit completion.
- schedule changes.

User input:
- what worked.
- what failed.
- notes.
- adjustment.

AI:
- summary.
- pattern.
- recommendation.

## 21.2. Monthly review

- goal completion.
- planned vs actual hours.
- carry-over.
- habit consistency.
- planning accuracy.
- productive day/time.
- bottleneck.
- next month recommendations.

## 21.3. Close month

Transaction:

```text
Finalize review
→ mark monthly plan closed
→ choose carry-over
→ create next plan if requested
```

Không duplicate carry-over task khi action retry.

---

# 22. PHASE 19 — ANALYTICS

Metrics:

```text
goal_completion
monthly_completion
planned_minutes
actual_focus_minutes
planning_accuracy
habit_consistency
task_completion
overdue_rate
deep_work_minutes
ai_acceptance_rate
```

## 22.1. Rule

Metric definitions phải ở một chỗ.

Không tính cùng metric bằng nhiều formula khác nhau giữa dashboard và analytics.

## 22.2. Views

Nếu dùng PostgreSQL view:
- phải đảm bảo RLS/security behavior đúng.
- ưu tiên security-invoker semantics hoặc RPC authenticated.
- không tạo view vô tình bypass RLS.

---

# 23. PHASE 20 — AI COACH

Không làm chatbot vô định.

Actions:

```text
Phân tích tháng này
Lập kế hoạch tuần
Tôi đang quá tải?
Tôi nên ưu tiên gì?
Chia nhỏ mục tiêu
Sắp xếp lại lịch
Đánh giá tiến độ
```

Mỗi action:
- có typed request.
- chỉ query data cần thiết.
- có structured output.
- có error state.
- không gửi toàn DB.

---

# 24. PHASE 21 — ERROR MODEL

Tạo common error codes:

```text
AUTH_ERROR
FORBIDDEN
NOT_FOUND
VALIDATION_ERROR
CONFLICT_ERROR
RATE_LIMIT
AI_ERROR
NETWORK_ERROR
SERVER_ERROR
```

UI:
- không show raw SQL.
- không show stack trace.
- không show Gemini response raw nếu chứa system prompt/context.

Logging:
- log request id.
- user id có thể log dạng UUID server-side nếu cần.
- không log secret.
- không log full auth token.

---

# 25. PHASE 22 — TIMEZONE

DB:
- mọi instant dùng `timestamptz`.

Frontend:
- display theo `profiles.timezone`.

Calendar:
- timezone aware.

AI:
- prompt phải nói timezone rõ.
- candidate timestamp phải ISO-8601.

Không lưu:

```text
"2026-09-11 19:00"
```

mà không có timezone semantics.

---

# 26. PHASE 23 — SECURITY HARDENING

## 26.1. Frontend

- Không secret.
- Sanitize display.
- không `innerHTML` với AI output.
- external links `rel="noopener noreferrer"`.
- auth state cleanup on logout.
- không lưu access token custom nếu Supabase SDK đã quản lý.

## 26.2. Database

- RLS all private tables.
- FK.
- constraints.
- overlap exclusion.
- atomic approval RPC.
- ownership.
- least privilege.

## 26.3. Edge

- authenticated.
- Zod input validation.
- body size reasonable.
- rate limit.
- timeout.
- CORS restricted phù hợp.
- no secret logs.

## 26.4. Dependency scan

Chạy:

```bash
npm audit --omit=dev
npm outdated || true
```

Không upgrade major tùy tiện ngay trước deploy.

Nếu high/critical production vulnerability:
- fix trước deploy.

## 26.5. Secret scan

Trước commit cuối:

```bash
git grep -nE 'sb_secret_|SUPABASE_SECRET_KEY|GEMINI_API_KEY|SUPABASE_ACCESS_TOKEN|SUPABASE_DB_PASSWORD' || true
```

Expected:
- chỉ có placeholder/documentation names.
- không có credential value.

Kiểm tra build artifact:

```bash
grep -R -nE 'sb_secret_|GEMINI_API_KEY|SUPABASE_SECRET_KEY' dist/ || true
```

Expected:
- zero secret values.

---

# 27. PHASE 24 — TEST PLAN

## 27.1. Unit

Test:

- interval overlap.
- availability subtraction.
- task splitting.
- candidate generation.
- deadline.
- duration.
- progress.
- streak.
- time zone conversion.
- form validators.
- DTO mappers.

## 27.2. Scheduler boundary tests

Bắt buộc:

```text
A ends exactly when B starts → no conflict
A starts exactly when B ends → no conflict
A inside B → conflict
B inside A → conflict
same interval → conflict
cross midnight → correct
deadline boundary → correct
DST timezone → no silent corruption
```

## 27.3. Auth/RLS tests

Bắt buộc:
- anonymous denied.
- own data allowed.
- other user data denied.

## 27.4. AI parser

Test:
- valid output.
- malformed JSON.
- unknown task id.
- unknown candidate id.
- duplicate candidate.
- overlap.
- duration mismatch.
- confidence out of bounds.
- Gemini timeout.

## 27.5. Angular

```bash
npm run build
ng test --watch=false
```

Nếu project script khác, dùng script thực tế.

## 27.6. Playwright smoke

Scenarios:

```text
login
dashboard load
create goal
create monthly goal
create task
create fixed event
reject overlap
open AI scheduler
preview proposal
approve proposal
calendar contains event
habit toggle
focus start/stop
logout
```

Nếu production auth automation cần test credentials:
- tạo temporary test account securely.
- delete after test.
- không commit test password.

---

# 28. PHASE 25 — QUALITY GATE

Không được chuyển sang deployment nếu bất kỳ gate nào fail.

## Gate A — Compile

```bash
npm run build
```

PASS.

## Gate B — Tests

Unit PASS.

Critical integration tests PASS.

## Gate C — Database

Migration apply PASS.

No invalid RLS.

## Gate D — Edge

Functions deploy PASS.

Smoke PASS.

## Gate E — Security

No secret in source/history/build artifact.

## Gate F — UX

Check responsive:
- 360px.
- 768px.
- 1024px.
- desktop >= 1440px.

## Gate G — Runtime

Browser console:
- no uncaught exception.
- no repeated 401 loop.
- no hydration error because app is CSR.
- no missing chunk/assets.

---

# 29. PHASE 26 — GITHUB PAGES STRATEGY

## 29.1. Clean routes

Ưu tiên PathLocationStrategy.

Không bắt buộc hash route.

GitHub Pages không có server rewrite, vì vậy build artifact phải có:

```text
index.html
404.html
```

Sau build:

```bash
cp dist/<project>/browser/index.html dist/<project>/browser/404.html
```

Khi deep-link bị Pages trả custom 404, Angular vẫn bootstrap và Router xử lý route.

## 29.2. Dynamic base href

Nếu repo:

```text
varethon-ascend
```

base href:

```text
/varethon-ascend/
```

Nếu repo là:

```text
<username>.github.io
```

base href:

```text
/
```

Workflow phải tự detect repo name.

## 29.3. Build path

Với Angular application builder mặc định:

```text
dist/<project-name>/browser
```

Workflow phải verify path tồn tại trước upload.

---

# 30. PHASE 27 — GITHUB ACTIONS

Tạo:

```text
.github/workflows/pages.yml
```

Workflow phải:

1. Checkout.
2. Setup Node.
3. `npm ci`.
4. Test.
5. Determine base href.
6. Production build.
7. Copy `index.html` → `404.html`.
8. Configure Pages.
9. Upload artifact.
10. Deploy Pages.

Skeleton logic:

```yaml
name: Build and Deploy Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6

      - uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'
          cache: npm

      - run: npm ci

      - run: npm test -- --watch=false

      - name: Resolve base href
        id: base
        shell: bash
        run: |
          REPO="${GITHUB_REPOSITORY#*/}"
          if [[ "$REPO" == *.github.io ]]; then
            echo "href=/" >> "$GITHUB_OUTPUT"
          else
            echo "href=/$REPO/" >> "$GITHUB_OUTPUT"
          fi

      - name: Build
        run: npm run build -- --base-href "${{ steps.base.outputs.href }}"

      - name: SPA fallback
        shell: bash
        run: |
          BUILD_DIR="dist/varethon-ascend/browser"
          test -f "$BUILD_DIR/index.html"
          cp "$BUILD_DIR/index.html" "$BUILD_DIR/404.html"

      - uses: actions/configure-pages@v5

      - uses: actions/upload-pages-artifact@v4
        with:
          path: dist/varethon-ascend/browser

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy
        id: deployment
        uses: actions/deploy-pages@v4
```

Luna phải điều chỉnh `dist/...` theo actual Angular project name, không copy mù.

## 30.1. GitHub Pages source

Repository Settings → Pages phải dùng:

```text
Source: GitHub Actions
```

Nếu có thể cấu hình bằng GitHub API/CLI thì tự cấu hình.

Nếu Pages tự nhận deployment workflow thì verify qua Actions/API.

---

# 31. PHASE 28 — CREATE/PUSH GITHUB REPOSITORY

## 31.1. Verify GitHub auth

```bash
gh auth status
```

## 31.2. Git hygiene

Trước commit:

```bash
git status
git diff --check
git grep -nE 'sb_secret_|SUPABASE_SECRET_KEY|GEMINI_API_KEY|SUPABASE_ACCESS_TOKEN|SUPABASE_DB_PASSWORD' || true
```

## 31.3. Commit

Suggested commits theo phase:

```text
chore: bootstrap Angular application
feat: add Supabase schema and RLS
feat: implement auth and onboarding
feat: implement goals monthly plans and tasks
feat: implement calendar and scheduling engine
feat: implement Gemini planning functions
feat: add habits focus and learning modules
feat: add reviews analytics and AI coach
test: add critical scheduling and security coverage
ci: deploy Angular app to GitHub Pages
```

Nếu Luna đã thực hiện theo worktree nhỏ:
- commit theo phase.
- không squash bắt buộc.

## 31.4. Create repo nếu chưa có

Nếu user/org context cho phép:

```bash
gh repo create varethon-ascend \
  --public \
  --source=. \
  --remote=origin
```

Nếu `origin` đã có:
- không create duplicate.
- inspect `git remote -v`.

## 31.5. Push

```bash
git branch -M main
git push -u origin main
```

---

# 32. PHASE 29 — PRODUCTION VERIFICATION

Sau push:

## 32.1. GitHub Actions

```bash
gh run list --limit 10
```

Watch latest:

```bash
gh run watch
```

Nếu fail:
1. `gh run view --log-failed`
2. sửa code/workflow.
3. commit.
4. push.
5. watch lại.
6. lặp đến PASS.

Không báo user tự vào sửa Action.

## 32.2. Pages URL

Lấy actual URL từ deployment output/GitHub Pages.

HTTP checks:

```text
GET /
GET /<repo>/
GET /<repo>/app/dashboard
```

Deep link phải bootstrap Angular.

## 32.3. Browser smoke

Test production thật:

- page load.
- no missing assets.
- login.
- route navigation.
- reload protected deep-link.
- create/read/update/delete.
- mobile width.
- dark/light if implemented.
- Edge Function call.
- AI scheduler.
- approve schedule.
- refresh calendar.

---

# 33. SELF-HEALING LOOP

Bất kỳ command nào fail:

```text
Run
 ↓
Capture stderr/log
 ↓
Identify root cause
 ↓
Apply smallest correct fix
 ↓
Run focused test
 ↓
Run full gate
 ↓
Continue
```

Không:

```text
Fail → ignore → deploy
```

## 33.1. Dependency failure

- đọc peer requirements.
- dùng compatible current version.
- không dùng `--force` trước khi hiểu root cause.
- không downgrade Angular 22 trừ khi có lý do cực mạnh.

## 33.2. Migration failure

- xác định migration nào.
- kiểm tra remote state.
- fix forward.
- tránh destructive reset.

## 33.3. Function deploy failure

- run type/format check.
- inspect imports.
- inspect auth configuration.
- deploy individual function để isolate.
- test remote.

## 33.4. GitHub Pages asset 404

Check:
- `<base href>`.
- workflow base path.
- output directory.
- asset URLs.
- 404.html.
- case-sensitive paths.

## 33.5. Angular route refresh 404

Check:
- 404.html copied.
- base href.
- Pages artifact contains 404.html.
- route is client route, not missing static asset.

---

# 34. DEFINITION OF DONE BY FEATURE

## Auth

- [ ] Login works.
- [ ] Logout works.
- [ ] Session restore works.
- [ ] Protected routes protected.
- [ ] Forgot/reset works.
- [ ] Profile created.

## Goals

- [ ] CRUD.
- [ ] Milestones.
- [ ] Progress.
- [ ] Validation.
- [ ] RLS.

## Monthly Planning

- [ ] One plan/month.
- [ ] Monthly goals.
- [ ] Carry-over.
- [ ] Close/reopen rules.

## Tasks

- [ ] CRUD.
- [ ] Priority/deadline.
- [ ] Status.
- [ ] Estimates.
- [ ] Filter.
- [ ] Overdue.
- [ ] Scheduling metadata.

## Calendar

- [ ] Month.
- [ ] Week.
- [ ] Day.
- [ ] Agenda.
- [ ] Fixed commitments.
- [ ] Recurrence.
- [ ] Conflict backend.
- [ ] Friendly error UI.

## AI Scheduler

- [ ] Gemini server-side only.
- [ ] Structured output.
- [ ] Candidate-slot mode.
- [ ] Preview.
- [ ] Approve transaction.
- [ ] Double conflict check.
- [ ] No direct AI insertion.
- [ ] Rate limit.
- [ ] Error fallback.

## Habits

- [ ] CRUD.
- [ ] Daily logs.
- [ ] Streak.
- [ ] Completion stats.

## Focus

- [ ] Start.
- [ ] Pause.
- [ ] Resume.
- [ ] Stop.
- [ ] Server-trusted duration.
- [ ] Task actual time update.

## Learning

- [ ] Roadmap.
- [ ] Nodes.
- [ ] Prerequisites.
- [ ] Resources.

## Review

- [ ] Weekly.
- [ ] Monthly.
- [ ] Backend metrics.
- [ ] AI narrative.
- [ ] Carry-over.

## Analytics

- [ ] Consistent metric formulas.
- [ ] User isolated.
- [ ] Responsive.

## Deployment

- [ ] Supabase linked.
- [ ] Migrations applied.
- [ ] Functions live.
- [ ] Gemini secret live.
- [ ] GitHub repo pushed.
- [ ] GitHub Action PASS.
- [ ] GitHub Pages online.
- [ ] Deep links work.

---

# 35. FINAL SECURITY CHECKLIST

Luna phải chạy checklist cuối:

- [ ] No Gemini key in source.
- [ ] No Supabase secret key in source.
- [ ] No DB password in source.
- [ ] No access token in source.
- [ ] No secret in `dist/`.
- [ ] `.env*` ignored.
- [ ] RLS enabled.
- [ ] No private `USING (true)` policy.
- [ ] User ownership tested.
- [ ] Edge Functions require auth.
- [ ] AI output validated.
- [ ] Calendar DB conflict enforced.
- [ ] Atomic AI accept.
- [ ] No raw SQL errors in UI.
- [ ] No console uncaught errors.
- [ ] Production dependency critical vulnerability = 0 known.
- [ ] GitHub Action green.
- [ ] Pages live.

---

# 36. ACCEPTANCE TEST — END-TO-END USER JOURNEY

Luna phải tự chạy hoặc mô phỏng/test đầy đủ flow này:

```text
1. User opens GitHub Pages.
2. Login.
3. Onboarding.
4. Create Life Area: Cybersecurity.
5. Create long-term goal.
6. Add milestone.
7. Create current Monthly Plan.
8. Create Monthly Goal.
9. Create 3 Tasks.
10. Add fixed busy calendar event.
11. Attempt overlapping manual event → rejected.
12. Open AI Smart Scheduler.
13. Generate proposal.
14. Verify AI did not write calendar directly.
15. Review proposal.
16. Approve proposal.
17. Verify events appear.
18. Add unexpected fixed event.
19. Run AI reschedule.
20. Verify locked events unchanged.
21. Complete one task/focus session.
22. Toggle habit.
23. Open dashboard.
24. Verify derived metrics.
25. Open weekly review.
26. Generate AI review.
27. Refresh current deep URL.
28. Verify app still loads on GitHub Pages.
29. Logout.
30. Verify protected page redirects to login.
```

Nếu bất kỳ step nào fail:
- fix.
- rerun từ relevant step.
- rerun critical smoke before completion.

---

# 37. LUNA FINAL RESPONSE CONTRACT

Khi đã hoàn thành, **không paste code dài vào chat**.

Chỉ trả:

```markdown
# VARETHON ASCEND — DEPLOYED

- GitHub: <repository-url>
- GitHub Pages: <live-url>
- Branch: main
- Commit: <sha>
- Angular build: PASS
- GitHub Actions: PASS
- Supabase migrations: DEPLOYED
- Edge Functions: DEPLOYED
- Production smoke test: PASS
```

Nếu có external-auth blocker thật sự:
- ghi đúng blocker.
- liệt kê những phần đã hoàn tất.
- không tuyên bố deploy thành công.

---

# 38. IMPLEMENTATION PRIORITY

Nếu cần tối ưu thứ tự để giảm bug:

```text
P0
Auth
RLS
Goals
Monthly Plan
Tasks
Calendar
Conflict Engine
AI Scheduler
GitHub Pages

P1
Habits
Focus
Reviews
Dashboard
Analytics

P2
Learning Roadmap
Resources
AI Coach enhancements
UI polish
```

Tuy nhiên bản final phải hoàn thiện toàn bộ scope trong BD trừ chức năng được BD ghi rõ là future/optional.

---

# 39. COMMAND SEQUENCE — REFERENCE ONLY

Luna phải điều chỉnh theo state thực tế, không copy mù:

```bash
# Tooling / project
node --version
npm --version
gh auth status

# Angular
npm install
npm run build

# Supabase
npx supabase --version
npx supabase projects list
npx supabase login                  # only if needed
npx supabase init                   # only if needed
npx supabase link --project-ref qphzagsrntgjktnqiyaz

# Inspect
npx supabase migration list
npx supabase functions list --project-ref qphzagsrntgjktnqiyaz

# Database
npx supabase db push

# Secrets — values come from secure runtime/task context
npx supabase secrets set GEMINI_API_KEY="$GEMINI_API_KEY" \
  --project-ref qphzagsrntgjktnqiyaz
npx supabase secrets set GEMINI_MODEL="gemini-3.8-flash" \
  --project-ref qphzagsrntgjktnqiyaz

# Edge Functions
npx supabase functions deploy --project-ref qphzagsrntgjktnqiyaz
npx supabase functions list --project-ref qphzagsrntgjktnqiyaz

# Quality
npm test -- --watch=false
npm run build
npm audit --omit=dev

# Git
git status
git diff --check
git add .
git commit -m "feat: build VARETHON ASCEND personal development platform"

# Repo if missing
gh repo create varethon-ascend --public --source=. --remote=origin

# Push
git branch -M main
git push -u origin main

# CI
gh run list --limit 10
gh run watch
```

---

# 40. IMPORTANT NOTES FOR LUNA

1. `VARETHON_ASCEND_BD.md` là nguồn nghiệp vụ chính.
2. Tài liệu này là nguồn execution/order-of-work chính.
3. Nếu BD và implementation plan khác nhau:
   - Business rule → BD thắng.
   - Security/deployment hardening → plan này thắng nếu không làm thay đổi nghiệp vụ.
4. Không đưa AI key vào Angular.
5. Không dùng secret key trong GitHub Pages.
6. Supabase RLS là security boundary chính của browser client.
7. Gemini là untrusted planner; deterministic backend là authority.
8. Database constraint/RPC là authority cho conflict và atomic mutation.
9. GitHub Pages chỉ nhận static Angular build.
10. Final output của Luna chỉ cần GitHub URL + Pages URL + trạng thái PASS.

---

# 41. VERIFIED PLATFORM ASSUMPTIONS — 11/09/2026

Plan này dựa trên behavior hiện hành:

- Angular 22 đang active; Angular 22 hỗ trợ Node 22.22.3+, 24.15+ hoặc 26.
- Angular application builder production output mặc định nằm dưới `dist/<project>/browser`.
- `ng build --base-href` hỗ trợ deploy dưới GitHub project subpath.
- Supabase CLI hỗ trợ `login`, `link`, `db push`, `functions deploy`, `secrets set`.
- Supabase Edge Functions production được cấp các Supabase environment variables mặc định.
- Supabase publishable key dành cho public client khi RLS được cấu hình đúng.
- Supabase secret key chỉ dành cho trusted backend và bypass RLS.
- GitHub Pages custom workflow dùng `configure-pages`, `upload-pages-artifact`, `deploy-pages`.
- Gemini 3.8 Flash là stable model và hỗ trợ structured outputs.

Tài liệu chính thức:
- Angular versions: https://angular.dev/reference/versions
- Angular build: https://angular.dev/cli/build
- Angular deployment: https://angular.dev/tools/cli/deployment
- Supabase CLI: https://supabase.com/docs/reference/cli
- Supabase Edge Functions deploy: https://supabase.com/docs/guides/functions/deploy
- Supabase secrets: https://supabase.com/docs/guides/functions/secrets
- Supabase function auth: https://supabase.com/docs/guides/functions/auth
- GitHub Pages custom workflows: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
- Gemini models: https://ai.google.dev/gemini-api/docs/models
- Gemini structured output: https://ai.google.dev/gemini-api/docs/structured-output

# BUSINESS DESIGN (BD) — VARETHON ASCEND
## Nền tảng học tập, lập kế hoạch và phát triển bản thân

**Phiên bản:** 1.0  
**Mục tiêu triển khai:** Angular + Supabase + Gemini AI + GitHub Pages  
**Đối tượng sử dụng ban đầu:** Single-user, nhưng kiến trúc sẵn sàng mở rộng multi-user  
**Triết lý:** Goal-driven → Plan-driven → Schedule-driven → Review-driven

---

# 1. TỔNG QUAN DỰ ÁN

## 1.1. Mục tiêu

VARETHON ASCEND là hệ thống cá nhân giúp người dùng biến mục tiêu dài hạn thành kế hoạch tháng, nhiệm vụ cụ thể và lịch học/làm việc thực tế.

Hệ thống giải quyết 5 vấn đề chính:

1. Người dùng có mục tiêu nhưng không chia nhỏ được thành kế hoạch khả thi.
2. Lịch bận cố định và lịch học thường bị xung đột.
3. Người dùng khó biết nên ưu tiên việc gì trước.
4. Kế hoạch thường được lập nhưng thiếu cơ chế theo dõi và review.
5. AI thường đưa lịch "đẹp trên giấy" nhưng không kiểm tra ràng buộc thực tế.

Hệ thống phải tạo thành vòng lặp:

```text
TẦM NHÌN / MỤC TIÊU DÀI HẠN
            ↓
       MỤC TIÊU THÁNG
            ↓
   MILESTONE / TASK / HABIT
            ↓
      LỊCH THỰC THI
            ↓
     THEO DÕI TIẾN ĐỘ
            ↓
      WEEKLY REVIEW
            ↓
      MONTHLY REVIEW
            ↓
       ĐIỀU CHỈNH
```

---

# 2. NGUYÊN TẮC THIẾT KẾ

## 2.1. Các nguyên tắc bắt buộc

- Không để AI tự ghi lịch trực tiếp mà chưa qua validation.
- Không được phép tạo 2 lịch trùng thời gian nếu cả hai là `busy/locked`.
- Lịch bận cố định luôn có mức ưu tiên cao nhất.
- Người dùng luôn có quyền sửa/khóa/xóa đề xuất AI.
- Mọi dữ liệu cá nhân phải bị cô lập theo `auth.uid()`.
- Tất cả bảng dữ liệu người dùng phải bật Row Level Security.
- Gemini API key và Supabase secret key chỉ tồn tại server-side.
- Angular không được chứa secret key.
- Tất cả logic quan trọng phải có validation ở DB/Edge Function, không chỉ ở UI.
- Mọi thao tác phá hủy dữ liệu phải có confirm hoặc soft-delete phù hợp.
- Mobile responsive là yêu cầu bắt buộc.
- Các thao tác chính phải hoàn thành trong tối đa 2–3 bước.
- Không cho AI "bịa" task, deadline hoặc lịch bận mà người dùng chưa xác nhận.

---

# 3. CÔNG NGHỆ

## 3.1. Frontend

- Angular
- TypeScript strict mode
- Angular Standalone Components
- Angular Router
- Angular Signals cho local/application state
- Reactive Forms
- SCSS
- Angular CDK nếu cần dialog/overlay/accessibility
- `@supabase/supabase-js`

Khuyến nghị:

```text
Angular
├── Core
├── Shared
├── Features
├── Data Access
└── UI
```

Không dùng state management phức tạp như NgRx ở phiên bản đầu trừ khi thật sự cần.

---

## 3.2. Backend

Supabase:

- PostgreSQL
- Supabase Auth
- Row Level Security
- Edge Functions
- Realtime (chỉ bật cho bảng thực sự cần)
- Database Functions / RPC
- Cron nếu sau này cần tổng hợp tự động
- Storage nếu bổ sung tài liệu/ảnh

---

## 3.3. AI

Gemini API chỉ được gọi từ:

```text
Angular
   ↓ JWT
Supabase Edge Function
   ↓ GEMINI_API_KEY
Gemini
```

Không được:

```text
Angular → Gemini trực tiếp
```

Gemini dùng cho:

- Phân rã mục tiêu.
- Tạo đề xuất mục tiêu tháng.
- Lập lịch học.
- Điều chỉnh lịch khi có sự kiện mới.
- Review tuần/tháng.
- Phân tích overload.
- Gợi ý ưu tiên.
- Tóm tắt tiến độ.
- AI Coach.

AI chỉ trả về structured JSON, sau đó backend validate trước khi gửi cho Angular.

---

# 4. QUẢN LÝ SECRET

## 4.1. Frontend được phép có

```ts
export const environment = {
  production: true,
  supabaseUrl: '<SUPABASE_URL>',
  supabasePublishableKey: '<SUPABASE_PUBLISHABLE_KEY>'
};
```

Publishable key chỉ an toàn khi RLS được cấu hình đúng.

## 4.2. Không được commit

```text
SUPABASE_SECRET_KEY
GEMINI_API_KEY
DATABASE_PASSWORD
PROJECT_PASSWORD
```

Chúng phải được lưu bằng Supabase Secrets / server-side environment variables.

## 4.3. Các secret đã từng xuất hiện trong hội thoại/repository

Trước production phải:

1. Rotate Gemini API key.
2. Rotate Supabase secret key.
3. Đổi mật khẩu database/project nếu đó là credential thật.
4. Kiểm tra Git history.
5. Không commit `.env`.
6. Kiểm tra GitHub secret scanning.

---

# 5. KIẾN TRÚC TỔNG THỂ

```text
┌──────────────────────────────┐
│        GitHub Pages          │
│       Angular SPA            │
└──────────────┬───────────────┘
               │
               │ Publishable Key + User JWT
               ▼
┌──────────────────────────────┐
│          Supabase            │
│                              │
│ Auth                         │
│ PostgreSQL + RLS             │
│ RPC / Functions              │
│ Edge Functions               │
└──────────────┬───────────────┘
               │ Server Secret
               ▼
┌──────────────────────────────┐
│          Gemini API          │
└──────────────────────────────┘
```

---

# 6. KIẾN TRÚC ANGULAR

```text
src/app/
├── core/
│   ├── auth/
│   ├── guards/
│   ├── interceptors/
│   ├── layout/
│   ├── config/
│   └── services/
│
├── shared/
│   ├── components/
│   ├── directives/
│   ├── pipes/
│   ├── models/
│   ├── utils/
│   └── validators/
│
├── features/
│   ├── auth/
│   ├── dashboard/
│   ├── vision/
│   ├── goals/
│   ├── monthly-plan/
│   ├── tasks/
│   ├── calendar/
│   ├── habits/
│   ├── focus/
│   ├── learning/
│   ├── reviews/
│   ├── analytics/
│   ├── ai-coach/
│   └── settings/
│
├── data-access/
│   ├── supabase/
│   ├── repositories/
│   └── dto/
│
├── app.routes.ts
└── app.config.ts
```

Mỗi feature nên chứa:

```text
feature/
├── pages/
├── components/
├── services/
├── models/
└── feature.routes.ts
```

---

# 7. CÁC MODULE CHỨC NĂNG

# 7.1. Authentication & Profile

## Chức năng

- Đăng nhập.
- Đăng xuất.
- Quên mật khẩu.
- Session restore.
- Hồ sơ cá nhân.
- Timezone.
- Khung giờ làm việc mặc định.
- Ngày bắt đầu tuần.
- Thời lượng session học mặc định.
- Mức năng lượng theo khung giờ.

## Rule

- Route nghiệp vụ bắt buộc AuthGuard.
- Không render dữ liệu private trước khi auth state được xác định.
- Mọi query phải dựa vào user hiện tại.

---

# 7.2. Life Areas — Lĩnh vực phát triển

Cho phép chia cuộc sống thành các nhóm:

- Học tập.
- Công việc.
- Cybersecurity.
- English.
- Sức khỏe.
- Tài chính.
- Dự án cá nhân.
- Kỹ năng.
- Khác.

Người dùng có thể tự tạo.

Mỗi lĩnh vực có:

```text
id
name
description
icon
color_key
priority
is_active
```

Life Area được dùng để phân loại Goals, Tasks, Habits và thống kê.

---

# 7.3. Mục tiêu dài hạn

## Ví dụ

```text
Mục tiêu:
Đạt IELTS 6.0

Deadline:
30/06/2027

Kết quả đo lường:
Listening >= 6.0
Reading >= 6.0
Writing >= 5.5
Speaking >= 5.5
```

## Thuộc tính

- Tiêu đề.
- Mô tả.
- Life Area.
- Ngày bắt đầu.
- Deadline.
- Priority.
- Status.
- Progress.
- Success criteria.
- Motivation / Why.
- Risk.
- Notes.

## Status

```text
draft
active
paused
completed
cancelled
```

## Logic

Progress không nên nhập tay mặc định.

Ưu tiên:

```text
Milestone progress
        ↓
Goal progress
```

Nếu không có milestone mới cho phép manual progress.

---

# 7.4. Milestone

Mục tiêu dài hạn được chia thành milestone.

Ví dụ:

```text
IELTS 6.0
├── 5.0
├── 5.5
└── 6.0
```

Milestone gồm:

- title
- target_date
- weight
- status
- measurable_result

Tổng `weight` của milestone thuộc một goal phải bằng 100 hoặc backend normalize.

---

# 7.5. Mục tiêu tháng

Mỗi tháng có Monthly Plan.

Ví dụ:

```text
Tháng 09/2026

1. Hoàn thành Angular Advanced
2. Học 20 giờ Cybersecurity
3. IELTS Listening 5.0
4. Hoàn thành module Auth dự án
```

Monthly Goal có thể:

- Liên kết Long-term Goal.
- Độc lập.
- Được AI đề xuất.
- Copy từ tháng trước.
- Chuyển task chưa hoàn thành sang tháng sau.

Các trường:

```text
month
title
goal_id
target_value
unit
priority
status
progress
estimated_hours
```

---

# 7.6. Task Management

Task là đơn vị thực thi nhỏ nhất.

## Task gồm

- Title.
- Description.
- Goal.
- Monthly Goal.
- Life Area.
- Priority.
- Deadline.
- Estimate minutes.
- Actual minutes.
- Difficulty.
- Energy level.
- Status.
- Flexible / fixed.
- Splittable.
- Minimum session duration.
- Maximum session duration.

## Status

```text
backlog
planned
in_progress
done
skipped
cancelled
```

## Priority

```text
P0 critical
P1 high
P2 medium
P3 low
```

---

# 7.7. Lịch bận cố định

Người dùng nhập trước:

- Lịch học trên trường.
- Lịch làm việc.
- Lịch dạy.
- Di chuyển.
- Ngủ.
- Việc cá nhân.
- Event định kỳ.

Các event này mặc định:

```text
event_type = fixed_commitment
is_locked = true
```

AI không được phép ghi đè.

Hỗ trợ recurrence:

```text
Daily
Weekly
Monthly
Custom weekdays
Until date
```

---

# 7.8. Lập lịch học thủ công

Flow:

```text
Chọn task
   ↓
Chọn ngày
   ↓
Chọn giờ
   ↓
Conflict check
   ↓
Save
```

Nếu conflict:

- Không cho lưu với `locked event`.
- Cho cảnh báo nếu event flexible.
- Có nút chọn khung giờ khác.

---

# 7.9. AI Smart Scheduler

Đây là chức năng lõi.

## Input

AI nhận:

- Fixed commitments.
- Existing locked events.
- Tasks chưa xếp lịch.
- Deadline.
- Estimate.
- Priority.
- Energy preference.
- Daily available hours.
- Break rule.
- Sleep time.
- Monthly goals.
- User preference.

## AI không trực tiếp lưu DB

Flow bắt buộc:

```text
User chọn "Lập lịch bằng AI"
            ↓
Angular gửi constraints
            ↓
Edge Function xác thực JWT
            ↓
Backend query dữ liệu thật
            ↓
Gemini tạo proposed schedule JSON
            ↓
Backend schema validation
            ↓
Backend conflict validation
            ↓
Backend sửa/loại proposal lỗi
            ↓
Angular hiển thị Preview
            ↓
User Approve
            ↓
Transaction / RPC
            ↓
Calendar Events
```

## Structured output

AI phải trả về dạng:

```json
{
  "summary": "...",
  "items": [
    {
      "task_id": "uuid",
      "start_at": "ISO-8601",
      "end_at": "ISO-8601",
      "reason": "...",
      "confidence": 0.91
    }
  ],
  "warnings": []
}
```

Không chấp nhận text tự do để ghi lịch.

---

# 7.10. Scheduling Engine Validation

Mọi proposal phải chạy qua engine deterministic.

## Rule priority

```text
1. Sleep / unavailable time
2. Fixed commitment
3. Locked manual event
4. Deadline constraint
5. Minimum break
6. Task priority
7. Energy fit
8. User preferred time
9. AI preference
```

AI chỉ được quyết định từ mức 6 trở xuống.

## Conflict rule

Hai interval `[A_start, A_end)` và `[B_start, B_end)` conflict nếu:

```text
A_start < B_end
AND
A_end > B_start
```

## Additional validation

- `end_at > start_at`.
- Không vượt task remaining estimate.
- Không schedule sau deadline nếu task bắt buộc trước deadline.
- Không vượt `max_daily_study_minutes`.
- Chèn break theo rule.
- Không tạo slot ngắn hơn `minimum_session_minutes`.
- Không tự động schedule task `cancelled/done`.

---

# 7.11. Reschedule thông minh

Khi người dùng thêm sự kiện đột xuất:

```text
Event mới
   ↓
Detect affected study sessions
   ↓
Mark "needs_reschedule"
   ↓
User chọn:
   ├── Reschedule manually
   └── AI reschedule
```

AI chỉ được di chuyển:

```text
event_source = ai
OR flexible = true
```

Không được di chuyển locked/fixed event.

---

# 7.12. Calendar

Các chế độ:

- Month.
- Week.
- Day.
- Agenda.

Month view cần:

- Dot/badge theo loại event.
- Tổng thời gian học/ngày.
- Mức quá tải.
- Goal progress indicator.

Week view là màn hình làm việc chính.

---

# 7.13. Habit Tracker

Ví dụ:

- Học English 30 phút.
- Đọc sách.
- Tập thể dục.
- Labs cybersecurity.
- Ngủ đúng giờ.

Habit gồm:

```text
title
frequency
target_count
target_minutes
preferred_time
start_date
end_date
```

Thống kê:

- Current streak.
- Best streak.
- Completion rate.
- 7-day trend.
- 30-day trend.

Habit không tự động tính như task hoàn thành.

---

# 7.14. Focus Session

Cho phép bắt đầu phiên học trực tiếp từ task.

```text
Task
 ↓
Start Focus
 ↓
Timer
 ↓
Pause
 ↓
Complete
 ↓
Actual duration
```

Kết quả cập nhật:

- `focus_sessions`
- `task.actual_minutes`
- Analytics.

Có thể hỗ trợ:

```text
25/5
50/10
Custom
```

---

# 7.15. Learning Roadmap

Người dùng tạo roadmap:

```text
Cybersecurity
├── Linux
├── Networking
├── Web Security
├── Pentest
├── Reverse Engineering
└── Exploit Development
```

Node gồm:

- title
- description
- status
- prerequisite
- estimated_hours
- resource
- skill_level

Status:

```text
not_started
learning
practicing
mastered
```

Roadmap có thể liên kết Goals và Tasks.

---

# 7.16. Resource Library

Lưu:

- Link.
- Course.
- Book.
- Video.
- Repository.
- Note.
- Document reference.

Có tags và liên kết:

```text
Goal
Roadmap node
Task
```

---

# 7.17. Daily Dashboard

Dashboard không được nhồi quá nhiều dữ liệu.

Hiển thị:

1. Today timeline.
2. Next task.
3. Overdue tasks.
4. Daily goal.
5. Focus time.
6. Habit status.
7. Goal progress.
8. AI suggestion tối đa 1–3 mục.

Primary CTA:

```text
BẮT ĐẦU VIỆC TIẾP THEO
```

---

# 7.18. Weekly Review

Mỗi cuối tuần:

- Task hoàn thành.
- Task chưa hoàn thành.
- Focus time.
- Habit completion.
- Goal progress.
- Overloaded days.
- Planned vs actual.
- Điều gì tốt.
- Điều gì chưa tốt.
- Điều chỉnh tuần tới.

AI có thể sinh summary nhưng dữ liệu số phải do backend tính.

---

# 7.19. Monthly Review

Cuối tháng:

```text
Plan
  VS
Actual
```

Bao gồm:

- Monthly goal completion.
- Tổng giờ dự kiến.
- Tổng giờ thực tế.
- Goal tiến triển.
- Habit consistency.
- Tasks carried over.
- Top productive days.
- Bottleneck.
- AI recommendations.

Sau review:

```text
Close Month
    ↓
Carry Over?
    ↓
Create Next Month
```

---

# 7.20. Analytics

Các chỉ số:

- Goal completion %.
- Monthly completion %.
- Planned hours.
- Actual focus hours.
- Planning accuracy.
- Habit consistency.
- Task completion.
- Overdue rate.
- Deep-work time.
- AI schedule acceptance rate.

Không dùng biểu đồ nếu biểu đồ không giúp ra quyết định.

---

# 7.21. AI Coach

AI Coach không phải chatbot tự do hoàn toàn.

Có action rõ ràng:

```text
Phân tích tháng này
Lập kế hoạch tuần
Tôi đang quá tải?
Tôi nên ưu tiên gì?
Chia nhỏ mục tiêu
Sắp xếp lại lịch
Đánh giá tiến độ
```

AI Context phải giới hạn theo dữ liệu cần thiết.

Không gửi toàn bộ database vào prompt.

---

# 8. DATABASE DESIGN

Các bảng cốt lõi:

```text
profiles
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
ai_schedule_proposals
user_preferences
```

---

# 9. SCHEMA CHÍNH

## profiles

```text
id uuid PK -> auth.users.id
display_name text
timezone text
week_start smallint
created_at timestamptz
updated_at timestamptz
```

## goals

```text
id uuid PK
user_id uuid FK
life_area_id uuid
title text
description text
why text
start_date date
target_date date
priority smallint
status text
manual_progress numeric nullable
created_at timestamptz
updated_at timestamptz
deleted_at timestamptz nullable
```

## goal_milestones

```text
id uuid PK
user_id uuid
goal_id uuid FK
title text
target_date date
weight numeric
status text
order_index int
```

## monthly_plans

```text
id uuid PK
user_id uuid
year int
month int
status text
created_at timestamptz
closed_at timestamptz nullable

UNIQUE(user_id, year, month)
```

## monthly_goals

```text
id uuid PK
user_id uuid
monthly_plan_id uuid
goal_id uuid nullable
title text
target_value numeric nullable
unit text nullable
estimated_minutes int
priority smallint
status text
```

## tasks

```text
id uuid PK
user_id uuid
monthly_goal_id uuid nullable
goal_id uuid nullable
life_area_id uuid nullable
title text
description text
priority smallint
status text
deadline timestamptz nullable
estimated_minutes int
actual_minutes int default 0
energy_required smallint
is_splittable boolean
min_session_minutes int
max_session_minutes int
created_at timestamptz
updated_at timestamptz
completed_at timestamptz nullable
```

## calendar_events

```text
id uuid PK
user_id uuid
task_id uuid nullable
title text
description text
event_type text
source text
start_at timestamptz
end_at timestamptz
is_locked boolean
is_flexible boolean
status text
proposal_id uuid nullable
created_at timestamptz
updated_at timestamptz
```

`event_type`:

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

`source`:

```text
manual
ai
recurrence
system
```

## habits

```text
id uuid PK
user_id uuid
life_area_id uuid nullable
title text
frequency_type text
target_count int
target_minutes int nullable
start_date date
end_date date nullable
is_active boolean
```

## habit_logs

```text
id uuid PK
user_id uuid
habit_id uuid
log_date date
value numeric
completed boolean

UNIQUE(user_id, habit_id, log_date)
```

## focus_sessions

```text
id uuid PK
user_id uuid
task_id uuid nullable
started_at timestamptz
ended_at timestamptz nullable
duration_seconds int
status text
```

## ai_requests

```text
id uuid PK
user_id uuid
request_type text
status text
input_hash text
model text
created_at timestamptz
completed_at timestamptz nullable
error_code text nullable
```

Không lưu raw prompt nếu prompt chứa thông tin nhạy cảm không cần thiết.

## ai_schedule_proposals

```text
id uuid PK
user_id uuid
ai_request_id uuid
task_id uuid
start_at timestamptz
end_at timestamptz
reason text
confidence numeric
status text
```

Status:

```text
proposed
accepted
rejected
invalidated
```

---

# 10. DATABASE CONSTRAINTS

Bắt buộc:

```text
end_at > start_at
estimated_minutes >= 0
actual_minutes >= 0
priority BETWEEN 0 AND 3
month BETWEEN 1 AND 12
progress BETWEEN 0 AND 100
```

Không dựa vào Angular để enforce.

---

# 11. ROW LEVEL SECURITY

Tất cả bảng user-owned:

```sql
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid())
```

Không tạo policy dạng:

```sql
USING (true)
```

cho bảng dữ liệu private.

Các bảng có quan hệ con phải kiểm tra ownership trực tiếp hoặc thông qua parent.

`profiles.id`:

```sql
id = auth.uid()
```

Secret/service role chỉ được dùng trong Edge Functions thực sự cần quyền admin.

---

# 12. EDGE FUNCTIONS

## 12.1. ai-schedule

Nhiệm vụ:

- Validate user.
- Load constraints.
- Build prompt.
- Call Gemini.
- Validate JSON.
- Conflict check.
- Return proposal.

Không save Calendar Event trực tiếp.

## 12.2. accept-ai-schedule

- Validate ownership.
- Re-check conflicts.
- Re-check proposal expiration.
- Insert calendar events trong transaction.
- Mark proposal accepted.

## 12.3. ai-breakdown-goal

Input:

```text
goal_id
```

Output:

```text
milestone proposals
monthly goal proposals
task proposals
```

User phải approve.

## 12.4. ai-review

Backend tính metrics trước.

Gemini chỉ nhận:

```text
aggregated metrics + user notes
```

AI sinh:

- Summary.
- Pattern.
- Risk.
- Recommendation.

## 12.5. ai-reschedule

Chỉ reschedule flexible/AI events.

---

# 13. AI SAFETY & RELIABILITY

AI output luôn được coi là **untrusted input**.

Phải có:

1. JSON schema validation.
2. UUID ownership validation.
3. Date validation.
4. Conflict validation.
5. Duration validation.
6. Deadline validation.
7. Rate limiting.
8. Request timeout.
9. Retry giới hạn.
10. Fallback UI.

Nếu Gemini lỗi:

```text
Không làm mất dữ liệu.
Không phá lịch hiện tại.
Cho phép người dùng lập lịch thủ công.
```

---

# 14. ROUTES

```text
/login

/app
/app/dashboard

/app/goals
/app/goals/:id

/app/month
/app/month/:year/:month

/app/tasks

/app/calendar
/app/calendar/month
/app/calendar/week
/app/calendar/day

/app/habits

/app/focus

/app/learning
/app/learning/:roadmapId

/app/reviews
/app/reviews/weekly
/app/reviews/monthly

/app/analytics

/app/ai

/app/settings
```

---

# 15. UX FLOW CHÍNH

## First-run onboarding

```text
Đăng nhập
   ↓
Chọn timezone
   ↓
Nhập giờ ngủ
   ↓
Nhập thời gian bận cố định
   ↓
Chọn lĩnh vực phát triển
   ↓
Tạo 1–3 mục tiêu dài hạn
   ↓
Tạo Monthly Plan
   ↓
AI đề xuất kế hoạch
   ↓
Preview
   ↓
Approve
   ↓
Dashboard
```

Không bắt người dùng cấu hình tất cả ngay lần đầu.

---

# 16. UI/UX GUIDELINES

## Desktop

```text
Sidebar
├── Dashboard
├── Goals
├── Month
├── Calendar
├── Tasks
├── Habits
├── Learning
├── Reviews
└── Analytics
```

## Mobile

Bottom navigation tối đa 5 mục:

```text
Today
Calendar
Goals
Tasks
More
```

## Nguyên tắc

- Primary action rõ.
- Không quá 1 modal lồng nhau.
- Confirm với destructive action.
- Toast cho thành công nhẹ.
- Inline error cho validation.
- Skeleton khi load.
- Empty state phải có CTA.
- Keyboard accessible.
- Không dùng màu làm tín hiệu duy nhất.
- Touch target >= 44px.
- Calendar phải usable trên mobile.

---

# 17. ERROR HANDLING

Phân loại:

```text
AUTH_ERROR
VALIDATION_ERROR
CONFLICT_ERROR
NETWORK_ERROR
RATE_LIMIT
AI_ERROR
SERVER_ERROR
```

UI không hiển thị raw database error.

Ví dụ:

```text
CONFLICT_ERROR
→ "Khung giờ này trùng với lịch bận 14:00–16:00."
```

---

# 18. OFFLINE / NETWORK RESILIENCE

Phiên bản đầu:

- Không cần full offline-first.
- Cache dữ liệu đọc gần nhất ở memory/local storage với dữ liệu không nhạy cảm.
- Mutation thất bại phải giữ form state.
- Không optimistic update cho thao tác calendar quan trọng.
- Có retry thủ công.

---

# 19. TIMEZONE

Database lưu:

```text
timestamptz UTC
```

Frontend hiển thị theo:

```text
profiles.timezone
```

Không lưu lịch bằng local string không timezone.

Recurrence phải được generate theo timezone người dùng để tránh lệch DST nếu sau này dùng ở quốc gia khác.

---

# 20. LOGIC MONTHLY PLANNING

Khi tạo tháng mới:

```text
Create Monthly Plan
       ↓
Load active long-term goals
       ↓
Load unfinished previous tasks
       ↓
User chọn Carry Over
       ↓
Estimate available capacity
       ↓
Create Monthly Goals
       ↓
Create Tasks
       ↓
Input Fixed Commitments
       ↓
Schedule manually / AI
```

Không tự carry over task vô hạn.

Task bị carry over >= 2 tháng:

```text
Flag: stale_task
```

Hệ thống yêu cầu:

```text
Do
Delegate
Reduce
Rescope
Delete
```

---

# 21. CAPACITY PLANNING

Trước khi AI lập lịch:

```text
Available Minutes
=
Total user planning window
- Fixed commitments
- Sleep
- Reserved buffer
```

Monthly plan phải cảnh báo nếu:

```text
Required Estimated Minutes > Available Minutes
```

Mức:

```text
<= 80%       Healthy
80–100%      High load
> 100%       Overloaded
```

Không cho AI giả vờ "nhét" mọi task vào lịch.

---

# 22. PRIORITY SCORE

Có thể dùng score deterministic:

```text
score =
priority_weight
+ deadline_urgency
+ goal_importance
+ overdue_weight
- estimated_effort_penalty
```

AI chỉ dùng score này như một feature.

Không để AI tự quyết định toàn bộ priority.

---

# 23. PROGRESS CALCULATION

Task:

```text
done = 100%
```

Monthly Goal:

```text
weighted completed tasks / total weighted tasks
```

Goal:

```text
weighted milestone progress
```

Habit không cộng trực tiếp vào Goal progress trừ khi được cấu hình là measurable criterion.

---

# 24. SECURITY CHECKLIST

- [ ] RLS enabled mọi user table.
- [ ] Publishable key only in Angular.
- [ ] Secret key never in Angular.
- [ ] Gemini key only Edge Function secret.
- [ ] No secrets in Git.
- [ ] AuthGuard.
- [ ] Edge Function JWT validation.
- [ ] Ownership validation.
- [ ] Input schema validation.
- [ ] DB constraints.
- [ ] Rate limiting AI endpoint.
- [ ] CORS restricted.
- [ ] No raw stack trace to client.
- [ ] No service role for normal CRUD.
- [ ] Audit AI acceptance/rejection.
- [ ] Sanitise user-generated markdown/HTML nếu có rich text.

---

# 25. TESTING

## Unit test

- Date overlap.
- Progress calculation.
- Capacity calculation.
- Priority score.
- Form validators.
- Task splitting.

## Integration test

- Auth.
- RLS.
- Goal CRUD.
- Monthly plan.
- Calendar insert.
- Conflict rejection.
- AI proposal acceptance.

## E2E

Critical flows:

```text
Login
→ Create Goal
→ Create Monthly Goal
→ Create Task
→ Add Fixed Schedule
→ AI Schedule
→ Preview
→ Accept
→ Calendar
→ Complete Task
→ Review
```

## Security test

Một user A không được:

```text
SELECT
INSERT
UPDATE
DELETE
```

dữ liệu user B dù sửa request thủ công.

---

# 26. DEPLOYMENT

## Frontend

```text
GitHub
   ↓
GitHub Actions
   ↓
ng build
   ↓
GitHub Pages
```

Angular Router khi GitHub Pages phải xử lý SPA fallback phù hợp.

Có thể dùng hash routing nếu muốn cách triển khai đơn giản nhất:

```text
/#/app/dashboard
```

Nếu muốn clean URL, workflow phải tạo fallback `404.html` phù hợp.

## Backend

```text
Supabase Cloud
├── PostgreSQL
├── Auth
├── RLS
└── Edge Functions
```

Gemini secret cấu hình trong Supabase project secrets.

---

# 27. CI/CD

Pipeline:

```text
install
 ↓
lint
 ↓
unit test
 ↓
build
 ↓
deploy
```

Không deploy nếu test/build fail.

Recommended branch:

```text
main      → production
develop   → integration
feature/* → feature
fix/*     → bugfix
```

---

# 28. DEFINITION OF DONE

Một feature chỉ được coi là hoàn thành khi:

- UI hoàn chỉnh.
- Responsive.
- Loading state.
- Empty state.
- Error state.
- Validation.
- Permission/RLS.
- Unit/integration test phù hợp.
- Không có console error.
- Không có TypeScript error.
- Không hardcode secret.
- Không dead route.
- Không button không hoạt động.
- Keyboard navigation hợp lý.
- Build production thành công.

---

# 29. IMPLEMENTATION PHASES CHO CODEX

## Phase 0 — Foundation

- Angular workspace.
- Routing.
- Layout.
- Supabase client.
- Auth.
- Guards.
- Error handling.
- Core models.

## Phase 1 — Planning Core

- Life Areas.
- Goals.
- Milestones.
- Monthly Plans.
- Monthly Goals.
- Tasks.

## Phase 2 — Calendar

- Fixed commitments.
- Manual scheduling.
- Month/week/day view.
- Conflict engine.
- Recurrence.

## Phase 3 — AI

- Edge Function secrets.
- Gemini gateway.
- AI goal breakdown.
- AI scheduler.
- Proposal preview.
- Accept/reject.
- AI reschedule.

## Phase 4 — Execution

- Focus sessions.
- Habits.
- Today dashboard.
- Task completion.

## Phase 5 — Growth

- Learning roadmap.
- Resources.
- Weekly review.
- Monthly review.
- Analytics.
- AI Coach.

## Phase 6 — Hardening

- RLS tests.
- E2E.
- Accessibility.
- Responsive QA.
- Performance.
- Error boundaries.
- Production deployment.

---

# 30. YÊU CẦU ĐỐI VỚI CODEX

Codex phải:

1. Không tự ý đổi architecture.
2. Không đặt Gemini key ở Angular.
3. Không đặt Supabase secret key ở Angular.
4. Không tắt RLS để "fix nhanh".
5. Không dùng `any` nếu có thể định nghĩa type.
6. Không hardcode user id.
7. Không query dữ liệu user khác.
8. Không save AI output trước validation.
9. Không để calendar conflict.
10. Không implement button placeholder trong production.
11. Không bỏ qua error/loading/empty states.
12. Chạy build/test sau mỗi phase.
13. Tạo migration SQL có thể reproduce.
14. Commit database migrations vào repository.
15. Tách domain logic khỏi UI components.
16. Giữ component nhỏ, reusable.
17. Dùng repository/service layer cho data access.
18. Không expose stack trace hoặc internal error.
19. Tất cả destructive action phải confirm.
20. Không đánh dấu hoàn thành khi acceptance criteria chưa pass.

---

# 31. ACCEPTANCE CRITERIA TOÀN HỆ THỐNG

Một phiên bản MVP đạt yêu cầu khi người dùng có thể:

1. Đăng nhập.
2. Tạo mục tiêu dài hạn.
3. Chia milestone.
4. Tạo kế hoạch tháng.
5. Tạo task.
6. Nhập lịch bận cố định.
7. Lập lịch học thủ công.
8. Yêu cầu AI lập lịch.
9. Preview AI schedule.
10. Không thể accept lịch conflict.
11. Xem Month/Week/Day Calendar.
12. Hoàn thành task.
13. Track Focus time.
14. Track Habits.
15. Review tuần.
16. Review tháng.
17. Xem analytics.
18. Dữ liệu user được RLS bảo vệ.
19. Refresh trang GitHub Pages không phá ứng dụng.
20. Không có secret trong compiled frontend.

---

# 32. TÓM TẮT CÁCH HỆ THỐNG HOẠT ĐỘNG

Hệ thống vận hành theo một chu trình đơn giản:

```text
1. Tạo mục tiêu dài hạn
         ↓
2. Chia thành milestone
         ↓
3. Chọn mục tiêu cần đạt trong tháng
         ↓
4. Chia thành task
         ↓
5. Nhập lịch bận cố định
         ↓
6. Tự xếp lịch hoặc nhờ AI
         ↓
7. AI chỉ đưa proposal
         ↓
8. Backend kiểm tra xung đột
         ↓
9. Người dùng duyệt
         ↓
10. Thực hiện theo Calendar
         ↓
11. Focus / Task / Habit tracking
         ↓
12. Weekly Review
         ↓
13. Monthly Review
         ↓
14. Điều chỉnh tháng tiếp theo
```

Điểm quan trọng nhất là hệ thống không chỉ là **To-do App** hay **Calendar App**.

Nó là:

> **Goal → Plan → Schedule → Execute → Measure → Review → Improve**

AI đóng vai trò **planner/copilot**, không phải nguồn dữ liệu có quyền quyết định cuối cùng.

---

# 33. KẾT LUẬN

Kiến trúc đề xuất sử dụng Angular làm SPA, Supabase làm Auth/PostgreSQL/RLS/Edge Functions và Gemini làm AI planner phía server.

Mấu chốt để hệ thống ổn định:

- Database là nguồn sự thật duy nhất.
- AI output không đáng tin cho tới khi được validate.
- Fixed schedule luôn ưu tiên hơn AI.
- RLS bảo vệ dữ liệu ở tầng database.
- Secret không bao giờ đi vào browser.
- Mỗi tháng phải có capacity planning.
- Mọi plan đều phải gắn với execution và review.

Với kiến trúc này, dự án có thể bắt đầu như một ứng dụng cá nhân nhưng vẫn đủ sạch để mở rộng thành hệ thống multi-user/SaaS trong tương lai.

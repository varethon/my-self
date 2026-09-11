import { expect, test } from '@playwright/test';

test.describe('VARETHON ASCEND demo smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/runtime-config.js', async (route) => route.fulfill({ contentType: 'application/javascript', body: "window.__VARETHON_CONFIG__={supabaseUrl:'https://qphzagsrntgjktnqiyaz.supabase.co',supabasePublishableKey:''};" }));
    await page.goto('/login');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('login → onboarding → goal → milestone → task → conflict-safe calendar → AI preview → focus → habit → review → deep link → logout', async ({ page }) => {
    await page.getByLabel('Email').fill('smoke@example.com');
    await page.getByLabel('Mật khẩu').fill('smoke-pass');
    await page.getByRole('button', { name: /Mở workspace/ }).click();
    await expect(page).toHaveURL(/onboarding/);
    await page.getByRole('button', { name: /Bắt đầu workspace/ }).click();
    await expect(page).toHaveURL(/app\/dashboard/);

    await page.getByRole('link', { name: 'Mục tiêu' }).click();
    await page.getByRole('button', { name: /Mục tiêu mới/ }).click();
    await page.getByLabel('Tên mục tiêu').fill('Smoke goal');
    await page.getByRole('button', { name: 'Tạo mục tiêu' }).click();
    await page.getByRole('button', { name: /Thêm milestone/ }).first().click();
    await expect(page.getByText(/milestone/).first()).toBeVisible();

    await page.getByRole('link', { name: 'Nhiệm vụ' }).click();
    await page.getByRole('button', { name: /Task mới/ }).click();
    await page.getByLabel('Tên task').fill('Smoke task');
    await page.getByRole('button', { name: 'Thêm vào backlog' }).click();
    await expect(page.getByText('Smoke task')).toBeVisible();

    await page.getByRole('link', { name: 'Lịch' }).click();
    await page.getByRole('button', { name: /Sự kiện mới/ }).click();
    await page.getByLabel('Tên sự kiện').fill('Overlapping commitment');
    await page.getByLabel('Bắt đầu').fill('2026-09-11T13:45');
    await page.getByLabel('Kết thúc').fill('2026-09-11T14:15');
    await page.getByRole('button', { name: 'Lưu lịch bận' }).click();
    await expect(page.getByText(/Khung giờ trùng/)).toBeVisible();

    await page.getByRole('link', { name: 'AI Coach' }).click();
    await page.getByRole('button', { name: /Lập lịch tuần này/ }).click();
    await expect(page.getByText(/Đề xuất của AI/)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/chưa lưu/)).toBeVisible();
    await page.getByRole('button', { name: /Duyệt & thêm vào lịch/ }).click();
    await expect(page.getByText(/Đã duyệt proposal/)).toBeVisible();

    await page.getByRole('link', { name: 'Focus' }).click();
    await page.getByRole('button', { name: /Bắt đầu session/ }).click();
    await page.getByRole('button', { name: /Kết thúc session/ }).click();
    await page.getByRole('link', { name: 'Thói quen' }).click();
    await page.getByRole('button', { name: /Check in/ }).first().click();
    await page.getByRole('link', { name: 'Reviews' }).click();
    await page.getByRole('button', { name: /Lưu review/ }).click();
    await expect(page.getByText(/Review đã lưu/)).toBeVisible();

    await page.goto('/app/analytics');
    await expect(page.getByText('Analytics')).toBeVisible();
    await page.getByRole('button', { name: /Đăng xuất/ }).click();
    await expect(page).toHaveURL(/login/);
  });
});

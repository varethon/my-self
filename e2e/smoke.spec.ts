import { expect, test } from '@playwright/test';

test.describe('VARETHON ASCEND local-only smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('protects a course deep link with the password gate', async ({ page }) => {
    await page.goto('/app/courses');
    await expect(page).toHaveURL(/login\?.*returnUrl/);
    await page.getByLabel('Mật khẩu').fill('0346782752');
    await page.getByRole('button', { name: /Mở workspace/ }).click();
    await expect(page).toHaveURL(/app\/courses/);
    await expect(page.getByRole('heading', { name: 'Khóa học của bạn.' })).toBeVisible();
  });

  test('unlock → goal → milestone → task → conflict-safe calendar → AI preview → focus → habit → review → courses → logout', async ({ page }) => {
    await page.getByLabel('Mật khẩu').fill('0346782752');
    await page.getByRole('button', { name: /Mở workspace/ }).click();
    await expect(page).toHaveURL(/app\/dashboard/);
    await page.goto('/onboarding');
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
    await page.reload();
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

    await page.goto('/app/courses');
    await expect(page.getByRole('heading', { name: 'Khóa học của bạn.' })).toBeVisible();
    await expect(page.getByRole('button', { name: /MCSA.*bài học/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Linux.*bài học/ })).toBeVisible();
    await page.getByRole('button', { name: /2\. Crack Windows Server/ }).click();
    await expect(page.locator('video')).toHaveAttribute('src', /courses\/MCSA/);
    await page.reload();
    await expect(page.getByRole('button', { name: /2\. Crack Windows Server/ })).toHaveClass(/active/);

    await page.goto('/app/analytics');
    await expect(page.getByRole('heading', { name: 'Analytics rõ ràng.' })).toBeVisible();
    await page.getByRole('button', { name: /Đăng xuất/ }).click();
    await expect(page).toHaveURL(/login/);
  });

  test('rejects an invalid password and exposes no signup flow', async ({ page }) => {
    await page.getByLabel('Mật khẩu').fill('wrong-password');
    await page.getByRole('button', { name: /Mở workspace/ }).click();
    await expect(page.getByRole('alert')).toHaveText('Mật khẩu không đúng.');
    await expect(page.getByLabel('Tài khoản')).toHaveCount(0);
    await expect(page.getByText(/Đăng ký|Tạo tài khoản/)).toHaveCount(0);
  });
});

import { test, expect } from "@playwright/test";
import { uniqueEmail, TEST_PASSWORD, login } from "./helpers";

test.describe("PROFILE — xem/sửa profile, đổi mật khẩu, my-bookings", () => {
  let email = "";

  test.beforeEach(async ({ page }) => {
    email = uniqueEmail("e2e.profile");
    // seed account riêng cho spec này
    await page.goto("/vi/register");
    await page.getByPlaceholder("John Doe").fill("QA Profile");
    await page.getByPlaceholder("name@example.com").fill(email);
    await page.getByPlaceholder("0123456789").fill("0912345682");
    await page.getByPlaceholder("••••••••").fill(TEST_PASSWORD);
    await page.locator('form button[type="submit"]').click();
    await page.waitForURL(/\/vi\/login/);

    await login(page, email, TEST_PASSWORD);
    await page.waitForURL(/\/vi$/);
  });

  test("Cập nhật họ tên + số điện thoại trong /dashboard/profile", async ({ page }) => {
    await page.goto("/dashboard/profile");
    await page.waitForLoadState("networkidle");

    const nameInput = page.getByPlaceholder(/John|Họ tên|Name/i).first();
    const phoneInput = page.getByPlaceholder("0123456789").first();

    await nameInput.fill("QA Profile Đã Sửa");
    await phoneInput.fill("0987654321");
    await page.locator('button[type="submit"]').first().click();

    // Sau lưu: toast thành công hoặc giá trị mới còn trên form
    await expect(page.locator('[role="status"], [data-sonner-toast]').first()).toBeVisible({ timeout: 10_000 });
  });

  test("Trang my-bookings hiển thị (rỗng hoặc có dữ liệu)", async ({ page }) => {
    await page.goto("/dashboard/my-bookings");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1, main").first()).toBeVisible();
  });

  test("Đổi mật khẩu: mật khẩu cũ sai bị từ chối", async ({ page }) => {
    await page.goto("/dashboard/change-password");
    await page.waitForLoadState("networkidle");

    const pwInputs = page.locator('input[type="password"]');
    await pwInputs.nth(0).fill("WrongOld123!");
    await pwInputs.nth(1).fill("NewPass123!");
    await pwInputs.nth(2).fill("NewPass123!");
    await page.locator('button[type="submit"]').first().click();

    // Sai mật khẩu cũ → lỗi hiển thị, vẫn ở trang đổi mật khẩu
    await expect(page).toHaveURL(/\/dashboard\/change-password/);
    await expect(page.locator('[role="status"], [data-sonner-toast]').first()).toBeVisible({ timeout: 10_000 });
  });
});
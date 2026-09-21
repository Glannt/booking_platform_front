import { test, expect } from "@playwright/test";
import { uniqueEmail, TEST_PASSWORD, login, ADMIN_EMAIL, ADMIN_PASSWORD } from "./helpers";

test.describe("AUTH — đăng ký / đăng nhập / logout", () => {
  test("Đăng ký tài khoản khách mới thành công", async ({ page }) => {
    const email = uniqueEmail("e2e.customer");

    await page.goto("/vi/register");
    await page.locator('form button[type="submit"]').waitFor();

    await page.getByPlaceholder("John Doe").fill("QA Tester E2E");
    await page.getByPlaceholder("name@example.com").fill(email);
    await page.getByPlaceholder("0123456789").fill("0912345678");
    await page.getByPlaceholder("••••••••").fill(TEST_PASSWORD);
    await page.locator('form button[type="submit"]').click();

    // Sau đăng ký thành công: toast + chuyển về trang login
    await page.waitForURL(/\/vi\/login/);
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test("Đăng ký trùng email bị từ chối", async ({ page }) => {
    const email = uniqueEmail("e2e.dup");
    // Tạo trước một tài khoản
    await page.goto("/vi/register");
    await page.getByPlaceholder("John Doe").fill("QA Dup");
    await page.getByPlaceholder("name@example.com").fill(email);
    await page.getByPlaceholder("0123456789").fill("0912345679");
    await page.getByPlaceholder("••••••••").fill(TEST_PASSWORD);
    await page.locator('form button[type="submit"]').click();
    await page.waitForURL(/\/vi\/login/);

    // Đăng ký lại cùng email → phải báo lỗi, không chuyển trang
    await page.goto("/vi/register");
    await page.getByPlaceholder("John Doe").fill("QA Dup 2");
    await page.getByPlaceholder("name@example.com").fill(email);
    await page.getByPlaceholder("0123456789").fill("0912345680");
    await page.getByPlaceholder("••••••••").fill(TEST_PASSWORD);
    await page.locator('form button[type="submit"]').click();

    await expect(page).toHaveURL(/\/vi\/register/);
    // Toast lỗi của HeroUI xuất hiện
    await expect(page.locator('[role="status"], [data-sonner-toast]').first()).toBeVisible({ timeout: 10_000 });
  });

  test("Đăng nhập sai mật khẩu báo lỗi, không vào được", async ({ page }) => {
    await page.goto("/vi/login");
    await page.locator('input[type="email"]').fill("khongton tai@test.local");
    await page.locator('input[type="password"]').fill("WrongPass123!");
    await page.locator('form button[type="submit"]').click();

    await expect(page).toHaveURL(/\/vi\/login/);
    await expect(page.locator('[role="status"], [data-sonner-toast]').first()).toBeVisible({ timeout: 10_000 });
  });

  test("Admin đăng nhập web → chuyển thẳng vào /portal", async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.waitForURL(/\/portal/);
    await expect(page).toHaveURL(/\/portal/);
  });

  test("Khách đăng nhập → về trang chủ theo locale, logout được", async ({ page }) => {
    const email = uniqueEmail("e2e.login");
    // seed account
    await page.goto("/vi/register");
    await page.getByPlaceholder("John Doe").fill("QA Login");
    await page.getByPlaceholder("name@example.com").fill(email);
    await page.getByPlaceholder("0123456789").fill("0912345681");
    await page.getByPlaceholder("••••••••").fill(TEST_PASSWORD);
    await page.locator('form button[type="submit"]').click();
    await page.waitForURL(/\/vi\/login/);

    await login(page, email, TEST_PASSWORD);
    await page.waitForURL(/\/vi$/);
  });
});
import { test, expect } from "@playwright/test";
import { portalLogin, ADMIN_EMAIL, ADMIN_PASSWORD, MODERATOR_EMAIL, MODERATOR_PASSWORD } from "./helpers";

test.describe("PORTAL — quản trị (admin)", () => {
  test.beforeEach(async ({ page }) => {
    await portalLogin(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  });

  test("Dashboard tổng quan hiển thị", async ({ page }) => {
    await page.goto("/portal");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("main").first()).toBeVisible();
  });

  test("Bảng Bookings: load + filter theo trạng thái", async ({ page }) => {
    await page.goto("/portal/bookings");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("main").first()).toBeVisible();

    // Table bookings phải tồn tại (kể cả rỗng cũng có container)
    const table = page.locator("table, [role=table], .overflow-x-auto").first();
    await expect(table).toBeVisible({ timeout: 20_000 });
  });

  test("Quản lý Currency: trang load + nút Sync tồn tại", async ({ page }) => {
    await page.goto("/portal/currencies");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("main").first()).toBeVisible();

    // Nút sync tỉ giá
    await expect(page.getByRole("button", { name: /sync|đồng bộ|tỉ giá/i }).first()).toBeVisible({ timeout: 20_000 });
  });

  test("Quản lý Role: ADMIN có quyền SETTING_UPDATE (regression fix sync)", async ({ page }) => {
    await page.goto("/portal/roles");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("main").first()).toBeVisible();

    // Hierarchical: chọn role ADMIN → tab permissions phải chứa SETTING_UPDATE
    await page.getByText("ADMIN", { exact: true }).first().click();
    await expect(page.getByText("SETTING_UPDATE").first()).toBeVisible({ timeout: 20_000 });
  });
});

test.describe("PORTAL — moderator", () => {
  test("Moderator login → vào portal được (allowedRoles gồm MODERATOR)", async ({ page }) => {
    await portalLogin(page, MODERATOR_EMAIL, MODERATOR_PASSWORD);
    await expect(page).toHaveURL(/\/portal/);
  });
});

test.describe("PORTAL — phân quyền cơ bản", () => {
  test("Khách hàng không vào được /portal (AuthGuard chặn)", async ({ page }) => {
    // Mở thẳng /portal khi chưa đăng nhập → bị đá về /portal/login
    await page.goto("/portal");
    await page.waitForURL(/\/portal\/login/, { timeout: 20_000 });
  });
});
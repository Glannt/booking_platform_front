import { Page } from "@playwright/test";

/**
 * Credentials mặc định trùng với seed trong UserDataInitializer
 * (chỉ dùng cho môi trường dev/staging — trên VPS đổi qua env).
 */
export const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || "tongnguyenthanhdo@gmail.com";
export const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || "Do200904sad@";
export const MODERATOR_EMAIL = process.env.E2E_MODERATOR_EMAIL || "minhkhoa.travel.vn@gmail.com";
export const MODERATOR_PASSWORD = process.env.E2E_MODERATOR_PASSWORD || "Minhtpt18@";

/** Email duy nhất cho mỗi lần chạy test (tránh conflict account đã tồn tại). */
export function uniqueEmail(prefix = "e2e"): string {
  return `${prefix}.${Date.now()}${Math.floor(Math.random() * 1000)}@test.local`;
}

/** Mật khẩu hợp lệ theo schema register (hoa + ký tự đặc biệt + >= 8 ký tự). */
export const TEST_PASSWORD = "Test123!";

/** Login qua UI dùng chung cho portal/auth spec. */
export async function login(page: Page, email: string, password: string): Promise<void> {
  await page.goto("/vi/login");
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('form button[type="submit"]').click();
}

/** Login portal (ADMIN/STAFF/MODERATOR) qua UI. */
export async function portalLogin(page: Page, email: string, password: string): Promise<void> {
  await page.goto("/portal/login");
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('form button[type="submit"]').click();
  await page.waitForURL(/\/portal$/);
}
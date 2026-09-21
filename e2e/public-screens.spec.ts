import { test, expect } from "@playwright/test";

/**
 * Smoke toàn bộ màn hình public — data-driven theo danh sách URL.
 * Mỗi trang phải trả về HTTP 200 và render nội dung thật (không phải error boundary).
 */
const PUBLIC_PAGES = [
  "/", // root (redirect locale mặc định)
  "/vi",
  "/en",
  "/ko",
  "/ru",
  "/vi/about",
  "/vi/pricing",
  "/vi/promotions",
  "/vi/blog",
  "/vi/docs",
  "/vi/airport-transfer",
  "/vi/intercity",
  "/vi/intercity/routes",
  "/vi/self-drive",
  "/vi/self-drive/vehicles",
  "/vi/tours",
  "/vi/login",
  "/vi/register",
  "/vi/forgot-password",
];

// Trang Only-Server (không fetch nếu chưa login) bỏ qua assertion nội dung — chỉ check HTTP status
const SELF_CONTAINED_ONLY = ["/vi/login", "/vi/register", "/vi/forgot-password"];

test.describe("PUBLIC SCREENS — smoke tất cả màn hình", () => {
  for (const path of PUBLIC_PAGES) {
    test(`Load ${path} => HTTP 200, không crash`, async ({ page }) => {
      const response = await page.goto(path, { waitUntil: "domcontentloaded" });
      expect(response?.status()).toBeLessThan(400);

      if (!SELF_CONTAINED_ONLY.includes(path)) {
        // Trang phải render nội dung: có ít nhất một heading hoặc main
        await expect(page.locator("main, h1").first()).toBeVisible({ timeout: 20_000 });
      }
    });
  }

  test("Tour list → mở chi tiết tour đầu tiên", async ({ page }) => {
    await page.goto("/vi/tours");
    const firstTourLink = page.locator('a[href*="/vi/tours/"]').first();
    await expect(firstTourLink).toBeVisible({ timeout: 20_000 });
    await firstTourLink.click();
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("main").first()).toBeVisible();
  });

  test("404 của trang không tồn tại render đúng", async ({ page }) => {
    const response = await page.goto("/vi/trang-khong-ton-tai-xyz");
    expect(response?.status()).toBe(404);
  });
});
import { test, expect } from "@playwright/test";

/**
 * CHECK BOOKING — tra cứu booking theo mã trên trang công khai + sự kiện flow tour.
 * Lưu ý: spec này cần tối thiểu 1 tour & 1 booking trong DB (seed chuẩn đã có tours).
 * Nếu DB chưa có bookings, phần "tra theo mã" sẽ skip có lý do rõ ràng.
 */
test.describe("BOOKING — luồng đặt + tra cứu", () => {
  test("Tour detail → nút đặt tour hiển thị", async ({ page }) => {
    await page.goto("/vi/tours");
    const firstTourLink = page.locator('a[href*="/vi/tours/"]').first();
    await expect(firstTourLink).toBeVisible({ timeout: 20_000 });
    await firstTourLink.click();
    await page.waitForLoadState("domcontentloaded");

    // Trang detail có khu booking (widget đặt): tìm button chứa "Đặt" hoặc "Book"
    const bookingCta = page.locator('button, a').filter({ hasText: /đặt|book/i }).first();
    await expect(bookingCta).toBeVisible({ timeout: 20_000 });
  });

  test("Trang tra cứu booking /vi/booking/[id] render", async ({ page }) => {
    // Không có mã thật → kiểm tra trang render error-state thay vì crash
    const response = await page.goto("/vi/booking/CODE-KHONG-TON-TAI");
    expect(response?.status()).toBeLessThan(500);
    await expect(page.locator("main").first()).toBeVisible();
  });
});
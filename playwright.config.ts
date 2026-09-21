import { defineConfig, devices } from "@playwright/test";

/**
 * E2E test config — chạy local / staging / production VPS.
 *
 * - Mặc định nhắm http://localhost:3000 (dev server do team tự khởi động,
 *   nếu chưa chạy Playwright sẽ tự start `pnpm dev` nhờ webServer bên dưới).
 * - Trên VPS production: E2E_BASE_URL=https://domain & bỏ project Chromium nếu muốn nhẹ.
 */
const BASE_URL = process.env.E2E_BASE_URL || "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false, // test có state login dùng chung context — chạy tuần tự cho ổn định
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report" }],
  ],
  timeout: 60_000,
  expect: { timeout: 15_000 },
  // Screenshot/Trace bật khi fail để QA có bằng chứng
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    locale: "vi-VN",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    // Bỏ comment khi cần test cross-browser
    // { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    // { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  webServer: {
    command: "pnpm dev",
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
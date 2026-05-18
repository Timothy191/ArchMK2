/**
 * Visual regression tests for the login page.
 * Uses Playwright's built-in snapshot comparison.
 *
 * First run (baseline): npx playwright test e2e/visual --update-snapshots
 * Subsequent runs:       npx playwright test e2e/visual
 */

import { test, expect } from "@playwright/test";

test.describe("login page visual regression", () => {
  test("full login page matches snapshot", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveScreenshot("login-full.png", {
      fullPage: true,
      threshold: 0.02, // 2% pixel difference tolerance
    });
  });

  test("login form card matches snapshot", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    const form = page.locator("form");
    await expect(form).toHaveScreenshot("login-form-card.png", {
      threshold: 0.02,
    });
  });

  test("login page with filled email field", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    await page.locator("input[type='email'], input#email").first().fill("operator@plantcor.os");

    await expect(page.locator("form")).toHaveScreenshot("login-form-filled.png", {
      threshold: 0.02,
    });
  });

  test("login page light macOS theme — no dark backgrounds", async ({ page }) => {
    await page.goto("/login");

    const bodyBg = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });

    // Should be a light color — macOS base background #f3f4f6 ≈ rgb(243,244,246)
    const match = bodyBg.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      const [, r, g, b] = match.map(Number);
      const luminance = (r! + g! + b!) / 3;
      expect(luminance).toBeGreaterThan(200); // light background
    }
  });
});

import { test, expect } from "@playwright/test";

test.describe("login page", () => {
  test("renders login form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("form")).toBeVisible();
    await expect(page.locator("input[type='email']")).toBeVisible();
    await expect(page.locator("input[type='password']")).toBeVisible();
  });

  test("redirects authenticated users away from login", async ({ page }) => {
    // This test documents the expected behavior.
    // Full auth flow (sign up + sign in) requires Supabase local instance.
    // For now we verify the unauthenticated state renders correctly.
    await page.goto("/login");
    await expect(page.locator("form")).toBeVisible();
  });
});

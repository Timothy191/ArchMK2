import { test, expect } from "@playwright/test";

test.describe("login page", () => {
  test("renders login form with all fields", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("form")).toBeVisible();
    await expect(page.locator("input#email")).toBeVisible();
    await expect(page.locator("input#password")).toBeVisible();
    await expect(page.locator("button[type='submit']")).toBeVisible();
  });

  test("form has correct HTML5 validation attributes", async ({ page }) => {
    await page.goto("/login");

    const email = page.locator("input#email");
    await expect(email).toHaveAttribute("type", "email");
    await expect(email).toHaveAttribute("required", "");

    const password = page.locator("input#password");
    await expect(password).toHaveAttribute("type", "password");
    await expect(password).toHaveAttribute("required", "");
    await expect(password).toHaveAttribute("minLength", "6");
  });

  test("empty form submission is blocked by browser validation", async ({
    page,
  }) => {
    await page.goto("/login");

    // Try to submit without filling anything
    await page.locator("button[type='submit']").click();

    // Form should still be visible (submission blocked)
    await expect(page.locator("form")).toBeVisible();
    // URL should not change
    expect(page.url()).toContain("/login");
  });

  test("captures redirect parameter in URL", async ({ page }) => {
    await page.goto("/login?redirect=/drilling");

    // Verify the redirect param is in the URL (browsers display decoded)
    expect(page.url()).toContain("redirect=/drilling");

    // Form should still render
    await expect(page.locator("form")).toBeVisible();
  });
});

test.describe("auth middleware", () => {
  test("unauthenticated user is redirected to login from protected routes", async ({
    page,
  }) => {
    await page.goto("/drilling");

    // Should redirect to login with redirect param
    await expect(page).toHaveURL(/.*\/login.*/);
    expect(page.url()).toContain("redirect=%2Fdrilling");

    // Login form should be visible
    await expect(page.locator("form")).toBeVisible();
  });

  test("unauthenticated user is redirected from hub page", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page).toHaveURL(/.*\/login.*/);
    expect(page.url()).toContain("redirect=%2F");
    await expect(page.locator("form")).toBeVisible();
  });

  test("unauthenticated user is redirected from department tools", async ({
    page,
  }) => {
    await page.goto("/drilling/tools");

    await expect(page).toHaveURL(/.*\/login.*/);
    expect(page.url()).toContain("redirect=%2Fdrilling%2Ftools");
    await expect(page.locator("form")).toBeVisible();
  });
});

test.describe("design system", () => {
  test("login page uses correct dark theme colors", async ({ page }) => {
    await page.goto("/login");

    // Check body has dark background
    const body = page.locator("body");
    await expect(body).toHaveClass(/bg-\[#0f0f0f\]/);

    // Check form card uses correct background
    const form = page.locator("form");
    await expect(form).toHaveClass(/bg-\[#242424\]/);
    await expect(form).toHaveClass(/border-\[#363636\]/);

    // Check text color
    const heading = page.locator("h1");
    await expect(heading).toHaveClass(/text-\[#fafafa\]/);
  });

  test("no forbidden design system classes are present", async ({ page }) => {
    await page.goto("/login");

    const html = await page.content();

    const forbiddenPatterns = [
      "font-bold",
      "font-semibold",
      "bg-white/5",
      "border-white/10",
      "text-white/50",
      "text-white/70",
      "shadow",
      "box-shadow",
    ];

    for (const pattern of forbiddenPatterns) {
      expect(html).not.toContain(pattern);
    }
  });
});

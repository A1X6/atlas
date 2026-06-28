import { test, expect } from "@playwright/test";

test("root redirects to the default locale", async ({ page }) => {
  await page.goto("/");
  await page.waitForURL(/\/en$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
});

test("English home renders hero + CTA", async ({ page }) => {
  await page.goto("/en");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: /browse products/i })).toBeVisible();
});

test("Arabic home is RTL and translated", async ({ page }) => {
  await page.goto("/ar");
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  // The hero CTA is translated to Arabic ("Browse products").
  await expect(page.getByRole("link", { name: "تصفّح المنتجات" })).toBeVisible();
});

test("login page renders the sign-in form", async ({ page }) => {
  await page.goto("/en/login");
  await expect(page.getByRole("heading", { name: /sign in to atlas/i })).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
});

test("registration page renders sectioned form", async ({ page }) => {
  await page.goto("/en/register");
  await expect(page.getByRole("heading", { name: /create your account/i })).toBeVisible();
  await expect(page.getByText(/basic information/i)).toBeVisible();
});

test("unauthenticated visit to /app redirects to login", async ({ page }) => {
  await page.goto("/en/app/dashboard");
  await page.waitForURL(/\/login/);
  await expect(page.getByRole("heading", { name: /sign in to atlas/i })).toBeVisible();
});

test("language switcher swaps locale", async ({ page }) => {
  await page.goto("/en");
  await page.getByRole("button", { name: /language/i }).click();
  await page.getByRole("menuitem", { name: "العربية" }).click();
  await page.waitForURL(/\/ar$/);
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
});

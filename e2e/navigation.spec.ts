import { expect, test } from "@playwright/test";

test.describe("导航栏", () => {
  test("停在视口水平中心，误差不超过 4 像素", async ({ page }, info) => {
    test.skip(info.project.name !== "desktop", "只在桌面工程下校验");
    await page.goto("/");
    const rail = page.getByTestId("rail");
    await expect(rail).toBeVisible();
    const box = await rail.boundingBox();
    const viewport = page.viewportSize();
    expect(box).not.toBeNull();
    expect(viewport).not.toBeNull();
    expect(Math.abs(box!.x + box!.width / 2 - viewport!.width / 2)).toBeLessThan(4);
  });

  test("有毛玻璃、细边框和阴影", async ({ page }) => {
    await page.goto("/");
    const style = await page.getByTestId("rail").evaluate((node) => {
      const computed = getComputedStyle(node);
      return {
        filter: computed.backdropFilter,
        border: computed.borderTopWidth,
        shadow: computed.boxShadow,
        radius: computed.borderTopLeftRadius,
      };
    });
    expect(style.filter).toContain("blur");
    expect(parseFloat(style.border)).toBeGreaterThan(0);
    expect(style.shadow).not.toBe("none");
    expect(parseFloat(style.radius)).toBeGreaterThan(0);
  });

  test("桌面端导航项排成一行", async ({ page }, info) => {
    test.skip(info.project.name !== "desktop", "只在桌面工程下校验");
    await page.goto("/");
    await expect(page.getByTestId("nav-links")).toBeVisible();
    expect((await page.getByTestId("rail").boundingBox())!.height).toBeLessThanOrEqual(90);
  });

  test("点导航项会跳转，当前项标了 aria-current", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("nav-posts").click();
    await expect(page).toHaveURL(/\/posts/);
    await expect(page.getByTestId("nav-posts")).toHaveAttribute("aria-current", "page");
  });

  test("移动端用汉堡菜单打开抽屉", async ({ page }, info) => {
    test.skip(info.project.name !== "mobile", "只在移动工程下校验");
    await page.goto("/");
    await expect(page.getByTestId("nav-links")).toBeHidden();
    await page.getByTestId("nav-burger").click();
    await expect(page.getByTestId("nav-drawer")).toBeVisible();
    await page.getByTestId("nav-drawer").getByRole("link", { name: "文章" }).click();
    await expect(page).toHaveURL(/\/posts/);
    await expect(page.getByTestId("nav-drawer")).toBeHidden();
  });

  test("主题切换会改根元素上的 class", async ({ page }) => {
    await page.goto("/");
    const before = await page.evaluate(() => document.documentElement.className);
    await page.getByTestId("theme-toggle").click();
    await expect.poll(() => page.evaluate(() => document.documentElement.className)).not.toBe(before);
  });

  test("Ctrl+K 打开命令面板并跳到文章", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Control+k");
    await expect(page.getByTestId("command-palette")).toBeVisible();
    await page.getByTestId("palette-input").fill("毛玻璃");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/posts\//);
  });
});

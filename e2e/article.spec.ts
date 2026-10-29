import { expect, test } from "@playwright/test";

const SLUG = "chinese-web-typography";

test.describe("文章页", () => {
  test("渲染标题、元信息与正文", async ({ page }) => {
    await page.goto("/posts/" + SLUG);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("中文网页排版");
    await expect(page.locator(".meta-line").first()).toContainText("分钟读完");
    await expect(page.locator(".prose-article")).toBeVisible();
  });

  test("目录里的锚点能跳到对应小节", async ({ page }) => {
    await page.goto("/posts/" + SLUG);
    const first = page.getByRole("navigation", { name: "目录" }).getByRole("link").first();
    const href = await first.getAttribute("href");
    expect(href).toMatch(/^#/);
    await first.click();
    await expect(page).toHaveURL(new RegExp(href + "$"));
    await expect(page.locator(href!)).toBeVisible();
  });

  test("代码块悬停出现复制按钮，点击后变已复制", async ({ page }, info) => {
    test.skip(info.project.name !== "desktop", "触摸设备没有 hover");
    await page.goto("/posts/" + SLUG);
    const pre = page.locator(".prose-article pre").first();
    await pre.scrollIntoViewIfNeeded();
    await pre.hover();
    const button = pre.locator(".code-toolbar button");
    await expect(button).toBeVisible();
    await button.click();
    await expect(button).toHaveText("已复制");
  });

  test("上下篇各是一块，指向相邻文章", async ({ page }) => {
    await page.goto("/posts/" + SLUG);
    const onward = page.getByRole("navigation", { name: "上下篇" });
    await expect(onward).toBeVisible();
    expect(await onward.getByRole("link").count()).toBeGreaterThan(0);
  });

  test("标签会链到标签页", async ({ page }) => {
    await page.goto("/posts/" + SLUG);
    await page.locator('a[href^="/tags/"]').first().click();
    await expect(page).toHaveURL(/\/tags\//);
  });

  test("喜欢按钮只记一次", async ({ page }) => {
    await page.goto("/posts/" + SLUG);
    const button = page.getByRole("button", { name: /喜欢|已喜欢/ });
    await button.click();
    await expect(button).toHaveAttribute("aria-pressed", "true");
    await expect(button).toContainText("已喜欢");
  });

  test("不存在的文章给 404", async ({ page }) => {
    const response = await page.goto("/posts/this-slug-does-not-exist");
    expect(response?.status()).toBe(404);
  });
});

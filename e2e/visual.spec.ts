import { test } from "@playwright/test";

const OUT = "../docs/screenshots";
const SLUG = "chinese-web-typography";

/** Walk the page so lazy content settles, then return to the top before the shot. */
async function settle(page: import("@playwright/test").Page, waitMs = 2200) {
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(waitMs);
  const height = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < height; y += 700) {
    await page.evaluate((to) => window.scrollTo(0, to), y);
    await page.waitForTimeout(110);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);
}

test.describe("视觉留档", () => {
  test("首页浅色与深色", async ({ page }) => {
    await page.goto("/");
    await settle(page, 3000);
    await page.screenshot({ path: OUT + "/home-light.png" });
    await page.getByTestId("theme-toggle").click();
    await page.waitForTimeout(700);
    await page.screenshot({ path: OUT + "/home-dark.png" });
  });

  test("首页整页", async ({ page }) => {
    await page.goto("/");
    await settle(page, 3000);
    await page.screenshot({ path: OUT + "/home-full.png", fullPage: true });
  });

  test("文章列表", async ({ page }) => {
    await page.goto("/posts");
    await settle(page);
    await page.screenshot({ path: OUT + "/posts.png", fullPage: true });
  });

  test("文章详情", async ({ page }) => {
    await page.goto("/posts/" + SLUG);
    await settle(page, 2600);
    await page.screenshot({ path: OUT + "/post.png" });
  });

  test("归档与标签", async ({ page }) => {
    await page.goto("/archive");
    await settle(page);
    await page.screenshot({ path: OUT + "/archive.png", fullPage: true });
    await page.goto("/tags");
    await settle(page);
    await page.screenshot({ path: OUT + "/tags.png" });
  });

  test("歌单页与展开的播放器", async ({ page }) => {
    await page.goto("/music");
    await settle(page);
    await page.getByTestId("player-toggle").click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: OUT + "/music-player.png" });
  });

  test("关于页", async ({ page }) => {
    await page.goto("/about");
    await settle(page);
    await page.screenshot({ path: OUT + "/about.png" });
  });

  test("后台：登录、概览、文章", async ({ page }) => {
    await page.goto("/studio/login");
    await page.waitForTimeout(600);
    await page.screenshot({ path: OUT + "/studio-login.png" });
    await page.getByTestId("login-username").fill("<REDACTED>");
    await page.getByTestId("login-password").fill("<REDACTED>");
    await page.getByTestId("login-submit").click();
    await page.waitForURL(/\/studio$/, { timeout: 25000 });
    await page.waitForTimeout(1200);
    await page.screenshot({ path: OUT + "/studio-overview.png" });
    await page.goto("/studio/posts");
    await page.waitForTimeout(1200);
    await page.screenshot({ path: OUT + "/studio-posts.png", fullPage: true });
    await page.goto("/studio/settings");
    await page.waitForTimeout(1400);
    await page.screenshot({ path: OUT + "/studio-settings.png" });
  });

  test("移动端留档", async ({ page }, info) => {
    test.skip(info.project.name !== "mobile", "只在移动工程下校验");
    await page.goto("/");
    await settle(page, 3000);
    await page.screenshot({ path: OUT + "/mobile-home.png", fullPage: true });
    await page.goto("/posts/" + SLUG);
    await settle(page, 2600);
    await page.screenshot({ path: OUT + "/mobile-post.png" });
  });
});

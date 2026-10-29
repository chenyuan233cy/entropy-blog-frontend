import { expect, test } from "@playwright/test";

test.describe("悬浮音乐播放器", () => {
  test("收起时是圆形按钮，点开出现面板", async ({ page }) => {
    await page.goto("/");
    const toggle = page.getByTestId("player-toggle");
    await expect(toggle).toBeVisible();
    await expect(page.getByTestId("player-panel")).toBeHidden();

    const radius = await toggle.evaluate((node) => getComputedStyle(node).borderTopLeftRadius);
    expect(radius).not.toBe("0px");

    await toggle.click();
    await expect(page.getByTestId("player-panel")).toBeVisible();
    await expect(page.getByTestId("player-title")).not.toBeEmpty();
  });

  test("面板里有封面、进度条和音量条", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("player-toggle").click();
    await expect(page.getByTestId("player-panel").locator("img").first()).toBeVisible();
    await expect(page.getByTestId("player-progress")).toBeVisible();
    await expect(page.getByTestId("player-volume")).toBeVisible();
  });

  test("点播放按钮会切换播放状态", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("player-toggle").click();
    const play = page.getByTestId("player-play");
    const before = await play.getAttribute("aria-label");
    await play.click();
    await expect.poll(() => play.getAttribute("aria-label")).not.toBe(before);
  });

  test("拖动进度条会改变它的值", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("player-toggle").click();
    const progress = page.getByTestId("player-progress");
    await progress.evaluate((node) => {
      const input = node as HTMLInputElement;
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
      setter.call(input, "20");
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
    expect(Number(await progress.inputValue())).toBe(20);
  });

  test("移动端播放器仍然可展开", async ({ page }, info) => {
    test.skip(info.project.name !== "mobile", "只在移动工程下校验");
    await page.goto("/");
    await page.getByTestId("player-toggle").click();
    await expect(page.getByTestId("player-panel")).toBeVisible();
  });
});

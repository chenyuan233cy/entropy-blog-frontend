import { expect, test } from "@playwright/test";

const SLUG = "chinese-web-typography";
const NICK = "测试读者" + Date.now().toString().slice(-5);

test.describe("评论", () => {
  test("空表单会给出提示，不会发出去", async ({ page }) => {
    await page.goto("/posts/" + SLUG + "#replies");
    await page.getByRole("button", { name: "提交" }).click();
    await expect(page.getByText("昵称和内容都要填。")).toBeVisible();
  });

  test("提交后进入待审队列并给出提示", async ({ page }) => {
    await page.goto("/posts/" + SLUG + "#replies");
    await page.getByPlaceholder("昵称 *").fill(NICK);
    await page.getByPlaceholder("说点什么…").fill("这条来自自动化测试，用来验证评论提交链路。");
    await page.getByRole("button", { name: "提交" }).click();
    await expect(page.getByText(/评论已提交/)).toBeVisible({ timeout: 20000 });
  });

  test("后台能把这条评论删掉", async ({ page }, info) => {
    test.skip(info.project.name !== "desktop", "只在桌面工程下跑一次");
    await page.goto("/studio/login");
    await page.getByTestId("login-username").fill("<REDACTED>");
    await page.getByTestId("login-password").fill("<REDACTED>");
    await page.getByTestId("login-submit").click();
    await expect(page).toHaveURL(/\/studio$/, { timeout: 25000 });

    await page.goto("/studio/comments");
    const row = page.locator("li", { hasText: NICK }).first();
    if ((await row.count()) === 0) test.skip(true, "待审队列里没有测试评论");
    page.on("dialog", (dialog) => void dialog.accept());
    await row.getByRole("button", { name: /删除/ }).click();
    await expect(page.locator("li", { hasText: NICK })).toHaveCount(0, { timeout: 20000 });
  });
});

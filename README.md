# entropy-blog-frontend

个人博客「熵」的前端：Next.js App Router + TypeScript + Tailwind CSS，服务端组件直连后端 `/api/v1`，包含公开站点与后台管理（`/manage`）两套界面。

## 技术栈

| 层 | 选型 |
|---|---|
| 框架 | Next.js（App Router、React Server Components）+ React + TypeScript |
| 样式 | Tailwind CSS（`@tailwindcss/postcss`） |
| 状态 | zustand |
| 动效 | motion |
| 图标 | `@phosphor-icons/react` |
| 主题 | next-themes（明暗切换） |
| 代码高亮 | highlight.js |
| 图片 | sharp（`next/image`，输出 webp） |
| 测试 | Playwright |

## 页面

公开站点：`/`、`/posts`、`/posts/[slug]`、`/archive`、`/tags`、`/tags/[slug]`、`/search`、`/music`、`/tools`、`/files`、`/sponsor`、`/about`、`/login`、`/register`、`/oauth/callback`、`/me`、`/settings`、`/write`、`/write/[id]`。

后台管理：`/manage`、`/manage/comments`、`/manage/logins`、`/manage/music`、`/manage/sponsors`、`/manage/tags`。

## 快速开始

```bash
npm install

# 在项目根创建 .env.local（不要提交）：
# API_BASE_URL=http://127.0.0.1:8080
# SITE_URL=http://localhost:3000

npm run dev        # http://localhost:3000
```

后端默认跑在 `8080`，前端通过 `API_BASE_URL` 在**服务端**取数（见 `src/data/read.ts`）；后端短暂不可用时页面会渲染空状态而不是报错。

## 脚本

| 命令 | 作用 |
|---|---|
| `npm run dev` | 开发服务器（3000） |
| `npm run build` / `npm start` | 生产构建与启动（3000） |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | `next lint` |
| `npm test` / `npm run test:ui` | Playwright 端到端测试 |

## 环境变量

| 变量 | 说明 |
|---|---|
| `API_BASE_URL` | 后端地址，默认 `http://127.0.0.1:8080` |
| `SITE_URL` | 站点地址，用于元信息与绝对链接 |
| `E2E_BASE_URL` | Playwright 目标地址，默认 `http://127.0.0.1:3000` |
| `E2E_CHANNEL` | Playwright 使用的浏览器通道，默认 `chrome`（复用本机已装浏览器） |

## 端到端测试

Playwright 配置见 `playwright.config.ts`：单 worker 串行执行，超时 60s，默认驱动本机安装的 Chrome/Edge（`channel`），不下载浏览器内核。

> ⚠️ 仓库版本的 `e2e/*.spec.ts` 里，后台登录账号密码已脱敏为 `<REDACTED>`。要在自己机器上跑通 e2e，请先把那两行替换成本地实测账号，或改成读环境变量。

## 构建版本戳

`next.config.ts` 在构建时把版本戳内联为 `NEXT_PUBLIC_BUILD_STAMP`，运行时 `/api/version` 再读同一个文件——两边一致才能确认前端跑的就是这份代码。

## 安全与反代

- 响应头默认带 `X-Content-Type-Options: nosniff` 等防护
- 转发层请求体上限调到 400MB，需高于后端上传上限（300MB），否则超限请求会被截断成 `Failed to fetch`
- 部署：`npm run build && npm start`，前置 Nginx/网关负责 TLS 与 `/api` 反向代理

## 目录结构

```
src/
├── app/        App Router 路由（(public) 下为页面，api/version 为版本戳接口）
├── chrome/     全局框架：导航、页脚、主题
├── data/       服务端取数层（read.ts 直连后端 /api/v1）
├── pieces/     可复用业务组件（admin/ 下为后台组件）
├── state/      zustand store
└── style/      全局样式（Tailwind 基础层）
e2e/            Playwright 用例
```

## License

MIT

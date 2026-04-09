# 中关村学院 · AI 博士生模拟器

浏览器端文字模拟经营游戏（React + Vite）。

## 本地运行

```bash
npm ci
npm run dev
```

可选：复制 `.env.example` 为 `.env` 并填写 `GEMINI_API_KEY`。

## 在线体验（GitHub Pages）

推送 `main` 或 `master` 分支后，由 [GitHub Actions](.github/workflows/deploy-github-pages.yml) 自动构建部署。

1. 仓库 **Settings → Pages**：Source 选择 **GitHub Actions**。
2. 部署完成后，访问：`https://<你的用户名>.github.io/<仓库名>/`

若仓库改名，无需改代码，工作流会按新仓库名设置资源路径。

## 许可

由作者自行决定；若仅班级分享，保持仓库 **Private** 也可使用 Pages（视 GitHub 当前规则而定）。

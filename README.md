<div align="center">
  <h1>🎯 Vibe Coding Scout</h1>
  <p>由 Gemini AI 驱动的 YouTube AI 开发视频侦察站</p>
  <img src="https://img.shields.io/badge/Gemini-AI_Powered-blue?logo=google" alt="Gemini" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React" />
  <img src="https://img.shields.io/badge/Vite-6-646CFF?logo=vite" alt="Vite" />
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript" alt="TypeScript" />
</div>

---

## ✨ 项目简介

**Vibe Coding Scout** 是一个 AI 驱动的 YouTube 视频侦察工具，能够：

- 🔍 **自动侦察**：通过 Gemini + Google Search 实时发现最新 AI 开发 / Vibe Coding 视频
- 🧠 **深度解析**：为每个视频生成带有时间戳的深度技术解析报告（Substack 风格）
- 🖼️ **视觉分析**：利用 Gemini Vision 分析视频缩略图，生成更精准的内容摘要
- 📓 **NotebookLM 集成**：一键将视频导入 Google NotebookLM 进行二次深度提炼

## 🛡️ 安全架构

```
浏览器 (React 前端)
    │  fetch /api/scout 或 /api/details
    ▼
Express 后端 (server.ts)   ← GEMINI_API_KEY 在此安全读取（仅存在于服务器进程）
    │
    ▼
Google Gemini API
```

> **所有 API Key 均通过服务端 `.env` 文件或 GitHub Secrets 注入，不会出现在任何前端代码或构建产物中。**

---

## 🚀 本地开发

### 前置条件
- Node.js 20+
- 一个有效的 [Gemini API Key](https://aistudio.google.com/apikey)

### 1. 克隆项目

```bash
git clone https://github.com/vithyaalshaer-pixel/vibecoding.git
cd vibecoding
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

复制示例文件并填入你的 API Key：

```bash
cp .env.example .env
```

然后编辑 `.env`（参考 `.env.example`）：

```env
# Gemini API Key（在 https://aistudio.google.com/apikey 获取）
GEMINI_API_KEY="your_gemini_api_key_here"

# 本地开发时的应用 URL
APP_URL="http://localhost:3000"

# 可选：后端服务端口，默认 3001
# SERVER_PORT=3001
```

> ⚠️ 请勿将 `.env` 文件提交到 git！项目的 `.gitignore` 已自动排除该文件。

### 4. 启动应用

```bash
# 同时启动前端（Vite, :3000）和后端（Express, :3001）
npm run dev:all
```

浏览器访问 **http://localhost:3000**

> **也可以分别启动：**
> ```bash
> npm run server   # 仅启动后端 API 服务（端口 3001）
> npm run dev      # 仅启动前端开发服务器（端口 3000）
> ```

---

## ☁️ 自动部署（GitHub Actions）

本项目包含一套 GitHub Actions 工作流（`.github/workflows/deploy.yml`），在每次推送 `main` 分支时自动构建并部署到 **GitHub Pages**。

### 配置 GitHub Secrets

进入仓库 → **Settings → Secrets and variables → Actions → New repository secret**，添加以下 Secrets：

| Secret 名称       | 说明                                                |
|-------------------|-----------------------------------------------------|
| `GEMINI_API_KEY`  | 你的 Gemini API Key（**仅供服务端运行时使用**）       |
| `APP_URL`         | 部署后的应用 URL（如 `https://vithyaalshaer-pixel.github.io/vibecoding`）|

### 启用 GitHub Pages

进入仓库 → **Settings → Pages → Source**，选择 **GitHub Actions**。

之后每次 push 到 `main` 都会自动触发部署 🎉

---

## 🔧 可用脚本

| 命令                | 说明                           |
|---------------------|--------------------------------|
| `npm run dev:all`   | 同时启动前端与后端（推荐开发用）|
| `npm run dev`       | 仅启动 Vite 前端开发服务器      |
| `npm run server`    | 仅启动 Express 后端 API 服务    |
| `npm run build`     | 构建生产版本                   |
| `npm run lint`      | TypeScript 类型检查             |
| `npm run preview`   | 预览生产构建结果               |

---

## 📦 技术栈

- **前端**：React 19 + TypeScript + Vite 6 + Tailwind CSS v4
- **后端**：Express + Node.js + tsx（TypeScript 运行时）
- **AI**：Google Gemini API (`@google/genai`) + Google Search Tool
- **CI/CD**：GitHub Actions → GitHub Pages

---

## 📄 许可证

MIT

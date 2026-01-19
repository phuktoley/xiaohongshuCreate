# 小红书爆款内容生成助手 V1.0

**仓库地址**: https://github.com/phuktoley/xiaohongshuCreate

**V1.0 分支**: https://github.com/phuktoley/xiaohongshuCreate/tree/V1.0

## 项目概览

本项目是一个专为留学生申诉场景打造的 **小红书爆款内容生成助手**。它利用 AI 快速生成符合小红书平台风格的标题、正文、话题标签和封面文案，旨在帮助用户高效创作高互动性的内容。

该项目采用现代化的全栈技术栈，前后端分离，并已配置好本地开发环境，支持开发者快速上手。

## 核心功能

| 功能模块 | 详细说明 |
| :--- | :--- |
| **多人设管理** | 支持创建、编辑和切换4种预设人设（如“过来人学姐”、“专业顾问”），确保内容风格统一。 |
| **智能标题生成** | 根据场景、情绪和人设，生成5-10个带评分和emoji的爆款标题，严格控制在18字符以内。 |
| **笔记正文生成** | 基于标题和人设，生成300-500字的高质量笔记，包含开头、正文和互动引导。 |
| **话题标签推荐** | 智能推荐相关话题标签，并按场景、学校、申诉等维度进行分类。 |
| **封面文案生成** | 生成吸引眼球的封面文案，支持多种类型和配色方案建议。 |
| **历史记录管理** | 自动保存所有生成的内容，支持查看、收藏和二次编辑。 |
| **爆款数据库** | 内置100+高互动帖子的分析数据，为内容创作提供灵感。 |

## 技术栈

| 分类 | 技术 |
| :--- | :--- |
| **前端** | React 19, Vite, TypeScript, TailwindCSS, Radix UI, tRPC Client |
| **后端** | Node.js, Express, tRPC Server, Drizzle ORM |
| **数据库** | MySQL (本地开发可选) |
| **AI 集成** | OpenAI 兼容 API (默认使用 `gemini-2.5-flash`) |
| **包管理器** | pnpm |

## 本地开发指南

1.  **环境准备**:
    *   Node.js (v22.x 或更高版本)
    *   pnpm (v10.x 或更高版本)
    *   Git

2.  **克隆仓库**:
    ```bash
    git clone https://github.com/phuktoley/xiaohongshuCreate.git
    cd xiaohongshuCreate
    ```

3.  **安装依赖**:
    ```bash
    pnpm install
    ```

4.  **配置环境变量**:
    复制 `.env.example` 文件为 `.env`，并填入你的 OpenAI 兼容 API 密钥。
    ```bash
    cp .env.example .env
    ```
    编辑 `.env` 文件:
    ```env
    OPENAI_API_KEY=your-api-key-here
    OPENAI_BASE_URL=https://api.openai.com/v1 # 可选，默认为OpenAI官方地址
    LLM_MODEL=gemini-2.5-flash # 可选，默认为gemini-2.5-flash
    ```
    > **注意**: 项目已实现认证绕过，本地开发无需配置 OAuth 和数据库即可运行核心功能。

5.  **启动项目**:
    ```bash
    pnpm run dev
    ```
    项目将在 `http://localhost:3000` 上运行。

## 部署说明

项目可以通过 `pnpm run build` 命令进行构建，生成 `dist` 目录。该目录包含一个可独立运行的 Node.js 服务器和静态前端资源。

```bash
# 1. 构建项目
pnpm run build

# 2. 启动生产服务器
NODE_ENV=production node dist/index.js
```

## ⚠️ 已知问题 (V1.0)

**BUG #1: 内容生成失败**

-   **现象**: 在内容生成页面，填写完所有配置项后，点击“开始生成标题”按钮，页面提示“标题生成失败，请重试”。
-   **根本原因**: 前端在调用 tRPC 的 `generate.titles` 接口时，请求的 Body 格式不正确。tRPC 期望一个包含 `json` 字段的嵌套对象，但前端直接发送了参数对象。
-   **后端日志**: `Invalid input: expected object, received undefined`
-   **修复建议**: 修改前端调用 tRPC mutation 的地方。需要将请求参数包装在一个 `json` 对象中。例如，在 `client/src/lib/trpc.ts` 或调用该接口的组件中，调整请求的构造方式。

    **错误示例 (当前实现)**:
    ```javascript
    // client/src/pages/Generator.tsx (示意代码)
    generateTitles.mutate(payload);
    ```

    **正确示例 (修复方向)**:
    ```javascript
    // client/src/pages/Generator.tsx (示意代码)
    // 需要根据 tRPC client 的具体用法进行调整，
    // 但核心是确保请求体符合后端预期格式。
    // 这通常由 tRPC client 自动处理，问题可能出在 client 的配置上。
    // 快速修复可以尝试手动包装，但建议检查 tRPC Provider 和 client 的配置。
    ```

由于时间限制，此 Bug 未在本版本中修复，已记录在案，作为 V1.1 版本的首要任务。

# 本地开发环境配置指南

本文档旨在说明为了在标准（非 Manus）环境中成功运行 `phuktoley/0103XHS` 项目所做的关键修改。这些修改主要解决了 **认证** 和 **AI API 配置** 两个核心问题。

## 1. 认证绕过 (Authentication Bypass)

### 问题

项目原生设计依赖于 Manus 平台的 OAuth 服务进行用户认证。在本地或任何非 Manus 环境中，这套认证系统无法工作，导致用户无法登录，从而无法使用需要登录后才能访问的功能。

### 解决方案

为了在本地环境中模拟一个已登录的用户，我们对前端和后端都进行了修改：

#### 前端修改

- **文件**: `/client/src/_core/hooks/useAuth.ts`
- **操作**: 修改了 `useAuth` 这个 React Hook。
- **逻辑**: 当该 Hook 无法获取到真实的用户信息时，它会返回一个写死的“模拟用户”对象，并始终将认证状态 (`isAuthenticated`) 设置为 `true`。这样，所有依赖此 Hook 的前端组件都会认为用户已经登录。

#### 后端修改

- **文件**: `/server/_core/context.ts`
- **操作**: 修改了 tRPC 的 `createContext` 函数。
- **逻辑**: 这个函数负责在每个 API 请求到达时创建上下文（Context），其中包含用户信息。修改后的逻辑是：如果通过正常流程无法验证并获取用户，则自动创建一个“模拟用户”并注入到上下文中。这样，所有受保护的后端 API (`protectedProcedure`) 都能获取到一个有效的用户对象，从而绕过了认证检查。

## 2. AI API 灵活配置

### 问题

项目的 AI 功能（如标题生成）硬编码了对特定 API (`forge.manus.im`) 和特定环境变量 (`BUILT_IN_FORGE_API_KEY`) 的依赖。这使得在没有这些特定配置的环境中，AI 功能完全无法使用。

### 解决方案

为了让项目能适应更通用的环境（例如使用标准的 OpenAI API 或任何兼容 OpenAI 的服务），我们进行了以下配置和代码修改：

#### 环境变量兼容

- **文件**: `/server/_core/env.ts`
- **操作**: 修改了环境变量的读取逻辑。
- **逻辑**: 现在，程序会优先尝试读取项目原有的 `BUILT_IN_FORGE_API_KEY` 和 `BUILT_IN_FORGE_API_URL`。如果这两个变量不存在，它会自动降级（fallback）去读取更通用的 `OPENAI_API_KEY` 和 `OPENAI_BASE_URL`。这使得项目可以在任何配置了标准 OpenAI 环境变量的环境中无缝运行。

#### API URL 构建优化

- **文件**: `/server/_core/llm.ts`
- **操作**: 优化了请求 URL 的构建函数 `resolveApiUrl`。
- **逻辑**: 之前的逻辑简单地在基础 URL 后拼接 `/v1/chat/completions`，但这在 `OPENAI_BASE_URL` 已经包含 `/v1` 的情况下会导致 URL 错误（例如 `.../v1/v1/...`）。新的逻辑会检查基础 URL 是否已经以 `/v1` 结尾，从而确保最终生成的 API 请求地址总是正确的。

#### 移除 Manus 特有参数

- **文件**: `/server/_core/llm.ts`
- **操作**: 移除了对 Manus 平台特有的 API 参数的调用。
- **逻辑**: 删除了 `thinking` 和 `budget_tokens` 等非标准参数，确保 API 请求体与标准的 OpenAI Chat Completions API 兼容。

## 总结

通过以上修改，项目现在具备了良好的本地开发体验。开发者只需在项目根目录创建一个 `.env` 文件，并填入一个有效的 OpenAI 兼容 API 密钥，即可在本地完整地运行和测试所有功能，无需再进行任何代码修改。

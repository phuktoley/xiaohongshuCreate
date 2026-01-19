# 0103XHS Railway 部署笔记

## 部署信息

- **项目地址**: https://0103xhs-production.up.railway.app
- **Railway 项目**: https://railway.com/project/fed76032-abdb-41c5-b8d2-cbbe88ec199b
- **部署时间**: 2026-01-04

## 环境变量配置

Railway 上需要配置以下环境变量：

```
OPENAI_API_KEY="sk-8v4NEBD5podRE4gMbVmy5Z"
OPENAI_BASE_URL="https://api.manus.im/api/llm-proxy/v1"
LLM_MODEL="gemini-2.5-flash"
PORT="8080"
NODE_ENV="production"
VITE_OAUTH_PORTAL_URL="https://oauth.example.com"
VITE_APP_ID="demo-app"
OAUTH_SERVER_URL="https://oauth.example.com"
JWT_SECRET="your-jwt-secret-for-development"
BUILT_IN_FORGE_API_KEY="sk-8v4NEBD5podRE4gMbVmy5Z"
BUILT_IN_FORGE_API_URL="https://api.manus.im/api/llm-proxy/v1"
```

## 已知问题和修复

### 问题 1: 批量生成失败 - JSON 解析错误

**错误信息**:
```
SyntaxError: Unexpected token '好', "好的，作为"过来人学"... is not valid JSON
SyntaxError: Unexpected token '`', "```json\n{\n"... is not valid JSON
```

**原因分析**:
Gemini 模型在返回 JSON 时，有时会：
1. 在 JSON 前添加"好的，作为..."等前缀文字
2. 用 markdown 代码块（\`\`\`json ... \`\`\`）包裹 JSON
3. 在 JSON 后添加额外的解释文字

**解决方案**:
在 `server/ai.ts` 中添加了 `extractJSON()` 和 `safeParseJSON()` 函数，用于：
1. 去除 markdown 代码块标记
2. 提取纯 JSON 内容（找到第一个 `{` 和最后一个 `}` 之间的内容）
3. 处理 AI 的"寒暄"文字

**修改文件**: `server/ai.ts`

### 问题 2: API Key 配置问题

**原因**: Railway 环境变量中的 `OPENAI_API_KEY` 是占位符 `your-api-key-here`

**解决方案**: 
1. 在 `server/_core/env.ts` 中设置了默认值
2. 在 Railway 环境变量中配置了正确的 Manus API Key

## 构建和启动命令

- **构建命令**: `pnpm install && pnpm build`
- **启动命令**: `pnpm start`

## 功能测试清单

- [x] 首页加载
- [x] 单篇生成 - 标题
- [x] 单篇生成 - 正文
- [x] 单篇生成 - 标签
- [x] 单篇生成 - 封面
- [ ] 批量生成（需要验证 JSON 解析修复）
- [x] 404 错误页面
- [x] 502 错误处理（服务下线时显示 Railway 默认页面）

## 待办事项

1. **验证批量生成修复**: 部署新代码后需要重新测试批量生成功能
2. **监控日志**: 关注 Railway 日志中是否还有 JSON 解析错误
3. **考虑添加重试机制**: 如果 AI 返回格式仍然不规范，可以考虑添加重试逻辑

## 代码修改摘要

### server/ai.ts

添加了以下函数：

```typescript
/**
 * 预处理 AI 返回的内容，提取纯 JSON
 */
function extractJSON(content: string): string {
  // 1. 首先尝试直接解析
  // 2. 去除 markdown 代码块
  // 3. 找到第一个 { 和最后一个 } 之间的内容
  // 4. 处理数组情况
}

/**
 * 安全解析 JSON，带有预处理
 */
function safeParseJSON<T>(content: string): T {
  const extracted = extractJSON(content);
  return JSON.parse(extracted) as T;
}
```

所有 `JSON.parse(content)` 调用都改为 `safeParseJSON(content)`。

### server/_core/env.ts

设置了默认的 API 配置：
- 默认 API Key: Manus 提供的 key
- 默认 Base URL: https://api.manus.im/api/llm-proxy/v1
- 默认模型: gemini-2.5-flash

### server/_core/llm.ts

- 添加了 API Key 占位符检测
- 优化了 URL 解析逻辑

## 参考项目

- `feishu-gaoding-web`: 同一 Railway 账号下的参考项目，配置类似

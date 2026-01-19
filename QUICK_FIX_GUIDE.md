# 快速修复指南 - BUG #1: 内容生成失败

**问题**: 点击"开始生成标题"按钮后，页面提示"标题生成失败，请重试"

**根本原因**: 前端 tRPC 调用参数格式错误

---

## 修复方案 1: 检查 tRPC Client 配置 (推荐)

### 步骤 1: 检查 `client/src/lib/trpc.ts`

确保 tRPC Client 使用了正确的 `transformer` 和 `links` 配置。

**当前配置** (可能存在问题):

```typescript
import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../../../server/routers';

export const trpc = createTRPCReact<AppRouter>();

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: '/api/trpc',
    }),
  ],
});
```

**修复后的配置**:

```typescript
import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
import type { AppRouter } from '../../../server/routers';

export const trpc = createTRPCReact<AppRouter>();

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: '/api/trpc',
      // 添加 transformer
      transformer: superjson,
    }),
  ],
});
```

### 步骤 2: 检查 tRPC Provider

确保在 `client/src/main.tsx` 中正确配置了 tRPC Provider。

**当前配置** (可能存在问题):

```typescript
import { trpc, trpcClient } from './lib/trpc';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

function App() {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {/* ... */}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
```

**修复后的配置**:

```typescript
import { trpc, trpcClient } from './lib/trpc';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {/* ... */}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
```

---

## 修复方案 2: 检查前端调用方式

### 步骤 1: 找到调用位置

在 `client/src/pages/Generator.tsx` 中找到调用 `generate.titles` 的代码。

**可能的错误示例**:

```typescript
const generateTitles = trpc.generate.titles.useMutation();

const handleGenerateTitles = async () => {
  try {
    const result = await generateTitles.mutateAsync({
      scenario,
      emotion,
      personaType,
      schoolRegion,
      schoolName,
      customInput,
    });
    // 处理结果
  } catch (error) {
    console.error('生成失败:', error);
  }
};
```

### 步骤 2: 检查参数传递

确保参数类型与后端定义一致。检查 `server/routers.ts` 中的输入验证:

```typescript
titles: protectedProcedure
  .input(z.object({
    scenario: z.enum(["delay", "dropout", "misconduct", "fail", "leave", "withdraw"]),
    emotion: z.enum(["empathy", "warning", "help", "success", "critic"]),
    personaType: z.enum(["senior_sister", "professional", "anxious", "critic"]),
    schoolRegion: z.enum(["uk", "au", "us", "ca", "hk", "sg", "eu"]).optional(),
    schoolName: z.string().optional(),
    customInput: z.string().optional(),
  }))
  .mutation(async ({ ctx, input }) => {
    // ...
  }),
```

**修复建议**:

1.  确保前端传递的参数类型与后端定义完全一致
2.  检查枚举值是否匹配 (例如 `"fail"` vs `"挂科"`)
3.  确保可选参数在未填写时传递 `undefined` 而非空字符串

---

## 修复方案 3: 添加调试日志

### 步骤 1: 在前端添加日志

在 `client/src/pages/Generator.tsx` 中添加日志:

```typescript
const handleGenerateTitles = async () => {
  console.log('=== 开始生成标题 ===');
  console.log('参数:', {
    scenario,
    emotion,
    personaType,
    schoolRegion,
    schoolName,
    customInput,
  });
  
  try {
    const result = await generateTitles.mutateAsync({
      scenario,
      emotion,
      personaType,
      schoolRegion,
      schoolName,
      customInput,
    });
    console.log('生成结果:', result);
  } catch (error) {
    console.error('生成失败:', error);
    console.error('错误详情:', JSON.stringify(error, null, 2));
  }
};
```

### 步骤 2: 在后端添加日志

在 `server/routers.ts` 中添加日志:

```typescript
titles: protectedProcedure
  .input(z.object({
    // ...
  }))
  .mutation(async ({ ctx, input }) => {
    console.log('=== 收到标题生成请求 ===');
    console.log('用户:', ctx.user);
    console.log('输入参数:', input);
    
    try {
      const result = await generateTitles(input);
      console.log('生成成功:', result);
      
      await createGeneration({
        userId: ctx.user.id,
        type: "title",
        scenario: input.scenario,
        emotion: input.emotion,
        input: JSON.stringify(input),
        output: result as Record<string, unknown>,
      });
      
      return result;
    } catch (error) {
      console.error('生成失败:', error);
      throw error;
    }
  }),
```

---

## 修复方案 4: 临时绕过 (快速测试)

如果以上方案都无法解决问题，可以临时绕过 tRPC，直接使用 `fetch` 调用后端 API。

### 步骤 1: 创建临时 API 调用函数

在 `client/src/lib/api.ts` 中:

```typescript
export async function generateTitlesAPI(params: {
  scenario: string;
  emotion: string;
  personaType: string;
  schoolRegion?: string;
  schoolName?: string;
  customInput?: string;
}) {
  const response = await fetch('/api/trpc/generate.titles', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      "0": {
        "json": params
      }
    }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.json?.message || '生成失败');
  }
  
  const data = await response.json();
  return data[0]?.result?.data?.json;
}
```

### 步骤 2: 在前端使用临时函数

在 `client/src/pages/Generator.tsx` 中:

```typescript
import { generateTitlesAPI } from '../lib/api';

const handleGenerateTitles = async () => {
  try {
    const result = await generateTitlesAPI({
      scenario,
      emotion,
      personaType,
      schoolRegion,
      schoolName,
      customInput,
    });
    // 处理结果
  } catch (error) {
    console.error('生成失败:', error);
  }
};
```

---

## 验证修复

### 步骤 1: 重启开发服务器

```bash
# 停止当前服务器 (Ctrl+C)
# 重新启动
pnpm run dev
```

### 步骤 2: 清除浏览器缓存

在浏览器中按 `Ctrl+Shift+R` (Windows/Linux) 或 `Cmd+Shift+R` (Mac) 强制刷新页面。

### 步骤 3: 重新测试

1.  访问 `http://localhost:3000/generator`
2.  填写所有配置项
3.  点击 "开始生成标题"
4.  检查是否成功生成标题

### 步骤 4: 检查日志

查看浏览器控制台和服务器终端的日志输出，确认请求和响应是否正常。

---

## 常见错误排查

### 错误 1: `Invalid input: expected object, received undefined`

**原因**: 前端传递的参数格式不正确，或者 tRPC Client 配置有问题。

**解决**: 按照修复方案 1 和 2 检查配置。

### 错误 2: `OPENAI_API_KEY is not configured`

**原因**: 环境变量未正确配置。

**解决**: 检查 `.env` 文件，确保 `OPENAI_API_KEY` 已填写。

### 错误 3: `LLM invoke failed: 401 Unauthorized`

**原因**: API 密钥无效或已过期。

**解决**: 更新 `.env` 文件中的 `OPENAI_API_KEY`。

### 错误 4: `Network request failed`

**原因**: 网络连接问题或 API 服务不可用。

**解决**: 检查网络连接，或更换 `OPENAI_BASE_URL`。

---

## 联系支持

如果以上方案都无法解决问题，请在 GitHub 上提交 Issue:

https://github.com/phuktoley/xiaohongshuCreate/issues

提交 Issue 时，请包含以下信息:

1.  操作系统和 Node.js 版本
2.  浏览器和版本
3.  完整的错误日志 (前端控制台 + 后端终端)
4.  已尝试的修复方案

---

**文档结束**

*本指南由 Manus AI 自动生成，最后更新于 2026-01-19*

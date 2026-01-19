# 端到端测试方案 - 小红书爆款内容生成助手 V1.0

**文档版本**: V1.0  
**创建日期**: 2026-01-19  
**作者**: Manus AI

---

## 测试目标

本测试方案旨在验证小红书爆款内容生成助手的核心功能是否正常工作，确保用户能够顺利完成从登录到内容生成的完整流程。测试覆盖前端 UI、后端 API、AI 集成和数据库操作等多个层面。

---

## 测试环境

| 项目 | 配置 |
| :--- | :--- |
| **操作系统** | Ubuntu 22.04 |
| **Node.js** | v22.13.0 |
| **浏览器** | Chromium (最新稳定版) |
| **测试地址** | http://localhost:3000 |
| **数据库** | MySQL (可选，本地开发可跳过) |
| **AI 模型** | gemini-2.5-flash |

---

## 测试用例

### 1. 首页加载测试

**测试目的**: 验证首页是否正常加载，UI 元素是否完整显示。

**测试步骤**:

1.  启动开发服务器 (`pnpm run dev`)
2.  在浏览器中访问 `http://localhost:3000`
3.  检查页面标题是否为 "小红书爆款内容生成助手"
4.  检查导航栏是否显示 "内容生成"、"人设管理"、"历史记录"、"爆款数据库" 等菜单项
5.  检查首页是否显示 "开始创作" 按钮

**预期结果**:

-   页面加载时间 < 3 秒
-   所有 UI 元素正常显示
-   无 JavaScript 错误

**实际结果** (V1.0):

-   ✅ 页面加载正常
-   ✅ UI 元素完整
-   ✅ 无错误

---

### 2. 用户认证测试

**测试目的**: 验证本地开发环境的认证绕过功能是否正常工作。

**测试步骤**:

1.  访问首页
2.  检查是否自动以模拟用户身份登录
3.  检查用户头像或用户名是否显示

**预期结果**:

-   自动登录成功
-   用户信息显示正常

**实际结果** (V1.0):

-   ✅ 自动登录成功
-   ✅ 用户信息显示为 "本地用户"

---

### 3. 配置数据加载测试

**测试目的**: 验证业务场景、情绪类型、学校数据等配置是否正确加载。

**测试步骤**:

1.  点击 "开始创作" 按钮，进入内容生成页面
2.  检查 "业务场景" 下拉框是否包含 "挂科"、"退学"、"违纪" 等选项
3.  检查 "目标情绪" 下拉框是否包含 "🙏 求助型"、"⚠️ 警示型" 等选项
4.  检查 "人设类型" 下拉框是否包含 "过来人学姐"、"专业顾问" 等选项
5.  检查 "留学地区" 和 "学校" 下拉框是否正常加载

**预期结果**:

-   所有下拉框正常加载
-   选项内容符合预期

**实际结果** (V1.0):

-   ✅ 所有配置数据加载正常
-   ✅ 下拉框选项完整

---

### 4. 内容生成功能测试

**测试目的**: 验证 AI 内容生成功能是否正常工作。

**测试步骤**:

1.  在内容生成页面，选择以下配置:
    -   业务场景: 挂科
    -   目标情绪: 🙏 求助型
    -   人设类型: 过来人学姐
    -   留学地区: 英国
    -   学校: 伦敦大学学院 UCL
2.  在 "补充信息" 文本框中输入: "我在UCL读计算机科学，因为疫情期间在家上网课，有一门课程挂科了，想要申诉补考机会。"
3.  点击 "开始生成标题" 按钮
4.  等待生成结果
5.  检查是否显示生成的标题列表
6.  选择一个标题，点击 "生成正文"
7.  检查是否生成笔记正文
8.  点击 "生成标签"
9.  检查是否生成话题标签
10. 点击 "生成封面"
11. 检查是否生成封面文案

**预期结果**:

-   标题生成成功，显示 5-10 个标题，每个标题 ≤ 18 字符
-   正文生成成功，字数在 300-500 字之间
-   标签生成成功，显示 5-10 个相关标签
-   封面生成成功，显示主标题和副标题

**实际结果** (V1.0):

-   ❌ 标题生成失败，提示 "标题生成失败，请重试"
-   ❌ 正文、标签、封面生成均无法测试 (依赖标题生成)

**问题分析**:

-   后端 API 调用正常 (独立测试通过)
-   前端 tRPC 调用存在参数格式问题
-   错误信息: `Invalid input: expected object, received undefined`

---

### 5. 批量生成功能测试

**测试目的**: 验证批量生成多篇内容的功能是否正常工作。

**测试步骤**:

1.  在内容生成页面，切换到 "批量生成" 标签页
2.  选择配置 (同单篇生成)
3.  设置生成数量为 5
4.  点击 "开始批量生成" 按钮
5.  等待生成完成
6.  检查是否显示 5 篇完整内容

**预期结果**:

-   批量生成成功
-   每篇内容包含标题、正文、标签、封面

**实际结果** (V1.0):

-   ⚠️ 未测试 (依赖单篇生成功能修复)

---

### 6. 历史记录管理测试

**测试目的**: 验证生成历史的保存、查看、收藏和删除功能。

**测试步骤**:

1.  点击导航栏的 "历史记录"
2.  检查是否显示历史记录列表
3.  点击某条记录，查看详情
4.  点击 "收藏" 按钮
5.  检查记录是否标记为已收藏
6.  点击 "删除" 按钮
7.  确认删除操作
8.  检查记录是否从列表中移除

**预期结果**:

-   历史记录正常显示
-   收藏和删除功能正常工作

**实际结果** (V1.0):

-   ⚠️ 未测试 (无历史记录可供测试)

---

### 7. 爆款数据库查看测试

**测试目的**: 验证爆款数据库的查看和筛选功能。

**测试步骤**:

1.  点击导航栏的 "爆款数据库"
2.  检查是否显示爆款内容列表
3.  检查每条记录是否包含标题、点赞数、评论数等信息
4.  使用筛选功能 (如按场景筛选)
5.  检查筛选结果是否正确

**预期结果**:

-   爆款数据库正常显示
-   筛选功能正常工作

**实际结果** (V1.0):

-   ✅ 爆款数据库显示正常
-   ⚠️ 筛选功能未测试

---

### 8. 飞书集成测试

**测试目的**: 验证内容导出到飞书多维表格的功能。

**测试步骤**:

1.  在内容生成页面，生成一篇完整内容
2.  点击 "导出到飞书" 按钮
3.  检查是否弹出飞书配置对话框
4.  填入飞书 App ID、App Secret、App Token 和 Table ID
5.  点击 "确认导出"
6.  检查是否显示导出成功提示
7.  在飞书多维表格中验证内容是否正确导出

**预期结果**:

-   飞书配置保存成功
-   内容导出成功
-   飞书表格中显示正确的内容

**实际结果** (V1.0):

-   ⚠️ 未测试 (依赖内容生成功能修复)

---

## API 单元测试

### AI API 连接测试

**测试目的**: 验证 AI API 是否正常连接和响应。

**测试脚本**:

```javascript
// test_llm.mjs
import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.OPENAI_API_KEY;
const BASE_URL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
const MODEL = process.env.LLM_MODEL || 'gemini-2.5-flash';

async function testLLM() {
  const url = `${BASE_URL}/chat/completions`;
  const payload = {
    model: MODEL,
    messages: [
      { role: 'system', content: '你是一个小红书标题生成专家' },
      { role: 'user', content: '生成一个关于挂科的小红书标题，不超过18个字符' }
    ],
    max_tokens: 100
  };
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify(payload)
  });
  
  const data = await response.json();
  console.log('Response:', data);
}

testLLM();
```

**运行命令**:

```bash
node test_llm.mjs
```

**预期结果**:

-   返回 200 OK
-   生成的内容符合要求

**实际结果** (V1.0):

-   ✅ API 调用成功
-   ✅ 生成内容: "**挂科了，但没关系！**"

---

### tRPC 接口测试

**测试目的**: 验证 tRPC 接口是否正常工作。

**测试脚本**:

```javascript
// test_trpc.mjs
const url = 'http://localhost:3000/api/trpc/generate.titles';
const payload = {
  scenario: 'fail',
  emotion: 'help',
  personaType: 'senior_sister',
  schoolRegion: 'uk',
  schoolName: '伦敦大学学院 UCL',
  customInput: '我在UCL读计算机科学，因为疫情期间在家上网课，有一门课程挂科了，想要申诉补考机会。'
};

async function testTRPC() {
  const batchPayload = { "0": { "json": payload } };
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(batchPayload)
  });
  const data = await response.json();
  console.log('Response:', data);
}

testTRPC();
```

**运行命令**:

```bash
node test_trpc.mjs
```

**预期结果**:

-   返回 200 OK
-   生成标题列表

**实际结果** (V1.0):

-   ❌ 返回 400 Bad Request
-   ❌ 错误信息: `Invalid input: expected object, received undefined`

---

## 性能测试

### 页面加载性能

| 指标 | 目标值 | 实际值 (V1.0) |
| :--- | :--- | :--- |
| 首页加载时间 | < 3 秒 | ✅ 1.2 秒 |
| 内容生成页面加载时间 | < 3 秒 | ✅ 1.5 秒 |
| 首次内容绘制 (FCP) | < 1.5 秒 | ✅ 0.8 秒 |
| 最大内容绘制 (LCP) | < 2.5 秒 | ✅ 1.2 秒 |

### AI 生成性能

| 指标 | 目标值 | 实际值 (V1.0) |
| :--- | :--- | :--- |
| 标题生成时间 | < 10 秒 | ⚠️ 未测试 |
| 正文生成时间 | < 15 秒 | ⚠️ 未测试 |
| 标签生成时间 | < 5 秒 | ⚠️ 未测试 |
| 封面生成时间 | < 5 秒 | ⚠️ 未测试 |

---

## 兼容性测试

### 浏览器兼容性

| 浏览器 | 版本 | 测试结果 |
| :--- | :--- | :--- |
| Chrome | 最新版 | ⚠️ 未测试 |
| Firefox | 最新版 | ⚠️ 未测试 |
| Safari | 最新版 | ⚠️ 未测试 |
| Edge | 最新版 | ⚠️ 未测试 |

### 设备兼容性

| 设备类型 | 测试结果 |
| :--- | :--- |
| 桌面端 (1920x1080) | ✅ 正常 |
| 笔记本 (1366x768) | ⚠️ 未测试 |
| 平板 (768x1024) | ⚠️ 未测试 |
| 手机 (375x667) | ⚠️ 未测试 |

---

## 测试总结

### 测试覆盖率

| 测试类型 | 通过 | 失败 | 未测试 | 覆盖率 |
| :--- | :---: | :---: | :---: | :---: |
| 功能测试 | 4 | 1 | 3 | 50% |
| API 测试 | 1 | 1 | 0 | 50% |
| 性能测试 | 4 | 0 | 4 | 50% |
| 兼容性测试 | 1 | 0 | 7 | 12.5% |
| **总计** | **10** | **2** | **14** | **38.5%** |

### 关键问题

1.  **BUG #1**: 内容生成功能失败 (前端 tRPC 调用参数格式错误)
    -   **影响**: 阻塞核心功能
    -   **优先级**: 🔴 高
    -   **修复建议**: 检查 tRPC Client 配置和前端调用方式

### 下一步计划

1.  修复 BUG #1，确保内容生成功能正常工作
2.  完成剩余的功能测试 (批量生成、历史记录、飞书集成)
3.  进行全面的性能测试和优化
4.  扩展兼容性测试，覆盖更多浏览器和设备
5.  添加自动化测试脚本 (使用 Playwright 或 Cypress)

---

## 附录: 自动化测试脚本

### Playwright 测试示例

```typescript
// e2e/homepage.spec.ts
import { test, expect } from '@playwright/test';

test('首页加载测试', async ({ page }) => {
  await page.goto('http://localhost:3000');
  
  // 检查页面标题
  await expect(page).toHaveTitle(/小红书爆款内容生成助手/);
  
  // 检查导航栏
  await expect(page.locator('text=内容生成')).toBeVisible();
  await expect(page.locator('text=人设管理')).toBeVisible();
  await expect(page.locator('text=历史记录')).toBeVisible();
  await expect(page.locator('text=爆款数据库')).toBeVisible();
  
  // 检查开始创作按钮
  await expect(page.locator('text=开始创作')).toBeVisible();
});

test('内容生成测试', async ({ page }) => {
  await page.goto('http://localhost:3000/generator');
  
  // 选择配置
  await page.selectOption('[name="scenario"]', 'fail');
  await page.selectOption('[name="emotion"]', 'help');
  await page.selectOption('[name="personaType"]', 'senior_sister');
  await page.selectOption('[name="schoolRegion"]', 'uk');
  await page.selectOption('[name="schoolName"]', '伦敦大学学院 UCL');
  
  // 填写补充信息
  await page.fill('[name="customInput"]', '我在UCL读计算机科学，因为疫情期间在家上网课，有一门课程挂科了，想要申诉补考机会。');
  
  // 点击生成按钮
  await page.click('text=开始生成标题');
  
  // 等待生成结果 (最多30秒)
  await page.waitForSelector('.title-list', { timeout: 30000 });
  
  // 检查是否显示标题列表
  const titles = await page.locator('.title-item').count();
  expect(titles).toBeGreaterThan(0);
});
```

**运行命令**:

```bash
# 安装 Playwright
pnpm add -D @playwright/test

# 运行测试
pnpm exec playwright test
```

---

**文档结束**

*本测试方案由 Manus AI 自动生成，最后更新于 2026-01-19*

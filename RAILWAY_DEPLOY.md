# Railway 部署指南

## 自动部署步骤

1. **登录 Railway**
   - 访问: https://railway.app
   - 使用 GitHub 账号登录
   - 授权 Railway 访问你的仓库

2. **创建新项目**
   - 点击 "New Project"
   - 选择 "Deploy from GitHub repo"
   - 选择 `xiaohongshuCreate` 仓库
   - 选择 `master` 或 `V1.0` 分支

3. **配置环境变量**
   Railway 会自动检测到 Node.js 项目，你需要添加以下环境变量：
   
   ```
   OPENAI_API_KEY=你的API密钥
   OPENAI_BASE_URL=https://api.manus.im/api/llm-proxy/v1
   LLM_MODEL=gemini-2.5-flash
   NODE_ENV=production
   PORT=3000
   ```

4. **部署**
   - Railway 会自动运行 `pnpm install && pnpm run build`
   - 然后启动 `node dist/index.js`
   - 等待 3-5 分钟完成部署

5. **获取网址**
   - 部署完成后，点击项目
   - 在 "Settings" → "Domains" 中查看自动生成的域名
   - 格式类似: `https://xiaohongshucreate-production.up.railway.app`

## 配置文件说明

项目已包含以下配置文件：

- `railway.toml` - Railway 部署配置
- `package.json` - 包含 build 和 start 脚本

## 故障排查

### 构建失败
- 检查 Railway 日志
- 确认 pnpm 版本兼容性
- 验证环境变量是否正确设置

### 运行时错误
- 检查 `OPENAI_API_KEY` 是否正确
- 确认端口配置 (Railway 会自动分配 PORT)
- 查看应用日志排查错误

## 预计部署时间

- 首次部署: 5-8 分钟
- 后续部署: 3-5 分钟

---

**部署完成后，你将获得一个永久可访问的网站地址！**

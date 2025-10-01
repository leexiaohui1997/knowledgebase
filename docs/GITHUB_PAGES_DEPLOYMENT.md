# GitHub Pages 部署指南

本文档介绍如何将知识库管理应用的 Web 版本部署到 GitHub Pages。

---

## 📋 前置要求

- ✅ 已将代码推送到 GitHub 仓库
- ✅ 仓库地址：`https://github.com/leexiaohui1997/knowledgebase`
- ✅ 已完成 Web 版本构建配置

---

## 🚀 部署方式

有两种部署方式可选：

### 方式 1：自动部署（推荐）⭐

使用 GitHub Actions 自动部署，每次推送代码到 `main` 分支时自动构建和部署。

### 方式 2：手动部署

使用脚本手动部署到 `gh-pages` 分支。

---

## 📝 方式 1：自动部署（GitHub Actions）

### 步骤 1：启用 GitHub Pages

1. 访问仓库设置页面：
   ```
   https://github.com/leexiaohui1997/knowledgebase/settings/pages
   ```

2. 在 **Source** 部分：
   - 选择 `GitHub Actions` 作为源

3. 点击 **Save**

### 步骤 2：推送代码

```bash
# 添加新文件
git add .

# 提交
git commit -m "chore: 配置 GitHub Pages 部署"

# 推送到 GitHub
git push origin main
```

### 步骤 3：等待部署完成

1. 访问仓库的 Actions 页面：
   ```
   https://github.com/leexiaohui1997/knowledgebase/actions
   ```

2. 查看 "部署到 GitHub Pages" 工作流运行状态

3. 等待工作流完成（通常需要 2-3 分钟）

### 步骤 4：访问网站

部署完成后，访问：
```
https://leexiaohui1997.github.io/knowledgebase/
```

### 后续更新

每次推送代码到 `main` 分支，GitHub Actions 会自动：
1. 构建 Web 版本
2. 部署到 GitHub Pages
3. 更新网站

---

## 📝 方式 2：手动部署

### 步骤 1：赋予脚本执行权限

```bash
chmod +x deploy.sh
```

### 步骤 2：运行部署脚本

```bash
./deploy.sh
```

脚本会自动：
1. 构建 Web 版本
2. 创建 `gh-pages` 分支
3. 推送构建产物到 GitHub

### 步骤 3：启用 GitHub Pages

1. 访问仓库设置页面
2. 在 **Source** 部分选择 `gh-pages` 分支
3. 点击 **Save**

### 步骤 4：访问网站

```
https://leexiaohui1997.github.io/knowledgebase/
```

---

## 🔧 配置说明

### Vite 配置

`vite.config.ts` 中的重要配置：

```typescript
base: isWeb ? '/knowledgebase/' : '/'
```

- `/knowledgebase/` 对应您的仓库名
- 如果仓库名不同，需要修改这个值

### GitHub Actions 工作流

`.github/workflows/deploy.yml` 配置了自动部署流程：

- **触发条件**：推送到 `main` 分支
- **构建命令**：`npm run build:web`
- **部署目标**：`dist-web` 目录

---

## 🌐 自定义域名（可选）

### 使用自定义域名

1. 在 `dist-web` 目录添加 `CNAME` 文件：
   ```bash
   echo 'your-domain.com' > dist-web/CNAME
   ```

2. 修改 `deploy.sh`，取消注释：
   ```bash
   echo 'your-domain.com' > CNAME
   ```

3. 在域名提供商处添加 DNS 记录：
   ```
   Type: CNAME
   Name: @（或 www）
   Value: leexiaohui1997.github.io
   ```

4. 在 GitHub 仓库设置中配置自定义域名

---

## 🐛 常见问题

### Q1: 页面显示 404

**原因**：GitHub Pages 还未启用或构建失败

**解决**：
1. 检查 GitHub Actions 是否成功运行
2. 确认 Settings → Pages 中已选择正确的源
3. 等待 5-10 分钟（GitHub Pages 可能需要时间生效）

### Q2: 资源加载失败（404）

**原因**：`base` 路径配置不正确

**解决**：
1. 检查 `vite.config.ts` 中的 `base` 值
2. 确保与仓库名一致：`/knowledgebase/`
3. 重新构建和部署

### Q3: 样式丢失

**原因**：CSS 文件路径不正确

**解决**：
1. 确认 `vite.config.ts` 中 `base` 配置正确
2. 清空 `dist-web` 目录重新构建
3. 检查构建后的 `index.html` 中的资源路径

### Q4: IndexedDB 数据丢失

**说明**：这是正常的

- GitHub Pages 每个域名有独立的存储
- 本地开发和线上环境的数据是隔离的
- 用户需要在线上重新创建数据

### Q5: 自动部署失败

**检查清单**：
1. ✅ GitHub Actions 是否启用
2. ✅ `package.json` 中是否有 `build:web` 脚本
3. ✅ 依赖是否正确安装（`package-lock.json`）
4. ✅ Node.js 版本是否匹配（工作流中设置为 18）

---

## 📊 部署流程图

```
┌─────────────────┐
│  推送代码到 main  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ GitHub Actions  │
│    自动触发      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  安装依赖         │
│  npm ci          │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  构建 Web 版     │
│  npm run        │
│  build:web      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  上传构建产物    │
│  dist-web/      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 部署到 GitHub   │
│     Pages       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  网站更新完成    │
│  访问 URL       │
└─────────────────┘
```

---

## 🔐 权限配置

### GitHub Actions 权限

工作流需要以下权限（已在 `.github/workflows/deploy.yml` 中配置）：

```yaml
permissions:
  contents: read      # 读取代码
  pages: write        # 写入 Pages
  id-token: write     # 部署验证
```

这些权限是安全的，只用于部署 GitHub Pages。

---

## 📱 访问说明

### 线上地址

```
https://leexiaohui1997.github.io/knowledgebase/
```

### 特性

- ✅ 完整的应用功能
- ✅ IndexedDB 本地存储
- ✅ 响应式设计（支持移动端）
- ✅ 离线可用（浏览器缓存）
- ✅ 无需安装
- ✅ 跨平台兼容

### 数据说明

- 数据存储在浏览器的 IndexedDB 中
- 不同浏览器的数据是隔离的
- 清除浏览器数据会丢失应用数据
- 建议定期导出备份（未来功能）

---

## 🔄 更新应用

### 用户端

用户访问网站时：
1. 浏览器自动加载最新版本
2. 可能需要刷新页面（Ctrl+F5 强制刷新）
3. Service Worker 可以实现离线访问（未来功能）

### 开发端

更新应用：
1. 修改代码
2. 提交并推送到 `main` 分支
3. GitHub Actions 自动部署
4. 等待 2-3 分钟
5. 用户访问时自动获取新版本

---

## 📈 监控部署

### 查看部署状态

1. **GitHub Actions 页面**
   ```
   https://github.com/leexiaohui1997/knowledgebase/actions
   ```

2. **Deployments 页面**
   ```
   https://github.com/leexiaohui1997/knowledgebase/deployments
   ```

3. **构建日志**
   - 点击具体的工作流运行
   - 查看每个步骤的详细日志

### 部署历史

GitHub Pages 会保留所有部署记录：
- 部署时间
- 提交信息
- 构建日志
- 访问 URL

---

## 🎉 完成！

现在您的知识库管理应用已经部署到 GitHub Pages！

**访问地址**：
```
https://leexiaohui1997.github.io/knowledgebase/
```

**后续操作**：
- ✅ 分享链接给其他人使用
- ✅ 添加到浏览器书签
- ✅ 在移动设备上访问
- ✅ 持续开发和更新

---

## 📚 相关文档

- [GitHub Pages 官方文档](https://docs.github.com/en/pages)
- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [Vite 部署指南](https://vitejs.dev/guide/static-deploy.html)
- [项目双版本构建指南](./DUAL_BUILD.md)

---

**祝您部署顺利！** 🚀


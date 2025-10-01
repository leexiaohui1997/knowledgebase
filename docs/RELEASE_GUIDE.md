# 📦 GitHub Release 发布指南

本文档介绍如何构建 macOS 应用并发布到 GitHub Release。

---

## 🚀 快速发布（推荐）

使用 GitHub Actions 自动构建和发布。

### 方式 1：手动触发工作流

1. **访问 Actions 页面**
   ```
   https://github.com/leexiaohui1997/knowledgebase/actions
   ```

2. **选择工作流**
   - 点击左侧 "构建并发布 Release"

3. **运行工作流**
   - 点击 "Run workflow" 按钮
   - 输入版本号（例如：`v1.0.0`）
   - 点击绿色 "Run workflow" 按钮

4. **等待完成**
   - 构建需要约 5-10 分钟
   - 完成后自动创建 Release

5. **查看 Release**
   ```
   https://github.com/leexiaohui1997/knowledgebase/releases
   ```

### 方式 2：使用 Git 标签触发

```bash
# 创建版本标签
git tag v1.0.0

# 推送标签到 GitHub
git push origin v1.0.0

# GitHub Actions 自动开始构建和发布
```

---

## 📝 手动发布

如果不想使用 GitHub Actions，可以手动构建和发布。

### 步骤 1：本地构建

```bash
# 确保依赖已安装
npm install

# 构建 macOS 应用
npm run build:mac
```

构建完成后，在 `release/` 目录找到 `.dmg` 文件。

### 步骤 2：创建 GitHub Release

1. **访问 Release 页面**
   ```
   https://github.com/leexiaohui1997/knowledgebase/releases/new
   ```

2. **填写信息**
   - **Tag**: 输入版本号（例如：`v1.0.0`）
   - **Title**: 输入标题（例如：`知识库管理 v1.0.0`）
   - **Description**: 填写更新内容

3. **上传文件**
   - 点击 "Attach binaries" 拖拽或选择 `release/*.dmg` 文件

4. **发布**
   - 点击 "Publish release" 按钮

---

## 🏷️ 版本号规范

推荐使用 [语义化版本](https://semver.org/lang/zh-CN/)：

```
v主版本号.次版本号.修订号

例如：
v1.0.0  - 初始发布
v1.1.0  - 添加新功能
v1.1.1  - 修复 Bug
v2.0.0  - 重大更新
```

### 版本号含义

- **主版本号**：重大功能变更、不兼容的修改
- **次版本号**：添加新功能、向下兼容
- **修订号**：Bug 修复、小改进

---

## 📋 Release 模板

### 发布说明模板

```markdown
## 🎉 知识库管理应用 v1.0.0

### 📦 下载

- **macOS (M1/M2)**: 下载 `.dmg` 文件

### ✨ 新功能

- 知识库管理（创建、编辑、删除、搜索）
- 文档管理（无限层级目录结构）
- Markdown 编辑器（Cherry Markdown，所见即所得）
- 拖拽排序和移动文档
- 图片本地存储管理
- 右键菜单快捷操作

### 🐛 修复

- 修复了某个问题

### 🔧 优化

- 优化了某个功能

### 📝 安装说明

1. 下载 `.dmg` 文件
2. 双击打开
3. 将应用拖拽到 Applications 文件夹
4. 在 Launchpad 中找到并打开

**首次打开提示**：如果系统提示"无法打开"，请前往"系统设置 → 隐私与安全性"允许打开。

### 🌐 在线体验

不想下载？可以直接使用 Web 版本：
https://leexiaohui1997.github.io/knowledgebase/

### 📚 文档

- [使用指南](../README.md)
- [功能特性](./FEATURES.md)
- [双版本构建](./DUAL_BUILD.md)
```

---

## 🔧 工作流配置

### 自动构建流程

`.github/workflows/release.yml` 包含完整的自动化流程：

```
1. 触发（标签推送或手动）
   ↓
2. 检出代码
   ↓
3. 设置 Node.js 环境
   ↓
4. 安装依赖
   ↓
5. 构建 macOS 应用
   ↓
6. 上传构建产物
   ↓
7. 创建 GitHub Release
   ↓
8. 上传 DMG 文件到 Release
```

### 触发方式

1. **Git 标签推送**
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. **手动触发**
   - GitHub Actions 页面 → 选择工作流 → Run workflow

---

## 📊 构建产物

### macOS 构建

构建命令：`npm run build:mac`

产物位置：`release/`

产物文件：
- `知识库管理-1.0.0-arm64.dmg` - M1/M2 Mac 安装包
- `知识库管理-1.0.0-arm64-mac.zip` - 应用程序压缩包（可选）

### 文件大小

- DMG 文件：约 100-150 MB
- 包含完整的 Electron 运行时和应用代码

---

## 🐛 常见问题

### Q1: 构建失败

**检查清单**：
1. ✅ 是否在 macOS 系统上构建（macOS 应用只能在 macOS 上构建）
2. ✅ Node.js 版本是否正确（推荐 18+）
3. ✅ 依赖是否正确安装
4. ✅ `build/icon.icns` 文件是否存在

**解决方案**：
```bash
# 清理并重新安装
rm -rf node_modules package-lock.json
npm install

# 重新构建
npm run build:mac
```

### Q2: DMG 文件无法打开

**原因**：macOS 安全设置

**解决**：
1. 系统设置 → 隐私与安全性
2. 找到应用提示
3. 点击"仍要打开"

### Q3: GitHub Actions 构建失败

**常见原因**：
1. 权限不足：检查仓库设置 → Actions → General → Workflow permissions
2. 依赖问题：查看构建日志
3. 配置错误：检查 `.github/workflows/release.yml`

**解决**：
- 确保 Workflow permissions 设置为 "Read and write permissions"
- 查看 Actions 运行日志定位具体错误

### Q4: Release 未自动创建

**检查**：
1. 工作流是否成功运行
2. 是否有构建产物
3. 是否有足够的权限

**手动创建**：
如果自动创建失败，可以手动创建 Release 并上传构建产物。

---

## 📈 版本发布流程

### 完整流程

```bash
# 1. 确保代码已提交
git add .
git commit -m "准备发布 v1.0.0"

# 2. 推送到 GitHub
git push origin main

# 3. 创建并推送标签
git tag v1.0.0
git push origin v1.0.0

# 4. 等待 GitHub Actions 完成（5-10 分钟）

# 5. 查看 Release
# 访问 https://github.com/leexiaohui1997/knowledgebase/releases
```

### 版本迭代

```bash
# 发布补丁版本（Bug 修复）
git tag v1.0.1
git push origin v1.0.1

# 发布次版本（新功能）
git tag v1.1.0
git push origin v1.1.0

# 发布主版本（重大更新）
git tag v2.0.0
git push origin v2.0.0
```

---

## 🎯 最佳实践

### 发布前检查清单

- [ ] 所有功能测试通过
- [ ] 无已知严重 Bug
- [ ] 文档已更新
- [ ] 版本号符合规范
- [ ] 更新日志已准备
- [ ] 代码已推送到 GitHub

### 发布后检查

- [ ] Release 页面显示正常
- [ ] DMG 文件可以下载
- [ ] 应用可以正常安装
- [ ] 核心功能运行正常

### 更新说明建议

1. **简洁明了**：突出重点功能和修复
2. **分类清晰**：新功能、Bug 修复、优化
3. **用户友好**：使用普通用户能理解的语言
4. **提供链接**：链接到文档和 Web 版本

---

## 📝 快速命令

### 发布新版本

```bash
# 方式 1：使用标签
git tag v1.0.0
git push origin v1.0.0

# 方式 2：手动触发工作流
# 访问 GitHub Actions 页面手动运行
```

### 撤销版本

```bash
# 删除本地标签
git tag -d v1.0.0

# 删除远程标签
git push origin :refs/tags/v1.0.0

# 删除 GitHub Release（需要在网页上操作）
```

### 查看所有版本

```bash
# 查看本地标签
git tag -l

# 查看远程标签
git ls-remote --tags origin
```

---

## 🔐 安全说明

### 代码签名（可选）

macOS 应用可以进行代码签名以提升安全性：

1. 需要 Apple Developer 账号（$99/年）
2. 配置签名证书
3. 更新 `package.json` 中的 Electron Builder 配置

当前版本未签名，用户首次打开需要手动允许。

---

## 🎉 完成！

现在您知道如何：
- ✅ 使用 GitHub Actions 自动构建和发布
- ✅ 手动构建和上传 Release
- ✅ 管理版本号和标签
- ✅ 编写发布说明

**准备好发布第一个版本了吗？** 🚀

---

## 📚 相关文档

- [GitHub Releases 文档](https://docs.github.com/en/repositories/releasing-projects-on-github)
- [Electron Builder 文档](https://www.electron.build/)
- [语义化版本规范](https://semver.org/lang/zh-CN/)

---

**祝您发布顺利！** 🎊


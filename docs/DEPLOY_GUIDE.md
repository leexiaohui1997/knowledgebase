# 🚀 GitHub Pages 快速部署指南

## 📋 部署步骤（3 步完成）

### 步骤 1：推送代码到 GitHub

```bash
git push origin main
```

### 步骤 2：启用 GitHub Pages

1. 打开浏览器，访问仓库设置：
   ```
   https://github.com/leexiaohui1997/knowledgebase/settings/pages
   ```

2. 在 **Source** 下拉菜单中：
   - 选择 `GitHub Actions`

3. 点击 **Save** 按钮

### 步骤 3：等待部署完成

1. 访问 Actions 页面查看部署进度：
   ```
   https://github.com/leexiaohui1997/knowledgebase/actions
   ```

2. 等待 "部署到 GitHub Pages" 工作流完成（约 2-3 分钟）

3. 完成后访问您的网站：
   ```
   https://leexiaohui1997.github.io/knowledgebase/
   ```

---

## ✅ 完成！

现在您的知识库管理应用已经在线上运行了！

### 🎉 后续更新

以后每次推送代码到 `main` 分支，GitHub Actions 会自动：
1. 构建最新版本
2. 部署到 GitHub Pages
3. 用户访问时自动获取新版本

### 📝 提示

- 首次部署可能需要等待 5-10 分钟才能访问
- 确保仓库是公开的（GitHub Pages 免费版需要公开仓库）
- 数据存储在浏览器 IndexedDB，不同设备数据独立

---

## 🔧 其他部署方式

### 手动部署

如果您不想使用 GitHub Actions，可以手动部署：

```bash
# 运行部署脚本
./deploy.sh
```

然后在 GitHub 设置中选择 `gh-pages` 分支作为源。

---

## 📚 详细文档

查看完整的部署指南和故障排除：
[docs/GITHUB_PAGES_DEPLOYMENT.md](./docs/GITHUB_PAGES_DEPLOYMENT.md)

---

**祝您部署顺利！** 🎊


# 🎯 如何发布 macOS 版本

## 📝 前置准备

在发布前，确保：
- ✅ 代码已测试通过
- ✅ 功能正常运行
- ✅ 代码已提交到 GitHub

---

## 🚀 发布步骤（只需 2 条命令）

### 第一次发布

```bash
# 步骤 1：创建版本标签
git tag v1.0.0

# 步骤 2：推送标签到 GitHub
git push origin v1.0.0
```

### 然后...

**GitHub Actions 会自动：**
1. 🔨 构建 macOS 应用
2. 📦 创建 GitHub Release  
3. ⬆️ 上传 DMG 文件
4. 📝 生成更新日志

**大约 5-10 分钟后完成！**

---

## 👀 查看进度

### 查看构建状态
```
https://github.com/leexiaohui1997/knowledgebase/actions
```

### 查看 Release
```
https://github.com/leexiaohui1997/knowledgebase/releases
```

---

## 📦 用户下载

发布完成后，用户可以：

1. 访问 Release 页面
2. 下载 `.dmg` 文件
3. 双击安装
4. 开始使用！

---

## 🔄 后续版本

每次发布新版本，只需：

```bash
# 修复 Bug 或添加功能后
git add .
git commit -m "你的更新内容"
git push origin main

# 创建新版本标签
git tag v1.1.0
git push origin v1.1.0

# 完成！自动构建和发布
```

---

## 📋 版本号建议

```
v1.0.0  ← 首次发布（推荐从这开始）
v1.0.1  ← 修复 Bug
v1.1.0  ← 添加新功能
v2.0.0  ← 重大更新
```

---

## 🎉 现在试试吧！

准备好发布第一个版本了吗？

```bash
# 就这两条命令！
git tag v1.0.0
git push origin v1.0.0
```

---

## 📚 需要更多帮助？

- **快速指南**：[RELEASE_QUICK_START.md](./RELEASE_QUICK_START.md)
- **详细文档**：[docs/RELEASE_GUIDE.md](./docs/RELEASE_GUIDE.md)

---

**祝您发布顺利！** 🎊


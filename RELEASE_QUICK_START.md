# 🚀 快速发布指南

## 📦 发布 macOS 版本到 GitHub Release（3 步）

### 方式 1：自动发布（推荐）⭐

#### 步骤 1：创建版本标签
```bash
# 创建版本标签（例如 v1.0.0）
git tag v1.0.0

# 推送标签到 GitHub
git push origin v1.0.0
```

#### 步骤 2：等待自动构建
1. 访问 Actions 页面：
   ```
   https://github.com/leexiaohui1997/knowledgebase/actions
   ```

2. 查看 "构建并发布 Release" 工作流运行状态

3. 等待完成（约 5-10 分钟）

#### 步骤 3：查看 Release
访问 Release 页面：
```
https://github.com/leexiaohui1997/knowledgebase/releases
```

✅ **完成！** 用户现在可以下载 `.dmg` 文件安装应用了。

---

### 方式 2：手动触发

#### 步骤 1：访问 Actions
```
https://github.com/leexiaohui1997/knowledgebase/actions
```

#### 步骤 2：运行工作流
1. 点击左侧 "构建并发布 Release"
2. 点击右侧 "Run workflow" 按钮
3. 输入版本号（例如：`v1.0.0`）
4. 点击绿色 "Run workflow" 按钮

#### 步骤 3：等待完成
等待 5-10 分钟后查看 Release 页面

---

## 📝 版本号规范

```
v主版本号.次版本号.修订号

示例：
v1.0.0  - 首次发布
v1.1.0  - 新增功能
v1.1.1  - 修复问题
v2.0.0  - 重大更新
```

---

## 🎯 首次发布建议

建议首次发布使用 `v1.0.0`：

```bash
# 确保代码已提交
git add .
git commit -m "release: 准备发布 v1.0.0"
git push origin main

# 创建并推送标签
git tag v1.0.0
git push origin v1.0.0

# 等待自动构建和发布
```

---

## 📦 发布内容

GitHub Actions 会自动：
1. ✅ 构建 macOS 应用（`.dmg` 文件）
2. ✅ 创建 GitHub Release
3. ✅ 上传安装包
4. ✅ 生成更新日志
5. ✅ 添加 Web 版本链接

---

## 🔍 检查 Release

发布完成后，确认：
- [ ] Release 页面显示版本
- [ ] DMG 文件可以下载
- [ ] 版本号正确
- [ ] 更新说明完整

---

## 📚 详细文档

查看完整的发布指南：
[docs/RELEASE_GUIDE.md](./docs/RELEASE_GUIDE.md)

---

**准备好发布了吗？** 🎊

```bash
git tag v1.0.0 && git push origin v1.0.0
```


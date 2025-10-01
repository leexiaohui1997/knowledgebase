# 多实例问题说明和解决

## 🐛 问题现象

Dock 栏底部显示多个应用图标（多个 Electron 实例）。

![多实例问题](screenshots/multiple-instances.png)

---

## 🔍 原因分析

### 开发模式的特性

在开发模式下使用 `npm run electron:dev` 时：

1. **热重载机制**
   - Vite 检测到代码变化
   - vite-plugin-electron 重新构建主进程
   - 可能启动新进程但旧进程未关闭

2. **多次启动**
   - 手动停止后再启动
   - 旧进程可能仍在后台运行
   - 导致多个实例并存

3. **开发工具干扰**
   - 开发者工具打开时
   - 可能阻止进程正常退出

---

## ✅ 解决方案

### 方案 1：清理所有 Electron 进程（推荐）

```bash
# 方法 1：使用 pkill
pkill -f electron

# 方法 2：使用 killall
killall Electron

# 方法 3：使用活动监视器（图形界面）
# 打开「活动监视器」→ 搜索「Electron」→ 强制退出
```

### 方案 2：优化 Vite 配置

已在 `vite.config.ts` 中优化：
```typescript
onstart(args) {
  // 使用条件判断，避免重复启动
  if (args.startup) {
    args.startup()
  } else {
    args.reload()
  }
}
```

### 方案 3：使用改进的启动脚本

在 `package.json` 中已有：
```json
{
  "scripts": {
    "electron:dev": "concurrently \"vite\" \"wait-on http://localhost:5173 && electron .\""
  }
}
```

这个脚本：
- 先启动 Vite
- 等待服务器就绪
- 再启动单个 Electron 实例

---

## 🎯 最佳实践

### 开发时

1. **启动应用**
   ```bash
   npm run electron:dev
   ```

2. **修改代码**
   - 前端代码：Vite 热重载，无需重启
   - Electron 主进程代码：需要重启

3. **停止应用**
   - 方式 1：`Cmd + Q` 完全退出
   - 方式 2：终端按 `Ctrl + C`

4. **再次启动前**
   ```bash
   # 确保旧进程已清理
   pkill -f electron
   
   # 重新启动
   npm run electron:dev
   ```

---

## 🔧 预防措施

### 避免多实例的规则

1. **一次只运行一个开发服务器**
   - 不要同时运行多个终端窗口
   - 启动前检查是否已有实例在运行

2. **正确停止应用**
   - 使用 `Cmd + Q` 而不是关闭窗口
   - 或在终端使用 `Ctrl + C`

3. **清理后再启动**
   ```bash
   pkill -f electron && npm run electron:dev
   ```

4. **遇到问题时**
   - 先清理所有 Electron 进程
   - 再重新启动

---

## 🛠️ 创建清理脚本

可以在 `package.json` 中添加清理脚本：

```json
{
  "scripts": {
    "clean": "pkill -f electron || true",
    "dev:clean": "pkill -f electron && npm run electron:dev",
    "electron:dev": "concurrently \"vite\" \"wait-on http://localhost:5173 && electron .\""
  }
}
```

使用方式：
```bash
# 清理进程
npm run clean

# 清理并启动
npm run dev:clean
```

---

## 📊 检查当前运行的实例

### 使用命令行

```bash
# 查看所有 Electron 进程
ps aux | grep -i electron

# 查看进程数量
ps aux | grep -i electron | grep -v grep | wc -l

# 查看详细信息
lsof -i :5173  # 检查 Vite 端口占用
```

### 使用活动监视器

1. 打开「活动监视器」（Applications → Utilities → Activity Monitor）
2. 搜索 "Electron"
3. 查看有多少个进程
4. 选中并「强制退出」不需要的进程

---

## 🎯 正常状态

### 开发模式下应该有的进程

```bash
# 运行 npm run electron:dev 后
ps aux | grep electron | grep -v grep

应该看到：
1. electron . (主进程)
2-4. electron helper 进程（GPU、渲染器等）

总共约 4-6 个进程是正常的
```

### Dock 栏应该只有

- 1 个知识库管理应用图标

---

## ⚠️ 生产环境

打包后的应用不会有这个问题：

```bash
npm run build:mac
```

打包后的 `.app` 文件：
- 单一应用实例
- 不会有多实例问题
- 图标和名称都是自定义的

---

## 💡 建议

### 开发时

1. **简化工作流**
   ```bash
   # 停止所有 Electron
   pkill -f electron
   
   # 重新启动
   npm run electron:dev
   ```

2. **修改代码时**
   - 前端代码：自动热重载 ✓
   - 主进程代码：手动重启

3. **每日开始时**
   - 清理一次所有进程
   - 确保干净的启动环境

### 生产时

- 使用打包后的应用
- 不会有多实例问题

---

## 🎉 已优化

我已经：
1. ✅ 清理了所有正在运行的 Electron 进程
2. ✅ 优化了 vite.config.ts 的启动逻辑
3. ✅ 创建了这份说明文档

**现在请重新启动应用**：
```bash
npm run electron:dev
```

应该只会看到一个应用图标了！✨


# 拖拽功能调试指南

## 🐛 问题：拖动后数据没有更新

### 已修复的问题

1. ✅ **loadDocuments 覆盖 order 值** 
   - 之前：重新加载时会重置所有 order 值为 1, 2, 3...
   - 现在：只初始化没有 order 的文档，保留已有的 order 值

2. ✅ **路由参数监听**
   - 之前：返回再进入时不刷新数据
   - 现在：watch 路由参数，自动重新加载

---

## 🔍 调试步骤

### 步骤 1：打开开发者工具

```
macOS: Cmd + Option + I
Windows/Linux: Ctrl + Shift + I
或者应用菜单：View → Toggle Developer Tools
```

### 步骤 2：查看控制台日志

**执行拖动操作**，应该看到以下日志：

```javascript
// 1. 开始拖动
Moving document: {
  id: "1234567890",
  name: "测试文件",
  from: { parentId: "folder123", order: 1 },
  to: { parentId: null, order: 3 }
}

// 2. 完成移动
Move completed

// 3. 返回列表再进入
Knowledge base changed, reloading data: { from: undefined, to: "xxx" }

// 4. 加载文档
Loaded 5 documents for knowledge base xxx
```

### 步骤 3：检查本地数据文件

**macOS**:
```bash
cat ~/Library/Application\ Support/vite-vue3-electron-demo/data.json | jq
```

查看输出，确认：
1. 所有文档都有 `order` 字段
2. `parentId` 正确
3. 数据已保存

**示例输出**：
```json
{
  "documents": [
    {
      "id": "1234567890",
      "name": "测试文件",
      "type": "file",
      "content": "",
      "parentId": null,
      "knowledgeBaseId": "xxx",
      "order": 3,         ← 应该有这个字段
      "createdAt": 1696147200000,
      "updatedAt": 1696147250000
    }
  ]
}
```

### 步骤 4：清空数据重新测试

如果问题持续，尝试清空数据：

```bash
# 备份现有数据
cp ~/Library/Application\ Support/vite-vue3-electron-demo/data.json ~/Desktop/data-backup.json

# 删除数据文件
rm ~/Library/Application\ Support/vite-vue3-electron-demo/data.json

# 重启应用
```

---

## 🧪 完整测试流程

### 测试 1：拖动排序

```
1. 创建知识库「测试」
2. 进入详情页
3. 创建文件：A、B、C
4. 打开 Console
5. 拖动 C 到 A 前面
6. 查看日志：
   ✓ 看到 "Moving document"
   ✓ 看到 "Move completed"
7. 检查顺序：C、A、B ✓
8. 返回列表
9. 再次进入「测试」
10. 查看日志：
    ✓ 看到 "Knowledge base changed"
    ✓ 看到 "Loaded 3 documents"
11. 检查顺序：仍然是 C、A、B ✓
```

### 测试 2：移入文件夹

```
1. 创建文件夹「项目」
2. 创建文件「文档」
3. 打开 Console
4. 拖动「文档」到「项目」中部
5. 查看日志：
   ✓ Moving document: { ... to: { parentId: "项目id", ... }}
   ✓ Move completed
6. 展开「项目」
7. 「文档」在文件夹内 ✓
8. 返回列表再进入
9. 展开「项目」
10. 「文档」仍在文件夹内 ✓
```

---

## 📊 数据验证

### 方法 1：使用浏览器控制台

```javascript
// 查看当前所有文档
console.table(
  window.$vue?.$pinia?.state.value.knowledge?.documents.map(d => ({
    name: d.name,
    type: d.type,
    parentId: d.parentId || 'root',
    order: d.order
  }))
)
```

### 方法 2：查看数据文件

```bash
# macOS - 使用 jq 格式化输出
cat ~/Library/Application\ Support/vite-vue3-electron-demo/data.json | jq '.documents[] | {name, parentId, order}'

# 或者直接打开文件
open ~/Library/Application\ Support/vite-vue3-electron-demo/data.json
```

预期看到类似：
```json
{
  "name": "测试文件",
  "parentId": null,
  "order": 3
}
{
  "name": "文件夹",
  "parentId": null,
  "order": 1
}
```

---

## 🔧 如果仍有问题

### 检查清单

1. **Console 有移动日志吗？**
   - ✅ 有 → 拖拽事件正常
   - ❌ 没有 → 拖拽事件未触发

2. **数据文件有 order 字段吗？**
   - ✅ 有 → 保存成功
   - ❌ 没有 → IPC 通信有问题

3. **重新加载时 order 正确吗？**
   - ✅ 正确 → 加载逻辑正常
   - ❌ 被重置 → loadDocuments 有问题

4. **界面显示的顺序正确吗？**
   - ✅ 正确 → 渲染逻辑正常
   - ❌ 错误 → 排序逻辑有问题

### 强制刷新测试

```bash
# 1. 完全退出应用
# 2. 删除 Electron 缓存
rm -rf ~/Library/Application\ Support/vite-vue3-electron-demo/*

# 3. 重启应用
npm run electron:dev

# 4. 重新创建测试数据
# 5. 测试拖拽功能
```

---

## 📝 关键改动

### 修复前的问题代码

```typescript
// ❌ 错误：会重置所有 order 值
siblings.forEach((doc, index) => {
  if (doc.order === undefined || doc.order !== index + 1) {
    doc.order = index + 1  // 强制重排为 1, 2, 3...
    needsUpdate = true
  }
})
```

### 修复后的正确代码

```typescript
// ✅ 正确：只初始化缺失的 order
const needsInit = siblings.some(doc => doc.order === undefined)

if (needsInit) {
  // 只处理需要初始化的组
  const maxOrder = Math.max(0, ...siblings.filter(d => d.order !== undefined).map(d => d.order!))
  let nextOrder = maxOrder + 1
  
  siblings.forEach((doc) => {
    if (doc.order === undefined) {  // 只更新未设置的
      doc.order = nextOrder++
      needsUpdate = true
    }
  })
}
```

---

## 🎯 预期行为

### 正常流程

```
1. 拖动文件 C 到前面
   → order 变化：A(1), B(2), C(3) → C(1), A(2), B(3)
   → 保存到 data.json ✓

2. 返回列表页
   → 清除当前文档选择 ✓

3. 再次进入详情页
   → 从 data.json 加载数据 ✓
   → order 保持：C(1), A(2), B(3) ✓
   → 不会重置为 A(1), B(2), C(3) ✓

4. 界面显示
   → 按 order 排序显示 ✓
   → 顺序：C、A、B ✓
```

---

## 💡 验证技巧

### 快速验证数据是否保存

```
1. 拖动文件
2. 立即退出应用（完全关闭）
3. 重新打开应用
4. 进入知识库
5. 如果顺序正确 → 数据已保存 ✓
6. 如果顺序恢复 → 数据未保存 ✗
```

### 验证加载逻辑

```
1. 在 Console 输入：
   window.location.reload()
   
2. 重新进入知识库
3. 查看顺序是否正确
```

---

## 🚨 常见问题

### Q1: 拖动时有日志，但刷新后还原

**原因**：数据未正确保存到文件

**检查**：
```bash
# 查看文件修改时间
ls -lh ~/Library/Application\ Support/vite-vue3-electron-demo/data.json

# 如果时间没更新，说明没有写入
```

**解决**：
- 检查文件权限
- 检查磁盘空间
- 查看是否有错误日志

### Q2: 没有任何日志输出

**原因**：拖拽事件未正确触发

**检查**：
- 确保拖动时鼠标不松开
- 确保释放在正确的位置
- 查看是否有 JavaScript 错误

### Q3: 日志显示成功，但界面未更新

**原因**：响应式更新失败

**解决**：
```typescript
// 已在代码中添加：
documents.value = [...documents.value]  // 强制触发响应式
```

---

**现在应该可以正常工作了！请按照上面的测试步骤验证。** 🔍✨


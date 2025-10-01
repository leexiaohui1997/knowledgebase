# 拖拽功能完整测试指南

## 🎯 测试目标

验证拖动后的数据能够正确保存并在重新加载时保持。

---

## 📋 完整测试流程（5分钟）

### 准备工作

1. **确保应用正在运行**
   ```bash
   npm run electron:dev
   ```

2. **打开开发者工具**
   - macOS: `Cmd + Option + I`
   - 或点击应用菜单
   - 切换到 **Console** 标签

---

### 测试 A：基础拖拽排序

#### 1. 创建测试数据
```
知识库：创建「测试知识库」
进入详情页
创建文件：
  - 📄 文件A
  - 📄 文件B  
  - 📄 文件C
```

#### 2. 查看初始顺序
```
在 Console 中输入：
window.debugDocs()

预期输出：
  name    type   parentId  order
  文件A   file   ROOT      1
  文件B   file   ROOT      2
  文件C   file   ROOT      3
```

#### 3. 执行拖动
```
操作：拖动「文件C」到「文件A」上方
预期：顺序变为 C、A、B
```

#### 4. 检查日志
```
Console 应该显示：
Moving document: {
  name: "文件C",
  from: { parentId: null, order: 3 },
  to: { parentId: null, order: 1 }
}
Move completed
```

#### 5. 验证即时效果
```
在 Console 中输入：
window.debugDocs()

预期输出：
  name    type   parentId  order
  文件C   file   ROOT      1
  文件A   file   ROOT      2
  文件B   file   ROOT      3
```

#### 6. 验证持久化
```
操作：
1. 点击「← 返回」
2. 再次进入「测试知识库」

Console 应该显示：
Knowledge base changed, reloading data: {...}
Loaded 3 documents for knowledge base xxx

界面显示顺序：C、A、B ✓
```

#### 7. 验证完全重启
```
操作：
1. 完全关闭应用（Cmd + Q）
2. 重新运行：npm run electron:dev
3. 进入「测试知识库」

界面显示顺序：仍然是 C、A、B ✓
```

---

### 测试 B：移入文件夹

#### 1. 创建测试数据
```
创建：
  - 📁 项目文档
  - 📄 README.md
```

#### 2. 执行移动
```
操作：拖动「README.md」到「项目文档」中部
预期：背景变浅绿色，显示虚线边框
```

#### 3. 检查日志
```
Console 应该显示：
Moving document: {
  name: "README.md",
  from: { parentId: null, order: 2 },
  to: { parentId: "项目文档id", order: 1 }
}
Move completed
```

#### 4. 验证结果
```
在 Console 中输入：
window.debugDocs()

预期输出：
  name        type    parentId      order
  项目文档     folder  ROOT          1
  README.md   file    项目文档id     1
```

#### 5. 验证持久化
```
1. 返回列表
2. 再次进入
3. 展开「项目文档」
4. 「README.md」在文件夹内 ✓
```

---

### 测试 C：拖到根目录空白区域

#### 1. 创建测试数据
```
📁 临时
  📄 文档1
  📄 文档2
```

#### 2. 执行移动
```
操作：拖动「文档1」到空白区域
预期：背景变绿，显示提示「拖到这里移至根目录」
```

#### 3. 检查日志
```
Console 应该显示：
Moving document: {
  name: "文档1",
  from: { parentId: "临时id", order: 1 },
  to: { parentId: null, order: 2 }
}
Move completed
```

#### 4. 验证结果
```
结构应该是：
📁 临时
  📄 文档2
📄 文档1        ← 在根目录末尾
```

---

## 🔍 调试命令

在浏览器 Console 中可以使用：

### 查看所有文档
```javascript
window.debugDocs()
```

### 手动检查数据
```javascript
// 获取 store
const store = window.$vue?.$pinia?.state.value.knowledge

// 查看文档数量
console.log('Total documents:', store?.documents.length)

// 查看根目录文档
console.log('Root documents:', 
  store?.documents.filter(d => d.parentId === null)
)

// 查看特定文件夹的子文档
const folderId = 'xxx'  // 替换为实际ID
console.log('Folder children:', 
  store?.documents.filter(d => d.parentId === folderId)
)
```

---

## 📁 数据文件位置

**macOS**:
```
~/Library/Application Support/vite-vue3-electron-demo/data.json
```

**打开方式**：
```bash
# 使用默认编辑器
open ~/Library/Application\ Support/vite-vue3-electron-demo/data.json

# 使用 VS Code
code ~/Library/Application\ Support/vite-vue3-electron-demo/data.json

# 查看内容
cat ~/Library/Application\ Support/vite-vue3-electron-demo/data.json
```

---

## ✅ 成功标准

### 拖动操作成功的标志

- [x] Console 有 "Moving document" 日志
- [x] Console 有 "Move completed" 日志
- [x] 界面立即显示新顺序
- [x] `window.debugDocs()` 显示正确的 order
- [x] 返回再进入，顺序保持
- [x] 完全重启应用，顺序保持
- [x] data.json 文件有正确的 order 值

### 如果以上全部通过

✅ **拖拽功能完全正常！**

### 如果有任何失败

1. 记录失败的步骤
2. 复制 Console 日志
3. 检查 data.json 内容
4. 提供这些信息以便进一步调试

---

## 🛠️ 修复总结

### 本次修复的问题

1. ✅ **loadDocuments 重置 order 值**
   - 修改前：重新加载时强制重排所有文档
   - 修改后：只初始化没有 order 的文档

2. ✅ **添加详细日志**
   - loadDocuments：显示加载的文档数量
   - moveDocument：显示移动详情
   - 初始化 order：显示每个文档的初始化过程

3. ✅ **添加调试工具**
   - `window.debugDocs()` 函数
   - 方便查看当前文档状态

---

**现在请按照上面的测试流程验证，并查看 Console 日志！** 🧪✨


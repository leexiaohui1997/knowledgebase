# Cherry Markdown 编辑器集成

## 🎯 编辑器升级

已将 CodeMirror 编辑器升级为 Cherry Markdown，提供更强大的 Markdown 编辑体验。

---

## 📦 Cherry Markdown 介绍

Cherry Markdown 是一款功能丰富、界面美观的 Markdown 编辑器，具有以下特点：

### ✨ 核心特性

1. **双栏模式**
   - 左侧：Markdown 源码编辑
   - 右侧：实时预览
   - 同步滚动

2. **所见即所得**
   - 支持直接在编辑器中看到部分渲染效果
   - 类似 Word 的编辑体验

3. **丰富的工具栏**
   - 加粗、斜体、删除线
   - 标题、列表、引用
   - 链接、图片、表格
   - 代码、代码块
   - 撤销、重做

4. **代码高亮**
   - 支持多种编程语言
   - 暗色主题代码块

5. **中文支持**
   - 完整的中文界面
   - 中文文档

---

## 🔄 相比 CodeMirror 的改进

| 特性 | CodeMirror | Cherry Markdown |
|------|-----------|----------------|
| 工具栏 | ❌ 无 | ✅ 丰富 |
| 双栏预览 | ❌ 需要切换 | ✅ 同时显示 |
| 所见即所得 | ❌ 无 | ✅ 部分支持 |
| 界面美观度 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 学习曲线 | 低 | 更低 |
| 功能丰富度 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 中文支持 | 一般 | 完善 |

---

## 🎨 界面展示

### 编辑模式

```
┌────────────────────────────────────────────────────┐
│ 工具栏：B I S | H# 列表 引用 | 链接 图片 表格 代码 │
├────────────────────────────────────────────────────┤
│ 编辑区              │ 预览区                        │
│                     │                              │
│ # 标题              │  标题                         │
│                     │                              │
│ - 列表项            │  • 列表项                     │
│                     │                              │
│ ```js               │  代码块（高亮）                │
│ code                │                              │
│ ```                 │                              │
└────────────────────────────────────────────────────┘
```

---

## 🛠️ 配置说明

### 编辑器配置

```typescript
new Cherry({
  el: container,
  value: initialContent,
  locale: 'zh_CN',  // 中文界面
  
  // 引擎配置
  engine: {
    syntax: {
      codeBlock: {
        theme: 'dark'  // 代码块暗色主题
      }
    }
  },
  
  // 工具栏配置
  toolbars: {
    theme: 'light',
    toolbar: [
      'bold', 'italic', 'strikethrough',  // 文本格式
      '|',  // 分隔符
      'header', 'list', 'quote',  // 块级元素
      '|',
      'link', 'image', 'table', 'code', 'codeBlock',  // 插入元素
      '|',
      'undo', 'redo'  // 操作
    ]
  },
  
  // 编辑器模式
  editor: {
    defaultModel: 'edit&preview',  // 双栏模式
    height: '100%'
  }
})
```

### 主题定制

已自定义主题颜色为应用的主题绿色（#42b883）：

```css
/* 工具栏按钮悬停 */
.cherry-toolbar-button:hover {
  background-color: #e6f7ef;
  color: #42b883;
}

/* 工具栏按钮激活 */
.cherry-toolbar-button--active {
  background-color: #42b883;
  color: white;
}
```

---

## 🎯 功能特性

### 工具栏功能

| 按钮 | 功能 | 快捷键 |
|------|------|--------|
| **B** | 加粗 | Cmd/Ctrl + B |
| *I* | 斜体 | Cmd/Ctrl + I |
| ~~S~~ | 删除线 | - |
| H# | 标题 | - |
| 列表 | 有序/无序列表 | - |
| 引用 | 引用块 | - |
| 链接 | 插入链接 | Cmd/Ctrl + K |
| 图片 | 插入图片 | - |
| 表格 | 插入表格 | - |
| `代码` | 行内代码 | - |
| 代码块 | 代码块 | - |
| ↶ | 撤销 | Cmd/Ctrl + Z |
| ↷ | 重做 | Cmd/Ctrl + Shift + Z |

### 快捷键

| 功能 | 快捷键 |
|------|--------|
| 保存 | Cmd/Ctrl + S |
| 加粗 | Cmd/Ctrl + B |
| 斜体 | Cmd/Ctrl + I |
| 插入链接 | Cmd/Ctrl + K |
| 撤销 | Cmd/Ctrl + Z |
| 重做 | Cmd/Ctrl + Shift + Z |

---

## 💡 使用技巧

### 双栏编辑

- 左侧编辑，右侧实时预览
- 同步滚动
- 所见即所得

### 工具栏操作

1. **选中文本后点击工具栏**
   - 自动添加 Markdown 标记
   - 例如：选中文字 → 点击 **B** → `**文字**`

2. **直接点击工具栏**
   - 插入对应的 Markdown 模板
   - 例如：点击表格 → 插入表格模板

### 常用格式

```markdown
# 一级标题
## 二级标题

**加粗文字**
*斜体文字*
~~删除线~~

- 无序列表
1. 有序列表

> 引用块

[链接文字](URL)
![图片](URL)

`行内代码`

\`\`\`javascript
代码块
\`\`\`

| 表头1 | 表头2 |
|-------|-------|
| 内容1 | 内容2 |
```

---

## 🔧 技术实现

### 生命周期管理

```typescript
onMounted(() => {
  initEditor()  // 初始化编辑器
  document.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown)
  cherryInstance?.destroy()  // 清理编辑器实例
})
```

### 内容同步

```typescript
// 监听外部内容变化
watch(() => props.content, (newContent) => {
  if (cherryInstance && cherryInstance.getMarkdown() !== newContent) {
    cherryInstance.setMarkdown(newContent)
  }
})

// 保存时获取内容
function handleSave() {
  const content = cherryInstance.getMarkdown()
  emit('save', content)
}
```

---

## 📝 已移除的依赖

```json
// 已移除
"markdown-it": "^14.0.0",
"codemirror": "^6.0.1",
"@codemirror/lang-markdown": "^6.2.0",
"@codemirror/theme-one-dark": "^6.1.0",
"vue-codemirror": "^6.1.1"
```

---

## 🎨 视觉优化

### 样式定制

1. **工具栏**
   - 浅灰背景（#fafafa）
   - 主题色高亮

2. **编辑区**
   - 白色背景
   - 清晰的分栏

3. **预览区**
   - 白色背景
   - 适当的内边距

---

## 🚀 优势

### 用户体验提升

1. **更直观**
   - 工具栏一目了然
   - 不需要记忆 Markdown 语法

2. **更高效**
   - 双栏实时预览
   - 不需要切换模式

3. **更强大**
   - 支持更多 Markdown 扩展语法
   - 更好的代码高亮

4. **更专业**
   - 类似主流 Markdown 编辑器
   - 符合用户习惯

---

## 📖 参考资源

- **官方文档**：https://github.com/Tencent/cherry-markdown
- **在线演示**：https://tencent.github.io/cherry-markdown/
- **语法手册**：内置工具栏提示

---

## ✅ 完成清单

- [x] 安装 cherry-markdown
- [x] 移除 CodeMirror 依赖
- [x] 重写 MarkdownEditor 组件
- [x] 配置中文界面
- [x] 定制主题颜色
- [x] 保留快捷键支持
- [x] 优化样式
- [x] 测试功能

---

**Cherry Markdown 编辑器已完全集成！享受更强大的编辑体验！** 🎉✨


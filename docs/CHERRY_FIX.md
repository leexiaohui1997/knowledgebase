# Cherry Markdown 错误修复

## 🐛 问题

Cherry Markdown 初始化时出现错误：
```
TypeError: Cannot read properties of undefined (reading 'createBtn')
```

## 🔍 原因

Cherry Markdown 依赖一些可选的外部库：
- **echarts** - 用于表格转图表功能
- **katex/MathJax** - 用于数学公式
- **mermaid** - 用于流程图
- **plantuml** - 用于 UML 图

如果这些库未安装，Cherry 在初始化某些插件时会报错。

## ✅ 解决方案

### 方案：安装 echarts（已采用）

安装 echarts 以支持 Cherry 的完整功能：

```bash
npm install echarts
```

同时在配置中禁用表格转图表：
```typescript
engine: {
  syntax: {
    table: {
      enableChart: false  // 禁用表格转图表
    }
  }
}
```

### 简化工具栏

使用简化的工具栏配置：
```typescript
toolbar: [
  'bold', 'italic', 'strikethrough',
  '|',
  'header', 'list', 'panel', 'detail',
  '|',
  'link', 'image', 'table', 'code',
  '|',
  'undo', 'redo'
]
```

## 🎯 当前配置

### 已启用的功能
- ✅ 加粗、斜体、删除线
- ✅ 标题
- ✅ 列表
- ✅ 折叠面板
- ✅ 详情折叠
- ✅ 链接、图片
- ✅ 表格（普通表格，不转图表）
- ✅ 代码、代码块
- ✅ 撤销、重做

### 已禁用的功能
- ❌ 表格转图表（enableChart: false）
- ❌ 数学公式（未安装 katex）
- ❌ 流程图（未安装 mermaid）
- ❌ UML 图（未安装 plantuml）

## 📦 依赖说明

### 必需依赖
- `cherry-markdown` - 核心编辑器
- `echarts` - 避免初始化错误

### 可选依赖（未安装）
- `katex` - 数学公式（LaTeX）
- `mermaid` - 流程图
- `plantuml` - UML 图

## 💡 如果需要更多功能

### 添加数学公式支持

```bash
npm install katex
```

### 添加流程图支持

```bash
npm install mermaid
```

然后在配置中启用。

## ✅ 修复完成

- [x] 安装 echarts
- [x] 配置 enableChart: false
- [x] 简化工具栏配置
- [x] 移除问题配置项
- [x] 测试编辑器加载

现在 Cherry Markdown 应该正常工作了！🎉


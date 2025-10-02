# 自定义 Alert 组件使用指南

## 🎯 概述

本项目已将所有原生 `alert()` 调用替换为自定义的 Alert 组件，提供更美观、更统一的用户体验。

## ✨ 功能特性

- 🎨 **美观的 UI 设计** - 现代化的弹窗样式
- 🎭 **多种类型支持** - info、success、warning、error
- 🎪 **动画效果** - 平滑的进入/退出动画
- 🎯 **图标支持** - Font Awesome 图标系统
- 🎨 **主题色适配** - 与应用整体风格一致
- 🎪 **全局状态管理** - 统一的弹窗管理

## 🚀 使用方法

### 1. 基础用法

```typescript
import { alert, alertSuccess, alertWarning, alertError } from '@/composables/useAlert'

// 基础信息提示
alert('这是一个提示信息')

// 成功提示
alertSuccess('操作成功！')

// 警告提示
alertWarning('请注意这个警告')

// 错误提示
alertError('发生了一个错误')
```

### 2. 高级配置

```typescript
import { alert } from '@/composables/useAlert'

// 自定义标题和类型
alert('请输入知识库名称', {
  title: '输入验证',
  type: 'warning'
})

// 确认对话框
import { confirm } from '@/composables/useAlert'

const result = await confirm('确定要删除这个项目吗？', {
  title: '确认删除',
  confirmText: '删除',
  cancelText: '取消',
  type: 'error'
})

if (result) {
  // 用户点击了确定
  console.log('用户确认删除')
} else {
  // 用户点击了取消
  console.log('用户取消删除')
}
```

### 3. 组件配置选项

```typescript
interface AlertOptions {
  title?: string          // 弹窗标题
  message: string         // 弹窗内容
  type?: 'info' | 'success' | 'warning' | 'error'  // 类型
  confirmText?: string    // 确认按钮文字
  showCancel?: boolean    // 是否显示取消按钮
  cancelText?: string     // 取消按钮文字
}
```

## 🎨 样式定制

### 类型对应的颜色

| 类型 | 主题色 | 图标 | 用途 |
|------|--------|------|------|
| `info` | #42b883 (Vue绿) | fa-circle-info | 一般信息提示 |
| `success` | #10b981 (绿色) | fa-circle-check | 成功操作 |
| `warning` | #f59e0b (橙色) | fa-triangle-exclamation | 警告信息 |
| `error` | #ef4444 (红色) | fa-circle-exclamation | 错误信息 |

### 动画效果

- **进入动画**: 缩放 + 位移动画 (0.2s)
- **退出动画**: 淡出效果 (0.2s)
- **悬停效果**: 按钮颜色变化

## 🔧 技术实现

### 1. 组件架构

```
CustomAlert.vue (UI组件)
    ↓
useAlert.ts (状态管理)
    ↓
全局状态 (reactive)
```

### 2. 状态管理

```typescript
// 全局状态
const alertState = reactive<AlertState>({
  show: false,
  options: {
    message: '',
    type: 'info'
  }
})
```

### 3. 事件系统

```typescript
// 确认事件
window.dispatchEvent(new CustomEvent('alert-confirm'))

// 取消事件
window.dispatchEvent(new CustomEvent('alert-cancel'))
```

## 📝 已替换的 alert 调用

### KnowledgeBaseList.vue
- ✅ 创建知识库名称验证
- ✅ 编辑知识库名称验证

### KnowledgeBaseDetail.vue
- ✅ 创建文档名称验证
- ✅ 重命名文档名称验证

### SettingsModal.vue
- ✅ 图片扫描结果提示
- ✅ 图片清理成功提示
- ✅ 错误处理提示

## 🎯 使用场景

### 1. 表单验证
```typescript
if (!formData.value.name.trim()) {
  alert('请输入知识库名称', { type: 'warning' })
  return
}
```

### 2. 操作确认
```typescript
const result = await confirm('确定要删除知识库吗？', {
  title: '确认删除',
  type: 'error'
})
```

### 3. 成功反馈
```typescript
alertSuccess('知识库创建成功！')
```

### 4. 错误处理
```typescript
try {
  await someOperation()
} catch (error) {
  alertError('操作失败，请重试')
}
```

## 🎨 设计规范

### 尺寸规范
- **弹窗宽度**: 400px (最大 90vw)
- **内边距**: 24px
- **圆角**: 12px
- **阴影**: 0 20px 40px rgba(0, 0, 0, 0.15)

### 颜色规范
- **背景**: white
- **遮罩**: rgba(0, 0, 0, 0.5)
- **边框**: 左侧 4px 彩色边框
- **按钮**: 主题色 + 悬停效果

### 字体规范
- **标题**: 18px, 600 weight
- **内容**: 14px, normal weight
- **按钮**: 14px, 500 weight

## 🚀 扩展功能

### 1. 添加新的弹窗类型

```typescript
// 在 useAlert.ts 中添加
export function alertCustom(message: string, options: Partial<AlertOptions> = {}) {
  alert(message, {
    type: 'custom',
    ...options
  })
}
```

### 2. 自定义图标

```typescript
// 在 CustomAlert.vue 中添加
function getIcon() {
  switch (currentOptions.value.type) {
    case 'custom':
      return 'fa-star'  // 自定义图标
    // ... 其他类型
  }
}
```

### 3. 添加音效

```typescript
function handleConfirm() {
  // 播放确认音效
  playSound('confirm')
  // ... 其他逻辑
}
```

## 🎉 总结

自定义 Alert 组件提供了：

- ✅ **统一的用户体验** - 所有弹窗风格一致
- ✅ **丰富的功能** - 支持多种类型和配置
- ✅ **美观的设计** - 现代化的 UI 风格
- ✅ **良好的性能** - 轻量级实现
- ✅ **易于维护** - 模块化设计

现在应用中的所有提示都使用了统一的自定义 Alert 组件，提供了更好的用户体验！🎊

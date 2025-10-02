# 📁 KnowledgeSidebar 组件

知识库侧边栏组件，提供类似 VS Code 的侧边栏体验，支持多面板切换和扩展。

## 🎯 设计目标

- **VS Code 风格**: 模仿 VS Code 的侧边栏设计，上面是图标导航，下面是内容区域
- **可扩展性**: 支持添加新的导航面板（搜索、大纲、书签等）
- **响应式设计**: 适配不同屏幕尺寸
- **主题支持**: 预留深色主题支持

## 🏗️ 组件结构

### 导航栏 (Navigation Bar)
- 垂直排列的图标按钮
- 支持工具提示 (tooltip)
- 激活状态指示器
- 悬停效果

### 内容区域 (Content Area)
- 动态内容插槽
- 支持不同面板的内容
- 滚动和溢出处理

## 📝 使用方法

### 基本用法

```vue
<template>
  <KnowledgeSidebar
    :active-item="activeSidebarItem"
    @item-click="handleSidebarItemClick"
  >
    <template #explorer>
      <div class="explorer-panel">
        <!-- 文档目录内容 -->
      </div>
    </template>
  </KnowledgeSidebar>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import KnowledgeSidebar from '@/components/KnowledgeSidebar.vue'

const activeSidebarItem = ref('explorer')

function handleSidebarItemClick(itemId: string) {
  activeSidebarItem.value = itemId
  console.log('切换到侧边栏项:', itemId)
}
</script>
```

### 扩展新面板

在 `KnowledgeSidebar.vue` 中添加新的导航项：

```typescript
// 在 sidebarItems 中添加新项
const sidebarItems = ref<SidebarItem[]>([
  {
    id: 'explorer',
    icon: 'fa-folder-open',
    label: '目录',
    tooltip: '文档目录'
  },
  {
    id: 'search',
    icon: 'fa-magnifying-glass',
    label: '搜索',
    tooltip: '搜索文档'
  },
  {
    id: 'outline',
    icon: 'fa-list',
    label: '大纲',
    tooltip: '文档大纲'
  }
])
```

在模板中添加对应的内容插槽：

```vue
<template #search>
  <div class="search-panel">
    <!-- 搜索面板内容 -->
  </div>
</template>

<template #outline>
  <div class="outline-panel">
    <!-- 大纲面板内容 -->
  </div>
</template>
```

## 🎨 样式特性

### 导航按钮
- **尺寸**: 48x48px (移动端 44x44px)
- **圆角**: 6px
- **间距**: 2px margin
- **激活状态**: 绿色背景 + 右侧指示条
- **悬停效果**: 浅绿色背景

### 响应式设计
- **桌面端**: 280px 宽度
- **移动端**: 240px 宽度
- **图标大小**: 18px (桌面) / 16px (移动)

### 深色主题支持
```css
@media (prefers-color-scheme: dark) {
  .knowledge-sidebar {
    background: #1e1e1e;
    border-right-color: #3c3c3c;
  }
  
  .sidebar-nav {
    background: #252526;
    border-bottom-color: #3c3c3c;
  }
}
```

## 🔧 组件接口

### Props
```typescript
interface Props {
  activeItem?: string  // 当前激活的导航项ID
}
```

### Events
```typescript
interface Events {
  'item-click': [itemId: string]  // 导航项点击事件
}
```

### Slots
```typescript
interface Slots {
  content?: {
    activeItem: string  // 当前激活项ID
  }
  explorer?: {}  // 文档目录面板
  // 其他面板插槽...
}
```

## 📋 当前面板

### 1. Explorer (文档目录)
- **图标**: `fa-folder-open`
- **功能**: 文档树形结构展示
- **特性**: 拖拽排序、右键菜单、创建/删除/重命名

## 🚀 扩展计划

### 计划中的面板
1. **搜索面板** (`search`)
   - 全文搜索功能
   - 搜索结果高亮
   - 搜索历史

2. **大纲面板** (`outline`)
   - 文档结构导航
   - 快速跳转
   - 层级显示

3. **书签面板** (`bookmarks`)
   - 常用文档收藏
   - 快速访问
   - 分类管理

4. **标签面板** (`tags`)
   - 文档标签管理
   - 按标签筛选
   - 标签统计

## 💡 最佳实践

### 1. 面板设计原则
- 保持一致的视觉风格
- 提供清晰的导航指示
- 支持键盘快捷键
- 响应式适配

### 2. 性能优化
- 使用 `v-show` 而非 `v-if` 切换面板
- 懒加载非激活面板内容
- 虚拟滚动处理大量数据

### 3. 无障碍支持
- 提供有意义的 `title` 属性
- 支持键盘导航
- 适当的颜色对比度

## 🔄 更新日志

### v1.0.0 (2024-01-XX)
- ✅ 初始版本发布
- ✅ 基础导航功能
- ✅ Explorer 面板集成
- ✅ 响应式设计
- ✅ 深色主题预留

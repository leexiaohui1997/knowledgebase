# Font Awesome 图标库集成

## 🎨 图标升级

已将所有表情符号图标替换为 Font Awesome 专业图标，界面更加统一和专业。

---

## 📦 安装的包

```json
{
  "@fortawesome/fontawesome-svg-core": "^6.5.0",
  "@fortawesome/free-solid-svg-icons": "^6.5.0",
  "@fortawesome/free-regular-svg-icons": "^6.5.0",
  "@fortawesome/vue-fontawesome": "^3.0.5"
}
```

---

## 🔄 图标替换对照表

### 知识库列表页

| 位置 | 旧图标 | 新图标 | Font Awesome 名称 |
|------|--------|--------|------------------|
| 页面标题 | 📚 | 📖 | `book` |
| 搜索框 | - | 🔍 | `magnifying-glass` |
| 创建按钮 | ➕ | + | `plus` |
| 删除按钮 | 🗑️ | 🗑️ | `trash` |
| 空状态 | 📚 | 📖 | `book` |

### 知识库详情页

| 位置 | 旧图标 | 新图标 | Font Awesome 名称 |
|------|--------|--------|------------------|
| 返回按钮 | ← | ← | `arrow-left` |
| 新建按钮 | ➕ | + | `plus` |
| 文档目录标题 | 📁 | 📁 | `folder-open` |
| 无文档状态 | 📝 | 📄 | `file-lines` |

### 文档树

| 位置 | 旧图标 | 新图标 | Font Awesome 名称 |
|------|--------|--------|------------------|
| 文件夹（折叠） | 📁 | 📁 | `folder` |
| 文件夹（展开） | 📂 | 📂 | `folder-open` |
| 文件 | 📄 | 📄 | `file` |
| 添加子项 | ➕ | + | `plus` |
| 删除 | 🗑️ | 🗑️ | `trash` |

### Markdown 编辑器

| 位置 | 旧图标 | 新图标 | Font Awesome 名称 |
|------|--------|--------|------------------|
| 预览按钮 | 👁️ | 👁️ | `eye` |
| 编辑按钮 | ✏️ | ✏️ | `pen-to-square` |
| 保存按钮 | 💾 | 💾 | `floppy-disk` |

### 右键菜单

| 功能 | 旧图标 | 新图标 | Font Awesome 名称 |
|------|--------|--------|------------------|
| 打开 | 📂 | 📂 | `folder-open` |
| 编辑 | ✏️ | ✏️ | `pen-to-square` |
| 重命名 | ✏️ | ✏️ | `pen-to-square` |
| 删除 | 🗑️ | 🗑️ | `trash` |
| 新建文件 | 📄 | 📄 | `file` |
| 新建文件夹 | 📁 | 📁 | `folder` |
| 创建知识库 | ➕ | + | `plus` |

---

## 🎯 图标特色

### 颜色方案

- **主色调图标**：`#42b883`（Vue 绿）
  - 页面标题图标
  - 文档目录图标
  - 展开的文件夹图标

- **中性图标**：`#666` / `#888`
  - 折叠的文件夹
  - 文件图标
  - 操作按钮

- **搜索图标**：`#999` → `#42b883`（获得焦点时）

- **空状态图标**：`#ddd`（浅灰）

- **删除图标悬停**：`#ef4444`（红色）

---

## 💡 使用方法

### 在组件中使用

```vue
<template>
  <!-- 基础用法 -->
  <font-awesome-icon :icon="['fas', 'book']" />
  
  <!-- 带样式 -->
  <font-awesome-icon :icon="['fas', 'folder']" class="my-icon" />
  
  <!-- 条件图标 -->
  <font-awesome-icon 
    :icon="['fas', isOpen ? 'folder-open' : 'folder']" 
  />
</template>

<style scoped>
.my-icon {
  color: #42b883;
  font-size: 20px;
}
</style>
```

### 在右键菜单中使用

```typescript
const menuItems: MenuItem[] = [
  {
    label: '操作名称',
    icon: 'fa-icon-name',  // 使用 fa- 前缀
    action: () => { ... }
  }
]
```

---

## 🎨 优势

### 相比表情符号的优势

1. **尺寸一致** ✅
   - Font Awesome 图标尺寸精确控制
   - 表情符号大小不统一

2. **颜色可控** ✅
   - 可以自定义任何颜色
   - 表情符号颜色固定

3. **对齐完美** ✅
   - 图标对齐像素完美
   - 表情符号可能错位

4. **风格统一** ✅
   - 所有图标风格一致
   - 表情符号风格各异

5. **专业感强** ✅
   - 更符合专业应用标准
   - 表情符号较为随意

---

## 📝 已修改的文件

1. **`src/main.ts`** - 配置 Font Awesome
2. **`src/views/KnowledgeBaseList.vue`** - 替换列表页图标
3. **`src/views/KnowledgeBaseDetail.vue`** - 替换详情页图标
4. **`src/components/DocumentTree.vue`** - 替换文档树图标
5. **`src/components/MarkdownEditor.vue`** - 替换编辑器图标
6. **`src/components/ContextMenu.vue`** - 支持 Font Awesome 图标
7. **`package.json`** - 添加依赖

---

## 🆕 新增功能

### 搜索框图标

添加了搜索图标（🔍）在输入框左侧：
- 默认灰色
- 获得焦点时变为主题色
- 视觉引导更明确

### 动态图标

文件夹图标根据展开/折叠状态变化：
- 折叠：📁 灰色文件夹
- 展开：📂 绿色文件夹

---

## 🎯 设计细节

### 图标尺寸

- **页面标题**：默认大小（与文字匹配）
- **按钮图标**：14px
- **文档树图标**：14px
- **操作按钮图标**：12px
- **空状态图标**：64px

### 图标间距

- **按钮**：图标与文字间距 6-8px
- **标题**：图标与文字间距 8-10px
- **菜单项**：图标与文字间距 10px

### 图标对齐

- 所有图标垂直居中
- 宽度统一（16px）
- 使用 flex 布局确保对齐

---

## 🔮 可扩展性

### 添加新图标

1. 在 `main.ts` 中导入：
```typescript
import { faNewIcon } from '@fortawesome/free-solid-svg-icons'
library.add(faNewIcon)
```

2. 在组件中使用：
```vue
<font-awesome-icon :icon="['fas', 'new-icon']" />
```

### 使用其他图标集

Font Awesome 还提供：
- **Regular icons**：`@fortawesome/free-regular-svg-icons`
- **Brands icons**：`@fortawesome/free-brands-svg-icons`
- **Pro icons**：需要付费

---

## ✨ 最终效果

界面现在看起来：
- ✅ 更加专业
- ✅ 视觉统一
- ✅ 图标清晰
- ✅ 对齐完美
- ✅ 颜色协调

---

**Font Awesome 图标库已完全集成！** 🎉


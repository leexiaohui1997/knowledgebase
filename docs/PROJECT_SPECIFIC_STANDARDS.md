# 项目特定功能规范

## 📖 文档说明

这是针对知识库管理系统的特定开发标准，包含项目特有的功能实现规范和最佳实践。

## 🎯 知识库管理系统特定规范

### 存储层规范
本项目使用存储抽象层设计，支持Electron和Web双版本。

```typescript
// ✅ 正确的存储使用方式
import { getStorage } from '@/storage'

const storage = getStorage()  // 自动检测环境

// ✅ 数据操作
await storage.createKnowledgeBase(kb)
await storage.getDocuments(knowledgeBaseId)
await storage.saveImage(knowledgeBaseId, imageData)
```

### 状态管理规范
使用Pinia进行状态管理，按功能模块划分。

```typescript
// ✅ Knowledge Store使用规范
import { useKnowledgeStore } from '@/stores/knowledge'

const store = useKnowledgeStore()

// ✅ 正确的数据操作
await store.createKnowledgeBase(formData)
await store.loadDocuments(knowledgeBaseId)
await store.moveDocument(nodeId, newParentId, newOrder)
```

## 🎨 UI组件特定规范

### CustomAlert组件使用
```typescript
// ✅ 正确的Alert使用方式
import { alert, alertSuccess, alertWarning, alertError } from '@/composables/useAlert'

// 基础提示
alert('请输入名称', { type: 'warning' })

// 成功提示
alertSuccess('操作成功！')

// 错误提示
alertError('操作失败，请重试')

// 确认对话框
const result = await confirm('确定要删除吗？')
if (result) {
  // 用户确认
}
```

### DocumentTree组件规范
```vue
<!-- ✅ 正确的DocumentTree使用 -->
<DocumentTree
  :nodes="documentTree"
  :all-nodes="store.documents"
  :current-doc-id="store.currentDocument?.id"
  @select="handleSelectDocument"
  @delete="handleDeleteDocument"
  @create-child="openCreateModal"
  @context-menu="handleNodeContextMenu"
  @drag-move="handleDragMove"
  @drag-over-node="handleDragOverNode"
/>
```

### MarkdownEditor组件规范
```vue
<!-- ✅ 正确的MarkdownEditor使用 -->
<MarkdownEditor
  v-if="store.currentDocument"
  :key="store.currentDocument.id"
  :content="store.currentDocument.content || ''"
  :title="store.currentDocument.name"
  @save="handleSaveContent"
/>
```

## 🔧 拖拽系统规范

### 拖拽实现规范
```typescript
// ✅ 拖拽事件处理
function handleDragStart(e: DragEvent, node: DocumentNode) {
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', node.id)
  }
}

function handleDrop(e: DragEvent, targetNode: DocumentNode) {
  e.preventDefault()
  const nodeId = e.dataTransfer?.getData('text/plain')
  if (!nodeId) return
  
  // 防止循环引用
  if (isDescendant(targetNode.id, nodeId, allNodes)) {
    return
  }
  
  emit('dragMove', nodeId, newParentId, position)
}
```

### 拖拽视觉反馈
```vue
<!-- ✅ 拖拽状态样式 -->
<template>
  <div 
    :class="[
      'node-content',
      {
        'drag-over': dragOverNodeId === node.id,
        'drop-before': dragOverNodeId === node.id && dropPosition === 'before',
        'drop-inside': dragOverNodeId === node.id && dropPosition === 'inside',
        'drop-after': dragOverNodeId === node.id && dropPosition === 'after',
        'dragging': draggedNodeId === node.id
      }
    ]"
  >
</template>
```

## 📁 文档管理规范

### 文档创建规范
```typescript
// ✅ 正确的文档创建流程
async function createDocument(data: CreateNodeForm) {
  if (!data.name.trim()) {
    alert('请输入名称', { type: 'warning' })
    return
  }
  
  // 计算order值
  const siblings = documents.value.filter(doc => doc.parentId === data.parentId)
  const maxOrder = siblings.length > 0 ? Math.max(...siblings.map(doc => doc.order || 0)) : 0
  
  await store.createDocument({
    ...data,
    order: maxOrder + 1,
    knowledgeBaseId: knowledgeBaseId.value
  })
}
```

### 文档移动规范
```typescript
// ✅ 正确的文档移动逻辑
async function moveDocument(nodeId: string, newParentId: string | null, newOrder: number) {
  const doc = documents.value.find(d => d.id === nodeId)
  if (!doc) return
  
  const oldParentId = doc.parentId
  const oldOrder = doc.order
  
  // 更新被移动节点
  doc.parentId = newParentId
  doc.order = newOrder
  doc.updatedAt = Date.now()
  await storage.updateDocument(knowledgeBaseId.value, toRaw(doc))
  
  // 重新排序相关节点
  // ... 排序逻辑
}
```

## 🖼️ 图片管理规范

### 图片保存规范
```typescript
// ✅ 正确的图片保存流程
async function saveImage(knowledgeBaseId: string, imageData: string) {
  try {
    const imagePath = await storage.saveImage(knowledgeBaseId, imageData)
    console.log('Image saved as:', imagePath)
    return imagePath
  } catch (error) {
    console.error('Image upload failed:', error)
    alertError('图片上传失败，请重试')
    throw error
  }
}
```

### 图片清理规范
```typescript
// ✅ 正确的图片清理流程
async function scanUnusedImages() {
  isScanning.value = true
  try {
    const storage = getStorage()
    const unused = await storage.getUnusedImages()
    unusedImages.value = unused
    
    if (unused.length > 0) {
      showCleanupConfirm.value = true
    } else {
      alertSuccess('没有发现未使用的图片！')
    }
  } catch (error) {
    console.error('扫描图片失败:', error)
    alertError('扫描失败，请重试')
  } finally {
    isScanning.value = false
  }
}
```

## 🎯 右键菜单规范

### 菜单项定义
```typescript
// ✅ 正确的菜单项定义
const menuItems = ref<MenuItem[]>([
  {
    label: '新建文件',
    icon: 'fa-file',
    action: () => openCreateModal(null, 'file')
  },
  {
    label: '新建文件夹',
    icon: 'fa-folder',
    action: () => openCreateModal(null, 'folder')
  },
  { label: '', divider: true, action: () => {} },
  {
    label: '删除',
    icon: 'fa-trash',
    action: () => handleDeleteDocument(node)
  }
])
```

### 菜单显示逻辑
```typescript
// ✅ 根据上下文显示不同菜单
function handleContextMenu(e: MouseEvent, node: DocumentNode) {
  e.preventDefault()
  e.stopPropagation()
  
  const menuItems: MenuItem[] = []
  
  if (node.type === 'folder') {
    menuItems.push(
      {
        label: '新建文件',
        icon: 'fa-file',
        action: () => openCreateModal(node.id, 'file')
      },
      {
        label: '新建文件夹',
        icon: 'fa-folder',
        action: () => openCreateModal(node.id, 'folder')
      }
    )
  }
  
  // 通用菜单项
  menuItems.push(
    {
      label: '重命名',
      icon: 'fa-pen-to-square',
      action: () => openRenameModal(node)
    },
    {
      label: '删除',
      icon: 'fa-trash',
      action: () => handleDeleteDocument(node)
    }
  )
  
  contextMenuItems.value = menuItems
  contextMenuRef.value?.show(e.clientX, e.clientY)
}
```

## 🔒 数据安全规范

### 数据序列化
```typescript
// ✅ 使用toRaw避免Proxy序列化问题
const rawKb = toRaw(knowledgeBase.value)
await store.updateKnowledgeBase({
  ...rawKb,
  ...formData.value
})

// ✅ 批量操作时也要使用toRaw
for (const doc of documents.value) {
  await storage.updateDocument(knowledgeBaseId.value, toRaw(doc))
}
```

### 输入验证
```typescript
// ✅ 完整的输入验证
function validateKnowledgeBase(data: CreateKnowledgeBaseForm) {
  if (!data.name.trim()) {
    alert('请输入知识库名称', { type: 'warning' })
    return false
  }
  
  if (data.name.length > 50) {
    alert('知识库名称不能超过50个字符', { type: 'warning' })
    return false
  }
  
  if (data.description && data.description.length > 200) {
    alert('简介不能超过200个字符', { type: 'warning' })
    return false
  }
  
  return true
}
```

## 🎨 样式特定规范

### 主题色使用
```css
/* ✅ 使用项目主题色 */
.btn-primary {
  background-color: #42b883;  /* Vue绿 */
  color: white;
}

.btn-primary:hover {
  background-color: #33a06f;  /* 悬停状态 */
}

/* ✅ 状态颜色 */
.alert-success { border-left-color: #10b981; }
.alert-warning { border-left-color: #f59e0b; }
.alert-error { border-left-color: #ef4444; }
.alert-info { border-left-color: #42b883; }
```

### 动画效果
```css
/* ✅ 统一的动画效果 */
.component {
  transition: all 0.2s ease;
}

.component:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* ✅ 加载状态动画 */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.spinner {
  animation: spin 1s linear infinite;
}
```

## 🚀 性能优化特定规范

### 文档树渲染优化
```typescript
// ✅ 使用计算属性优化文档树渲染
const documentTree = computed(() => {
  const buildTree = (parentId: string | null): DocumentNode[] => {
    return store.documents
      .filter(doc => doc.parentId === parentId)
      .map(doc => ({
        ...doc,
        children: doc.type === 'folder' ? buildTree(doc.id) : undefined
      }))
      .sort((a, b) => {
        if (a.order !== undefined && b.order !== undefined) {
          return a.order - b.order
        }
        return a.name.localeCompare(b.name)
      })
  }
  return buildTree(null)
})
```

### 搜索优化
```typescript
// ✅ 使用防抖优化搜索
import { debounce } from 'lodash-es'

const debouncedSearch = debounce((query: string) => {
  filteredKnowledgeBases.value = store.knowledgeBases.filter(kb =>
    kb.name.toLowerCase().includes(query.toLowerCase()) ||
    kb.description.toLowerCase().includes(query.toLowerCase())
  )
}, 300)

watch(searchQuery, debouncedSearch)
```

## 🎯 测试特定规范

### 组件测试
```typescript
// ✅ 测试Alert组件
function testAlert() {
  alertSuccess('测试成功！')
  // 验证弹窗是否显示
  // 验证内容是否正确
}

// ✅ 测试拖拽功能
function testDragAndDrop() {
  // 模拟拖拽事件
  // 验证拖拽结果
  // 验证视觉反馈
}
```

### 功能测试检查清单
- [ ] 知识库创建、编辑、删除
- [ ] 文档创建、重命名、删除
- [ ] 拖拽移动和排序
- [ ] 右键菜单功能
- [ ] Markdown编辑器保存
- [ ] 图片上传和管理
- [ ] 图片清理功能
- [ ] Alert弹窗显示
- [ ] 搜索功能
- [ ] 设置功能

**遵循此规范，确保项目特定功能的高质量和一致性！** 🚀
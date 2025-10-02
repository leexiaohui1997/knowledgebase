<script setup lang="ts">
import { ref, computed, onMounted, watch, toRaw } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useKnowledgeStore } from '@/stores/knowledge'
import DocumentTree from '@/components/DocumentTree.vue'
import MarkdownEditor from '@/components/MarkdownEditor.vue'
import ContextMenu from '@/components/ContextMenu.vue'
import SettingsModal from '@/components/SettingsModal.vue'
import { alert, confirm } from '@/composables/useAlert'
import type { DocumentNode } from '@/types'
import type { MenuItem } from '@/components/ContextMenu.vue'

const route = useRoute()
const router = useRouter()
const store = useKnowledgeStore()

const knowledgeBaseId = computed(() => route.params.id as string)
const isLoading = ref(false)
const showCreateModal = ref(false)
const showRenameModal = ref(false)
const showSettings = ref(false)
const renamingNode = ref<DocumentNode | null>(null)
const renameInput = ref('')
const createForm = ref({
  name: '',
  type: 'file' as 'file' | 'folder',
  parentId: null as string | null
})
const contextMenuRef = ref<InstanceType<typeof ContextMenu> | null>(null)
const contextMenuItems = ref<MenuItem[]>([])

// 构建树形结构
const documentTree = computed(() => {
  const buildTree = (parentId: string | null): DocumentNode[] => {
    return store.documents
      .filter(doc => doc.parentId === parentId)
      .map(doc => ({
        ...doc,
        children: doc.type === 'folder' ? buildTree(doc.id) : undefined
      }))
      .sort((a, b) => {
        // 按 order 字段排序，如果没有则按名称排序
        if (a.order !== undefined && b.order !== undefined) {
          return a.order - b.order
        }
        // 文件夹排在前面
        if (a.type !== b.type) {
          return a.type === 'folder' ? -1 : 1
        }
        return a.name.localeCompare(b.name)
      })
  }
  return buildTree(null)
})

// 加载知识库数据
async function loadKnowledgeBaseData(id: string) {
  if (isLoading.value) return
  
  isLoading.value = true
  try {
    await store.loadKnowledgeBases()
    const kb = store.knowledgeBases.find(kb => kb.id === id)
    if (!kb) {
      router.push('/')
      return
    }
    store.setCurrentKnowledgeBase(kb)
    await store.loadDocuments(id)
  } finally {
    isLoading.value = false
  }
}

// 初始加载
onMounted(() => {
  loadKnowledgeBaseData(knowledgeBaseId.value)
})

// 监听路由参数变化，重新加载数据
watch(knowledgeBaseId, (newId, oldId) => {
  if (newId && newId !== oldId) {
    console.log('Knowledge base changed, reloading data:', { from: oldId, to: newId })
    loadKnowledgeBaseData(newId)
  }
})

// 返回列表
function goBack() {
  // 清除当前文档选择
  store.setCurrentDocument(null)
  router.push('/')
}

// 打开创建弹窗
function openCreateModal(parentId: string | null = null, type: 'file' | 'folder' = 'file') {
  createForm.value = {
    name: '',
    type,
    parentId
  }
  showCreateModal.value = true
}

// 打开重命名弹窗
function openRenameModal(node: DocumentNode) {
  renamingNode.value = node
  renameInput.value = node.name
  showRenameModal.value = true
}

// 创建文档/文件夹
async function handleCreate() {
  if (!createForm.value.name.trim()) {
    alert('请输入名称', { type: 'warning' })
    return
  }
  await store.createDocument({
    ...createForm.value,
    knowledgeBaseId: knowledgeBaseId.value
  })
  showCreateModal.value = false
}

// 重命名文档
async function handleRename() {
  if (!renameInput.value.trim()) {
    alert('请输入名称', { type: 'warning' })
    return
  }
  if (renamingNode.value) {
    // 使用 toRaw 获取原始对象，避免响应式 Proxy
    const rawNode = toRaw(renamingNode.value)
    await store.updateDocument({
      ...rawNode,
      name: renameInput.value
    })
  }
  showRenameModal.value = false
  renamingNode.value = null
}

// 选择文档
function handleSelectDocument(doc: DocumentNode) {
  if (doc.type === 'file') {
    store.setCurrentDocument(doc)
  }
}

// 删除文档
async function handleDeleteDocument(doc: DocumentNode) {
  const result = await confirm(`确定要删除「${doc.name}」吗？${doc.type === 'folder' ? '这将删除文件夹下的所有内容。' : ''}`, {
    title: '确认删除',
    type: 'error',
    confirmText: '删除',
    cancelText: '取消'
  })
  
  if (result) {
    await store.deleteDocument(doc.id)
    if (store.currentDocument?.id === doc.id) {
      store.setCurrentDocument(null)
    }
  }
}

// 保存文档内容
async function handleSaveContent(content: string) {
  if (store.currentDocument) {
    // 使用 toRaw 获取原始对象，避免响应式 Proxy
    const rawDoc = toRaw(store.currentDocument)
    await store.updateDocument({
      ...rawDoc,
      content
    })
  }
}

// 处理左侧空白区域右键菜单
function handleTreeAreaContextMenu(e: MouseEvent) {
  e.preventDefault()
  contextMenuItems.value = [
    {
      label: '新建文件',
      icon: 'fa-file',
      action: () => openCreateModal(null, 'file')
    },
    {
      label: '新建文件夹',
      icon: 'fa-folder',
      action: () => openCreateModal(null, 'folder')
    }
  ]
  contextMenuRef.value?.show(e.clientX, e.clientY)
}

// 处理文档节点右键菜单
function handleNodeContextMenu(e: MouseEvent, node: DocumentNode) {
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
      },
      { label: '', divider: true, action: () => {} }
    )
  }
  
  menuItems.push(
    {
      label: '重命名',
      icon: 'fa-pen-to-square',
      action: () => openRenameModal(node)
    },
    { label: '', divider: true, action: () => {} },
    {
      label: '删除',
      icon: 'fa-trash',
      action: () => handleDeleteDocument(node)
    }
  )
  
  contextMenuItems.value = menuItems
  contextMenuRef.value?.show(e.clientX, e.clientY)
}

// 处理拖拽移动
async function handleDragMove(nodeId: string, targetParentId: string | null, position: number) {
  await store.moveDocument(nodeId, targetParentId, position)
}

// 当拖动到具体节点上时，清除根目录状态
function handleDragOverNode() {
  isDraggingOverRoot.value = false
}

// 拖拽到根目录空白区域
const isDraggingOverRoot = ref(false)

function handleRootDragOver(e: DragEvent) {
  e.preventDefault()
  e.stopPropagation()
  
  // 只在真正拖到空白区域时才设置为 true
  // 如果拖到节点上，节点会阻止事件冒泡
  const target = e.target as HTMLElement
  
  // 检查是否真的是容器本身，而不是子节点
  if (target.classList.contains('tree-container') || 
      target.classList.contains('drop-zone-hint') ||
      target.classList.contains('empty-tree')) {
    isDraggingOverRoot.value = true
  }
  
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'move'
  }
}

function handleRootDragLeave(e: DragEvent) {
  e.stopPropagation()
  const relatedTarget = e.relatedTarget as HTMLElement
  const currentTarget = e.currentTarget as HTMLElement
  
  if (!currentTarget.contains(relatedTarget)) {
    isDraggingOverRoot.value = false
  }
}

async function handleRootDrop(e: DragEvent) {
  e.preventDefault()
  e.stopPropagation()
  isDraggingOverRoot.value = false
  
  const nodeId = e.dataTransfer?.getData('text/plain')
  if (!nodeId) return
  
  // 获取根目录下的所有节点
  const rootNodes = store.documents.filter(doc => doc.parentId === null)
  const maxOrder = rootNodes.length > 0 ? Math.max(...rootNodes.map(d => d.order || 0)) : 0
  
  // 移动到根目录末尾
  await store.moveDocument(nodeId, null, maxOrder + 1)
}

// 调试：打印当前所有文档的状态
function debugPrintDocuments() {
  console.log('=== Current Documents State ===')
  console.table(
    store.documents.map(d => ({
      name: d.name,
      type: d.type,
      parentId: d.parentId || 'ROOT',
      order: d.order,
      id: d.id.slice(-6)
    }))
  )
}

// 开发环境下暴露调试函数到全局
if (import.meta.env.DEV) {
  (window as any).debugDocs = debugPrintDocuments
}
</script>

<template>
  <div class="knowledge-base-detail">
    <header class="header">
      <button @click="goBack" class="btn-back">
        <font-awesome-icon :icon="['fas', 'arrow-left']" />
        返回
      </button>
      <div class="kb-info">
        <span class="kb-avatar">{{ store.currentKnowledgeBase?.avatar }}</span>
        <h1>{{ store.currentKnowledgeBase?.name }}</h1>
      </div>
      <div class="header-right">
        <button @click="openCreateModal(null)" class="btn-primary">
          <font-awesome-icon :icon="['fas', 'plus']" />
          新建
        </button>
        <button @click="showSettings = true" class="btn-settings" title="设置">
          <font-awesome-icon :icon="['fas', 'gear']" />
        </button>
      </div>
    </header>

    <div class="content">
      <aside class="sidebar">
        <div class="sidebar-header">
          <h3>
            <font-awesome-icon :icon="['fas', 'folder-open']" class="sidebar-icon" />
            文档目录
          </h3>
        </div>
        <div 
          class="tree-container" 
          :class="{ 'drag-over-root': isDraggingOverRoot }"
          @contextmenu="handleTreeAreaContextMenu"
          @dragover="handleRootDragOver"
          @dragleave="handleRootDragLeave"
          @drop="handleRootDrop"
        >
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
          <div v-if="documentTree.length === 0" class="empty-tree">
            <p>暂无文档</p>
            <p class="hint">右键或点击右上角「新建」创建文件或文件夹</p>
          </div>
          <div v-else class="drop-zone-hint">
            拖到这里移至根目录
          </div>
        </div>
      </aside>

      <main class="editor-area">
        <MarkdownEditor
          v-if="store.currentDocument"
          :key="store.currentDocument.id"
          :content="store.currentDocument.content || ''"
          :title="store.currentDocument.name"
          @save="handleSaveContent"
        />
        <div v-else class="no-document">
          <font-awesome-icon :icon="['fas', 'file-lines']" class="no-doc-icon" />
          <p>请从左侧选择一个文档开始编辑</p>
        </div>
      </main>
    </div>

    <!-- 右键菜单 -->
    <ContextMenu ref="contextMenuRef" :items="contextMenuItems" />

    <!-- 创建文档/文件夹弹窗 -->
    <div v-if="showCreateModal" class="modal-overlay" @click="showCreateModal = false">
      <div class="modal-content" @click.stop>
        <h2>新建{{ createForm.type === 'file' ? '文件' : '文件夹' }}</h2>
        <div class="form-group">
          <label>类型</label>
          <div class="type-selector">
            <label class="radio-label">
              <input type="radio" v-model="createForm.type" value="file" />
              <span>📄 文件</span>
            </label>
            <label class="radio-label">
              <input type="radio" v-model="createForm.type" value="folder" />
              <span>📁 文件夹</span>
            </label>
          </div>
        </div>
        <div class="form-group">
          <label>名称 *</label>
          <input
            v-model="createForm.name"
            type="text"
            :placeholder="`请输入${createForm.type === 'file' ? '文件' : '文件夹'}名称`"
            class="form-input"
            @keyup.enter="handleCreate"
          />
        </div>
        <div class="modal-actions">
          <button @click="showCreateModal = false" class="btn-secondary">取消</button>
          <button @click="handleCreate" class="btn-primary">创建</button>
        </div>
      </div>
    </div>

    <!-- 重命名弹窗 -->
    <div v-if="showRenameModal" class="modal-overlay" @click="showRenameModal = false">
      <div class="modal-content" @click.stop>
        <h2>重命名{{ renamingNode?.type === 'file' ? '文件' : '文件夹' }}</h2>
        <div class="form-group">
          <label>名称 *</label>
          <input
            v-model="renameInput"
            type="text"
            :placeholder="`请输入${renamingNode?.type === 'file' ? '文件' : '文件夹'}名称`"
            class="form-input"
            @keyup.enter="handleRename"
            ref="renameInputRef"
          />
        </div>
        <div class="modal-actions">
          <button @click="showRenameModal = false" class="btn-secondary">取消</button>
          <button @click="handleRename" class="btn-primary">保存</button>
        </div>
      </div>
    </div>
  </div>

  <!-- 设置弹窗 -->
  <SettingsModal :show="showSettings" @close="showSettings = false" />
</template>

<style scoped>
.knowledge-base-detail {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

.header {
  background: white;
  border-bottom: 1px solid #e0e0e0;
  padding: 15px 20px;
  display: flex;
  align-items: center;
  gap: 20px;
}

.btn-back {
  background: transparent;
  border: none;
  font-size: 14px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 6px;
  transition: background-color 0.2s;
  color: #666;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn-back:hover {
  background-color: #f0f0f0;
}

.kb-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
}

.kb-avatar {
  font-size: 32px;
}

.kb-info h1 {
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.header-right {
  display: flex;
  gap: 10px;
  align-items: center;
}

.btn-settings {
  background-color: transparent;
  color: #666;
  border: 1px solid #ddd;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.btn-settings:hover {
  background-color: #f5f5f5;
  border-color: #42b883;
  color: #42b883;
}

.content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.sidebar {
  width: 280px;
  background: white;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 0 20px;
  border-bottom: 1px solid #e0e0e0;
  height: 61px;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.sidebar-header h3 {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin: 0;
  line-height: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.sidebar-icon {
  color: #42b883;
}

.tree-container {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  position: relative;
  transition: background-color 0.2s;
}

.tree-container.drag-over-root {
  background-color: #e6f7ef;
}

.drop-zone-hint {
  position: sticky;
  bottom: 0;
  padding: 12px;
  text-align: center;
  font-size: 12px;
  color: #999;
  background: linear-gradient(to top, white 50%, transparent);
  opacity: 0;
  transition: opacity 0.2s;
  pointer-events: none;
}

.tree-container.drag-over-root .drop-zone-hint {
  opacity: 1;
  color: #42b883;
  font-weight: 500;
}

.empty-tree {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}

.empty-tree p {
  margin-bottom: 8px;
}

.hint {
  font-size: 12px;
  color: #bbb;
}

.editor-area {
  flex: 1;
  overflow: hidden;
  background: white;
}

.no-document {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
}

.no-doc-icon {
  font-size: 64px;
  margin-bottom: 20px;
  color: #ddd;
}

.btn-primary {
  background-color: #42b883;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn-primary:hover {
  background-color: #33a06f;
}

.btn-secondary {
  background-color: #f0f0f0;
  color: #333;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-secondary:hover {
  background-color: #e0e0e0;
}

/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  padding: 24px;
  width: 400px;
  max-width: 90vw;
}

.modal-content h2 {
  font-size: 18px;
  margin-bottom: 20px;
  color: #333;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #666;
  margin-bottom: 8px;
}

.form-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.form-input:focus {
  border-color: #42b883;
}

.type-selector {
  display: flex;
  gap: 12px;
}

.radio-label {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.radio-label:hover {
  border-color: #42b883;
  background-color: #f0fdf7;
}

.radio-label input[type="radio"] {
  cursor: pointer;
}

.radio-label input[type="radio"]:checked + span {
  font-weight: 600;
  color: #42b883;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}
</style>


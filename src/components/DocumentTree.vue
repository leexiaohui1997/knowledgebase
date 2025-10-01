<script setup lang="ts">
import { ref } from 'vue'
import type { DocumentNode } from '@/types'

const props = defineProps<{
  nodes: DocumentNode[]
  currentDocId?: string
  level?: number
  allNodes?: DocumentNode[]  // 完整的扁平节点列表
}>()

const emit = defineEmits<{
  select: [doc: DocumentNode]
  delete: [doc: DocumentNode]
  createChild: [parentId: string]
  contextMenu: [e: MouseEvent, doc: DocumentNode]
  dragMove: [nodeId: string, targetParentId: string | null, position: number]
  dragOverNode: []  // 拖动到节点上时通知父组件
}>()

const expandedFolders = ref<Set<string>>(new Set())
const draggedNodeId = ref<string | null>(null)
const dragOverNodeId = ref<string | null>(null)
const dropPosition = ref<'before' | 'inside' | 'after' | null>(null)

function toggleFolder(folderId: string) {
  if (expandedFolders.value.has(folderId)) {
    expandedFolders.value.delete(folderId)
  } else {
    expandedFolders.value.add(folderId)
  }
}

function handleSelect(doc: DocumentNode) {
  if (doc.type === 'folder') {
    toggleFolder(doc.id)
  } else {
    emit('select', doc)
  }
}

function handleDelete(e: Event, doc: DocumentNode) {
  e.stopPropagation()
  emit('delete', doc)
}

function handleCreateChild(e: Event, parentId: string) {
  e.stopPropagation()
  emit('createChild', parentId)
}

function handleContextMenu(e: MouseEvent, doc: DocumentNode) {
  e.preventDefault()
  e.stopPropagation()
  emit('contextMenu', e, doc)
}

// 拖拽开始
function handleDragStart(e: DragEvent, node: DocumentNode) {
  draggedNodeId.value = node.id
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', node.id)
  }
}

// 拖拽结束
function handleDragEnd() {
  draggedNodeId.value = null
  dragOverNodeId.value = null
  dropPosition.value = null
}

// 拖拽经过
function handleDragOver(e: DragEvent, node: DocumentNode) {
  e.preventDefault()
  e.stopPropagation()
  
  // 通知父组件，有节点被拖动经过（用于清除根目录状态）
  emit('dragOverNode')
  
  if (!draggedNodeId.value || draggedNodeId.value === node.id) {
    return
  }
  
  dragOverNodeId.value = node.id
  
  // 计算放置位置
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const mouseY = e.clientY - rect.top
  const height = rect.height
  
  if (node.type === 'folder') {
    // 文件夹：上部、内部、下部
    if (mouseY < height * 0.25) {
      dropPosition.value = 'before'
    } else if (mouseY > height * 0.75) {
      dropPosition.value = 'after'
    } else {
      dropPosition.value = 'inside'
    }
  } else {
    // 文件：只有上部和下部
    if (mouseY < height * 0.5) {
      dropPosition.value = 'before'
    } else {
      dropPosition.value = 'after'
    }
  }
  
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'move'
  }
}

// 拖拽离开
function handleDragLeave(e: DragEvent) {
  e.stopPropagation()
  const relatedTarget = e.relatedTarget as HTMLElement
  const currentTarget = e.currentTarget as HTMLElement
  
  // 只有真正离开节点时才清除状态
  if (!currentTarget.contains(relatedTarget)) {
    dragOverNodeId.value = null
    dropPosition.value = null
  }
}

// 放置
function handleDrop(e: DragEvent, targetNode: DocumentNode) {
  e.preventDefault()
  e.stopPropagation()
  
  if (!draggedNodeId.value || draggedNodeId.value === targetNode.id) {
    handleDragEnd()
    return
  }
  
  // 使用完整的节点列表
  const allNodesList = props.allNodes || props.nodes
  
  const draggedNode = findNodeById(draggedNodeId.value, allNodesList)
  if (!draggedNode) {
    handleDragEnd()
    return
  }
  
  // 防止将父节点拖到子节点中
  if (isDescendant(targetNode.id, draggedNodeId.value, allNodesList)) {
    handleDragEnd()
    return
  }
  
  let newParentId: string | null
  let position: number
  
  if (dropPosition.value === 'inside' && targetNode.type === 'folder') {
    // 放入文件夹内
    newParentId = targetNode.id
    // 获取目标文件夹的子节点数量
    const targetChildren = allNodesList.filter(n => n.parentId === targetNode.id)
    position = targetChildren.length + 1
  } else {
    // 放在节点前后
    newParentId = targetNode.parentId
    const siblings = allNodesList.filter(n => n.parentId === newParentId)
    siblings.sort((a, b) => (a.order || 0) - (b.order || 0))
    
    const targetIndex = siblings.findIndex(n => n.id === targetNode.id)
    if (dropPosition.value === 'before') {
      position = targetNode.order || targetIndex + 1
    } else {
      position = (targetNode.order || targetIndex + 1) + 1
    }
  }
  
  emit('dragMove', draggedNodeId.value, newParentId, position)
  handleDragEnd()
}

// 查找节点（在扁平列表中查找）
function findNodeById(id: string, nodes: DocumentNode[]): DocumentNode | null {
  // 直接在扁平列表中查找
  return nodes.find(node => node.id === id) || null
}

// 检查是否为后代节点（检查是否在子孙节点中）
function isDescendant(ancestorId: string, descendantId: string, nodes: DocumentNode[]): boolean {
  // 从 descendant 开始向上查找，看是否会遇到 ancestor
  let current = nodes.find(n => n.id === descendantId)
  
  while (current) {
    if (current.parentId === ancestorId) {
      return true
    }
    if (!current.parentId) {
      break
    }
    current = nodes.find(n => n.id === current!.parentId)
  }
  
  return false
}
</script>

<template>
  <div class="document-tree">
    <div
      v-for="node in nodes"
      :key="node.id"
      class="tree-node"
      :style="{ paddingLeft: `${(level || 0) * 16}px` }"
    >
      <div
        :class="[
          'node-content',
          {
            active: currentDocId === node.id,
            'drag-over': dragOverNodeId === node.id,
            'drop-before': dragOverNodeId === node.id && dropPosition === 'before',
            'drop-inside': dragOverNodeId === node.id && dropPosition === 'inside',
            'drop-after': dragOverNodeId === node.id && dropPosition === 'after',
            'dragging': draggedNodeId === node.id
          }
        ]"
        draggable="true"
        @click="handleSelect(node)"
        @contextmenu="handleContextMenu($event, node)"
        @dragstart="handleDragStart($event, node)"
        @dragend="handleDragEnd"
        @dragover="handleDragOver($event, node)"
        @dragleave="handleDragLeave"
        @drop="handleDrop($event, node)"
      >
        <span class="node-icon">
          <font-awesome-icon 
            v-if="node.type === 'folder'"
            :icon="['fas', expandedFolders.has(node.id) ? 'folder-open' : 'folder']"
            :class="{ 'folder-open': expandedFolders.has(node.id) }"
          />
          <font-awesome-icon 
            v-else
            :icon="['fas', 'file']"
            class="file-icon"
          />
        </span>
        <span class="node-name">{{ node.name }}</span>
        <div class="node-actions">
          <button
            v-if="node.type === 'folder'"
            @click="handleCreateChild($event, node.id)"
            class="action-btn"
            title="新建子项"
          >
            <font-awesome-icon :icon="['fas', 'plus']" />
          </button>
          <button
            @click="handleDelete($event, node)"
            class="action-btn delete"
            title="删除"
          >
            <font-awesome-icon :icon="['fas', 'trash']" />
          </button>
        </div>
      </div>
      
      <DocumentTree
        v-if="node.type === 'folder' && expandedFolders.has(node.id) && node.children"
        :nodes="node.children"
        :all-nodes="allNodes"
        :current-doc-id="currentDocId"
        :level="(level || 0) + 1"
        @select="emit('select', $event)"
        @delete="emit('delete', $event)"
        @create-child="emit('createChild', $event)"
        @context-menu="(e, doc) => emit('contextMenu', e, doc)"
        @drag-move="(nodeId, parentId, pos) => emit('dragMove', nodeId, parentId, pos)"
        @drag-over-node="emit('dragOverNode')"
      />
    </div>
  </div>
</template>

<style scoped>
.document-tree {
  user-select: none;
}

.tree-node {
  margin-bottom: 2px;
}

.node-content {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: grab;
  border-radius: 6px;
  transition: background-color 0.2s;
  position: relative;
}

.node-content:active {
  cursor: grabbing;
}

.node-content:hover {
  background-color: #f5f5f5;
}

.node-content.active {
  background-color: #e6f7ef;
  color: #42b883;
  font-weight: 500;
}

/* 拖拽状态 */
.node-content.dragging {
  opacity: 0.4;
  cursor: grabbing !important;
}

.node-content.drag-over {
  background-color: #e6f7ef;
}

/* 放置位置指示线 */
.node-content.drop-before::before,
.node-content.drop-after::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  height: 2px;
  background-color: #42b883;
  z-index: 10;
}

.node-content.drop-before::before {
  top: 0;
}

.node-content.drop-after::after {
  bottom: 0;
}

/* 放入文件夹内的指示 */
.node-content.drop-inside {
  background-color: #d4f4e2;
  border: 2px dashed #42b883;
  padding: 6px 10px;
}

.node-icon {
  font-size: 14px;
  flex-shrink: 0;
  width: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
}

.node-icon .folder-open {
  color: #42b883;
}

.node-icon .file-icon {
  color: #888;
}

.node-name {
  flex: 1;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.node-actions {
  display: none;
  align-items: center;
  gap: 4px;
}

.node-content:hover .node-actions {
  display: flex;
}

.action-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 12px;
  padding: 4px;
  border-radius: 4px;
  opacity: 0.6;
  transition: all 0.2s;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn:hover {
  opacity: 1;
  background-color: rgba(0, 0, 0, 0.05);
}

.action-btn.delete:hover {
  background-color: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}
</style>


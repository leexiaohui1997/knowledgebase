<script setup lang="ts">
import { ref, computed, onMounted, toRaw } from 'vue'
import { useRouter } from 'vue-router'
import { useKnowledgeStore } from '@/stores/knowledge'
import ContextMenu from '@/components/ContextMenu.vue'
import SettingsModal from '@/components/SettingsModal.vue'
import { alert } from '@/composables/useAlert'
import type { KnowledgeBase } from '@/types'
import type { MenuItem } from '@/components/ContextMenu.vue'

const router = useRouter()
const store = useKnowledgeStore()

const searchQuery = ref('')
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showSettings = ref(false)
const editingKnowledgeBase = ref<KnowledgeBase | null>(null)
const formData = ref({
  name: '',
  avatar: '📚',
  description: ''
})
const contextMenuRef = ref<InstanceType<typeof ContextMenu> | null>(null)

// 可选的头像表情列表
const avatarOptions = ['📚', '📖', '📝', '📔', '📕', '📗', '📘', '📙', '📓', '🗂️', '📂', '📁', '💼', '🎯', '⚡', '🔥', '💡', '🚀', '🌟', '✨']

// 过滤后的知识库列表
const filteredKnowledgeBases = computed(() => {
  if (!searchQuery.value) {
    return store.knowledgeBases
  }
  const query = searchQuery.value.toLowerCase()
  return store.knowledgeBases.filter(kb =>
    kb.name.toLowerCase().includes(query) ||
    kb.description.toLowerCase().includes(query)
  )
})

// 加载知识库列表
onMounted(async () => {
  await store.loadKnowledgeBases()
})

// 打开创建弹窗
function openCreateModal() {
  formData.value = {
    name: '',
    avatar: '📚',
    description: ''
  }
  editingKnowledgeBase.value = null
  showCreateModal.value = true
}

// 打开编辑弹窗
function openEditModal(kb: KnowledgeBase) {
  editingKnowledgeBase.value = kb
  formData.value = {
    name: kb.name,
    avatar: kb.avatar,
    description: kb.description
  }
  showEditModal.value = true
}

// 关闭弹窗
function closeModal() {
  showCreateModal.value = false
  showEditModal.value = false
  editingKnowledgeBase.value = null
}

// 创建知识库
async function handleCreate() {
  if (!formData.value.name.trim()) {
    alert('请输入知识库名称', { type: 'warning' })
    return
  }
  await store.createKnowledgeBase(formData.value)
  closeModal()
}

// 更新知识库
async function handleUpdate() {
  if (!formData.value.name.trim()) {
    alert('请输入知识库名称', { type: 'warning' })
    return
  }
  if (editingKnowledgeBase.value) {
    // 使用 toRaw 获取原始对象，避免响应式 Proxy
    const rawKb = toRaw(editingKnowledgeBase.value)
    await store.updateKnowledgeBase({
      ...rawKb,
      ...formData.value
    })
  }
  closeModal()
}

// 删除知识库
async function handleDelete(kb: KnowledgeBase) {
  if (confirm(`确定要删除知识库「${kb.name}」吗？这将删除该知识库下的所有文档。`)) {
    await store.deleteKnowledgeBase(kb.id)
  }
}

// 进入知识库详情
function goToDetail(kb: KnowledgeBase) {
  store.setCurrentKnowledgeBase(kb)
  router.push(`/knowledge-base/${kb.id}`)
}

// 处理空白区域右键菜单
function handleEmptyAreaContextMenu(e: MouseEvent) {
  e.preventDefault()
  contextMenuItems.value = [
    {
      label: '创建知识库',
      icon: 'fa-plus',
      action: openCreateModal
    }
  ]
  contextMenuRef.value?.show(e.clientX, e.clientY)
}

// 当前右键菜单项
const contextMenuItems = ref<MenuItem[]>([])

// 处理知识库卡片右键菜单
function handleKbContextMenu(e: MouseEvent, kb: KnowledgeBase) {
  e.preventDefault()
  e.stopPropagation()
  contextMenuItems.value = [
    {
      label: '打开',
      icon: 'fa-folder-open',
      action: () => goToDetail(kb)
    },
    {
      label: '编辑',
      icon: 'fa-pen-to-square',
      action: () => openEditModal(kb)
    },
    { label: '', divider: true, action: () => {} },
    {
      label: '删除',
      icon: 'fa-trash',
      action: () => handleDelete(kb)
    }
  ]
  contextMenuRef.value?.show(e.clientX, e.clientY)
}

</script>

<template>
  <div class="knowledge-base-list">
    <header class="header">
      <div class="header-content">
        <h1>
          <font-awesome-icon :icon="['fas', 'book']" class="header-icon" />
          知识库管理
        </h1>
        <div class="header-actions">
          <div class="search-wrapper">
            <font-awesome-icon :icon="['fas', 'magnifying-glass']" class="search-icon" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜索知识库..."
              class="search-input"
            />
          </div>
          <button @click="openCreateModal" class="btn-primary">
            <font-awesome-icon :icon="['fas', 'plus']" />
            创建知识库
          </button>
          <button @click="showSettings = true" class="btn-settings" title="设置">
            <font-awesome-icon :icon="['fas', 'gear']" />
          </button>
        </div>
      </div>
    </header>

    <main class="main-content" @contextmenu="handleEmptyAreaContextMenu">
      <div v-if="filteredKnowledgeBases.length === 0" class="empty-state">
        <font-awesome-icon :icon="['fas', 'book']" class="empty-icon" />
        <p class="empty-text">{{ searchQuery ? '未找到相关知识库' : '还没有知识库，右键或点击右上角创建一个吧' }}</p>
      </div>

      <div v-else class="kb-grid">
        <div
          v-for="kb in filteredKnowledgeBases"
          :key="kb.id"
          class="kb-card"
          @click="goToDetail(kb)"
          @contextmenu="handleKbContextMenu($event, kb)"
        >
          <div class="kb-avatar">{{ kb.avatar }}</div>
          <div class="kb-content">
            <h3 class="kb-name">{{ kb.name }}</h3>
            <p class="kb-description">{{ kb.description || '暂无简介' }}</p>
            <div class="kb-meta">
              <span>更新于 {{ new Date(kb.updatedAt).toLocaleDateString() }}</span>
            </div>
          </div>
          <button
            @click.stop="handleDelete(kb)"
            class="btn-delete"
            title="删除"
          >
            <font-awesome-icon :icon="['fas', 'trash']" />
          </button>
        </div>
      </div>
    </main>

    <!-- 右键菜单 -->
    <ContextMenu ref="contextMenuRef" :items="contextMenuItems" />

    <!-- 创建知识库弹窗 -->
    <div v-if="showCreateModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <h2>创建知识库</h2>
        <div class="form-group">
          <label>名称 *</label>
          <input
            v-model="formData.name"
            type="text"
            placeholder="请输入知识库名称"
            class="form-input"
          />
        </div>
        <div class="form-group">
          <label>头像</label>
          <div class="avatar-selector">
            <div
              v-for="emoji in avatarOptions"
              :key="emoji"
              :class="['avatar-option', { active: formData.avatar === emoji }]"
              @click="formData.avatar = emoji"
            >
              {{ emoji }}
            </div>
          </div>
        </div>
        <div class="form-group">
          <label>简介</label>
          <textarea
            v-model="formData.description"
            placeholder="请输入知识库简介"
            class="form-textarea"
            rows="3"
          ></textarea>
        </div>
        <div class="modal-actions">
          <button @click="closeModal" class="btn-secondary">取消</button>
          <button @click="handleCreate" class="btn-primary">创建</button>
        </div>
      </div>
    </div>

    <!-- 编辑知识库弹窗 -->
    <div v-if="showEditModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <h2>编辑知识库</h2>
        <div class="form-group">
          <label>名称 *</label>
          <input
            v-model="formData.name"
            type="text"
            placeholder="请输入知识库名称"
            class="form-input"
          />
        </div>
        <div class="form-group">
          <label>头像</label>
          <div class="avatar-selector">
            <div
              v-for="emoji in avatarOptions"
              :key="emoji"
              :class="['avatar-option', { active: formData.avatar === emoji }]"
              @click="formData.avatar = emoji"
            >
              {{ emoji }}
            </div>
          </div>
        </div>
        <div class="form-group">
          <label>简介</label>
          <textarea
            v-model="formData.description"
            placeholder="请输入知识库简介"
            class="form-textarea"
            rows="3"
          ></textarea>
        </div>
        <div class="modal-actions">
          <button @click="closeModal" class="btn-secondary">取消</button>
          <button @click="handleUpdate" class="btn-primary">保存</button>
        </div>
      </div>
    </div>
  </div>

  <!-- 设置弹窗 -->
  <SettingsModal :show="showSettings" @close="showSettings = false" />
</template>

<style scoped>
.knowledge-base-list {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

.header {
  background: white;
  border-bottom: 1px solid #e0e0e0;
  padding: 20px 30px;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header h1 {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-icon {
  color: #42b883;
}

.header-actions {
  display: flex;
  gap: 15px;
  align-items: center;
}

.search-wrapper {
  position: relative;
  display: inline-block;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
  font-size: 14px;
}

.search-input {
  padding: 10px 16px 10px 36px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  width: 250px;
  outline: none;
  transition: border-color 0.2s;
  height: 40px;
  box-sizing: border-box;
}

.search-input:focus {
  border-color: #42b883;
}

.search-input:focus + .search-icon {
  color: #42b883;
}

.main-content {
  flex: 1;
  overflow-y: auto;
  padding: 30px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 20px;
  color: #ddd;
}

.empty-text {
  font-size: 16px;
}

.kb-grid {
  max-width: 1400px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.kb-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid #e0e0e0;
  position: relative;
  display: flex;
  gap: 15px;
}

.kb-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  border-color: #42b883;
}

.kb-avatar {
  font-size: 48px;
  flex-shrink: 0;
}

.kb-content {
  flex: 1;
  min-width: 0;
}

.kb-name {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #333;
}

.kb-description {
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.kb-meta {
  font-size: 12px;
  color: #999;
}

.btn-delete {
  position: absolute;
  top: 15px;
  right: 15px;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 18px;
  opacity: 0;
  transition: opacity 0.2s;
  padding: 5px;
}

.kb-card:hover .btn-delete {
  opacity: 0.6;
}

.btn-delete:hover {
  opacity: 1 !important;
}

.btn-primary {
  background-color: #42b883;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
  font-weight: 500;
  height: 40px;
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-primary:hover {
  background-color: #33a06f;
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

.btn-secondary {
  background-color: #f0f0f0;
  color: #333;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
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
  padding: 30px;
  width: 540px;
  max-width: 90vw;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-content h2 {
  font-size: 20px;
  margin-bottom: 20px;
  color: #333;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #666;
  margin-bottom: 8px;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
  font-family: inherit;
}

.form-input:focus,
.form-textarea:focus {
  border-color: #42b883;
}

.avatar-selector {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
  max-width: 100%;
  box-sizing: border-box;
}

.avatar-option {
  font-size: 24px;
  padding: 8px;
  text-align: center;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s;
  border: 2px solid transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1;
  box-sizing: border-box;
  min-width: 0;
  overflow: hidden;
}

.avatar-option:hover {
  background-color: #f0f0f0;
}

.avatar-option.active {
  background-color: #e6f7ef;
  border-color: #42b883;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 25px;
}
</style>


<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useKnowledgeStore } from '@/stores/knowledge'
import { alert, confirm, alertSuccess } from '@/composables/useAlert'
import AvatarSelector from '@/components/AvatarSelector.vue'

const router = useRouter()
const store = useKnowledgeStore()

// 表单数据
const formData = ref({
  name: '',
  description: '',
  avatar: ''
})

// 是否正在保存
const isSaving = ref(false)

// 当前知识库
const currentKnowledgeBase = computed(() => store.currentKnowledgeBase)

// 初始化表单数据
function initFormData() {
  if (currentKnowledgeBase.value) {
    formData.value = {
      name: currentKnowledgeBase.value.name,
      description: currentKnowledgeBase.value.description || '',
      avatar: currentKnowledgeBase.value.avatar || '📚'
    }
  }
}

// 保存设置
async function handleSave() {
  if (!formData.value.name.trim()) {
    alert('请输入知识库名称', { type: 'warning' })
    return
  }

  if (!currentKnowledgeBase.value) {
    alert('未找到当前知识库', { type: 'error' })
    return
  }

  isSaving.value = true
  try {
    // 创建更新后的知识库对象
    const updatedKnowledgeBase = {
      ...currentKnowledgeBase.value,
      name: formData.value.name.trim(),
      description: formData.value.description.trim(),
      avatar: formData.value.avatar.trim()
    }
    
    await store.updateKnowledgeBase(updatedKnowledgeBase)
    
    alertSuccess('设置已保存')
  } catch (error) {
    console.error('保存设置失败:', error)
    alert('保存失败，请重试', { type: 'error' })
  } finally {
    isSaving.value = false
  }
}

// 删除知识库
async function handleDelete() {
  if (!currentKnowledgeBase.value) {
    alert('未找到当前知识库', { type: 'error' })
    return
  }

  const result = await confirm(
    `确定要删除知识库「${currentKnowledgeBase.value.name}」吗？这将删除该知识库下的所有文档。`,
    {
      title: '确认删除',
      type: 'error',
      confirmText: '删除',
      cancelText: '取消'
    }
  )

  if (result) {
    try {
      await store.deleteKnowledgeBase(currentKnowledgeBase.value.id)
      // 删除成功后返回知识库列表页
      router.push('/')
    } catch (error) {
      console.error('删除知识库失败:', error)
      alert('删除失败，请重试', { type: 'error' })
    }
  }
}

// 组件挂载时初始化数据
onMounted(() => {
  initFormData()
})
</script>

<template>
  <div class="knowledge-base-settings">
    <div class="settings-header">
      <h3>知识库设置</h3>
    </div>

    <div class="settings-content">
      <!-- 基本信息 -->
      <div class="form-section">
        <div class="form-group">
          <label>图标</label>
          <AvatarSelector v-model="formData.avatar" />
        </div>

        <div class="form-group">
          <label for="name">名称 *</label>
          <input
            id="name"
            v-model="formData.name"
            type="text"
            placeholder="请输入知识库名称"
            class="form-input"
            required
          />
        </div>

        <div class="form-group">
          <label for="description">简介</label>
          <textarea
            id="description"
            v-model="formData.description"
            placeholder="请输入知识库简介（可选）"
            class="form-textarea"
            rows="3"
          ></textarea>
        </div>

        <div class="form-actions">
          <button
            @click="handleSave"
            :disabled="isSaving"
            class="btn-save"
          >
            <font-awesome-icon :icon="['fas', 'floppy-disk']" />
            {{ isSaving ? '保存中...' : '保存' }}
          </button>
        </div>
      </div>

      <!-- 分割线 -->
      <div class="divider"></div>

      <!-- 危险操作 -->
      <div class="danger-section">
        <h4>危险操作</h4>
        <p class="danger-description">
          删除知识库将永久删除该知识库下的所有文档，此操作不可撤销。
        </p>
        <button
          @click="handleDelete"
          class="btn-delete"
        >
          <font-awesome-icon :icon="['fas', 'trash']" />
          删除知识库
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.knowledge-base-settings {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
}

.settings-header {
  padding: 16px 20px;
  border-bottom: 1px solid #e0e0e0;
  background: #f8f9fa;
  height: 49px;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.settings-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.settings-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.form-section {
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #42b883;
  box-shadow: 0 0 0 2px rgba(66, 184, 131, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.form-actions {
  margin-top: 20px;
}

.btn-save {
  background-color: #42b883;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn-save:hover:not(:disabled) {
  background-color: #369870;
}

.btn-save:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.divider {
  height: 1px;
  background-color: #e0e0e0;
  margin: 20px 0;
}

.danger-section {
  padding: 20px 0;
}

.danger-section h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
  color: #dc3545;
}

.danger-description {
  margin: 0 0 16px 0;
  font-size: 13px;
  color: #666;
  line-height: 1.4;
}

.btn-delete {
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn-delete:hover {
  background-color: #c82333;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .settings-content {
    padding: 16px;
  }
  
  .settings-header {
    padding: 12px 16px;
  }
}
</style>

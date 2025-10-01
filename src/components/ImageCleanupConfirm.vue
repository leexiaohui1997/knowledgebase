<script setup lang="ts">
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { getStorage } from '@/storage'
import { ref, onMounted } from 'vue'

const props = defineProps<{
  images: string[]
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

// 图片预览数据
const imagePreviewMap = ref<Map<string, string>>(new Map())

// 加载图片预览
onMounted(async () => {
  const storage = getStorage()
  for (const imagePath of props.images) {
    try {
      const base64Data = await storage.readImage(imagePath)
      imagePreviewMap.value.set(imagePath, base64Data)
    } catch (error) {
      console.error('加载图片预览失败:', imagePath, error)
    }
  }
})

// 获取图片预览 URL
function getImagePreview(imagePath: string): string {
  const base64 = imagePreviewMap.value.get(imagePath)
  if (base64) {
    // 如果已经是完整的 data URL，直接返回
    if (base64.startsWith('data:')) {
      return base64
    }
    // 否则添加前缀
    return `data:image/png;base64,${base64}`
  }
  return ''
}

// 格式化文件大小
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}
</script>

<template>
  <div class="confirm-overlay" @click="emit('cancel')">
    <div class="confirm-modal" @click.stop>
      <!-- 头部 -->
      <div class="confirm-header">
        <h3>
          <FontAwesomeIcon icon="triangle-exclamation" class="warning-icon" />
          确认清理图片
        </h3>
        <button class="close-btn" @click="emit('cancel')">
          <FontAwesomeIcon icon="xmark" />
        </button>
      </div>

      <!-- 提示信息 -->
      <div class="confirm-message">
        <p>
          发现 <strong>{{ images.length }}</strong> 张未使用的图片，占用存储空间。
        </p>
        <p class="warning-text">
          <FontAwesomeIcon icon="circle-exclamation" />
          删除后无法恢复，请确认以下图片确实不再需要。
        </p>
      </div>

      <!-- 图片列表 -->
      <div class="images-list">
        <div
          v-for="(imagePath, index) in images"
          :key="imagePath"
          class="image-item"
        >
          <div class="image-preview">
            <img
              v-if="imagePreviewMap.has(imagePath)"
              :src="getImagePreview(imagePath)"
              :alt="imagePath"
            />
            <div v-else class="preview-loading">
              <FontAwesomeIcon icon="spinner" spin />
            </div>
          </div>
          <div class="image-info">
            <div class="image-path">
              <FontAwesomeIcon icon="image" />
              <span>{{ imagePath }}</span>
            </div>
            <div class="image-index">
              #{{ index + 1 }}
            </div>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="confirm-actions">
        <button class="btn-cancel" @click="emit('cancel')">
          <FontAwesomeIcon icon="xmark" />
          取消
        </button>
        <button class="btn-confirm" @click="emit('confirm')">
          <FontAwesomeIcon icon="trash" />
          确认删除 ({{ images.length }})
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.confirm-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2100;
}

.confirm-modal {
  background: white;
  border-radius: 12px;
  width: 600px;
  max-width: 90vw;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

/* 头部 */
.confirm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 25px;
  border-bottom: 1px solid #e0e0e0;
}

.confirm-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.warning-icon {
  color: #ff9800;
}

.close-btn {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: #666;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-btn:hover {
  background-color: #f0f0f0;
  color: #333;
}

/* 提示信息 */
.confirm-message {
  padding: 20px 25px;
  background: #fff3e0;
  border-bottom: 1px solid #ffe0b2;
}

.confirm-message p {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: #333;
  line-height: 1.6;
}

.confirm-message p:last-child {
  margin-bottom: 0;
}

.confirm-message strong {
  color: #ff9800;
  font-weight: 600;
}

.warning-text {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #f57c00 !important;
  font-size: 13px !important;
}

/* 图片列表 */
.images-list {
  flex: 1;
  overflow-y: auto;
  padding: 15px 25px;
}

.image-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 10px;
  transition: all 0.2s;
}

.image-item:hover {
  background: #f0f1f3;
}

.image-preview {
  width: 60px;
  height: 60px;
  border-radius: 6px;
  overflow: hidden;
  background: #e0e0e0;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-loading {
  color: #999;
  font-size: 20px;
}

.image-info {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.image-path {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #666;
  overflow: hidden;
}

.image-path span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.image-index {
  font-size: 12px;
  color: #999;
  padding: 2px 8px;
  background: white;
  border-radius: 4px;
  white-space: nowrap;
}

/* 操作按钮 */
.confirm-actions {
  display: flex;
  gap: 10px;
  padding: 20px 25px;
  border-top: 1px solid #e0e0e0;
  justify-content: flex-end;
}

.btn-cancel,
.btn-confirm {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
  border: none;
}

.btn-cancel {
  background-color: #f0f0f0;
  color: #666;
}

.btn-cancel:hover {
  background-color: #e0e0e0;
  color: #333;
}

.btn-confirm {
  background-color: #f44336;
  color: white;
}

.btn-confirm:hover {
  background-color: #d32f2f;
}

/* 滚动条样式 */
.images-list::-webkit-scrollbar {
  width: 6px;
}

.images-list::-webkit-scrollbar-track {
  background: transparent;
}

.images-list::-webkit-scrollbar-thumb {
  background: #ddd;
  border-radius: 3px;
}

.images-list::-webkit-scrollbar-thumb:hover {
  background: #ccc;
}
</style>


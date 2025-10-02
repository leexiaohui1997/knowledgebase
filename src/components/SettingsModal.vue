<script setup lang="ts">
import { ref, computed } from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import ImageCleanupConfirm from './ImageCleanupConfirm.vue'
import { getStorage } from '@/storage'
import { alertSuccess, alertError } from '@/composables/useAlert'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

// 当前选中的导航项
const activeTab = ref('general')

// 图片清理相关
const isScanning = ref(false)
const unusedImages = ref<string[]>([])
const showCleanupConfirm = ref(false)

// 开始扫描未使用的图片
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

// 确认清理图片
async function confirmCleanup() {
  try {
    const storage = getStorage()
    await storage.cleanupUnusedImages(unusedImages.value)
    alertSuccess(`成功清理 ${unusedImages.value.length} 张图片！`)
    unusedImages.value = []
    showCleanupConfirm.value = false
  } catch (error) {
    console.error('清理图片失败:', error)
    alertError('清理失败，请重试')
  }
}

// 取消清理
function cancelCleanup() {
  showCleanupConfirm.value = false
  unusedImages.value = []
}

// 关闭设置弹窗
function closeModal() {
  emit('close')
}
</script>

<template>
  <div v-if="show" class="settings-overlay" @click="closeModal">
    <div class="settings-modal" @click.stop>
      <!-- 头部 -->
      <div class="settings-header">
        <h2>
          <FontAwesomeIcon icon="gear" />
          设置
        </h2>
        <button class="close-btn" @click="closeModal">
          <FontAwesomeIcon icon="xmark" />
        </button>
      </div>

      <!-- 主体内容 -->
      <div class="settings-content">
        <!-- 左侧导航 -->
        <div class="settings-sidebar">
          <div
            :class="['sidebar-item', { active: activeTab === 'general' }]"
            @click="activeTab = 'general'"
          >
            <FontAwesomeIcon icon="sliders" />
            <span>通用</span>
          </div>
        </div>

        <!-- 右侧内容 -->
        <div class="settings-main">
          <!-- 通用设置 -->
          <div v-if="activeTab === 'general'" class="settings-section">
            <h3>通用设置</h3>

            <!-- 清理图片 -->
            <div class="setting-item">
              <div class="setting-info">
                <div class="setting-title">
                  <FontAwesomeIcon icon="trash" />
                  清理图片
                </div>
                <div class="setting-description">
                  扫描并删除未被使用的图片，释放存储空间
                </div>
              </div>
              <button
                class="btn-action"
                :disabled="isScanning"
                @click="scanUnusedImages"
              >
                <FontAwesomeIcon
                  :icon="isScanning ? 'spinner' : 'broom'"
                  :spin="isScanning"
                />
                {{ isScanning ? '扫描中...' : '开始清理' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 图片清理确认弹窗 -->
    <ImageCleanupConfirm
      v-if="showCleanupConfirm"
      :images="unusedImages"
      @confirm="confirmCleanup"
      @cancel="cancelCleanup"
    />
  </div>
</template>

<style scoped>
.settings-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.settings-modal {
  background: white;
  border-radius: 12px;
  width: 800px;
  max-width: 90vw;
  height: 600px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

/* 头部 */
.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 25px;
  border-bottom: 1px solid #e0e0e0;
}

.settings-header h2 {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
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

/* 主体内容 */
.settings-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* 左侧导航 */
.settings-sidebar {
  width: 200px;
  border-right: 1px solid #e0e0e0;
  padding: 20px 10px;
  overflow-y: auto;
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 15px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  color: #666;
  font-size: 14px;
}

.sidebar-item:hover {
  background-color: #f5f5f5;
  color: #333;
}

.sidebar-item.active {
  background-color: #e6f7ef;
  color: #42b883;
  font-weight: 500;
}

/* 右侧内容 */
.settings-main {
  flex: 1;
  padding: 25px;
  overflow-y: auto;
}

.settings-section h3 {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 20px 0;
}

/* 设置项 */
.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 10px;
  margin-bottom: 15px;
}

.setting-info {
  flex: 1;
}

.setting-title {
  font-size: 15px;
  font-weight: 500;
  color: #333;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.setting-description {
  font-size: 13px;
  color: #666;
  line-height: 1.5;
}

.btn-action {
  padding: 10px 20px;
  background-color: #42b883;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}

.btn-action:hover:not(:disabled) {
  background-color: #33a06f;
}

.btn-action:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 滚动条样式 */
.settings-sidebar::-webkit-scrollbar,
.settings-main::-webkit-scrollbar {
  width: 6px;
}

.settings-sidebar::-webkit-scrollbar-track,
.settings-main::-webkit-scrollbar-track {
  background: transparent;
}

.settings-sidebar::-webkit-scrollbar-thumb,
.settings-main::-webkit-scrollbar-thumb {
  background: #ddd;
  border-radius: 3px;
}

.settings-sidebar::-webkit-scrollbar-thumb:hover,
.settings-main::-webkit-scrollbar-thumb:hover {
  background: #ccc;
}
</style>


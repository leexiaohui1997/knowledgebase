<script setup lang="ts">
import { computed } from 'vue'
import { useAlertState, closeAlert } from '@/composables/useAlert'

interface AlertOptions {
  title?: string
  message: string
  type?: 'info' | 'success' | 'warning' | 'error'
  confirmText?: string
  showCancel?: boolean
  cancelText?: string
}

const props = withDefaults(defineProps<{
  show?: boolean
  options?: AlertOptions
}>(), {
  show: undefined,
  options: undefined
})

const emit = defineEmits<{
  close: []
  confirm: []
  cancel: []
}>()

// 使用全局状态
const alertState = useAlertState()

// 获取当前显示的状态和选项
const currentShow = computed(() => props.show !== undefined ? props.show : alertState.show)
const currentOptions = computed(() => props.options || alertState.options)

function handleConfirm() {
  // 触发全局事件
  window.dispatchEvent(new CustomEvent('alert-confirm'))
  emit('confirm')
  closeAlert()
}

function handleCancel() {
  // 触发全局事件
  window.dispatchEvent(new CustomEvent('alert-cancel'))
  emit('cancel')
  closeAlert()
}

function handleOverlayClick(e: MouseEvent) {
  if (e.target === e.currentTarget) {
    closeAlert()
    emit('close')
  }
}

// 获取图标
function getIcon() {
  switch (currentOptions.value.type) {
    case 'success':
      return 'fa-check-circle'
    case 'warning':
      return 'fa-exclamation-triangle'
    case 'error':
      return 'fa-times-circle'
    default:
      return 'fa-info-circle'
  }
}

// 获取颜色类
function getColorClass() {
  switch (currentOptions.value.type) {
    case 'success':
      return 'alert-success'
    case 'warning':
      return 'alert-warning'
    case 'error':
      return 'alert-error'
    default:
      return 'alert-info'
  }
}
</script>

<template>
  <div 
    v-if="currentShow"
    class="custom-alert-overlay"
    :class="{ 'show': currentShow }"
    @click="handleOverlayClick"
  >
    <div class="custom-alert-modal" :class="getColorClass()">
      <div class="alert-header">
        <div class="alert-icon">
          <font-awesome-icon :icon="['fas', getIcon()]" />
        </div>
        <h3 class="alert-title">{{ currentOptions.title || '提示' }}</h3>
      </div>
      
      <div class="alert-content">
        <p class="alert-message">{{ currentOptions.message }}</p>
      </div>
      
      <div class="alert-actions">
        <button 
          v-if="currentOptions.showCancel"
          @click="handleCancel"
          class="btn-cancel"
        >
          {{ currentOptions.cancelText || '取消' }}
        </button>
        <button 
          @click="handleConfirm"
          class="btn-confirm"
        >
          {{ currentOptions.confirmText || '确定' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-alert-overlay {
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
  opacity: 0;
  transition: opacity 0.2s ease;
}

.custom-alert-overlay.show {
  opacity: 1;
}

.custom-alert-modal {
  background: white;
  border-radius: 12px;
  padding: 24px;
  width: 400px;
  max-width: 90vw;
  max-height: 90vh;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  transform: scale(0.9) translateY(20px);
  transition: all 0.2s ease;
  border-left: 4px solid #42b883;
}

.custom-alert-overlay.show .custom-alert-modal {
  transform: scale(1) translateY(0);
}

.alert-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.alert-icon {
  font-size: 24px;
  color: #42b883;
  flex-shrink: 0;
}

.alert-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.alert-content {
  margin-bottom: 24px;
}

.alert-message {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
  margin: 0;
}

.alert-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn-confirm,
.btn-cancel {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  min-width: 80px;
}

.btn-confirm {
  background-color: #42b883;
  color: white;
}

.btn-confirm:hover {
  background-color: #33a06f;
}

.btn-cancel {
  background-color: #f0f0f0;
  color: #666;
}

.btn-cancel:hover {
  background-color: #e0e0e0;
}

/* 不同类型的状态颜色 */
.alert-success {
  border-left-color: #10b981;
}

.alert-success .alert-icon {
  color: #10b981;
}

.alert-warning {
  border-left-color: #f59e0b;
}

.alert-warning .alert-icon {
  color: #f59e0b;
}

.alert-error {
  border-left-color: #ef4444;
}

.alert-error .alert-icon {
  color: #ef4444;
}

.alert-info {
  border-left-color: #42b883;
}

.alert-info .alert-icon {
  color: #42b883;
}
</style>

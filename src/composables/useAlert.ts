import { reactive } from 'vue'

interface AlertOptions {
  title?: string
  message: string
  type?: 'info' | 'success' | 'warning' | 'error'
  confirmText?: string
  showCancel?: boolean
  cancelText?: string
}

interface AlertState {
  show: boolean
  options: AlertOptions
}

const alertState = reactive<AlertState>({
  show: false,
  options: {
    message: '',
    type: 'info'
  }
})

// 全局 alert 函数
export function alert(message: string, options: Partial<AlertOptions> = {}) {
  alertState.options = {
    message,
    type: 'info',
    ...options
  }
  alertState.show = true
}

// 成功提示
export function alertSuccess(message: string, title?: string) {
  alert(message, {
    title: title || '成功',
    type: 'success'
  })
}

// 警告提示
export function alertWarning(message: string, title?: string) {
  alert(message, {
    title: title || '警告',
    type: 'warning'
  })
}

// 错误提示
export function alertError(message: string, title?: string) {
  alert(message, {
    title: title || '错误',
    type: 'error'
  })
}

// 确认对话框
export function confirm(message: string, options: Partial<AlertOptions> = {}) {
  return new Promise<boolean>((resolve) => {
    // 设置确认对话框状态
    alertState.options = {
      message,
      type: 'warning',
      showCancel: true,
      confirmText: '确定',
      cancelText: '取消',
      ...options
    }
    alertState.show = true
    
    // 创建一次性事件监听器
    const handleConfirm = () => {
      window.removeEventListener('alert-confirm', handleConfirm)
      window.removeEventListener('alert-cancel', handleCancel)
      alertState.show = false
      resolve(true)
    }
    
    const handleCancel = () => {
      window.removeEventListener('alert-confirm', handleConfirm)
      window.removeEventListener('alert-cancel', handleCancel)
      alertState.show = false
      resolve(false)
    }
    
    // 监听确认和取消事件
    window.addEventListener('alert-confirm', handleConfirm)
    window.addEventListener('alert-cancel', handleCancel)
  })
}

// 获取 alert 状态
export function useAlertState() {
  return alertState
}

// 关闭 alert
export function closeAlert() {
  alertState.show = false
}

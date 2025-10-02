import { ref, reactive } from 'vue'

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
    alert(message, {
      title: '确认',
      type: 'warning',
      showCancel: true,
      confirmText: '确定',
      cancelText: '取消',
      ...options
    })
    
    // 监听确认和取消事件
    const handleConfirm = () => {
      alertState.show = false
      resolve(true)
    }
    
    const handleCancel = () => {
      alertState.show = false
      resolve(false)
    }
    
    // 这里需要与组件通信，暂时使用简单的实现
    // 在实际使用中，可以通过事件总线或全局状态管理来处理
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

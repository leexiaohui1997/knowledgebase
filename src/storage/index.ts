/**
 * 存储工厂
 * 根据环境自动选择合适的存储实现
 */

import type { IStorage } from './types'
import { ElectronStorage } from './electron-storage'
import { WebStorage } from './web-storage'

let storageInstance: IStorage | null = null

/**
 * 检测当前运行环境
 */
export function isElectronEnvironment(): boolean {
  return typeof window !== 'undefined' && !!window.electronAPI
}

/**
 * 获取存储实例（单例模式）
 */
export function getStorage(): IStorage {
  if (!storageInstance) {
    if (isElectronEnvironment()) {
      console.log('🖥️ 使用 Electron 存储')
      storageInstance = new ElectronStorage()
    } else {
      console.log('🌐 使用 Web 存储 (IndexedDB)')
      storageInstance = new WebStorage()
    }
  }
  return storageInstance
}

/**
 * 重置存储实例（用于测试）
 */
export function resetStorage(): void {
  storageInstance = null
}

// 导出类型和接口
export type { IStorage, StorageData } from './types'
export { StorageType } from './types'
export { ElectronStorage } from './electron-storage'
export { WebStorage } from './web-storage'


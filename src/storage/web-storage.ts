/**
 * Web 版存储实现（使用 IndexedDB）
 */

import type { IStorage, StorageData } from './types'
import type { KnowledgeBase, DocumentNode } from '../types'
import { MediaManager } from './media-manager'
import { LocalMediaProvider } from './local-media-provider'
import type { IMediaManager } from './media-provider'

const DB_NAME = 'KnowledgeBaseDB'
const DB_VERSION = 1
const STORE_DATA = 'data' // 存储知识库和文档数据
const STORE_IMAGES = 'images' // 存储图片

export class WebStorage implements IStorage {
  private db: IDBDatabase | null = null
  private mediaManager: IMediaManager

  constructor() {
    this.mediaManager = new MediaManager()
    // 注册本地媒体提供者
    const localMediaProvider = new LocalMediaProvider(this)
    this.mediaManager.registerProvider(localMediaProvider)
  }

  /**
   * 初始化数据库
   */
  private async initDB(): Promise<IDBDatabase> {
    if (this.db) {
      return this.db
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve(request.result)
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // 创建数据存储对象仓库
        if (!db.objectStoreNames.contains(STORE_DATA)) {
          db.createObjectStore(STORE_DATA, { keyPath: 'id' })
        }

        // 创建图片存储对象仓库
        if (!db.objectStoreNames.contains(STORE_IMAGES)) {
          db.createObjectStore(STORE_IMAGES, { keyPath: 'id' })
        }
      }
    })
  }

  /**
   * 读取数据
   */
  private async readData(): Promise<StorageData> {
    const db = await this.initDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_DATA], 'readonly')
      const store = transaction.objectStore(STORE_DATA)
      const request = store.get('main')

      request.onsuccess = () => {
        const data = request.result?.data || { knowledgeBases: [], documents: {} }
        resolve(data)
      }
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * 写入数据
   */
  private async writeData(data: StorageData): Promise<void> {
    const db = await this.initDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_DATA], 'readwrite')
      const store = transaction.objectStore(STORE_DATA)
      const request = store.put({ id: 'main', data })

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  // ==================== 知识库操作 ====================

  async getKnowledgeBases(): Promise<KnowledgeBase[]> {
    const data = await this.readData()
    return data.knowledgeBases
  }

  async createKnowledgeBase(kb: KnowledgeBase): Promise<void> {
    const data = await this.readData()
    data.knowledgeBases.push(kb)
    await this.writeData(data)
  }

  async updateKnowledgeBase(kb: KnowledgeBase): Promise<void> {
    const data = await this.readData()
    const index = data.knowledgeBases.findIndex(k => k.id === kb.id)
    if (index !== -1) {
      data.knowledgeBases[index] = kb
      await this.writeData(data)
    }
  }

  async deleteKnowledgeBase(id: string): Promise<void> {
    const data = await this.readData()
    data.knowledgeBases = data.knowledgeBases.filter(k => k.id !== id)
    delete data.documents[id]
    await this.writeData(data)
  }

  // ==================== 文档操作 ====================

  async getDocuments(knowledgeBaseId: string): Promise<DocumentNode[]> {
    const data = await this.readData()
    return data.documents[knowledgeBaseId] || []
  }

  async createDocument(knowledgeBaseId: string, doc: DocumentNode): Promise<void> {
    const data = await this.readData()
    if (!data.documents[knowledgeBaseId]) {
      data.documents[knowledgeBaseId] = []
    }
    data.documents[knowledgeBaseId].push(doc)
    await this.writeData(data)
  }

  async updateDocument(knowledgeBaseId: string, doc: DocumentNode): Promise<void> {
    const data = await this.readData()
    const docs = data.documents[knowledgeBaseId] || []
    const index = docs.findIndex(d => d.id === doc.id)
    if (index !== -1) {
      docs[index] = doc
      await this.writeData(data)
    }
  }

  async deleteDocument(knowledgeBaseId: string, docId: string): Promise<void> {
    const data = await this.readData()
    const docs = data.documents[knowledgeBaseId] || []
    
    // 递归删除函数
    const deleteRecursive = (nodes: DocumentNode[], id: string): DocumentNode[] => {
      return nodes.filter(node => {
        if (node.id === id) return false
        if (node.children) {
          node.children = deleteRecursive(node.children, id)
        }
        return true
      })
    }
    
    data.documents[knowledgeBaseId] = deleteRecursive(docs, docId)
    await this.writeData(data)
  }

  // ==================== 图片操作 ====================

  async saveImage(knowledgeBaseId: string, imageData: string): Promise<string> {
    const db = await this.initDB()
    
    // 生成唯一 ID
    const imageId = `${knowledgeBaseId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_IMAGES], 'readwrite')
      const store = transaction.objectStore(STORE_IMAGES)
      const request = store.put({ id: imageId, data: imageData })

      request.onsuccess = () => resolve(`local-media://${imageId}`)
      request.onerror = () => reject(request.error)
    })
  }

  async readImage(imagePath: string): Promise<string> {
    const db = await this.initDB()
    
    // 提取媒体ID（兼容旧的 local-image 协议）
    const imageId = imagePath.replace('local-media://', '').replace('local-image://', '')
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_IMAGES], 'readonly')
      const store = transaction.objectStore(STORE_IMAGES)
      const request = store.get(imageId)

      request.onsuccess = () => {
        const result = request.result
        if (result && result.data) {
          resolve(result.data)
        } else {
          reject(new Error('Image not found'))
        }
      }
      request.onerror = () => reject(request.error)
    })
  }

  async deleteImage(imagePath: string): Promise<void> {
    const db = await this.initDB()
    
    // 提取媒体ID（兼容旧的 local-image 协议）
    const imageId = imagePath.replace('local-media://', '').replace('local-image://', '')
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_IMAGES], 'readwrite')
      const store = transaction.objectStore(STORE_IMAGES)
      const request = store.delete(imageId)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  // ==================== 图片清理操作 ====================

  async getUnusedImages(): Promise<string[]> {
    const db = await this.initDB()
    
    // 获取所有存储的图片
    const allImages = await new Promise<string[]>((resolve, reject) => {
      const transaction = db.transaction([STORE_IMAGES], 'readonly')
      const store = transaction.objectStore(STORE_IMAGES)
      const request = store.getAllKeys()

      request.onsuccess = () => {
        const keys = request.result as string[]
        resolve(keys.map(key => `local-media://${key}`))
      }
      request.onerror = () => reject(request.error)
    })

    // 获取所有文档内容
    const data = await this.readData()
    const allDocuments: DocumentNode[] = []
    
    // 收集所有文档
    Object.values(data.documents).forEach(docs => {
      allDocuments.push(...docs)
    })

    // 提取所有文档中引用的媒体（兼容 local-image 与 local-media；支持图片、音频、视频 markdown 与 HTML 标签）
    const usedImages = new Set<string>()
    
    allDocuments.forEach(doc => {
      if (doc.content) {
        // 为每个文档创建新的正则表达式实例，避免 lastIndex 问题
        const imageRegex = /!\[([^\]]*)\]\((local-(?:media|image):\/\/[^)]+)\)/g
        const audioMarkdownRegex = /!audio\[([^\]]*)\]\((local-(?:media|image):\/\/[^)]+)\)/g
        const videoMarkdownRegex = /!video\[([^\]]*)\]\((local-(?:media|image):\/\/[^)]+)\)/g
        const audioHtmlRegex = /<audio[^>]*src=\"(local-(?:media|image):\/\/[^\"]+)\"[^>]*>(?:<\/audio>)?/gi
        const videoHtmlRegex = /<video[^>]*src=\"(local-(?:media|image):\/\/[^\"]+)\"[^>]*>(?:<\/video>)?/gi

        let imgMatch
        while ((imgMatch = imageRegex.exec(doc.content)) !== null) {
          const fullPath = imgMatch[2]
          const id = fullPath.replace('local-media://', '').replace('local-image://', '')
          usedImages.add(`local-media://${id}`)
        }

        let audioMdMatch
        while ((audioMdMatch = audioMarkdownRegex.exec(doc.content)) !== null) {
          const fullPath = audioMdMatch[2]
          const id = fullPath.replace('local-media://', '').replace('local-image://', '')
          usedImages.add(`local-media://${id}`)
        }

        let videoMdMatch
        while ((videoMdMatch = videoMarkdownRegex.exec(doc.content)) !== null) {
          const fullPath = videoMdMatch[2]
          const id = fullPath.replace('local-media://', '').replace('local-image://', '')
          usedImages.add(`local-media://${id}`)
        }

        let audioHtmlMatch
        while ((audioHtmlMatch = audioHtmlRegex.exec(doc.content)) !== null) {
          const fullPath = audioHtmlMatch[1]
          const id = fullPath.replace('local-media://', '').replace('local-image://', '')
          usedImages.add(`local-media://${id}`)
        }

        let videoHtmlMatch
        while ((videoHtmlMatch = videoHtmlRegex.exec(doc.content)) !== null) {
          const fullPath = videoHtmlMatch[1]
          const id = fullPath.replace('local-media://', '').replace('local-image://', '')
          usedImages.add(`local-media://${id}`)
        }
      }
    })
    
    console.log('扫描结果 - 所有文件(图片/音频/视频):', allImages.length, '已使用:', usedImages.size, '未使用:', allImages.length - usedImages.size)
    console.log('已使用的文件:', Array.from(usedImages))

    // 找出未使用的图片
    const unusedImages = allImages.filter(image => !usedImages.has(image))
    
    return unusedImages
  }

  async cleanupUnusedImages(imagePaths: string[]): Promise<void> {
    for (const imagePath of imagePaths) {
      try {
        await this.deleteImage(imagePath)
      } catch (error) {
        console.error('删除图片失败:', imagePath, error)
      }
    }
  }

  // ==================== 图片管理器 ====================

  getMediaManager(): IMediaManager {
    return this.mediaManager
  }
}


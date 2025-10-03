/**
 * Electron 版存储实现（通过 IPC 调用）
 */

import type { IStorage } from './types'
import type { KnowledgeBase, DocumentNode } from '../types'
import { MediaManager } from './media-manager'
import { LocalMediaProvider } from './local-media-provider'
import type { IMediaManager } from './media-provider'

export class ElectronStorage implements IStorage {
  private mediaManager: IMediaManager

  constructor() {
    this.mediaManager = new MediaManager()
    // 注册本地媒体提供者
    const localMediaProvider = new LocalMediaProvider(this)
    this.mediaManager.registerProvider(localMediaProvider)
  }

  private get api() {
    if (!(window as any).electronAPI) {
      throw new Error('Electron API not available')
    }
    return (window as any).electronAPI
  }

  // ==================== 知识库操作 ====================

  async getKnowledgeBases(): Promise<KnowledgeBase[]> {
    return this.api.getKnowledgeBases()
  }

  async createKnowledgeBase(kb: KnowledgeBase): Promise<void> {
    await this.api.createKnowledgeBase(kb)
  }

  async updateKnowledgeBase(kb: KnowledgeBase): Promise<void> {
    await this.api.updateKnowledgeBase(kb)
  }

  async deleteKnowledgeBase(id: string): Promise<void> {
    await this.api.deleteKnowledgeBase(id)
  }

  // ==================== 文档操作 ====================

  async getDocuments(knowledgeBaseId: string): Promise<DocumentNode[]> {
    return this.api.getDocuments(knowledgeBaseId)
  }

  async createDocument(knowledgeBaseId: string, doc: DocumentNode): Promise<void> {
    await this.api.createDocument({ ...doc, knowledgeBaseId })
  }

  async updateDocument(knowledgeBaseId: string, doc: DocumentNode): Promise<void> {
    await this.api.updateDocument({ ...doc, knowledgeBaseId })
  }

  async deleteDocument(_knowledgeBaseId: string, docId: string): Promise<void> {
    await this.api.deleteDocument(docId)
  }

  // ==================== 图片操作 ====================

  async saveImage(knowledgeBaseId: string, imageData: string): Promise<string> {
    const fileName = await this.api.saveImage(imageData, knowledgeBaseId)
    // 统一为新协议前缀，前端将以 local-media:// 识别与渲染
    return `local-media://${fileName}`
  }

  async readImage(imagePath: string): Promise<string> {
    const result = await this.api.readImage(imagePath)
    if (result === null) {
      throw new Error('Image not found')
    }
    return result
  }

  async deleteImage(imagePath: string): Promise<void> {
    await this.api.deleteImage(imagePath)
  }

  // ==================== 图片清理操作 ====================

  async getUnusedImages(): Promise<string[]> {
    return this.api.getUnusedImages()
  }

  async cleanupUnusedImages(imagePaths: string[]): Promise<void> {
    await this.api.cleanupUnusedImages(imagePaths)
  }

  // ==================== 图片管理器 ====================

  getMediaManager(): IMediaManager {
    return this.mediaManager
  }
}


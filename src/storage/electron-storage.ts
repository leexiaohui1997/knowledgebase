/**
 * Electron 版存储实现（通过 IPC 调用）
 */

import type { IStorage } from './types'
import type { KnowledgeBase, DocumentNode } from '../types'
import { ImageManager } from './image-manager'
import { LocalImageProvider } from './local-image-provider'
import type { IImageManager } from './image-provider'

export class ElectronStorage implements IStorage {
  private imageManager: IImageManager

  constructor() {
    this.imageManager = new ImageManager()
    // 注册本地图片提供者
    const localProvider = new LocalImageProvider(this)
    this.imageManager.registerProvider(localProvider)
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
    return this.api.saveImage(imageData, knowledgeBaseId)
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

  getImageManager(): IImageManager {
    return this.imageManager
  }
}


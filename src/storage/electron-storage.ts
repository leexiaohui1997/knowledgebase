/**
 * Electron 版存储实现（通过 IPC 调用）
 */

import type { IStorage } from './types'
import type { KnowledgeBase, DocumentNode } from '../types'

export class ElectronStorage implements IStorage {
  private get api() {
    if (!window.electronAPI) {
      throw new Error('Electron API not available')
    }
    return window.electronAPI
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
    await this.api.createDocument(knowledgeBaseId, doc)
  }

  async updateDocument(knowledgeBaseId: string, doc: DocumentNode): Promise<void> {
    await this.api.updateDocument(knowledgeBaseId, doc)
  }

  async deleteDocument(knowledgeBaseId: string, docId: string): Promise<void> {
    await this.api.deleteDocument(knowledgeBaseId, docId)
  }

  // ==================== 图片操作 ====================

  async saveImage(knowledgeBaseId: string, imageData: string): Promise<string> {
    return this.api.saveImage(knowledgeBaseId, imageData)
  }

  async readImage(imagePath: string): Promise<string> {
    return this.api.readImage(imagePath)
  }

  async deleteImage(imagePath: string): Promise<void> {
    await this.api.deleteImage(imagePath)
  }
}


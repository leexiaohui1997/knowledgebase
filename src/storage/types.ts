/**
 * 存储接口定义
 * 提供统一的数据存储抽象，支持 Electron 和 Web 两种环境
 */

import type { KnowledgeBase, DocumentNode } from '../types'
import type { IImageManager } from './image-provider'

/**
 * 存储数据结构
 */
export interface StorageData {
  knowledgeBases: KnowledgeBase[]
  documents: Record<string, DocumentNode[]> // key: knowledgeBaseId
}

/**
 * 统一存储接口
 */
export interface IStorage {
  // 知识库操作
  getKnowledgeBases(): Promise<KnowledgeBase[]>
  createKnowledgeBase(kb: KnowledgeBase): Promise<void>
  updateKnowledgeBase(kb: KnowledgeBase): Promise<void>
  deleteKnowledgeBase(id: string): Promise<void>

  // 文档操作
  getDocuments(knowledgeBaseId: string): Promise<DocumentNode[]>
  createDocument(knowledgeBaseId: string, doc: DocumentNode): Promise<void>
  updateDocument(knowledgeBaseId: string, doc: DocumentNode): Promise<void>
  deleteDocument(knowledgeBaseId: string, docId: string): Promise<void>

  // 图片操作（保持向后兼容）
  saveImage(knowledgeBaseId: string, imageData: string): Promise<string> // 返回图片路径/ID
  readImage(imagePath: string): Promise<string> // 返回 base64
  deleteImage(imagePath: string): Promise<void>
  getUnusedImages(): Promise<string[]> // 获取未使用的图片列表
  cleanupUnusedImages(imagePaths: string[]): Promise<void> // 清理指定的图片

  // 图片管理器
  getImageManager(): IImageManager
}

/**
 * 存储类型
 */
export enum StorageType {
  ELECTRON = 'electron',
  WEB = 'web'
}


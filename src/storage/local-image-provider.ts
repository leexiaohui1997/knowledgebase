/**
 * 本地图床提供者实现
 * 基于现有的存储系统实现本地图片存储
 */

import type { IImageProvider, ImageMetadata, ImageUploadResult } from './image-provider'
import type { IStorage } from './types'

export class LocalImageProvider implements IImageProvider {
  readonly name = 'local'
  readonly type = 'local' as const

  constructor(private storage: IStorage) {}

  async isAvailable(): Promise<boolean> {
    try {
      // 检查存储是否可用
      await this.storage.getKnowledgeBases()
      return true
    } catch {
      return false
    }
  }

  async uploadImage(imageData: string, _filename?: string): Promise<ImageUploadResult> {
    // 生成知识库ID（这里使用默认值，实际应该从上下文获取）
    const knowledgeBaseId = 'default'
    
    // 使用现有的存储接口保存图片
    const imagePath = await this.storage.saveImage(knowledgeBaseId, imageData)
    
    // 提取图片ID
    const imageId = this.extractImageId(imagePath)
    
    return {
      id: imageId,
      url: imagePath,
      metadata: {
        id: imageId,
        url: imagePath,
        provider: this.name,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    }
  }

  async getImage(id: string): Promise<string> {
    const imagePath = this.buildImagePath(id)
    return this.storage.readImage(imagePath)
  }

  async deleteImage(id: string): Promise<void> {
    const imagePath = this.buildImagePath(id)
    await this.storage.deleteImage(imagePath)
  }

  async getImageMetadata(id: string): Promise<ImageMetadata | null> {
    try {
      const imagePath = this.buildImagePath(id)
      const exists = await this.imageExists(id)
      
      if (!exists) {
        return null
      }

      return {
        id,
        url: imagePath,
        provider: this.name,
        createdAt: new Date(), // 本地存储无法获取精确的创建时间
        updatedAt: new Date()
      }
    } catch {
      return null
    }
  }

  async listImages(): Promise<ImageMetadata[]> {
    try {
      // 获取未使用的图片列表（这里需要扩展存储接口）
      const unusedImages = await this.storage.getUnusedImages()
      
      return unusedImages.map(imagePath => ({
        id: this.extractImageId(imagePath),
        url: imagePath,
        provider: this.name,
        createdAt: new Date(),
        updatedAt: new Date()
      }))
    } catch {
      return []
    }
  }

  async imageExists(id: string): Promise<boolean> {
    try {
      const imagePath = this.buildImagePath(id)
      await this.storage.readImage(imagePath)
      return true
    } catch {
      return false
    }
  }

  /**
   * 从图片路径中提取图片ID
   */
  private extractImageId(imagePath: string): string {
    if (imagePath.startsWith('local-image://')) {
      return imagePath.replace('local-image://', '')
    }
    return imagePath
  }

  /**
   * 构建图片路径
   */
  private buildImagePath(id: string): string {
    if (id.startsWith('local-image://')) {
      return id
    }
    return `local-image://${id}`
  }
}

/**
 * 本地媒体提供者实现
 * 基于现有的存储系统实现本地媒体文件存储，支持图片、音频、视频等多种媒体类型
 */

import type { IMediaProvider, MediaMetadata, MediaUploadResult } from './media-provider'
import { MediaType } from './media-provider'
import type { IStorage } from './types'

export class LocalMediaProvider implements IMediaProvider {
  readonly name = 'local'
  readonly type = 'local' as const
  readonly supportedTypes = [MediaType.IMAGE, MediaType.AUDIO, MediaType.VIDEO, MediaType.DOCUMENT]

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

  async uploadMedia(mediaData: string, mediaType: MediaType, _filename?: string): Promise<MediaUploadResult> {
    // 目前只支持图片，其他媒体类型的实现将在后续添加
    if (mediaType !== MediaType.IMAGE) {
      throw new Error(`Media type '${mediaType}' is not yet supported by local provider`)
    }

    // 生成知识库ID（这里使用默认值，实际应该从上下文获取）
    const knowledgeBaseId = 'default'
    
    // 使用现有的存储接口保存图片
    const mediaPath = await this.storage.saveImage(knowledgeBaseId, mediaData)
    
    // 提取媒体ID
    const mediaId = this.extractMediaId(mediaPath)
    
    // 从base64数据中提取MIME类型
    const mimeType = this.extractMimeType(mediaData)
    
    return {
      id: mediaId,
      url: mediaPath,
      type: mediaType,
      metadata: {
        id: mediaId,
        url: mediaPath,
        provider: this.name,
        type: mediaType,
        mimeType,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    }
  }

  async getMedia(id: string): Promise<string> {
    const mediaPath = this.buildMediaPath(id)
    const fullBase64Data = await this.storage.readImage(mediaPath)
    
    // 如果返回的数据已经包含 data: 前缀，直接返回
    if (fullBase64Data.startsWith('data:')) {
      return fullBase64Data
    } else {
      // 否则添加默认的图片前缀
      return `data:image/png;base64,${fullBase64Data}`
    }
  }

  async deleteMedia(id: string): Promise<void> {
    const mediaPath = this.buildMediaPath(id)
    await this.storage.deleteImage(mediaPath)
  }

  async getMediaMetadata(id: string): Promise<MediaMetadata | null> {
    try {
      const mediaPath = this.buildMediaPath(id)
      const mediaData = await this.storage.readImage(mediaPath)
      const mimeType = this.extractMimeType(mediaData)
      
      return {
        id,
        url: mediaPath,
        provider: this.name,
        type: MediaType.IMAGE, // 目前只支持图片
        mimeType,
        createdAt: new Date(), // 实际应该从文件系统获取
        updatedAt: new Date()
      }
    } catch {
      return null
    }
  }

  async listMedia(mediaType?: MediaType): Promise<MediaMetadata[]> {
    try {
      // 目前只支持图片类型
      if (mediaType && mediaType !== MediaType.IMAGE) {
        return []
      }

      // 使用现有的未使用图片接口来获取所有图片
      const unusedImages = await this.storage.getUnusedImages()
      
      // 转换为媒体元数据格式
      const mediaList: MediaMetadata[] = []
      for (const imagePath of unusedImages) {
        const mediaId = this.extractMediaId(imagePath)
        const metadata = await this.getMediaMetadata(mediaId)
        if (metadata) {
          mediaList.push(metadata)
        }
      }
      
      return mediaList
    } catch {
      return []
    }
  }

  async mediaExists(id: string): Promise<boolean> {
    try {
      const mediaPath = this.buildMediaPath(id)
      await this.storage.readImage(mediaPath)
      return true
    } catch {
      return false
    }
  }

  /**
   * 从媒体路径中提取媒体ID
   */
  private extractMediaId(mediaPath: string): string {
    // 处理 local-media:// 和向后兼容的 local-image:// 协议
    if (mediaPath.startsWith('local-media://') || mediaPath.startsWith('local-image://')) {
      return mediaPath.replace('local-media://', '').replace('local-image://', '')
    }
    
    // 处理普通文件路径
    const parts = mediaPath.split('/')
    return parts[parts.length - 1]
  }

  /**
   * 根据媒体ID构建媒体路径
   */
  private buildMediaPath(id: string): string {
    // 如果ID已经是完整路径，直接返回
    if (id.startsWith('local-media://') || id.startsWith('local-image://')) {
      return id
    }
    
    // 否则构建新的 local-media:// 路径
    return `local-media://${id}`
  }

  /**
   * 从base64数据中提取MIME类型
   */
  private extractMimeType(base64Data: string): string {
    const match = base64Data.match(/^data:([^;]+);base64,/)
    return match ? match[1] : 'image/png'
  }
}
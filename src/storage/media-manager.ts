/**
 * 媒体管理器核心实现
 * 统一管理多个媒体提供者，提供统一的媒体文件操作接口
 */

import type { 
  IMediaManager, 
  IMediaProvider, 
  MediaMetadata, 
  MediaUploadResult
} from './media-provider'
import { MediaType } from './media-provider'

export class MediaManager implements IMediaManager {
  private providers = new Map<string, IMediaProvider>()
  private defaultProviderName: string = 'local'

  constructor() {
    // 初始化时注册本地提供者
  }

  setDefaultProvider(providerName: string): void {
    if (!this.providers.has(providerName)) {
      throw new Error(`Provider '${providerName}' not found`)
    }
    this.defaultProviderName = providerName
  }

  getDefaultProvider(): IMediaProvider {
    const provider = this.providers.get(this.defaultProviderName)
    if (!provider) {
      throw new Error(`Default provider '${this.defaultProviderName}' not found`)
    }
    return provider
  }

  registerProvider(provider: IMediaProvider): void {
    this.providers.set(provider.name, provider)
  }

  getProvider(name: string): IMediaProvider | null {
    return this.providers.get(name) || null
  }

  getAllProviders(): IMediaProvider[] {
    return Array.from(this.providers.values())
  }

  async uploadMedia(mediaData: string, mediaType: MediaType, filename?: string, providerName?: string): Promise<MediaUploadResult> {
    const provider = providerName ? this.getProvider(providerName) : this.getDefaultProvider()
    
    if (!provider) {
      throw new Error(`Provider '${providerName || this.defaultProviderName}' not found`)
    }

    if (!(await provider.isAvailable())) {
      throw new Error(`Provider '${provider.name}' is not available`)
    }

    if (!provider.supportedTypes.includes(mediaType)) {
      throw new Error(`Provider '${provider.name}' does not support media type '${mediaType}'`)
    }

    return await provider.uploadMedia(mediaData, mediaType, filename)
  }

  async getMedia(id: string, providerName?: string): Promise<string> {
    const provider = providerName ? this.getProvider(providerName) : this.getDefaultProvider()
    
    if (!provider) {
      throw new Error(`Provider '${providerName || this.defaultProviderName}' not found`)
    }

    return await provider.getMedia(id)
  }

  async deleteMedia(id: string, providerName?: string): Promise<void> {
    const provider = providerName ? this.getProvider(providerName) : this.getDefaultProvider()
    
    if (!provider) {
      throw new Error(`Provider '${providerName || this.defaultProviderName}' not found`)
    }

    await provider.deleteMedia(id)
  }

  async getMediaMetadata(id: string, providerName?: string): Promise<MediaMetadata | null> {
    const provider = providerName ? this.getProvider(providerName) : this.getDefaultProvider()
    
    if (!provider) {
      throw new Error(`Provider '${providerName || this.defaultProviderName}' not found`)
    }

    return await provider.getMediaMetadata(id)
  }

  async listMedia(mediaType?: MediaType, providerName?: string): Promise<MediaMetadata[]> {
    const provider = providerName ? this.getProvider(providerName) : this.getDefaultProvider()
    
    if (!provider) {
      throw new Error(`Provider '${providerName || this.defaultProviderName}' not found`)
    }

    return await provider.listMedia(mediaType)
  }

  async mediaExists(id: string, providerName?: string): Promise<boolean> {
    const provider = providerName ? this.getProvider(providerName) : this.getDefaultProvider()
    
    if (!provider) {
      throw new Error(`Provider '${providerName || this.defaultProviderName}' not found`)
    }

    return await provider.mediaExists(id)
  }

  async migrateMedia(mediaId: string, fromProvider: string, toProvider: string): Promise<MediaUploadResult> {
    const sourceProvider = this.getProvider(fromProvider)
    const targetProvider = this.getProvider(toProvider)

    if (!sourceProvider) {
      throw new Error(`Source provider '${fromProvider}' not found`)
    }

    if (!targetProvider) {
      throw new Error(`Target provider '${toProvider}' not found`)
    }

    // 获取源媒体文件
    const mediaData = await sourceProvider.getMedia(mediaId)
    const metadata = await sourceProvider.getMediaMetadata(mediaId)

    if (!metadata) {
      throw new Error(`Media metadata not found for '${mediaId}'`)
    }

    // 上传到目标提供者
    const result = await targetProvider.uploadMedia(mediaData, metadata.type)

    // 删除源文件（可选，根据需求决定）
    // await sourceProvider.deleteMedia(mediaId)

    return result
  }

  // 向后兼容的图片方法
  async uploadImage(imageData: string, filename?: string, providerName?: string): Promise<MediaUploadResult> {
    return this.uploadMedia(imageData, MediaType.IMAGE, filename, providerName)
  }

  async getImage(id: string, providerName?: string): Promise<string> {
    return this.getMedia(id, providerName)
  }

  async deleteImage(id: string, providerName?: string): Promise<void> {
    return this.deleteMedia(id, providerName)
  }

  async getImageMetadata(id: string, providerName?: string): Promise<MediaMetadata | null> {
    return this.getMediaMetadata(id, providerName)
  }

  async listImages(providerName?: string): Promise<MediaMetadata[]> {
    return this.listMedia(MediaType.IMAGE, providerName)
  }

  async imageExists(id: string, providerName?: string): Promise<boolean> {
    return this.mediaExists(id, providerName)
  }

  async migrateImage(imageId: string, fromProvider: string, toProvider: string): Promise<MediaUploadResult> {
    return this.migrateMedia(imageId, fromProvider, toProvider)
  }
}
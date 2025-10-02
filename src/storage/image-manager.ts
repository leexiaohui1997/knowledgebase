/**
 * 图片管理器核心实现
 * 统一管理多个图片提供者，提供统一的图片操作接口
 */

import type { IImageManager, IImageProvider, ImageMetadata, ImageUploadResult } from './image-provider'

export class ImageManager implements IImageManager {
  private providers = new Map<string, IImageProvider>()
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

  getDefaultProvider(): IImageProvider {
    const provider = this.providers.get(this.defaultProviderName)
    if (!provider) {
      throw new Error(`Default provider '${this.defaultProviderName}' not found`)
    }
    return provider
  }

  registerProvider(provider: IImageProvider): void {
    this.providers.set(provider.name, provider)
  }

  getProvider(name: string): IImageProvider | null {
    return this.providers.get(name) || null
  }

  getAllProviders(): IImageProvider[] {
    return Array.from(this.providers.values())
  }

  async uploadImage(imageData: string, filename?: string, providerName?: string): Promise<ImageUploadResult> {
    const provider = providerName ? this.getProvider(providerName) : this.getDefaultProvider()
    
    if (!provider) {
      throw new Error(`Provider '${providerName || this.defaultProviderName}' not found`)
    }

    if (!(await provider.isAvailable())) {
      throw new Error(`Provider '${provider.name}' is not available`)
    }

    return provider.uploadImage(imageData, filename)
  }

  async getImage(id: string, providerName?: string): Promise<string> {
    const provider = providerName ? this.getProvider(providerName) : this.getDefaultProvider()
    
    if (!provider) {
      throw new Error(`Provider '${providerName || this.defaultProviderName}' not found`)
    }

    return provider.getImage(id)
  }

  async deleteImage(id: string, providerName?: string): Promise<void> {
    const provider = providerName ? this.getProvider(providerName) : this.getDefaultProvider()
    
    if (!provider) {
      throw new Error(`Provider '${providerName || this.defaultProviderName}' not found`)
    }

    await provider.deleteImage(id)
  }

  async getImageMetadata(id: string, providerName?: string): Promise<ImageMetadata | null> {
    const provider = providerName ? this.getProvider(providerName) : this.getDefaultProvider()
    
    if (!provider) {
      throw new Error(`Provider '${providerName || this.defaultProviderName}' not found`)
    }

    return provider.getImageMetadata(id)
  }

  async listImages(providerName?: string): Promise<ImageMetadata[]> {
    if (providerName) {
      const provider = this.getProvider(providerName)
      if (!provider) {
        throw new Error(`Provider '${providerName}' not found`)
      }
      return provider.listImages()
    }

    // 如果没有指定提供者，返回所有提供者的图片
    const allImages: ImageMetadata[] = []
    const providers = Array.from(this.providers.values())
    for (const provider of providers) {
      try {
        const images = await provider.listImages()
        allImages.push(...images)
      } catch (error) {
        console.warn(`Failed to list images from provider '${provider.name}':`, error)
      }
    }

    return allImages
  }

  async imageExists(id: string, providerName?: string): Promise<boolean> {
    const provider = providerName ? this.getProvider(providerName) : this.getDefaultProvider()
    
    if (!provider) {
      return false
    }

    return provider.imageExists(id)
  }

  async migrateImage(imageId: string, fromProvider: string, toProvider: string): Promise<ImageUploadResult> {
    const fromProviderInstance = this.getProvider(fromProvider)
    const toProviderInstance = this.getProvider(toProvider)

    if (!fromProviderInstance) {
      throw new Error(`Source provider '${fromProvider}' not found`)
    }

    if (!toProviderInstance) {
      throw new Error(`Target provider '${toProvider}' not found`)
    }

    // 从源提供者获取图片数据
    const imageData = await fromProviderInstance.getImage(imageId)
    
    // 上传到目标提供者
    const result = await toProviderInstance.uploadImage(imageData)
    
    // 删除源提供者中的图片
    try {
      await fromProviderInstance.deleteImage(imageId)
    } catch (error) {
      console.warn(`Failed to delete image from source provider:`, error)
    }

    return result
  }
}

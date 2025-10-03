/**
 * 媒体提供者抽象接口
 * 定义统一的媒体文件存储和访问接口，支持图片、音频、视频等多种媒体类型
 */

/**
 * 支持的媒体类型
 */
export enum MediaType {
  IMAGE = 'image',
  AUDIO = 'audio',
  VIDEO = 'video',
  DOCUMENT = 'document'
}

/**
 * 媒体文件元数据
 */
export interface MediaMetadata {
  id: string
  url: string
  provider: string
  type: MediaType
  mimeType: string
  size?: number
  width?: number
  height?: number
  duration?: number // 音频/视频时长（秒）
  createdAt: Date
  updatedAt: Date
}

/**
 * 媒体上传结果
 */
export interface MediaUploadResult {
  id: string
  url: string
  type: MediaType
  metadata?: Partial<MediaMetadata>
}

/**
 * 媒体提供者配置
 */
export interface MediaProviderConfig {
  name: string
  type: 'local' | 'cloud'
  enabled: boolean
  supportedTypes: MediaType[]
  settings?: Record<string, any>
}

/**
 * 媒体提供者接口
 */
export interface IMediaProvider {
  /**
   * 提供者名称
   */
  readonly name: string

  /**
   * 提供者类型
   */
  readonly type: 'local' | 'cloud'

  /**
   * 支持的媒体类型
   */
  readonly supportedTypes: MediaType[]

  /**
   * 检查提供者是否可用
   */
  isAvailable(): Promise<boolean>

  /**
   * 上传媒体文件
   */
  uploadMedia(mediaData: string, mediaType: MediaType, filename?: string): Promise<MediaUploadResult>

  /**
   * 获取媒体文件
   */
  getMedia(id: string): Promise<string>

  /**
   * 删除媒体文件
   */
  deleteMedia(id: string): Promise<void>

  /**
   * 获取媒体文件元数据
   */
  getMediaMetadata(id: string): Promise<MediaMetadata | null>

  /**
   * 列出媒体文件
   */
  listMedia(mediaType?: MediaType): Promise<MediaMetadata[]>

  /**
   * 检查媒体文件是否存在
   */
  mediaExists(id: string): Promise<boolean>
}

/**
 * 媒体管理器接口
 */
export interface IMediaManager {
  /**
   * 设置默认提供者
   */
  setDefaultProvider(providerName: string): void

  /**
   * 获取默认提供者
   */
  getDefaultProvider(): IMediaProvider

  /**
   * 注册媒体提供者
   */
  registerProvider(provider: IMediaProvider): void

  /**
   * 获取指定提供者
   */
  getProvider(name: string): IMediaProvider | null

  /**
   * 获取所有提供者
   */
  getAllProviders(): IMediaProvider[]

  /**
   * 上传媒体文件
   */
  uploadMedia(mediaData: string, mediaType: MediaType, filename?: string, providerName?: string): Promise<MediaUploadResult>

  /**
   * 获取媒体文件
   */
  getMedia(id: string, providerName?: string): Promise<string>

  /**
   * 删除媒体文件
   */
  deleteMedia(id: string, providerName?: string): Promise<void>

  /**
   * 获取媒体文件元数据
   */
  getMediaMetadata(id: string, providerName?: string): Promise<MediaMetadata | null>

  /**
   * 列出媒体文件
   */
  listMedia(mediaType?: MediaType, providerName?: string): Promise<MediaMetadata[]>

  /**
   * 检查媒体文件是否存在
   */
  mediaExists(id: string, providerName?: string): Promise<boolean>

  /**
   * 迁移媒体文件
   */
  migrateMedia(mediaId: string, fromProvider: string, toProvider: string): Promise<MediaUploadResult>

  // 向后兼容的图片方法
  /**
   * @deprecated 使用 uploadMedia 替代
   */
  uploadImage(imageData: string, filename?: string, providerName?: string): Promise<MediaUploadResult>

  /**
   * @deprecated 使用 getMedia 替代
   */
  getImage(id: string, providerName?: string): Promise<string>

  /**
   * @deprecated 使用 deleteMedia 替代
   */
  deleteImage(id: string, providerName?: string): Promise<void>

  /**
   * @deprecated 使用 getMediaMetadata 替代
   */
  getImageMetadata(id: string, providerName?: string): Promise<MediaMetadata | null>

  /**
   * @deprecated 使用 listMedia(MediaType.IMAGE) 替代
   */
  listImages(providerName?: string): Promise<MediaMetadata[]>

  /**
   * @deprecated 使用 mediaExists 替代
   */
  imageExists(id: string, providerName?: string): Promise<boolean>

  /**
   * @deprecated 使用 migrateMedia 替代
   */
  migrateImage(imageId: string, fromProvider: string, toProvider: string): Promise<MediaUploadResult>
}

// 重新导出原有的图片相关类型以保持向后兼容
export type ImageMetadata = MediaMetadata
export type ImageUploadResult = MediaUploadResult
export type ImageProviderConfig = MediaProviderConfig
export type IImageProvider = IMediaProvider
// 已移除 IImageManager 别名，鼓励直接使用 IMediaManager
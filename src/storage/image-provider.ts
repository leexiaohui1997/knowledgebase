/**
 * 图片提供者抽象接口
 * 定义统一的图片存储和访问接口，支持本地存储和第三方图床
 */

/**
 * 图片元数据
 */
export interface ImageMetadata {
  id: string
  url: string
  provider: string
  size?: number
  width?: number
  height?: number
  createdAt: Date
  updatedAt: Date
}

/**
 * 图片上传结果
 */
export interface ImageUploadResult {
  id: string
  url: string
  metadata?: Partial<ImageMetadata>
}

/**
 * 图片提供者配置
 */
export interface ImageProviderConfig {
  name: string
  type: 'local' | 'cloud'
  enabled: boolean
  settings?: Record<string, any>
}

/**
 * 图片提供者接口
 */
export interface IImageProvider {
  /**
   * 提供者名称
   */
  readonly name: string

  /**
   * 提供者类型
   */
  readonly type: 'local' | 'cloud'

  /**
   * 是否可用
   */
  isAvailable(): Promise<boolean>

  /**
   * 上传图片
   */
  uploadImage(imageData: string, filename?: string): Promise<ImageUploadResult>

  /**
   * 获取图片
   */
  getImage(id: string): Promise<string>

  /**
   * 删除图片
   */
  deleteImage(id: string): Promise<void>

  /**
   * 获取图片元数据
   */
  getImageMetadata(id: string): Promise<ImageMetadata | null>

  /**
   * 列出所有图片
   */
  listImages(): Promise<ImageMetadata[]>

  /**
   * 检查图片是否存在
   */
  imageExists(id: string): Promise<boolean>
}

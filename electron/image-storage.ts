import { app } from 'electron'
import fs from 'fs'
import path from 'path'

// 获取图片存储目录
export function getImagesPath(): string {
  const userDataPath = app.getPath('userData')
  const imagesPath = path.join(userDataPath, 'images')
  
  // 确保目录存在
  if (!fs.existsSync(imagesPath)) {
    fs.mkdirSync(imagesPath, { recursive: true })
  }
  
  return imagesPath
}

// 保存图片文件
export function saveImage(base64Data: string, knowledgeBaseId: string): string {
  try {
    // 解析 base64 数据
    const matches = base64Data.match(/^data:image\/(\w+);base64,(.+)$/)
    if (!matches) {
      throw new Error('Invalid base64 image data')
    }
    
    const ext = matches[1] // 图片格式（png, jpg, etc.）
    const data = matches[2] // base64 数据
    
    // 生成唯一文件名
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    const fileName = `${knowledgeBaseId}_${timestamp}_${random}.${ext}`
    
    // 保存路径
    const imagesPath = getImagesPath()
    const filePath = path.join(imagesPath, fileName)
    
    // 写入文件
    const buffer = Buffer.from(data, 'base64')
    fs.writeFileSync(filePath, buffer)
    
    console.log('Image saved:', fileName)
    return fileName
  } catch (error) {
    console.error('Error saving image:', error)
    throw error
  }
}

// 读取图片文件
export function readImage(fileName: string): Buffer | null {
  try {
    const imagesPath = getImagesPath()
    const filePath = path.join(imagesPath, fileName)
    
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath)
    }
    return null
  } catch (error) {
    console.error('Error reading image:', error)
    return null
  }
}

// 删除图片文件
export function deleteImage(fileName: string): boolean {
  try {
    const imagesPath = getImagesPath()
    const filePath = path.join(imagesPath, fileName)
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
      console.log('Image deleted:', fileName)
      return true
    }
    return false
  } catch (error) {
    console.error('Error deleting image:', error)
    return false
  }
}

// 获取图片的完整路径
export function getImagePath(fileName: string): string {
  const imagesPath = getImagesPath()
  return path.join(imagesPath, fileName)
}

// 获取所有图片文件列表
export function getAllImages(): string[] {
  try {
    const imagesPath = getImagesPath()
    const files = fs.readdirSync(imagesPath)
    // 过滤出图片文件
    return files.filter(file => /\.(png|jpg|jpeg|gif|webp)$/i.test(file))
  } catch (error) {
    console.error('Error getting all images:', error)
    return []
  }
}

// 批量删除图片
export function cleanupImages(fileNames: string[]): number {
  let deletedCount = 0
  for (const fileName of fileNames) {
    if (deleteImage(fileName)) {
      deletedCount++
    }
  }
  console.log(`Cleaned up ${deletedCount} images`)
  return deletedCount
}


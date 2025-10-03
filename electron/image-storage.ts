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
    // 解析 base64 数据（支持 image 与 audio），放宽 MIME 匹配
    // 示例：data:audio/mpeg;base64,xxx 或 data:audio/x-m4a;base64,xxx 或 data:audio/ogg;codecs=opus;base64,xxx
    const urlMatch = base64Data.match(/^data:([^;]+);base64,(.+)$/)
    if (!urlMatch) {
      throw new Error('Invalid base64 media data')
    }
    const mime = urlMatch[1] // e.g. image/png, audio/mpeg, audio/x-m4a, audio/ogg;codecs=opus
    const data = urlMatch[2]

    // 仅允许 image/* 或 audio/*
    if (!/^image\//.test(mime) && !/^audio\//.test(mime)) {
      throw new Error('Unsupported media mime type: ' + mime)
    }

    // 规范化扩展名映射
    const lowerMime = mime.toLowerCase()
    let ext = 'bin'
    if (lowerMime.startsWith('image/')) {
      // 常见图片扩展
      if (lowerMime.includes('png')) ext = 'png'
      else if (lowerMime.includes('jpeg') || lowerMime.includes('jpg')) ext = 'jpg'
      else if (lowerMime.includes('gif')) ext = 'gif'
      else if (lowerMime.includes('webp')) ext = 'webp'
      else if (lowerMime.includes('svg')) ext = 'svg'
      else {
        // 提取 image/<ext>
        const m = lowerMime.match(/^image\/([a-z0-9\-]+)/)
        ext = m?.[1]?.replace('jpeg', 'jpg') || 'img'
      }
    } else if (lowerMime.startsWith('audio/')) {
      // 常见音频扩展
      if (lowerMime.includes('mpeg') || lowerMime.includes('mp3')) ext = 'mp3'
      else if (lowerMime.includes('wav')) ext = 'wav'
      else if (lowerMime.includes('ogg')) ext = 'ogg'
      else if (lowerMime.includes('mp4') || lowerMime.includes('m4a') || lowerMime.includes('x-m4a')) ext = 'm4a'
      else if (lowerMime.includes('aac')) ext = 'aac'
      else if (lowerMime.includes('flac')) ext = 'flac'
      else {
        // 提取 audio/<ext>
        const m = lowerMime.match(/^audio\/([a-z0-9\-]+)/)
        ext = m?.[1] || 'audio'
      }
    }
    
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
    
    console.log('Media saved:', fileName, 'mime:', mime)
    return fileName
  } catch (error) {
    console.error('Error saving media:', error)
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
    // 过滤出图片与音频文件（保持旧函数名以兼容调用）
    return files.filter(file => /\.(png|jpg|jpeg|gif|webp|svg|mp3|wav|ogg|m4a|aac|flac)$/i.test(file))
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


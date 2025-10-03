import { ipcMain } from 'electron'
import { readData, writeData } from './storage'
import { saveImage, readImage, deleteImage, getImagePath, getAllImages, cleanupImages } from './image-storage'

// 注册 IPC 处理器
export function registerIpcHandlers() {
  // 获取所有知识库
  ipcMain.handle('get-knowledge-bases', () => {
    const data = readData()
    return data.knowledgeBases || []
  })

  // 创建知识库
  ipcMain.handle('create-knowledge-base', (_, knowledgeBase) => {
    const data = readData()
    data.knowledgeBases = data.knowledgeBases || []
    data.knowledgeBases.push(knowledgeBase)
    writeData(data)
    return knowledgeBase
  })

  // 更新知识库
  ipcMain.handle('update-knowledge-base', (_, knowledgeBase) => {
    const data = readData()
    const index = data.knowledgeBases.findIndex((kb: any) => kb.id === knowledgeBase.id)
    if (index !== -1) {
      data.knowledgeBases[index] = knowledgeBase
      writeData(data)
    }
    return knowledgeBase
  })

  // 删除知识库
  ipcMain.handle('delete-knowledge-base', (_, id) => {
    const data = readData()
    data.knowledgeBases = data.knowledgeBases.filter((kb: any) => kb.id !== id)
    data.documents = data.documents.filter((doc: any) => doc.knowledgeBaseId !== id)
    writeData(data)
    return true
  })

  // 获取知识库的所有文档
  ipcMain.handle('get-documents', (_, knowledgeBaseId) => {
    const data = readData()
    return (data.documents || []).filter((doc: any) => doc.knowledgeBaseId === knowledgeBaseId)
  })

  // 创建文档节点
  ipcMain.handle('create-document', (_, document) => {
    const data = readData()
    data.documents = data.documents || []
    data.documents.push(document)
    writeData(data)
    return document
  })

  // 更新文档节点
  ipcMain.handle('update-document', (_, document) => {
    const data = readData()
    const index = data.documents.findIndex((doc: any) => doc.id === document.id)
    if (index !== -1) {
      data.documents[index] = document
      writeData(data)
    }
    return document
  })

  // 删除文档节点
  ipcMain.handle('delete-document', (_, id) => {
    const data = readData()
    // 递归删除子节点
    const deleteNode = (nodeId: string) => {
      const children = data.documents.filter((doc: any) => doc.parentId === nodeId)
      children.forEach((child: any) => deleteNode(child.id))
      data.documents = data.documents.filter((doc: any) => doc.id !== nodeId)
    }
    deleteNode(id)
    writeData(data)
    return true
  })

  // 保存图片
  ipcMain.handle('save-image', (_, base64Data, knowledgeBaseId) => {
    return saveImage(base64Data, knowledgeBaseId)
  })

  // 读取媒体（兼容 local-media:// 与 local-image:// 前缀），返回 data URL
  ipcMain.handle('read-image', (_, fileNameOrPath) => {
    const fileName = String(fileNameOrPath)
      .replace('local-media://', '')
      .replace('local-image://', '')
    const buffer = readImage(fileName)
    if (!buffer) return null

    // 基于扩展名推断 MIME 类型
    const lower = fileName.toLowerCase()
    let mime = 'image/png'
    if (lower.endsWith('.png')) mime = 'image/png'
    else if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) mime = 'image/jpeg'
    else if (lower.endsWith('.gif')) mime = 'image/gif'
    else if (lower.endsWith('.webp')) mime = 'image/webp'
    else if (lower.endsWith('.svg')) mime = 'image/svg+xml'
    else if (lower.endsWith('.mp3')) mime = 'audio/mpeg'
    else if (lower.endsWith('.wav')) mime = 'audio/wav'
    else if (lower.endsWith('.ogg')) mime = 'audio/ogg'
    else if (lower.endsWith('.m4a')) mime = 'audio/mp4'
    else if (lower.endsWith('.aac')) mime = 'audio/aac'
    else if (lower.endsWith('.flac')) mime = 'audio/flac'

    const base64 = buffer.toString('base64')
    return `data:${mime};base64,${base64}`
  })

  // 删除图片（兼容 local-media:// 与 local-image:// 前缀）
  ipcMain.handle('delete-image', (_, fileNameOrPath) => {
    const fileName = String(fileNameOrPath)
      .replace('local-media://', '')
      .replace('local-image://', '')
    return deleteImage(fileName)
  })

  // 获取图片路径
  ipcMain.handle('get-image-path', (_, fileName) => {
    return getImagePath(fileName)
  })

  // 获取未使用的图片（兼容两种协议扫描）
  ipcMain.handle('get-unused-images', () => {
    const data = readData()
    const allDocuments = data.documents || []
    
    // 获取所有存储的图片
    const allImages = getAllImages()
    
    // 提取所有文档中引用的图片
    const usedImages = new Set<string>()
    
    allDocuments.forEach((doc: any) => {
      if (doc.content) {
        // Markdown 图片语法：![](...)（兼容两种协议）
        const mdImageRegex = /!\[[^\]]*\]\((local-(?:media|image):\/\/)([^)]+)\)/g
        let imgMatch
        while ((imgMatch = mdImageRegex.exec(doc.content)) !== null) {
          usedImages.add(imgMatch[2])
        }

        // Markdown 音频语法：!audio[](...)（兼容两种协议）
        const mdAudioRegex = /!audio\[[^\]]*\]\((local-(?:media|image):\/\/)([^)]+)\)/g
        let audioMdMatch
        while ((audioMdMatch = mdAudioRegex.exec(doc.content)) !== null) {
          usedImages.add(audioMdMatch[2])
        }

        // Markdown 视频语法：!video[](...)（兼容两种协议）
        const mdVideoRegex = /!video\[[^\]]*\]\((local-(?:media|image):\/\/)([^)]+)\)/g
        let videoMdMatch
        while ((videoMdMatch = mdVideoRegex.exec(doc.content)) !== null) {
          usedImages.add(videoMdMatch[2])
        }

        // HTML audio/source 标签：src="local-media://..." 或 local-image://...
        const htmlAudioRegex = /<(?:audio|source)[^>]*src=["'](local-(?:media|image):\/\/)([^"'>]+)["'][^>]*>/gi
        let audioMatch
        while ((audioMatch = htmlAudioRegex.exec(doc.content)) !== null) {
          usedImages.add(audioMatch[2])
        }

        // HTML video 标签：src="local-media://..." 或 local-image://...
        const htmlVideoRegex = /<video[^>]*src=["'](local-(?:media|image):\/\/)([^"'>]+)["'][^>]*>/gi
        let videoMatch
        while ((videoMatch = htmlVideoRegex.exec(doc.content)) !== null) {
          usedImages.add(videoMatch[2])
        }
      }
    })
    
    console.log('扫描结果 - 所有媒体文件:', allImages.length, '已使用:', usedImages.size, '未使用:', allImages.length - usedImages.size)
    console.log('已使用的媒体文件:', Array.from(usedImages))
    
    // 找出未使用的图片
    const unusedImages = allImages.filter(image => !usedImages.has(image))
    
    // 返回带 local-media:// 前缀的路径（默认新协议）
    return unusedImages.map(image => `local-media://${image}`)
  })

  // 清理未使用的图片
  ipcMain.handle('cleanup-unused-images', (_, imagePaths: string[]) => {
    // 提取文件名（去掉两种前缀）
    const fileNames = imagePaths.map(path => String(path)
      .replace('local-media://', '')
      .replace('local-image://', '')
    )
    const deletedCount = cleanupImages(fileNames)
    return deletedCount
  })
}


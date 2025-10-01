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

  // 读取图片
  ipcMain.handle('read-image', (_, fileName) => {
    const buffer = readImage(fileName)
    return buffer ? buffer.toString('base64') : null
  })

  // 删除图片
  ipcMain.handle('delete-image', (_, fileName) => {
    return deleteImage(fileName)
  })

  // 获取图片路径
  ipcMain.handle('get-image-path', (_, fileName) => {
    return getImagePath(fileName)
  })

  // 获取未使用的图片
  ipcMain.handle('get-unused-images', () => {
    const data = readData()
    const allDocuments = data.documents || []
    
    // 获取所有存储的图片
    const allImages = getAllImages()
    
    // 提取所有文档中引用的图片
    const usedImages = new Set<string>()
    
    allDocuments.forEach((doc: any) => {
      if (doc.content) {
        // 为每个文档创建新的正则表达式实例，避免 lastIndex 问题
        const imageRegex = /!\[([^\]]*)\]\(local-image:\/\/([^)]+)\)/g
        let match
        while ((match = imageRegex.exec(doc.content)) !== null) {
          usedImages.add(match[2])
        }
      }
    })
    
    console.log('扫描结果 - 所有图片:', allImages.length, '已使用:', usedImages.size, '未使用:', allImages.length - usedImages.size)
    console.log('已使用的图片:', Array.from(usedImages))
    
    // 找出未使用的图片
    const unusedImages = allImages.filter(image => !usedImages.has(image))
    
    // 返回带 local-image:// 前缀的路径
    return unusedImages.map(image => `local-image://${image}`)
  })

  // 清理未使用的图片
  ipcMain.handle('cleanup-unused-images', (_, imagePaths: string[]) => {
    // 提取文件名（去掉 local-image:// 前缀）
    const fileNames = imagePaths.map(path => path.replace('local-image://', ''))
    const deletedCount = cleanupImages(fileNames)
    return deletedCount
  })
}


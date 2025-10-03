import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron
  },
  // 知识库操作
  getKnowledgeBases: () => ipcRenderer.invoke('get-knowledge-bases'),
  createKnowledgeBase: (data: any) => ipcRenderer.invoke('create-knowledge-base', data),
  updateKnowledgeBase: (data: any) => ipcRenderer.invoke('update-knowledge-base', data),
  deleteKnowledgeBase: (id: string) => ipcRenderer.invoke('delete-knowledge-base', id),
  // 文档操作
  getDocuments: (knowledgeBaseId: string) => ipcRenderer.invoke('get-documents', knowledgeBaseId),
  createDocument: (data: any) => ipcRenderer.invoke('create-document', data),
  updateDocument: (data: any) => ipcRenderer.invoke('update-document', data),
  deleteDocument: (id: string) => ipcRenderer.invoke('delete-document', id),
  // 图片操作
  saveImage: (base64Data: string, knowledgeBaseId: string) => ipcRenderer.invoke('save-image', base64Data, knowledgeBaseId),
  readImage: (fileName: string) => ipcRenderer.invoke('read-image', fileName),
  deleteImage: (fileName: string) => ipcRenderer.invoke('delete-image', fileName),
  getImagePath: (fileName: string) => ipcRenderer.invoke('get-image-path', fileName),
  // 图片清理操作
  getUnusedImages: () => ipcRenderer.invoke('get-unused-images'),
  cleanupUnusedImages: (imagePaths: string[]) => {
    const safeArray = Array.isArray(imagePaths) ? [...imagePaths] : []
    return ipcRenderer.invoke('cleanup-unused-images', safeArray)
  }
})


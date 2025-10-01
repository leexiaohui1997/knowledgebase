/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface Window {
  electronAPI: {
    platform: string
    versions: {
      node: string
      chrome: string
      electron: string
    }
    // 知识库操作
    getKnowledgeBases: () => Promise<any[]>
    createKnowledgeBase: (data: any) => Promise<any>
    updateKnowledgeBase: (data: any) => Promise<any>
    deleteKnowledgeBase: (id: string) => Promise<boolean>
    // 文档操作
    getDocuments: (knowledgeBaseId: string) => Promise<any[]>
    createDocument: (data: any) => Promise<any>
    updateDocument: (data: any) => Promise<any>
    deleteDocument: (id: string) => Promise<boolean>
    // 图片操作
    saveImage: (base64Data: string, knowledgeBaseId: string) => Promise<string>
    readImage: (fileName: string) => Promise<string | null>
    deleteImage: (fileName: string) => Promise<boolean>
    getImagePath: (fileName: string) => Promise<string>
    // 图片清理操作
    getUnusedImages: () => Promise<string[]>
    cleanupUnusedImages: (imagePaths: string[]) => Promise<number>
  }
}

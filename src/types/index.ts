// 知识库类型
export interface KnowledgeBase {
  id: string
  name: string
  avatar: string
  description: string
  createdAt: number
  updatedAt: number
}

// 文档节点类型（文件或文件夹）
export interface DocumentNode {
  id: string
  name: string
  type: 'file' | 'folder'
  content?: string // 仅文件有内容
  parentId: string | null // null 表示根节点
  knowledgeBaseId: string
  children?: DocumentNode[] // 仅文件夹有子节点
  order: number // 排序字段
  createdAt: number
  updatedAt: number
}

// 创建知识库的表单数据
export interface CreateKnowledgeBaseForm {
  name: string
  avatar: string
  description: string
}

// 创建文档节点的表单数据
export interface CreateNodeForm {
  name: string
  type: 'file' | 'folder'
  parentId: string | null
  knowledgeBaseId: string
}


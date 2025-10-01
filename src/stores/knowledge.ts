import { defineStore } from 'pinia'
import { ref, toRaw } from 'vue'
import type { KnowledgeBase, DocumentNode } from '@/types'

export const useKnowledgeStore = defineStore('knowledge', () => {
  const knowledgeBases = ref<KnowledgeBase[]>([])
  const currentKnowledgeBase = ref<KnowledgeBase | null>(null)
  const documents = ref<DocumentNode[]>([])
  const currentDocument = ref<DocumentNode | null>(null)

  // 加载所有知识库
  async function loadKnowledgeBases() {
    knowledgeBases.value = await window.electronAPI.getKnowledgeBases()
  }

  // 创建知识库
  async function createKnowledgeBase(data: { name: string; avatar: string; description: string }) {
    const kb: KnowledgeBase = {
      id: Date.now().toString(),
      ...data,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    await window.electronAPI.createKnowledgeBase(toRaw(kb))
    knowledgeBases.value.push(kb)
    return kb
  }

  // 更新知识库
  async function updateKnowledgeBase(kb: KnowledgeBase) {
    kb.updatedAt = Date.now()
    await window.electronAPI.updateKnowledgeBase(toRaw(kb))
    const index = knowledgeBases.value.findIndex(item => item.id === kb.id)
    if (index !== -1) {
      knowledgeBases.value[index] = kb
    }
  }

  // 删除知识库
  async function deleteKnowledgeBase(id: string) {
    await window.electronAPI.deleteKnowledgeBase(id)
    knowledgeBases.value = knowledgeBases.value.filter(kb => kb.id !== id)
  }

  // 加载知识库的文档
  async function loadDocuments(knowledgeBaseId: string) {
    documents.value = await window.electronAPI.getDocuments(knowledgeBaseId)
    
    console.log(`Loaded ${documents.value.length} documents for knowledge base ${knowledgeBaseId}`)
    
    // 确保所有文档都有 order 字段（只初始化未设置的）
    let needsUpdate = false
    const groupedByParent = new Map<string | null, DocumentNode[]>()
    
    // 按父节点分组
    documents.value.forEach(doc => {
      const key = doc.parentId
      if (!groupedByParent.has(key)) {
        groupedByParent.set(key, [])
      }
      groupedByParent.get(key)!.push(doc)
    })
    
    // 为每组分配 order（只处理没有 order 的文档）
    groupedByParent.forEach((siblings) => {
      // 检查是否有文档缺少 order
      const needsInit = siblings.some(doc => doc.order === undefined)
      
      if (needsInit) {
        // 按规则排序
        siblings.sort((a, b) => {
          if (a.order !== undefined && b.order !== undefined) {
            return a.order - b.order
          }
          if (a.order !== undefined) return -1
          if (b.order !== undefined) return 1
          if (a.type !== b.type) {
            return a.type === 'folder' ? -1 : 1
          }
          return a.name.localeCompare(b.name)
        })
        
        // 为没有 order 的文档分配值
        const maxOrder = Math.max(0, ...siblings.filter(d => d.order !== undefined).map(d => d.order!))
        let nextOrder = maxOrder + 1
        
        siblings.forEach((doc) => {
          if (doc.order === undefined) {
            doc.order = nextOrder++
            needsUpdate = true
            console.log(`Initializing order for document: ${doc.name} → ${doc.order}`)
          }
        })
      }
    })
    
    // 如果有文档需要更新，批量保存
    if (needsUpdate) {
      console.log('Saving documents with initialized order fields')
      for (const doc of documents.value) {
        if (doc.order !== undefined) {
          // 使用 toRaw 转换为普通对象，避免 Proxy 序列化错误
          await window.electronAPI.updateDocument(toRaw(doc))
        }
      }
    }
  }

  // 创建文档节点
  async function createDocument(data: { name: string; type: 'file' | 'folder'; parentId: string | null; knowledgeBaseId: string }) {
    // 计算新节点的 order 值（同级最大值 + 1）
    const siblings = documents.value.filter(doc => doc.parentId === data.parentId)
    const maxOrder = siblings.length > 0 ? Math.max(...siblings.map(doc => doc.order || 0)) : 0
    
    const doc: DocumentNode = {
      id: Date.now().toString(),
      ...data,
      content: data.type === 'file' ? '' : undefined,
      order: maxOrder + 1,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    await window.electronAPI.createDocument(toRaw(doc))
    documents.value.push(doc)
    return doc
  }

  // 更新文档节点
  async function updateDocument(doc: DocumentNode) {
    doc.updatedAt = Date.now()
    await window.electronAPI.updateDocument(toRaw(doc))
    const index = documents.value.findIndex(item => item.id === doc.id)
    if (index !== -1) {
      documents.value[index] = doc
    }
  }

  // 删除文档节点
  async function deleteDocument(id: string) {
    await window.electronAPI.deleteDocument(id)
    documents.value = documents.value.filter(doc => doc.id !== id && doc.parentId !== id)
  }

  // 设置当前知识库
  function setCurrentKnowledgeBase(kb: KnowledgeBase | null) {
    currentKnowledgeBase.value = kb
  }

  // 设置当前文档
  function setCurrentDocument(doc: DocumentNode | null) {
    currentDocument.value = doc
  }

  // 移动文档节点
  async function moveDocument(nodeId: string, newParentId: string | null, newOrder: number) {
    const doc = documents.value.find(d => d.id === nodeId)
    if (!doc) {
      console.error('Document not found:', nodeId)
      return
    }

    const oldParentId = doc.parentId
    const oldOrder = doc.order

    console.log('Moving document:', {
      id: nodeId,
      name: doc.name,
      from: { parentId: oldParentId, order: oldOrder },
      to: { parentId: newParentId, order: newOrder }
    })

    // 更新被移动节点
    doc.parentId = newParentId
    doc.order = newOrder
    doc.updatedAt = Date.now()
    await window.electronAPI.updateDocument(toRaw(doc))

    // 如果改变了父节点，需要重排旧父节点下的其他节点
    if (oldParentId !== newParentId) {
      const oldSiblings = documents.value.filter(d => d.parentId === oldParentId && d.id !== nodeId)
      oldSiblings.sort((a, b) => (a.order || 0) - (b.order || 0))
      for (let i = 0; i < oldSiblings.length; i++) {
        oldSiblings[i].order = i + 1
        oldSiblings[i].updatedAt = Date.now()
        await window.electronAPI.updateDocument(toRaw(oldSiblings[i]))
      }
    }

    // 重新排序新父节点下的所有节点（包括被移动的节点）
    const newSiblings = documents.value.filter(d => d.parentId === newParentId)
    newSiblings.sort((a, b) => {
      // 被移动的节点使用新的 order
      const orderA = a.id === nodeId ? newOrder : (a.order || 0)
      const orderB = b.id === nodeId ? newOrder : (b.order || 0)
      return orderA - orderB
    })
    
    // 重新分配连续的 order 值
    for (let i = 0; i < newSiblings.length; i++) {
      if (newSiblings[i].order !== i + 1) {
        newSiblings[i].order = i + 1
        newSiblings[i].updatedAt = Date.now()
        await window.electronAPI.updateDocument(toRaw(newSiblings[i]))
      }
    }

    // 触发响应式更新
    documents.value = [...documents.value]
    
    console.log('Move completed')
  }

  // 重新排序文档节点
  async function reorderDocuments(parentId: string | null, nodeIds: string[]) {
    const nodes = documents.value.filter(d => d.parentId === parentId)
    const orderedNodes = nodeIds.map(id => nodes.find(n => n.id === id)).filter(Boolean) as DocumentNode[]
    
    for (let i = 0; i < orderedNodes.length; i++) {
      if (orderedNodes[i].order !== i + 1) {
        orderedNodes[i].order = i + 1
        orderedNodes[i].updatedAt = Date.now()
        await window.electronAPI.updateDocument(toRaw(orderedNodes[i]))
      }
    }

    // 触发响应式更新
    documents.value = [...documents.value]
  }

  return {
    knowledgeBases,
    currentKnowledgeBase,
    documents,
    currentDocument,
    loadKnowledgeBases,
    createKnowledgeBase,
    updateKnowledgeBase,
    deleteKnowledgeBase,
    loadDocuments,
    createDocument,
    updateDocument,
    deleteDocument,
    setCurrentKnowledgeBase,
    setCurrentDocument,
    moveDocument,
    reorderDocuments
  }
})


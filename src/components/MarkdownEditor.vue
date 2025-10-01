<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, nextTick, computed } from 'vue'
import { useRoute } from 'vue-router'
import Cherry from 'cherry-markdown'
import 'cherry-markdown/dist/cherry-markdown.css'
import { getStorage } from '@/storage'

const props = defineProps<{
  content: string
  title: string
}>()

const route = useRoute()
const knowledgeBaseId = computed(() => route.params.id as string)
const storage = getStorage()

const emit = defineEmits<{
  save: [content: string]
}>()

const editorContainer = ref<HTMLDivElement | null>(null)
let cherryInstance: Cherry | null = null
// 存储图片映射：base64 -> 文件名
const imageMapping = new Map<string, string>()

// 将本地图片路径转换为可显示的格式（加载时）
async function loadImagesForDisplay(content: string): Promise<string> {
  const imageRegex = /!\[([^\]]*)\]\(local-image:\/\/([^)]+)\)/g
  const matches = [...content.matchAll(imageRegex)]
  
  // 清空旧的映射
  imageMapping.clear()
  
  for (const match of matches) {
    const fileName = match[2]
    const imagePath = `local-image://${fileName}`
    
    try {
      // 读取图片的 base64 数据
      const base64Data = await storage.readImage(fileName)
      if (base64Data) {
        // 存储映射关系：路径 -> base64 数据
        imageMapping.set(imagePath, base64Data)
      }
    } catch (error) {
      console.error('Failed to load image:', fileName, error)
    }
  }
  
  // 返回原内容，保持 local-image:// 路径
  return content
}

// 初始化 Cherry 编辑器
async function initEditor() {
  await nextTick()
  
  if (!editorContainer.value) return
  
  // 加载图片映射
  await loadImagesForDisplay(props.content)

  cherryInstance = new Cherry({
    el: editorContainer.value,
    value: props.content,
    locale: 'zh_CN',
    engine: {
      syntax: {
        codeBlock: {
          theme: 'default'
        },
        table: {
          enableChart: false
        }
      }
    },
    toolbars: {
      theme: 'light',
      showToolbar: true,
      toolbar: false  // 使用默认工具栏
    },
    editor: {
      defaultModel: 'editOnly',  // 所见即所得单栏模式
      height: '100%'
    },
    previewer: {
      dom: false,
      className: 'cherry-markdown-preview'
    },
    // 自定义图片上传
    fileUpload: (file: File, callback: (url: string) => void) => {
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const base64Data = e.target?.result as string
          console.log('Uploading image, size:', Math.round(base64Data.length / 1024), 'KB')
          
          // 调用存储 API 保存图片到本地（返回值已包含 local-image:// 前缀）
          const imagePath = await storage.saveImage(knowledgeBaseId.value, base64Data)
          console.log('Image saved as:', imagePath)
          
          // 存储映射关系：路径 -> base64
          imageMapping.set(imagePath, base64Data.split(',')[1])  // 只存储 base64 数据部分
          
          // 返回路径（已包含 local-image:// 前缀）
          console.log('Inserting image path:', imagePath)
          callback(imagePath)
        } catch (error) {
          console.error('Image upload failed:', error)
        }
      }
      reader.onerror = (error) => {
        console.error('FileReader error:', error)
      }
      reader.readAsDataURL(file)
    },
    callback: {
      afterChange: (text: string) => {
        // 内容变化时不自动保存，等待用户手动保存
      },
      // 自定义图片渲染
      beforeImageMounted: (srcProp: string, src: string) => {
        // 如果是 local-image:// 协议，转换为 base64
        if (src.startsWith('local-image://')) {
          const base64Data = imageMapping.get(src)
          if (base64Data) {
            return { srcProp, src: `data:image/png;base64,${base64Data}` }
          }
        }
        return { srcProp, src }
      }
    }
  })
}

// 监听 props.content 变化
watch(() => props.content, async (newContent) => {
  if (cherryInstance) {
    const currentContent = cherryInstance.getMarkdown()
    // 加载图片映射
    await loadImagesForDisplay(newContent)
    if (currentContent !== newContent) {
      cherryInstance.setMarkdown(newContent)
    }
  }
})

// 保存内容
function handleSave() {
  if (cherryInstance) {
    const content = cherryInstance.getMarkdown()
    
    // 内容已经是 local-image:// 格式，直接保存
    console.log('Saving document, content length:', content.length)
    console.log('Images in mapping:', imageMapping.size)
    emit('save', content)
  }
}

// 快捷键保存
function handleKeydown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key === 's') {
    e.preventDefault()
    handleSave()
  }
}

onMounted(() => {
  initEditor()
  document.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown)
  if (cherryInstance) {
    cherryInstance.destroy()
  }
})
</script>

<template>
  <div class="markdown-editor">
    <div class="editor-header">
      <h2>{{ title }}</h2>
      <div class="header-actions">
        <button @click="handleSave" class="btn-save">
          <font-awesome-icon :icon="['fas', 'floppy-disk']" />
          保存
        </button>
      </div>
    </div>

    <div class="editor-container">
      <div ref="editorContainer" class="cherry-editor"></div>
    </div>
  </div>
</template>

<style scoped>
.markdown-editor {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
}

.editor-header {
  padding: 0 20px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  height: 61px;
  flex-shrink: 0;
  z-index: 10;
}

.editor-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
  line-height: 1;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.btn-save {
  background-color: #42b883;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn-save:hover {
  background-color: #33a06f;
}

.editor-container {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.cherry-editor {
  height: 100%;
  width: 100%;
}

/* Cherry Markdown 样式覆盖 */
.cherry-editor :deep(.cherry) {
  height: 100% !important;
  border: none !important;
}

.cherry-editor :deep(.cherry-toolbar) {
  border-bottom: 1px solid #e0e0e0 !important;
  background: #fafafa !important;
}

.cherry-editor :deep(.cherry-editor) {
  background: white !important;
}

.cherry-editor :deep(.cherry-previewer) {
  background: white !important;
  padding: 20px !important;
}

/* 图片样式 - 控制最大宽度 */
.cherry-editor :deep(.cherry-editor img),
.cherry-editor :deep(.cherry-previewer img) {
  max-width: 100% !important;
  height: auto !important;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin: 10px 0;
}

/* 自定义主题色 */
.cherry-editor :deep(.cherry-toolbar .cherry-toolbar-button:hover) {
  background-color: #e6f7ef !important;
  color: #42b883 !important;
}

.cherry-editor :deep(.cherry-toolbar .cherry-toolbar-button.cherry-toolbar-button--active) {
  background-color: #42b883 !important;
  color: white !important;
}
</style>


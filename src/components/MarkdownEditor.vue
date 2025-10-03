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
// 存储媒体映射：路径 -> base64 数据（可包含 data: 前缀）
const imageMapping = new Map<string, string>()
// 存储对象URL映射：原始本地路径 -> 对象URL，便于释放资源
const objectUrlMapping = new Map<string, string>()

function extractMimeTypeFromDataUrl(dataUrl: string): string | null {
  const match = dataUrl.match(/^data:([^;]+);base64,/)
  return match ? match[1] : null
}

function dataUrlToBlobUrl(dataUrl: string): { url: string, mime: string } | null {
  try {
    const mime = extractMimeTypeFromDataUrl(dataUrl)
    if (!mime) return null
    const base64 = dataUrl.split(',')[1]
    const binary = atob(base64)
    const len = binary.length
    const bytes = new Uint8Array(len)
    for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i)
    const blob = new Blob([bytes], { type: mime })
    const url = URL.createObjectURL(blob)
    return { url, mime }
  } catch {
    return null
  }
}

// 将本地媒体路径转换为可显示的格式（加载时）
async function loadImagesForDisplay(content: string): Promise<string> {
  // 兼容 local-image 与新的 local-media 协议，支持图片、音频、视频
  const mediaRegex = /!(?:audio|video)?\[([^\]]*)\]\((local-(?:media|image):\/\/)([^)]+)\)/g
  const matches = [...content.matchAll(mediaRegex)]
  
  // 不再清空旧映射，避免上传后尚未保存的图片/音频被清空导致渲染失败
  
  for (const match of matches) {
    const fileName = match[3]
    const imagePath = `${match[2]}${fileName}`
    
    try {
      // 使用新的媒体管理器接口获取媒体内容
      const mediaManager = storage.getMediaManager()
      const base64Data = await mediaManager.getMedia(fileName)
      if (base64Data) {
        // 存储映射关系：路径 -> base64 数据
        imageMapping.set(imagePath, base64Data)
      }
    } catch (error) {
      console.error('Failed to load image:', fileName, error)
    }
  }
  
  // 返回原内容，保持原协议前缀
  return content
}

// 预处理：将 <audio/src>、<video/src> 和 <source/src> 的 local-... 改写为 data-src 占位，避免初次渲染触发网络请求
function sanitizeMediaLocalSrc(content: string): string {
  let result = content
  // 处理 <audio src="local-...">
  result = result.replace(/<audio([^>]*?)\s+src=("|')(local-(?:media|image):\/\/[^"']+)(\2)([^>]*)>/gi, (_m, pre, quote, url, _q, post) => {
    return `<audio${pre} data-src=${quote}${url}${quote} preload="none"${post}>`
  })
  // 处理 <video src="local-...">
  result = result.replace(/<video([^>]*?)\s+src=("|')(local-(?:media|image):\/\/[^"']+)(\2)([^>]*)>/gi, (_m, pre, quote, url, _q, post) => {
    return `<video${pre} data-src=${quote}${url}${quote} preload="none"${post}>`
  })
  // 处理 <source src="local-...">（音频/视频来源）
  result = result.replace(/<source([^>]*?)\s+src=("|')(local-(?:media|image):\/\/[^"']+)(\2)([^>]*)>/gi, (_m, pre, quote, url, _q, post) => {
    return `<source${pre} data-src=${quote}${url}${quote}${post}>`
  })
  return result
}

// 解析并替换编辑区与预览区中的本地媒体元素（图片、音频、source）
async function resolveLocalMediaElements() {
  try {
    const container = editorContainer.value
    if (!container) return

    const mediaManager = storage.getMediaManager()

    // 查询图片、音频、视频与 source 元素
    const elements = container.querySelectorAll('img, audio, video, source')
    for (const el of Array.from(elements)) {
      const srcAttr = (el as HTMLImageElement).getAttribute('src') || ''
      const dataSrcAttr = (el as HTMLElement).getAttribute('data-src') || ''
      const src = dataSrcAttr || srcAttr
      if (src.startsWith('local-media://') || src.startsWith('local-image://')) {
        // 如果是音频、视频、图片或source，移除 src 并设置占位，避免浏览器请求未知协议
        if (el instanceof HTMLAudioElement) {
          try {
            if (srcAttr && (srcAttr.startsWith('local-media://') || srcAttr.startsWith('local-image://'))) {
              el.removeAttribute('src')
            }
            el.setAttribute('preload', 'none')
          } catch {}
        } else if (el instanceof HTMLVideoElement) {
          try {
            if (srcAttr && (srcAttr.startsWith('local-media://') || srcAttr.startsWith('local-image://'))) {
              el.removeAttribute('src')
            }
            el.setAttribute('preload', 'none')
          } catch {}
        } else if (el instanceof HTMLImageElement) {
          try {
            if (!dataSrcAttr && srcAttr && (srcAttr.startsWith('local-media://') || srcAttr.startsWith('local-image://'))) {
              ;(el as HTMLElement).setAttribute('data-src', srcAttr)
              ;(el as HTMLImageElement).removeAttribute('src')
            }
          } catch {}
        } else if (el instanceof HTMLSourceElement) {
          try {
            if (!dataSrcAttr && srcAttr && (srcAttr.startsWith('local-media://') || srcAttr.startsWith('local-image://'))) {
              (el as HTMLElement).setAttribute('data-src', srcAttr)
              ;(el as HTMLSourceElement).removeAttribute('src')
            }
          } catch {}
        }
        const cached = imageMapping.get(src)
        if (cached) {
          if (cached.startsWith('data:')) {
            // 命中缓存，直接设置到对应元素
            if (el instanceof HTMLImageElement) {
              (el as HTMLImageElement).setAttribute('src', cached)
            } else if (el instanceof HTMLAudioElement) {
              try {
                el.src = cached
                el.setAttribute('preload', 'metadata')
                el.load()
                ;(el as HTMLElement).removeAttribute('data-src')
              } catch {}
            } else if (el instanceof HTMLVideoElement) {
              try {
                const converted = dataUrlToBlobUrl(cached)
                if (converted) {
                  // 注入 <source>，提供 type，提升兼容性
                  const sourceEl = document.createElement('source')
                  sourceEl.src = converted.url
                  sourceEl.type = converted.mime
                  // 清理旧的source，避免堆叠
                  el.querySelectorAll('source').forEach(s => s.remove())
                  el.removeAttribute('src')
                  el.appendChild(sourceEl)
                  el.setAttribute('preload', 'metadata')
                  el.setAttribute('playsinline', 'true')
                  el.load()
                  ;(el as HTMLElement).removeAttribute('data-src')
                  try {
                    const old = objectUrlMapping.get(src)
                    if (old) URL.revokeObjectURL(old)
                  } catch {}
                  objectUrlMapping.set(src, converted.url)
                } else {
                  // 回退到直接使用 dataURL
                  el.src = cached
                  el.setAttribute('preload', 'metadata')
                  el.load()
                  ;(el as HTMLElement).removeAttribute('data-src')
                }
              } catch {}
            } else if (el instanceof HTMLSourceElement) {
              try {
                const converted = dataUrlToBlobUrl(cached)
                if (converted) {
                  el.src = converted.url
                  const mime = converted.mime
                  if (mime) {
                    ;(el as HTMLSourceElement).type = mime
                  }
                  const parent = el.parentElement as HTMLAudioElement | HTMLVideoElement | null
                  if (parent && (parent instanceof HTMLAudioElement || parent instanceof HTMLVideoElement)) {
                    parent.load()
                  }
                  ;(el as HTMLElement).removeAttribute('data-src')
                  try {
                    const old = objectUrlMapping.get(src)
                    if (old) URL.revokeObjectURL(old)
                  } catch {}
                  objectUrlMapping.set(src, converted.url)
                } else {
                  el.src = cached
                  const parent = el.parentElement as HTMLAudioElement | HTMLVideoElement | null
                  if (parent && (parent instanceof HTMLAudioElement || parent instanceof HTMLVideoElement)) {
                    parent.load()
                  }
                  ;(el as HTMLElement).removeAttribute('data-src')
                }
              } catch {}
            }
            continue
          } else {
            // 缓存不包含 data: 前缀
            if (el instanceof HTMLAudioElement || el instanceof HTMLVideoElement || el instanceof HTMLSourceElement) {
              // 对音频和视频，主动读取媒体，确保拿到带正确 MIME 的 data URL
              const id = src.replace('local-media://', '').replace('local-image://', '')
              try {
                const data = await mediaManager.getMedia(id)
                imageMapping.set(src, data)
                if (el instanceof HTMLAudioElement) {
                  el.src = data
                  el.setAttribute('preload', 'metadata')
                  el.load()
                  ;(el as HTMLElement).removeAttribute('data-src')
                } else if (el instanceof HTMLVideoElement) {
                  const converted = dataUrlToBlobUrl(data)
                  if (converted) {
                    const sourceEl = document.createElement('source')
                    sourceEl.src = converted.url
                    sourceEl.type = converted.mime
                    el.querySelectorAll('source').forEach(s => s.remove())
                    el.removeAttribute('src')
                    el.appendChild(sourceEl)
                    el.setAttribute('preload', 'metadata')
                    el.setAttribute('playsinline', 'true')
                    el.load()
                    ;(el as HTMLElement).removeAttribute('data-src')
                    try {
                      const old = objectUrlMapping.get(src)
                      if (old) URL.revokeObjectURL(old)
                    } catch {}
                    objectUrlMapping.set(src, converted.url)
                  } else {
                    el.src = data
                    el.setAttribute('preload', 'metadata')
                    el.load()
                    ;(el as HTMLElement).removeAttribute('data-src')
                  }
                } else if (el instanceof HTMLSourceElement) {
                  const converted = dataUrlToBlobUrl(data)
                  if (converted) {
                    el.src = converted.url
                    const mime = converted.mime
                    if (mime) {
                      ;(el as HTMLSourceElement).type = mime
                    }
                    const parent = el.parentElement as HTMLAudioElement | HTMLVideoElement | null
                    if (parent && (parent instanceof HTMLAudioElement || parent instanceof HTMLVideoElement)) {
                      parent.load()
                    }
                    ;(el as HTMLElement).removeAttribute('data-src')
                    try {
                      const old = objectUrlMapping.get(src)
                      if (old) URL.revokeObjectURL(old)
                    } catch {}
                    objectUrlMapping.set(src, converted.url)
                  } else {
                    el.src = data
                    const parent = el.parentElement as HTMLAudioElement | HTMLVideoElement | null
                    if (parent && (parent instanceof HTMLAudioElement || parent instanceof HTMLVideoElement)) {
                      parent.load()
                    }
                    ;(el as HTMLElement).removeAttribute('data-src')
                  }
                }
              } catch (e) {
                console.error('解析媒体失败:', src, e)
              }
              continue
            } else {
              const finalSrc = `data:image/png;base64,${cached}`
              ;(el as HTMLImageElement).setAttribute('src', finalSrc)
              ;(el as HTMLElement).removeAttribute('data-src')
              continue
            }
          }
        }
        // 提取媒体ID并加载
        const id = src.replace('local-media://', '').replace('local-image://', '')
        try {
          const data = await mediaManager.getMedia(id)
          imageMapping.set(src, data)
           if (el instanceof HTMLImageElement) {
             (el as HTMLImageElement).setAttribute('src', data)
             ;(el as HTMLElement).removeAttribute('data-src')
           } else if (el instanceof HTMLAudioElement) {
             try {
               el.src = data
               el.setAttribute('preload', 'metadata')
               el.load()
               ;(el as HTMLElement).removeAttribute('data-src')
             } catch {}
           } else if (el instanceof HTMLVideoElement) {
             try {
               const converted = dataUrlToBlobUrl(data)
               if (converted) {
                 const sourceEl = document.createElement('source')
                 sourceEl.src = converted.url
                 sourceEl.type = converted.mime
                 el.querySelectorAll('source').forEach(s => s.remove())
                 el.removeAttribute('src')
                 el.appendChild(sourceEl)
                 el.setAttribute('preload', 'metadata')
                 el.setAttribute('playsinline', 'true')
                 el.load()
                 ;(el as HTMLElement).removeAttribute('data-src')
                 objectUrlMapping.set(src, converted.url)
               } else {
                 el.src = data
                 el.setAttribute('preload', 'metadata')
                 el.load()
                 ;(el as HTMLElement).removeAttribute('data-src')
               }
             } catch {}
           } else if (el instanceof HTMLSourceElement) {
             try {
               const converted = dataUrlToBlobUrl(data)
               if (converted) {
                 el.src = converted.url
                 const mime = converted.mime
                 if (mime) {
                   ;(el as HTMLSourceElement).type = mime
                 }
                 const parent = el.parentElement as HTMLAudioElement | HTMLVideoElement | null
                 if (parent && (parent instanceof HTMLAudioElement || parent instanceof HTMLVideoElement)) {
                   parent.load()
                 }
                 ;(el as HTMLElement).removeAttribute('data-src')
                 objectUrlMapping.set(src, converted.url)
               } else {
                 el.src = data
                 const parent = el.parentElement as HTMLAudioElement | HTMLVideoElement | null
                 if (parent && (parent instanceof HTMLAudioElement || parent instanceof HTMLVideoElement)) {
                   parent.load()
                 }
                 ;(el as HTMLElement).removeAttribute('data-src')
               }
             } catch {}
           }
        } catch (e) {
          console.error('解析本地媒体失败:', src, e)
        }
      }
    }

    // 监听 DOM 变更，动态解析新增的媒体元素
    const observer = new MutationObserver(async (mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList' || mutation.type === 'attributes') {
          const nodes = [] as Element[]
          mutation.addedNodes.forEach(n => {
            if (n instanceof Element) nodes.push(n)
          })
          if (mutation.target instanceof Element) nodes.push(mutation.target)
          for (const node of nodes) {
            const candidates = node.querySelectorAll?.('img, audio, video, source') || []
            for (const el of Array.from(candidates)) {
              const srcAttr = (el as HTMLImageElement).getAttribute('src') || ''
              const dataSrcAttr = (el as HTMLElement).getAttribute('data-src') || ''
              const src = dataSrcAttr || srcAttr
              if (src && (src.startsWith('local-media://') || src.startsWith('local-image://'))) {
                if (el instanceof HTMLAudioElement) {
                  try {
                    if (srcAttr && (srcAttr.startsWith('local-media://') || srcAttr.startsWith('local-image://'))) {
                      el.removeAttribute('src')
                    }
                    el.setAttribute('preload', 'none')
                  } catch {}
                } else if (el instanceof HTMLSourceElement) {
                  try {
                    if (!dataSrcAttr && srcAttr && (srcAttr.startsWith('local-media://') || srcAttr.startsWith('local-image://'))) {
                      (el as HTMLElement).setAttribute('data-src', srcAttr)
                      ;(el as HTMLSourceElement).removeAttribute('src')
                    }
                  } catch {}
                }
                const cached = imageMapping.get(src)
                if (cached) {
                  if (cached.startsWith('data:')) {
                    if (el instanceof HTMLImageElement) {
                      (el as HTMLImageElement).setAttribute('src', cached)
                    } else if (el instanceof HTMLAudioElement) {
                      try {
                        el.src = cached
                        el.setAttribute('preload', 'metadata')
                        el.load()
                        ;(el as HTMLElement).removeAttribute('data-src')
                      } catch {}
                    } else if (el instanceof HTMLVideoElement) {
                      try {
                        const converted = dataUrlToBlobUrl(cached)
                        if (converted) {
                          ;(el as HTMLVideoElement).querySelectorAll('source').forEach(s => s.remove())
                          ;(el as HTMLVideoElement).removeAttribute('src')
                          const sourceEl = document.createElement('source')
                          sourceEl.src = converted.url
                          sourceEl.type = converted.mime
                          ;(el as HTMLVideoElement).appendChild(sourceEl)
                          ;(el as HTMLVideoElement).setAttribute('preload', 'metadata')
                          ;(el as HTMLVideoElement).setAttribute('playsinline', 'true')
                          ;(el as HTMLVideoElement).load()
                          ;(el as HTMLElement).removeAttribute('data-src')
                          try {
                            const old = objectUrlMapping.get(src)
                            if (old) URL.revokeObjectURL(old)
                          } catch {}
                          objectUrlMapping.set(src, converted.url)
                        } else {
                          ;(el as HTMLVideoElement).src = cached
                          ;(el as HTMLVideoElement).setAttribute('preload', 'metadata')
                          ;(el as HTMLVideoElement).load()
                          ;(el as HTMLElement).removeAttribute('data-src')
                        }
                      } catch {}
                    } else if (el instanceof HTMLSourceElement) {
                      try {
                        el.src = cached
                        const parent = el.parentElement as HTMLAudioElement | null
                        if (parent && parent instanceof HTMLAudioElement) {
                          parent.load()
                        }
                        ;(el as HTMLElement).removeAttribute('data-src')
                      } catch {}
                    }
                  } else {
                    if (el instanceof HTMLAudioElement || el instanceof HTMLSourceElement || el instanceof HTMLVideoElement) {
                      const id = src.replace('local-media://', '').replace('local-image://', '')
                      try {
                        const data = await mediaManager.getMedia(id)
                        imageMapping.set(src, data)
                        if (el instanceof HTMLAudioElement) {
                          el.src = data
                          el.setAttribute('preload', 'metadata')
                          el.load()
                          ;(el as HTMLElement).removeAttribute('data-src')
                        } else if (el instanceof HTMLVideoElement) {
                          try {
                            const converted = dataUrlToBlobUrl(data)
                            if (converted) {
                              ;(el as HTMLVideoElement).querySelectorAll('source').forEach(s => s.remove())
                              ;(el as HTMLVideoElement).removeAttribute('src')
                              const sourceEl = document.createElement('source')
                              sourceEl.src = converted.url
                              sourceEl.type = converted.mime
                              ;(el as HTMLVideoElement).appendChild(sourceEl)
                              ;(el as HTMLVideoElement).setAttribute('preload', 'metadata')
                              ;(el as HTMLVideoElement).setAttribute('playsinline', 'true')
                              ;(el as HTMLVideoElement).load()
                              ;(el as HTMLElement).removeAttribute('data-src')
                              try {
                                const old = objectUrlMapping.get(src)
                                if (old) URL.revokeObjectURL(old)
                              } catch {}
                              objectUrlMapping.set(src, converted.url)
                            } else {
                              ;(el as HTMLVideoElement).src = data
                              ;(el as HTMLVideoElement).setAttribute('preload', 'metadata')
                              ;(el as HTMLVideoElement).load()
                              ;(el as HTMLElement).removeAttribute('data-src')
                            }
                          } catch {}
                        } else if (el instanceof HTMLSourceElement) {
                          el.src = data
                          const parent = el.parentElement as HTMLAudioElement | null
                          if (parent && parent instanceof HTMLAudioElement) {
                            parent.load()
                          }
                          ;(el as HTMLElement).removeAttribute('data-src')
                        }
                      } catch (e) {
                        console.error('解析音频失败:', src, e)
                      }
                    } else {
                      const finalSrc = `data:image/png;base64,${cached}`
                      ;(el as HTMLImageElement).setAttribute('src', finalSrc)
                    }
                  }
                } else {
                  const id = src.replace('local-media://', '').replace('local-image://', '')
                  try {
                    const data = await mediaManager.getMedia(id)
                    imageMapping.set(src, data)
                    if (el instanceof HTMLImageElement) {
                      (el as HTMLImageElement).setAttribute('src', data)
                      ;(el as HTMLElement).removeAttribute('data-src')
                    } else if (el instanceof HTMLAudioElement) {
                      try {
                        el.src = data
                        el.setAttribute('preload', 'metadata')
                        el.load()
                        ;(el as HTMLElement).removeAttribute('data-src')
                      } catch {}
                    } else if (el instanceof HTMLVideoElement) {
                      try {
                        const converted = dataUrlToBlobUrl(data)
                        if (converted) {
                          ;(el as HTMLVideoElement).querySelectorAll('source').forEach(s => s.remove())
                          ;(el as HTMLVideoElement).removeAttribute('src')
                          const sourceEl = document.createElement('source')
                          sourceEl.src = converted.url
                          sourceEl.type = converted.mime
                          ;(el as HTMLVideoElement).appendChild(sourceEl)
                          ;(el as HTMLVideoElement).setAttribute('preload', 'metadata')
                          ;(el as HTMLVideoElement).setAttribute('playsinline', 'true')
                          ;(el as HTMLVideoElement).load()
                          ;(el as HTMLElement).removeAttribute('data-src')
                          try {
                            const old = objectUrlMapping.get(src)
                            if (old) URL.revokeObjectURL(old)
                          } catch {}
                          objectUrlMapping.set(src, converted.url)
                        } else {
                          ;(el as HTMLVideoElement).src = data
                          ;(el as HTMLVideoElement).setAttribute('preload', 'metadata')
                          ;(el as HTMLVideoElement).load()
                          ;(el as HTMLElement).removeAttribute('data-src')
                        }
                      } catch {}
                    } else if (el instanceof HTMLSourceElement) {
                      try {
                        el.src = data
                        const parent = el.parentElement as HTMLAudioElement | null
                        if (parent && parent instanceof HTMLAudioElement) {
                          parent.load()
                        }
                        ;(el as HTMLElement).removeAttribute('data-src')
                      } catch {}
                    }
                  } catch (e) {
                    console.error('解析本地媒体失败:', src, e)
                  }
                }
              }
            }
          }
        }
      }
    })
    observer.observe(container, { childList: true, subtree: true, attributes: true, attributeFilter: ['src', 'data-src'] })

    // 兜底：处理仍未解析的 <video data-src="local-...">，确保最终注入 <source>
    const unresolvedVideos = container.querySelectorAll('video[data-src^="local-"]')
    for (const v of Array.from(unresolvedVideos)) {
      try {
        const videoEl = v as HTMLVideoElement
        const ds = (v as HTMLElement).getAttribute('data-src') || ''
        if (!ds || !(ds.startsWith('local-media://') || ds.startsWith('local-image://'))) continue
        // 若已有 source 且可用则跳过
        const existingValidSource = Array.from(videoEl.querySelectorAll('source')).some(s => {
          const src = s.getAttribute('src') || ''
          return src.startsWith('blob:') || src.startsWith('data:')
        })
        if (existingValidSource) continue

        let dataUrl = imageMapping.get(ds) || ''
        if (!dataUrl) {
          const id = ds.replace('local-media://', '').replace('local-image://', '')
          try {
            const mediaManager = storage.getMediaManager()
            dataUrl = await mediaManager.getMedia(id)
            imageMapping.set(ds, dataUrl)
          } catch {}
        }
        if (!dataUrl) continue

        const converted = dataUrlToBlobUrl(dataUrl)
        if (converted) {
          videoEl.querySelectorAll('source').forEach(s => s.remove())
          videoEl.removeAttribute('src')
          const sourceEl = document.createElement('source')
          sourceEl.src = converted.url
          sourceEl.type = converted.mime
          videoEl.appendChild(sourceEl)
          videoEl.setAttribute('preload', 'metadata')
          videoEl.setAttribute('playsinline', 'true')
          videoEl.load()
          ;(videoEl as HTMLElement).removeAttribute('data-src')
          try {
            const old = objectUrlMapping.get(ds)
            if (old) URL.revokeObjectURL(old)
          } catch {}
          objectUrlMapping.set(ds, converted.url)
        } else {
          videoEl.src = dataUrl
          videoEl.setAttribute('preload', 'metadata')
          videoEl.load()
          ;(videoEl as HTMLElement).removeAttribute('data-src')
        }
      } catch {}
    }
  } catch (err) {
    console.error('解析本地媒体元素时出错:', err)
  }
}

// 初始化 Cherry 编辑器
async function initEditor() {
  await nextTick()
  
  if (!editorContainer.value) return
  
  // 预处理内容，避免音频初次渲染触发请求
  const sanitizedContent = sanitizeMediaLocalSrc(props.content)
  // 加载图片映射
  await loadImagesForDisplay(sanitizedContent)

  cherryInstance = new Cherry({
    el: editorContainer.value,
    value: sanitizedContent,
    locale: 'zh_CN',
    engine: {
      syntax: {
        table: {
          enableChart: false
        }
      }
    },
    toolbars: {
      showToolbar: true
    },
    editor: {
      defaultModel: 'editOnly',  // 所见即所得单栏模式
      height: '100%'
    },
    previewer: {
      dom: false,
      className: 'cherry-markdown-preview'
    },
    // 自定义文件上传：图片与音频
    fileUpload: (file: File, callback: (url: string) => void) => {
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const base64Data = e.target?.result as string
          const isAudio = file.type && file.type.startsWith('audio/')
          const isImage = file.type && file.type.startsWith('image/')
          const isVideo = file.type && file.type.startsWith('video/')

          if (!isAudio && !isImage && !isVideo) {
            // 非图片/音频/视频走默认逻辑：不处理
            callback('')
            return
          }

          // 对视频进行 mp4 严格限制
          if (isVideo) {
            const nameLower = (file.name || '').toLowerCase()
            const isMp4Ext = nameLower.endsWith('.mp4')
            const isMp4Mime = file.type === 'video/mp4'
            if (!isMp4Ext && !isMp4Mime) {
              const { alertWarning } = await import('@/composables/useAlert')
              alertWarning('仅支持插入 mp4 格式的视频')
              // 告知 Cherry 不插入任何内容
              callback('')
              return
            }
          }

          // 捕获当前选区，防止异步读写导致选区丢失
          const savedRange = captureSelection()

          const mediaPath = await storage.saveImage(knowledgeBaseId.value, base64Data)
          console.log('Media saved as:', mediaPath, 'type:', file.type)

          if (isImage) {
            // 图片：存储 base64 部分用于 beforeImageMounted
            const pureBase64 = base64Data.startsWith('data:') ? base64Data.split(',')[1] : base64Data
            imageMapping.set(mediaPath, pureBase64)
            callback(mediaPath)
          } else if (isAudio) {
            // 音频：保留完整 data:，仅回调给 Cherry，由 Cherry 完成插入
            imageMapping.set(mediaPath, base64Data)
            callback(mediaPath)
          } else if (isVideo) {
            // 视频：保留完整 data:，仅回调给 Cherry，由 Cherry 完成插入
            imageMapping.set(mediaPath, base64Data)
            callback(mediaPath)
          }
        } catch (error) {
          console.error('Media upload failed:', error)
        }
      }
      reader.onerror = (error) => {
        console.error('FileReader error:', error)
      }
      reader.readAsDataURL(file)
    },
    callback: {
      afterChange: () => {
        // 内容变化时不自动保存，等待用户手动保存
        // 解析本地媒体元素，避免出现 local-media:// 加载失败
        resolveLocalMediaElements()
      },
      // 自定义图片渲染：本地协议初次渲染使用 data-src，避免浏览器请求
      beforeImageMounted: (srcProp: string, src: string) => {
        if (src.startsWith('local-media://') || src.startsWith('local-image://')) {
          const base64Data = imageMapping.get(src)
          if (base64Data) {
            if (base64Data.startsWith('data:')) {
              // 直接使用 data: 作为 src
              return { srcProp: 'src', src: base64Data }
            } else {
              // 包装为 data:image/png;base64
              return { srcProp: 'src', src: `data:image/png;base64,${base64Data}` }
            }
          }
          // 未命中映射时，先用 data-src 占位，稍后由解析器赋 src
          return { srcProp: 'data-src', src }
        }
        return { srcProp, src }
      }
    }
  })

  // 初始解析一次本地媒体元素
  resolveLocalMediaElements()
}

// 监听 props.content 变化
watch(() => props.content, async (newContent) => {
  if (cherryInstance) {
    const currentContent = cherryInstance.getMarkdown()
    const sanitized = sanitizeMediaLocalSrc(newContent)
    // 加载图片映射
    await loadImagesForDisplay(sanitized)
    if (currentContent !== sanitized) {
      cherryInstance.setMarkdown(sanitized)
    }
  }
})

// 保存内容
function handleSave() {
  if (cherryInstance) {
    const content = cherryInstance.getMarkdown()
    
    // 内容中可能包含 local-media:// 或兼容的 local-image:// 协议
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
  // 安装运行时拦截器，防止向 audio/source 写入 local-media://
  installMediaSrcInterceptor()
  initEditor()
  document.addEventListener('keydown', handleKeydown)
  // 绑定粘贴事件（捕获阶段），支持音频文件粘贴
  const container = editorContainer.value
  if (container) {
    container.addEventListener('paste', handlePaste, true)
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown)
  if (cherryInstance) {
    cherryInstance.destroy()
  }
  // 恢复拦截器
  uninstallMediaSrcInterceptor()
  const container = editorContainer.value
  if (container) {
    container.removeEventListener('paste', handlePaste, true)
  }
  // 释放对象URL，避免内存泄漏
  for (const url of objectUrlMapping.values()) {
    try { URL.revokeObjectURL(url) } catch {}
  }
  objectUrlMapping.clear()
})

// 插入音频文件
async function onInsertAudio() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'audio/*'
  input.onchange = async () => {
    const file = input.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const base64Data = e.target?.result as string
        // 保存到存储（沿用 saveImage 接口存储媒体数据）
        const savedRange = captureSelection()
        const audioPath = await storage.saveImage(knowledgeBaseId.value, base64Data)
        // 记录映射，音频保留完整 data 前缀，方便直接设置到 audio.src
        imageMapping.set(audioPath, base64Data)

        // 统一插入：改为 Markdown 语法，不插 HTML
        const fileName = file.name || audioPath.replace('local-media://', '')
        const mdAudio = `!audio[${fileName}](${audioPath})\n\n`
        restoreSelection(savedRange)
        insertMarkdownAtCursor(mdAudio)
      } catch (error) {
        console.error('Audio upload failed:', error)
      }
    }
    reader.onerror = (error) => console.error('FileReader error:', error)
    reader.readAsDataURL(file)
  }
  input.click()
}

// 插入视频文件
async function onInsertVideo() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'video/mp4'
  input.onchange = async () => {
    const file = input.files?.[0]
    if (!file) return
    // 仅允许 mp4
    const nameLower = (file.name || '').toLowerCase()
    const isMp4Ext = nameLower.endsWith('.mp4')
    const isMp4Mime = file.type === 'video/mp4'
    if (!isMp4Ext && !isMp4Mime) {
      // 使用全局 Alert 统一提示
      const { alertWarning } = await import('@/composables/useAlert')
      alertWarning('仅支持插入 mp4 格式的视频')
      return
    }
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const base64Data = e.target?.result as string
        // 保存到存储（沿用 saveImage 接口存储媒体数据）
        const savedRange = captureSelection()
        const videoPath = await storage.saveImage(knowledgeBaseId.value, base64Data)
        // 记录映射，视频保留完整 data 前缀，方便直接设置到 video.src
        imageMapping.set(videoPath, base64Data)

        // 统一插入：改为 Markdown 语法，不插 HTML
        const fileName = file.name || videoPath.replace('local-media://', '')
        const mdVideo = `!video[${fileName}](${videoPath})\n\n`
        restoreSelection(savedRange)
        insertMarkdownAtCursor(mdVideo)
      } catch (error) {
        console.error('Video upload failed:', error)
      }
    }
    reader.onerror = (error) => console.error('FileReader error:', error)
    reader.readAsDataURL(file)
  }
  input.click()
}

// 处理粘贴事件：识别剪贴板中的音频和视频文件并插入
async function handlePaste(e: ClipboardEvent) {
  const dt = e.clipboardData
  if (!dt) return
  // 先捕获当前选区，避免异步读文件期间选区丢失
  const savedRange = captureSelection()
  
  const items = Array.from(dt.items)
  const files = Array.from(dt.files || [])
  
  // 优先识别 audio/*
  const audioItem = items.find(item => item.kind === 'file' && item.type.startsWith('audio/'))
  const audioFile = files.find(f => f.type && f.type.startsWith('audio/'))
  
  // 识别 video/*
  const videoItem = items.find(item => item.kind === 'file' && item.type.startsWith('video/'))
  const videoFile = files.find(f => f.type && f.type.startsWith('video/'))
  
  if (audioItem || audioFile) {
    e.preventDefault()
    const file = audioItem?.getAsFile() || audioFile
    if (file) await insertAudioFile(file, savedRange)
    return
  }
  
  if (videoItem || videoFile) {
    e.preventDefault()
    const file = videoItem?.getAsFile() || videoFile
    if (file) await insertVideoFile(file, savedRange)
    return
  }
}

// 拖拽事件处理
let dragCounter = 0

function handleDragEnter(e: DragEvent) {
  e.preventDefault()
  dragCounter++
  if (dragCounter === 1) {
    // 添加拖拽样式
    editorContainer.value?.classList.add('drag-over')
  }
}

function handleDragOver(e: DragEvent) {
  e.preventDefault()
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'copy'
  }
}

function handleDragLeave(e: DragEvent) {
  e.preventDefault()
  dragCounter--
  if (dragCounter === 0) {
    // 移除拖拽样式
    editorContainer.value?.classList.remove('drag-over')
  }
}

async function handleDrop(e: DragEvent) {
  e.preventDefault()
  dragCounter = 0
  editorContainer.value?.classList.remove('drag-over')
  
  const files = Array.from(e.dataTransfer?.files || [])
  if (files.length === 0) return
  
  // 先捕获当前选区
  const savedRange = captureSelection()
  
  // 处理每个文件
  for (const file of files) {
    if (file.type.startsWith('audio/')) {
      await insertAudioFile(file, savedRange)
    } else if (file.type.startsWith('video/')) {
      await insertVideoFile(file, savedRange)
    } else if (file.type.startsWith('image/')) {
      // 处理图片文件（如果需要的话）
      const reader = new FileReader()
      reader.onload = async (ev) => {
        try {
          const base64Data = ev.target?.result as string
          const imagePath = await storage.saveImage(knowledgeBaseId.value, base64Data)
          imageMapping.set(imagePath, base64Data)
          const fileName = file.name || imagePath.replace('local-media://', '')
          const mdImage = `![${fileName}](${imagePath})`
          restoreSelection(savedRange)
          try {
            cherryInstance?.insert(mdImage, false, false, true)
          } catch {
            insertMarkdownAtCursor(mdImage)
          }
        } catch (err) {
          console.error('Drop image failed:', err)
        }
      }
      reader.readAsDataURL(file)
    }
  }
}

// 将音频文件读为 data: 并保存，然后插入到当前光标处或文末
async function insertAudioFile(file: File, initialRange?: Range | null) {
  return new Promise<void>((resolve) => {
    const reader = new FileReader()
    reader.onload = async (ev) => {
      try {
        const base64Data = ev.target?.result as string
        // 优先使用从粘贴事件捕获到的选区
        const rangeToRestore = initialRange ?? captureSelection()
        const audioPath = await storage.saveImage(knowledgeBaseId.value, base64Data)
        // 保留完整 data:，解析器会直接赋到 src
        imageMapping.set(audioPath, base64Data)
        // 改为插入 Markdown 语法，不插 HTML
        const fileName = file.name || audioPath.replace('local-media://', '')
        const mdAudio = `!audio[${fileName}](${audioPath})`
        // 粘贴路径：由我们主动插入 Markdown，防止 Cherry 的 fileUpload 插入逻辑缺席
        restoreSelection(rangeToRestore)
        try {
          cherryInstance?.insert(mdAudio, false, false, true)
        } catch {
          insertMarkdownAtCursor(mdAudio)
        }
      } catch (err) {
        console.error('Paste audio failed:', err)
        resolve()
      }
    }
    reader.onerror = () => resolve()
    reader.readAsDataURL(file)
  })
}

// 将视频文件读为 data: 并保存，然后插入到当前光标处或文末
async function insertVideoFile(file: File, initialRange?: Range | null) {
  return new Promise<void>((resolve) => {
    const reader = new FileReader()
    reader.onload = async (ev) => {
      try {
        // 仅允许 mp4
        const nameLower = (file.name || '').toLowerCase()
        const isMp4Ext = nameLower.endsWith('.mp4')
        const isMp4Mime = file.type === 'video/mp4'
        if (!isMp4Ext && !isMp4Mime) {
          const { alertWarning } = await import('@/composables/useAlert')
          alertWarning('仅支持插入 mp4 格式的视频')
          resolve()
          return
        }
        const base64Data = ev.target?.result as string
        // 优先使用从粘贴事件捕获到的选区
        const rangeToRestore = initialRange ?? captureSelection()
        const videoPath = await storage.saveImage(knowledgeBaseId.value, base64Data)
        // 保留完整 data:，解析器会直接赋到 src
        imageMapping.set(videoPath, base64Data)
        // 改为插入 Markdown 语法，不插 HTML
        const fileName = file.name || videoPath.replace('local-media://', '')
        const mdVideo = `!video[${fileName}](${videoPath})`
        // 粘贴路径：由我们主动插入 Markdown，防止 Cherry 的 fileUpload 插入逻辑缺席
        restoreSelection(rangeToRestore)
        try {
          cherryInstance?.insert(mdVideo, false, false, true)
        } catch {
          insertMarkdownAtCursor(mdVideo)
        }
      } catch (err) {
        console.error('Paste video failed:', err)
        resolve()
      }
    }
    reader.onerror = () => resolve()
    reader.readAsDataURL(file)
  })
}

// 在 contenteditable 区域尝试插入 HTML 到光标位置
function insertHtmlAtCursor(html: string): boolean {
  try {
    const sel = window.getSelection()
    const container = editorContainer.value
    if (!container) return false
    const editable = container.querySelector('[contenteditable="true"]') as HTMLElement | null
    if (!sel || sel.rangeCount === 0 || !editable) {
      return appendBySetMarkdown(html)
    }
    const range = sel.getRangeAt(0)
    if (!editable.contains(range.commonAncestorContainer)) {
      return appendBySetMarkdown(html)
    }
    const fragment = range.createContextualFragment(html)
    range.deleteContents()
    range.insertNode(fragment)
    // 将光标移动到插入节点之后
    sel.removeAllRanges()
    const newRange = document.createRange()
    newRange.selectNodeContents(editable)
    newRange.collapse(false)
    sel.addRange(newRange)
    return true
  } catch {
    return appendBySetMarkdown(html)
  }
}

function insertIntoEditorEnd(html: string): boolean {
  const container = editorContainer.value
  if (!container) return false
  const editable = container.querySelector('[contenteditable="true"]') as HTMLElement | null
  if (!editable) {
    return appendBySetMarkdown(html)
  }
  const div = document.createElement('div')
  div.innerHTML = html
  while (div.firstChild) {
    editable.appendChild(div.firstChild)
  }
  return true
}

function appendBySetMarkdown(html: string): boolean {
  if (!cherryInstance) return false
  try {
    const current = cherryInstance.getMarkdown()
    // 直接拼接，不额外添加两侧空行，由上层决定是否需要换行
    const sep = current.endsWith('\n') ? '' : '\n'
    cherryInstance.setMarkdown(`${current}${sep}${html}`)
    return true
  } catch {
    return false
  }
}

// 选区与插入工具：保证 Markdown 文本按光标精准插入
function getEditable(): HTMLElement | null {
  const container = editorContainer.value
  if (!container) return null
  return container.querySelector('[contenteditable="true"]') as HTMLElement | null
}

function captureSelection(): Range | null {
  const sel = window.getSelection()
  const editable = getEditable()
  if (!sel || sel.rangeCount === 0 || !editable) return null
  const range = sel.getRangeAt(0)
  if (!editable.contains(range.commonAncestorContainer)) return null
  // 克隆一份，避免后续修改影响原对象
  return range.cloneRange()
}

function restoreSelection(range: Range | null): void {
  const editable = getEditable()
  if (!editable) return
  // 强制聚焦编辑区
  editable.focus()
  const sel = window.getSelection()
  if (!sel || !range) return
  sel.removeAllRanges()
  sel.addRange(range)
}

function moveCaretToEnd(): void {
  const editable = getEditable()
  if (!editable) return
  editable.focus()
  const sel = window.getSelection()
  if (!sel) return
  sel.removeAllRanges()
  const endRange = document.createRange()
  endRange.selectNodeContents(editable)
  endRange.collapse(false)
  sel.addRange(endRange)
}

function insertMarkdownAtCursor(text: string): boolean {
  const editable = getEditable()
  if (!editable) {
    return appendBySetMarkdown(text)
  }
  try {
    // 优先使用 insertText，纯文本插入
    editable.focus()
    const ok = document.execCommand('insertText', false, text)
    if (ok) return true
  } catch {}
  // 回退到 Range 操作
  try {
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) {
      moveCaretToEnd()
    }
    const sel2 = window.getSelection()
    if (!sel2 || sel2.rangeCount === 0) {
      return appendBySetMarkdown(text)
    }
    const range = sel2.getRangeAt(0)
    if (!editable.contains(range.commonAncestorContainer)) {
      moveCaretToEnd()
    }
    const activeSel = window.getSelection()
    const activeRange = activeSel && activeSel.rangeCount > 0 ? activeSel.getRangeAt(0) : null
    if (!activeRange) {
      return appendBySetMarkdown(text)
    }
    const node = document.createTextNode(text)
    activeRange.deleteContents()
    activeRange.insertNode(node)
    // 将光标移动到文本节点之后
    activeSel!.removeAllRanges()
    const after = document.createRange()
    after.setStartAfter(node)
    after.collapse(true)
    activeSel!.addRange(after)
    return true
  } catch {
    return appendBySetMarkdown(text)
  }
}

// 运行时拦截器：阻止向 <audio>/<video>/<source> 设置 local-media:// src，并改写为 data-src 或 data:
let originalSetAttribute: ((qualifiedName: string, value: string) => void) | null = null
let originalAudioSrcDescriptor: PropertyDescriptor | undefined
let originalVideoSrcDescriptor: PropertyDescriptor | undefined
let originalSourceSrcDescriptor: PropertyDescriptor | undefined

function installMediaSrcInterceptor() {
  try {
    // 拦截 setAttribute
    const ElementProto = Element.prototype as any
    if (!originalSetAttribute) {
      originalSetAttribute = ElementProto.setAttribute
      ElementProto.setAttribute = function (name: string, value: string) {
        try {
          if (name === 'src' && typeof value === 'string') {
            const target = this as Element
            if ((target instanceof HTMLAudioElement || target instanceof HTMLVideoElement || target instanceof HTMLSourceElement) && (value.startsWith('local-media://') || value.startsWith('local-image://'))) {
              // 将 local-... 改写为 data-src，占位，等待解析器设置为 data:
              originalSetAttribute!.call(target, 'data-src', value)
              // 触发一次解析，尽快替换为 data:
              resolveLocalMediaElements()
              return
            }
          }
        } catch {}
        return originalSetAttribute!.call(this, name, value)
      }
    }

    // 拦截 audio.src 与 source.src 的 setter
    if (!originalAudioSrcDescriptor) {
      originalAudioSrcDescriptor = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'src')
      const newAudioSrcSetter = function (this: HTMLMediaElement, value: string) {
        try {
          if (typeof value === 'string' && (value.startsWith('local-media://') || value.startsWith('local-image://'))) {
            // 改写为 data-src，占位；解析器会异步设置为 data:
            (this as any).setAttribute('data-src', value)
            resolveLocalMediaElements()
            return
          }
        } catch {}
        return originalAudioSrcDescriptor?.set?.call(this, value)
      }
      Object.defineProperty(HTMLMediaElement.prototype, 'src', {
        set: newAudioSrcSetter,
        get: originalAudioSrcDescriptor?.get,
        configurable: true,
        enumerable: true
      })
    }

    // 拦截 video.src 的 setter（部分浏览器对 HTMLMediaElement 的拦截不足）
    if (!originalVideoSrcDescriptor) {
      originalVideoSrcDescriptor = Object.getOwnPropertyDescriptor(HTMLVideoElement.prototype, 'src')
      const newVideoSrcSetter = function (this: HTMLVideoElement, value: string) {
        try {
          if (typeof value === 'string' && (value.startsWith('local-media://') || value.startsWith('local-image://'))) {
            (this as any).setAttribute('data-src', value)
            resolveLocalMediaElements()
            return
          }
        } catch {}
        return originalVideoSrcDescriptor?.set?.call(this, value)
      }
      Object.defineProperty(HTMLVideoElement.prototype, 'src', {
        set: newVideoSrcSetter,
        get: originalVideoSrcDescriptor?.get,
        configurable: true,
        enumerable: true
      })
    }

    if (!originalSourceSrcDescriptor) {
      originalSourceSrcDescriptor = Object.getOwnPropertyDescriptor(HTMLSourceElement.prototype, 'src')
      const newSourceSrcSetter = function (this: HTMLSourceElement, value: string) {
        try {
          if (typeof value === 'string' && (value.startsWith('local-media://') || value.startsWith('local-image://'))) {
            (this as any).setAttribute('data-src', value)
            resolveLocalMediaElements()
            return
          }
        } catch {}
        return originalSourceSrcDescriptor?.set?.call(this, value)
      }
      Object.defineProperty(HTMLSourceElement.prototype, 'src', {
        set: newSourceSrcSetter,
        get: originalSourceSrcDescriptor?.get,
        configurable: true,
        enumerable: true
      })
    }
  } catch (e) {
    console.warn('安装媒体拦截器失败:', e)
  }
}

function uninstallMediaSrcInterceptor() {
  try {
    // 恢复 setAttribute
    if (originalSetAttribute) {
      (Element.prototype as any).setAttribute = originalSetAttribute
      originalSetAttribute = null
    }
    // 恢复 audio.src
    if (originalAudioSrcDescriptor) {
      Object.defineProperty(HTMLMediaElement.prototype, 'src', originalAudioSrcDescriptor)
      originalAudioSrcDescriptor = undefined
    }
    // 恢复 source.src
    if (originalSourceSrcDescriptor) {
      Object.defineProperty(HTMLSourceElement.prototype, 'src', originalSourceSrcDescriptor)
      originalSourceSrcDescriptor = undefined
    }
  } catch (e) {
    console.warn('卸载媒体拦截器失败:', e)
  }
}
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
      <div 
        ref="editorContainer" 
        class="cherry-editor"
        @dragover.prevent="handleDragOver"
        @dragenter.prevent="handleDragEnter"
        @dragleave.prevent="handleDragLeave"
        @drop.prevent="handleDrop"
      ></div>
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
  height: 60px;
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
  padding: 0 !important;
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

/* 拖拽样式 */
.cherry-editor.drag-over {
  position: relative;
}

.cherry-editor.drag-over::before {
  content: '拖拽文件到此处上传';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(66, 184, 131, 0.1);
  border: 2px dashed #42b883;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: #42b883;
  font-weight: 600;
  z-index: 1000;
  pointer-events: none;
}

.cherry-editor :deep(.cherry-previewer) {
  background: white !important;
  padding: 0 !important;
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

/* 视频样式 - 控制最大宽度 */
.cherry-editor :deep(.cherry-editor video),
.cherry-editor :deep(.cherry-previewer video) {
  max-width: 100% !important;
  height: auto !important;
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


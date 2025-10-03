<script setup lang="ts">
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { getStorage } from '@/storage'
import { ref, onMounted } from 'vue'
import { alertError } from '@/composables/useAlert'

const props = defineProps<{
  images: string[]
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

// 媒体预览数据（图片/音频）
const imagePreviewMap = ref<Map<string, string>>(new Map())

// 音频和视频播放状态与引用
const playing = ref<Record<string, boolean>>({})
const audioRefs = ref<Record<string, HTMLAudioElement | null>>({})
const videoRefs = ref<Record<string, HTMLVideoElement | null>>({})

// 视频弹窗控制与当前视频源
const showVideoModal = ref(false)
const currentVideoSrc = ref<string>('')

function setAudioRef(path: string, el: HTMLAudioElement | null) {
  audioRefs.value[path] = el
}

function setVideoRef(path: string, el: HTMLVideoElement | null) {
  videoRefs.value[path] = el
}

function pauseOthers(exceptPath?: string) {
  // 暂停所有音频
  const audioRefs_ = audioRefs.value
  for (const key in audioRefs_) {
    if (!Object.prototype.hasOwnProperty.call(audioRefs_, key)) continue
    if (key === exceptPath) continue
    const other = audioRefs_[key]
    if (other) {
      try {
        other.pause()
      } catch {}
    }
    playing.value[key] = false
  }
  
  // 暂停所有视频
  const videoRefs_ = videoRefs.value
  for (const key in videoRefs_) {
    if (!Object.prototype.hasOwnProperty.call(videoRefs_, key)) continue
    if (key === exceptPath) continue
    const other = videoRefs_[key]
    if (other) {
      try {
        other.pause()
      } catch {}
    }
    playing.value[key] = false
  }
}

// 加载媒体预览
onMounted(async () => {
  const storage = getStorage()
  // 优先使用新的媒体管理器，如果不可用则回退到图片管理器
  const mediaManager = storage.getMediaManager()
  
  for (const imagePath of props.images) {
    try {
      // 提取媒体ID（兼容 local-media 与旧的 local-image 前缀）
      const imageId = imagePath.replace('local-media://', '').replace('local-image://', '')
      // 使用媒体管理器的 getMedia 方法替代旧的图片接口
      const base64Data = await mediaManager.getMedia(imageId)
      imagePreviewMap.value.set(imagePath, base64Data)
    } catch (error) {
      console.error('加载媒体预览失败:', imagePath, error)
    }
  }
})

// 获取媒体预览 URL（图片/音频）
function getImagePreview(imagePath: string): string {
  const base64 = imagePreviewMap.value.get(imagePath)
  if (base64) {
    // 如果已经是完整的 data URL，直接返回
    if (base64.startsWith('data:')) {
      return base64
    }
    // 否则添加默认图片前缀
    return `data:image/png;base64,${base64}`
  }
  return ''
}

function isAudio(imagePath: string): boolean {
  const preview = getImagePreview(imagePath)
  return preview.startsWith('data:audio')
}

function isVideo(imagePath: string): boolean {
  const preview = getImagePreview(imagePath)
  return preview.startsWith('data:video')
}

function togglePlay(imagePath: string) {
  const preview = getImagePreview(imagePath)
  if (!preview) return
  
  // 音频：保持原有播放/暂停逻辑
  if (preview.startsWith('data:audio')) {
    const audioEl = audioRefs.value[imagePath]
    if (!audioEl) return
    const isPlaying = !!playing.value[imagePath]
    if (isPlaying) {
      try { audioEl.pause() } catch {}
      playing.value[imagePath] = false
    } else {
      // 互斥播放
      pauseOthers(imagePath)
      try { audioEl.play() } catch {}
      playing.value[imagePath] = true
    }
    return
  }

  // 视频：仅支持 mp4 打开弹窗，其它格式提示不支持预览
  if (preview.startsWith('data:video')) {
    const isMp4 = /^data:video\/mp4/i.test(preview)
    if (isMp4) {
      showVideoModal.value = true
      currentVideoSrc.value = preview
    } else {
      alertError('该视频格式暂不支持预览，请使用 MP4 格式')
    }
    return
  }

  // 其他未知类型
  alertError('该文件类型不支持预览')
}

function onPlay(imagePath: string) {
  // 事件级别也强制互斥，避免外部调用造成并发播放
  pauseOthers(imagePath)
  playing.value[imagePath] = true
}

function onPause(imagePath: string) {
  playing.value[imagePath] = false
}

function onEnded(imagePath: string) {
  playing.value[imagePath] = false
}


</script>

<template>
  <div class="confirm-overlay" @click="emit('cancel')">
    <div class="confirm-modal" @click.stop>
      <!-- 头部 -->
      <div class="confirm-header">
        <h3>
          <FontAwesomeIcon icon="triangle-exclamation" class="warning-icon" />
          确认清理文件
        </h3>
        <button class="close-btn" @click="emit('cancel')">
          <FontAwesomeIcon icon="xmark" />
        </button>
      </div>

      <!-- 提示信息 -->
      <div class="confirm-message">
        <p>
          发现 <strong>{{ images.length }}</strong> 个未使用的文件（图片/音频/视频），占用存储空间。
        </p>
        <p class="warning-text">
          <FontAwesomeIcon icon="circle-exclamation" />
          删除后无法恢复，请确认以下文件确实不再需要。
        </p>
      </div>

      <!-- 文件列表（图片/音频/视频） -->
  <div class="images-list">
        <div
          v-for="(imagePath, index) in images"
          :key="imagePath"
          class="image-item"
        >
          <div class="image-preview">
            <template v-if="imagePreviewMap.has(imagePath)">
              <img
                v-if="getImagePreview(imagePath).startsWith('data:image')"
                :src="getImagePreview(imagePath)"
                :alt="imagePath"
              />
              <div
                v-else-if="getImagePreview(imagePath).startsWith('data:audio')"
                class="audio-preview"
              >
                <button class="audio-btn" @click="togglePlay(imagePath)">
                  <FontAwesomeIcon :icon="playing[imagePath] ? 'pause' : 'play'" />
                </button>
                <!-- 隐藏的原生音频元素，用于实际播放控制 -->
                <audio
                  :src="getImagePreview(imagePath)"
                  :ref="el => setAudioRef(imagePath, el as HTMLAudioElement)"
                  @ended="onEnded(imagePath)"
                  @play="onPlay(imagePath)"
                  @pause="onPause(imagePath)"
                  preload="metadata"
                  class="audio-hidden"
                />
              </div>
              <div
                v-else-if="getImagePreview(imagePath).startsWith('data:video')"
                class="video-preview"
              >
                <div class="video-thumbnail">
                  <!-- 缩略图里不再展示 video-info 文本层，也不直接播放预览视频 -->
                  <div class="video-overlay">
                    <button
                      @click="togglePlay(imagePath)"
                      class="play-button video-play-button"
                    >
                      <FontAwesomeIcon icon="play" />
                    </button>
                  </div>
                </div>
              </div>
              <div v-else class="preview-unknown">无法预览的文件类型</div>
            </template>
            <div v-else class="preview-loading">
              <FontAwesomeIcon icon="spinner" spin />
            </div>
          </div>
          <div class="image-info">
            <div class="image-path">
              <FontAwesomeIcon :icon="isVideo(imagePath) ? 'video' : isAudio(imagePath) ? 'volume-high' : 'image'" />
              <span>{{ imagePath }}</span>
            </div>
            <div class="image-index">
              #{{ index + 1 }}
            </div>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="confirm-actions">
        <button class="btn-cancel" @click="emit('cancel')">
          <FontAwesomeIcon icon="xmark" />
          取消
        </button>
        <button class="btn-confirm" @click="emit('confirm')">
          <FontAwesomeIcon icon="trash" />
          确认删除 ({{ images.length }})
        </button>
      </div>
    </div>
  </div>

  <!-- 视频播放弹窗 -->
  <div v-if="showVideoModal" class="video-modal-overlay" @click="showVideoModal = false">
    <div class="video-modal" @click.stop>
      <div class="video-modal-header">
        <span>预览视频</span>
        <button class="video-modal-close" @click="showVideoModal = false">
          <FontAwesomeIcon icon="xmark" />
        </button>
      </div>
      <div class="video-modal-body">
        <video
          v-if="currentVideoSrc"
          :src="currentVideoSrc"
          controls
          autoplay
          playsinline
          preload="auto"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.confirm-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2100;
}

.confirm-modal {
  background: white;
  border-radius: 12px;
  width: 600px;
  max-width: 90vw;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

/* 头部 */
.confirm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 25px;
  border-bottom: 1px solid #e0e0e0;
}

.confirm-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.warning-icon {
  color: #ff9800;
}

.close-btn {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: #666;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-btn:hover {
  background-color: #f0f0f0;
  color: #333;
}

/* 提示信息 */
.confirm-message {
  padding: 20px 25px;
  background: #fff3e0;
  border-bottom: 1px solid #ffe0b2;
}

.confirm-message p {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: #333;
  line-height: 1.6;
}

.confirm-message p:last-child {
  margin-bottom: 0;
}

.confirm-message strong {
  color: #ff9800;
  font-weight: 600;
}

.warning-text {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #f57c00 !important;
  font-size: 13px !important;
}

/* 图片列表 */
.images-list {
  flex: 1;
  overflow-y: auto;
  padding: 15px 25px;
}

.image-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 10px;
  transition: all 0.2s;
}

.image-item:hover {
  background: #f0f1f3;
}

.image-preview {
  width: 60px;
  height: 60px;
  border-radius: 6px;
  overflow: hidden;
  background: #e0e0e0;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-preview audio {
  width: 100%;
}

.audio-preview {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.audio-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #333;
  transition: all 0.2s;
  font-size: 18px;
}

.audio-btn:hover {
  transform: scale(1.05);
}

.audio-hidden {
  display: none;
}

/* 视频预览样式 */
.video-preview {
  width: 100%;
  height: 100%;
  position: relative;
}

.video-thumbnail {
  width: 100%;
  height: 100%;
  position: relative;
  border-radius: 8px;
  overflow: hidden;
}

.video-element {
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: #000;
}

.video-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  opacity: 1;
  transition: opacity 0.2s;
}

.video-thumbnail:hover .video-overlay {
  opacity: 1;
}

.video-play-button {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.9);
  color: #333;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.video-play-button:hover {
  background: white;
  transform: scale(1.05);
}

.video-play-button.playing {
  background: rgba(244, 67, 54, 0.9);
  color: white;
}

.video-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  padding: 20px 8px 8px;
}

.video-name {
  color: white;
  font-size: 12px;
  font-weight: 500;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 视频弹窗样式 */
.video-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2200;
}

.video-modal {
  background: white;
  border-radius: 12px;
  width: 800px;
  max-width: 90vw;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

.video-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #e0e0e0;
}

.video-modal-close {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: #666;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.video-modal-close:hover {
  background-color: #f0f0f0;
  color: #333;
}

.video-modal-body {
  padding: 12px 16px;
}

.video-modal-body video {
  width: 100%;
  max-height: 70vh;
  background: #000;
}

.preview-loading {
  color: #999;
  font-size: 20px;
}

.preview-unknown {
  color: #999;
  font-size: 12px;
}

.image-info {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.image-path {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #666;
  overflow: hidden;
}

.image-path span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.image-index {
  font-size: 12px;
  color: #999;
  padding: 2px 8px;
  background: white;
  border-radius: 4px;
  white-space: nowrap;
}

/* 操作按钮 */
.confirm-actions {
  display: flex;
  gap: 10px;
  padding: 20px 25px;
  border-top: 1px solid #e0e0e0;
  justify-content: flex-end;
}

.btn-cancel,
.btn-confirm {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
  border: none;
}

.btn-cancel {
  background-color: #f0f0f0;
  color: #666;
}

.btn-cancel:hover {
  background-color: #e0e0e0;
  color: #333;
}

.btn-confirm {
  background-color: #f44336;
  color: white;
}

.btn-confirm:hover {
  background-color: #d32f2f;
}

/* 滚动条样式 */
.images-list::-webkit-scrollbar {
  width: 6px;
}

.images-list::-webkit-scrollbar-track {
  background: transparent;
}

.images-list::-webkit-scrollbar-thumb {
  background: #ddd;
  border-radius: 3px;
}

.images-list::-webkit-scrollbar-thumb:hover {
  background: #ccc;
}
</style>


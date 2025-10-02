<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

export interface MenuItem {
  label: string
  icon?: string
  action: () => void
  divider?: boolean
  disabled?: boolean
}

defineProps<{
  items: MenuItem[]
}>()

const visible = ref(false)
const position = ref({ x: 0, y: 0 })

// 显示菜单
function show(x: number, y: number) {
  position.value = { x, y }
  visible.value = true
  
  // 调整位置，防止超出屏幕
  setTimeout(() => {
    const menu = document.querySelector('.context-menu') as HTMLElement
    if (menu) {
      const rect = menu.getBoundingClientRect()
      const windowWidth = window.innerWidth
      const windowHeight = window.innerHeight
      
      if (rect.right > windowWidth) {
        position.value.x = windowWidth - rect.width - 10
      }
      if (rect.bottom > windowHeight) {
        position.value.y = windowHeight - rect.height - 10
      }
    }
  }, 0)
}

// 隐藏菜单
function hide() {
  visible.value = false
}

// 处理菜单项点击
function handleItemClick(item: MenuItem) {
  if (item.disabled) return
  item.action()
  hide()
}

// 点击外部隐藏菜单
function handleClickOutside(e: MouseEvent) {
  const menu = document.querySelector('.context-menu')
  if (menu && !menu.contains(e.target as Node)) {
    hide()
  }
}

// 监听滚动事件，滚动时隐藏菜单
function handleScroll() {
  hide()
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('contextmenu', hide)
  window.addEventListener('scroll', handleScroll, true)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('contextmenu', hide)
  window.removeEventListener('scroll', handleScroll, true)
})

defineExpose({
  show,
  hide
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="context-menu"
      :style="{
        left: `${position.x}px`,
        top: `${position.y}px`
      }"
    >
      <template v-for="(item, index) in items" :key="index">
        <div
          v-if="item.divider"
          class="menu-divider"
        />
        <div
          v-else
          :class="['menu-item', { disabled: item.disabled }]"
          @click="handleItemClick(item)"
        >
          <span v-if="item.icon" class="menu-icon">
            <font-awesome-icon v-if="item.icon.startsWith('fa-')" :icon="['fas', item.icon.replace('fa-', '')]" />
            <span v-else>{{ item.icon }}</span>
          </span>
          <span class="menu-label">{{ item.label }}</span>
        </div>
      </template>
    </div>
  </Teleport>
</template>

<style scoped>
.context-menu {
  position: fixed;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 4px;
  min-width: 160px;
  z-index: 9999;
  user-select: none;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
  color: #333;
}

.menu-item:hover:not(.disabled) {
  background-color: #f0f0f0;
}

.menu-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.menu-icon {
  font-size: 14px;
  width: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.menu-label {
  flex: 1;
}

.menu-divider {
  height: 1px;
  background-color: #e0e0e0;
  margin: 4px 0;
}
</style>


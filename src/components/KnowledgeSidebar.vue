<script setup lang="ts">
import { ref, computed } from 'vue'

interface SidebarItem {
  id: string
  icon: string
  label: string
  tooltip?: string
}

const props = defineProps<{
  activeItem?: string
}>()

const emit = defineEmits<{
  'item-click': [itemId: string]
}>()

// 侧边栏导航项
const sidebarItems = ref<SidebarItem[]>([
  {
    id: 'explorer',
    icon: 'fa-folder-open',
    label: '目录',
    tooltip: '文档目录'
  },
  {
    id: 'settings',
    icon: 'fa-gear',
    label: '设置',
    tooltip: '知识库设置'
  }
])

// 当前激活的导航项
const activeItem = computed(() => props.activeItem || 'explorer')

// 处理导航项点击
function handleItemClick(item: SidebarItem) {
  emit('item-click', item.id)
}

// 获取激活状态的类名
function getItemClass(item: SidebarItem) {
  return {
    'sidebar-item': true,
    'active': activeItem.value === item.id
  }
}
</script>

<template>
  <div class="knowledge-sidebar">
    <!-- 导航栏 -->
    <div class="sidebar-nav">
      <div
        v-for="item in sidebarItems"
        :key="item.id"
        :class="getItemClass(item)"
        :title="item.tooltip || item.label"
        @click="handleItemClick(item)"
      >
        <font-awesome-icon :icon="['fas', item.icon]" class="nav-icon" />
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="sidebar-content">
      <!-- 直接渲染 explorer 插槽内容 -->
      <div v-if="activeItem === 'explorer'" class="explorer-content">
        <div class="explorer-header">
          <h3>文档目录</h3>
        </div>
        <slot name="explorer">
          <!-- 文档目录内容 -->
        </slot>
      </div>
      
      <!-- 设置面板内容 -->
      <div v-if="activeItem === 'settings'" class="settings-content">
        <slot name="settings">
          <!-- 知识库设置内容 -->
        </slot>
      </div>
    </div>
  </div>
</template>

<style scoped>
.knowledge-sidebar {
  width: 280px;
  background: white;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* 导航栏样式 */
.sidebar-nav {
  background: white;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 8px;
  flex-shrink: 0;
  width: 100%;
  height: 60px;
}

.sidebar-item {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  margin: 0 8px;
  border-radius: 4px;
  position: relative;
}

.sidebar-item:hover {
  background-color: #e6f7ef;
  color: #42b883;
}

.sidebar-item.active {
  background-color: #42b883;
  color: white;
}

.sidebar-item.active::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 24px;
  height: 3px;
  background-color: #42b883;
  border-radius: 2px;
}

.nav-icon {
  font-size: 14px;
}

/* 内容区域样式 */
.sidebar-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.explorer-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.explorer-header {
  padding: 16px 20px;
  border-bottom: 1px solid #e0e0e0;
  background: #f8f9fa;
  height: 60px;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.explorer-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.settings-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .knowledge-sidebar {
    width: 240px;
  }
  
  .sidebar-nav {
    height: 50px;
    padding: 6px;
  }
  
  .sidebar-item {
    width: 32px;
    height: 32px;
    margin: 0 6px;
  }
  
  .nav-icon {
    font-size: 12px;
  }
}

/* 深色主题支持（预留） */
@media (prefers-color-scheme: dark) {
  .knowledge-sidebar {
    background: #1e1e1e;
    border-right-color: #3c3c3c;
  }
  
  .sidebar-nav {
    background: #252526;
    border-bottom-color: #3c3c3c;
  }
  
  .sidebar-item:hover {
    background-color: #2d2d30;
    color: #42b883;
  }
}
</style>

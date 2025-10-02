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
  }
  // 后续可以扩展更多导航项
  // {
  //   id: 'search',
  //   icon: 'fa-magnifying-glass',
  //   label: '搜索',
  //   tooltip: '搜索文档'
  // },
  // {
  //   id: 'outline',
  //   icon: 'fa-list',
  //   label: '大纲',
  //   tooltip: '文档大纲'
  // }
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
      <slot name="content" :activeItem="activeItem">
        <!-- 默认内容插槽 -->
        <div v-if="activeItem === 'explorer'" class="explorer-content">
          <slot name="explorer">
            <!-- 文档目录内容 -->
          </slot>
        </div>
      </slot>
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
  flex-direction: column;
  padding: 4px 0;
  flex-shrink: 0;
  height: 100%;
}

.sidebar-item {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  margin: 2px 6px;
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
  right: -9px;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 24px;
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

/* 响应式设计 */
@media (max-width: 768px) {
  .knowledge-sidebar {
    width: 240px;
  }
  
  .sidebar-item {
    width: 32px;
    height: 32px;
    margin: 2px 5px;
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

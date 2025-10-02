# Vue组件开发规范

## 📖 文档说明

这是针对Vue3+TypeScript组件的具体开发标准，适用于所有Vue组件、TypeScript和JavaScript文件的开发。

## 🎯 组件设计原则

### 单一职责原则
每个组件只负责一个明确的功能，保持组件的简洁和可维护性。

```vue
<!-- ✅ 好的示例：专注单一功能 -->
<template>
  <div class="alert-modal">
    <!-- 只负责显示Alert弹窗 -->
  </div>
</template>

<!-- ❌ 避免：功能过于复杂 -->
<template>
  <div class="everything-component">
    <!-- 不要在一个组件中处理太多功能 -->
  </div>
</template>
```

### 可复用性设计
设计通用的组件接口，支持多种使用场景。

```typescript
// ✅ 好的接口设计
interface AlertOptions {
  title?: string
  message: string
  type?: 'info' | 'success' | 'warning' | 'error'
  confirmText?: string
  showCancel?: boolean
  cancelText?: string
}

// 支持多种使用方式
const props = withDefaults(defineProps<{
  show?: boolean        // 可选：外部控制显示
  options?: AlertOptions // 可选：外部传入配置
}>(), {
  show: undefined,
  options: undefined
})
```

## 📝 组件结构规范

### 标准组件结构
```vue
<template>
  <!-- 1. 模板内容 -->
</template>

<script setup lang="ts">
// 2. 导入语句
import { ref, computed, watch } from 'vue'
import { useStore } from '@/stores'

// 3. 类型定义
interface Props {
  // props类型定义
}

// 4. Props和Emits定义
const props = withDefaults(defineProps<Props>(), {
  // 默认值
})

const emit = defineEmits<{
  // emits类型定义
}>()

// 5. 响应式数据
const data = ref()

// 6. 计算属性
const computed = computed(() => {})

// 7. 监听器
watch(() => {}, () => {})

// 8. 方法定义
function handleSomething() {}

// 9. 生命周期
onMounted(() => {})
</script>

<style scoped>
/* 10. 样式定义 */
</style>
```

### 导入顺序规范
```typescript
// 1. Vue核心API
import { ref, computed, watch, onMounted } from 'vue'

// 2. Vue Router
import { useRoute, useRouter } from 'vue-router'

// 3. 第三方库
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

// 4. 项目内部模块
import { useKnowledgeStore } from '@/stores/knowledge'
import { getStorage } from '@/storage'

// 5. 类型定义
import type { KnowledgeBase, DocumentNode } from '@/types'
import type { MenuItem } from '@/components/ContextMenu.vue'
```

## 🎨 Props设计规范

### 类型安全
```typescript
// ✅ 使用TypeScript接口定义
interface Props {
  title: string
  items: Array<{ id: string; name: string }>
  show?: boolean
  onConfirm?: () => void
}

const props = withDefaults(defineProps<Props>(), {
  show: false
})

// ❌ 避免：使用any类型
const props = defineProps<{
  data: any  // 过于宽泛
}>()
```

### 默认值设置
```typescript
// ✅ 使用withDefaults设置默认值
const props = withDefaults(defineProps<{
  show?: boolean
  type?: 'info' | 'success' | 'warning' | 'error'
}>(), {
  show: false,
  type: 'info'
})

// ✅ 对于复杂对象，使用undefined作为默认值
const props = withDefaults(defineProps<{
  options?: AlertOptions
}>(), {
  options: undefined  // 让组件内部处理
})
```

## 🎯 Emits设计规范

### 事件命名
```typescript
// ✅ 使用动词+名词的命名方式
const emit = defineEmits<{
  'update:modelValue': [value: string]
  'item-click': [item: MenuItem]
  'close': []
  'confirm': [data: any]
}>()

// ❌ 避免：过于简单的命名
const emit = defineEmits<{
  'click': []  // 不够明确
}>()
```

### 事件参数类型
```typescript
// ✅ 明确的事件参数类型
const emit = defineEmits<{
  'node-select': [node: DocumentNode]
  'menu-action': [action: string, item: MenuItem]
  'drag-move': [nodeId: string, targetParentId: string | null, position: number]
}>()
```

## 🔧 响应式数据规范

### ref vs reactive
```typescript
// ✅ 基础类型使用ref
const count = ref(0)
const message = ref('')
const isVisible = ref(false)

// ✅ 对象类型使用reactive
const formData = reactive({
  name: '',
  email: '',
  age: 0
})

// ✅ 复杂对象数组使用ref
const documents = ref<DocumentNode[]>([])
const knowledgeBases = ref<KnowledgeBase[]>([])
```

### 计算属性优化
```typescript
// ✅ 使用计算属性缓存复杂计算
const filteredItems = computed(() => {
  return items.value.filter(item => 
    item.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

// ✅ 计算属性依赖明确
const currentDocument = computed(() => {
  return documents.value.find(doc => doc.id === selectedId.value)
})
```

## 🎨 样式规范

### Scoped样式
```vue
<style scoped>
/* ✅ 使用scoped避免样式污染 */
.component-name {
  /* 组件样式 */
}

/* ✅ 深度选择器使用:deep() */
:deep(.external-library-class) {
  /* 修改第三方库样式 */
}
</style>
```

### CSS类命名
```css
/* ✅ 使用BEM命名规范 */
.alert-modal {
  /* 块 */
}

.alert-modal__header {
  /* 元素 */
}

.alert-modal--warning {
  /* 修饰符 */
}

/* ✅ 或使用组件名作为前缀 */
.custom-alert-overlay {
  /* 组件名 + 功能描述 */
}

.custom-alert-modal {
  /* 组件名 + 功能描述 */
}
```

## 🔄 组件通信规范

### 父子组件通信
```vue
<!-- 父组件 -->
<template>
  <ChildComponent 
    :data="parentData"
    @update="handleUpdate"
  />
</template>

<!-- 子组件 -->
<script setup lang="ts">
const props = defineProps<{
  data: string
}>()

const emit = defineEmits<{
  'update': [value: string]
}>()

function handleClick() {
  emit('update', newValue)
}
</script>
```

### 跨组件通信
```typescript
// ✅ 使用Pinia进行状态管理
const store = useKnowledgeStore()
const documents = computed(() => store.documents)

// ✅ 使用provide/inject进行依赖注入
// 父组件
provide('theme', theme)

// 子组件
const theme = inject('theme')
```

## 🎯 性能优化规范

### 组件懒加载
```typescript
// ✅ 路由懒加载
const routes = [
  {
    path: '/knowledge-base/:id',
    component: () => import('@/views/KnowledgeBaseDetail.vue')
  }
]

// ✅ 条件组件渲染
<template>
  <MarkdownEditor v-if="showEditor" />
</template>
```

### 事件处理优化
```typescript
// ✅ 使用防抖处理高频事件
import { debounce } from 'lodash-es'

const debouncedSearch = debounce((query: string) => {
  // 搜索逻辑
}, 300)

// ✅ 避免在模板中使用复杂表达式
<template>
  <!-- ❌ 避免 -->
  <div>{{ items.filter(item => item.active).length }}</div>
  
  <!-- ✅ 推荐 -->
  <div>{{ activeItemsCount }}</div>
</template>

<script setup>
const activeItemsCount = computed(() => 
  items.value.filter(item => item.active).length
)
</script>
```

## 🔒 错误处理规范

### 组件错误边界
```typescript
// ✅ 使用try-catch处理异步操作
async function loadData() {
  try {
    isLoading.value = true
    const data = await api.getData()
    items.value = data
  } catch (error) {
    console.error('加载数据失败:', error)
    // 显示错误提示
    alertError('加载数据失败，请重试')
  } finally {
    isLoading.value = false
  }
}
```

### 输入验证
```typescript
// ✅ 表单验证
function validateForm() {
  if (!formData.value.name.trim()) {
    alert('请输入名称', { type: 'warning' })
    return false
  }
  
  if (formData.value.email && !isValidEmail(formData.value.email)) {
    alert('请输入有效的邮箱地址', { type: 'warning' })
    return false
  }
  
  return true
}
```

## 🎉 最佳实践总结

### 组件设计检查清单
- [ ] 组件职责单一明确
- [ ] 接口设计合理，支持多种使用场景
- [ ] TypeScript类型定义完整
- [ ] Props默认值设置正确
- [ ] Emits事件命名清晰
- [ ] 响应式数据使用恰当
- [ ] 计算属性优化合理
- [ ] 样式使用scoped避免污染
- [ ] 错误处理完善
- [ ] 性能优化到位

### 代码质量检查
- [ ] 无TypeScript错误
- [ ] 无ESLint警告
- [ ] 组件可复用性强
- [ ] 代码注释清晰
- [ ] 测试覆盖充分
- [ ] 文档更新及时

**遵循此规范，确保Vue组件的高质量和可维护性！** 🚀
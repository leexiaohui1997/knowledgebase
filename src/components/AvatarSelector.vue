<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  modelValue: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

// 可选的图标选项
const avatarOptions = [
  '📚', '📖', '📝', '📔', '📕', '📗', 
  '📘', '📙', '📓', '🗂️', '📂', '📁', 
  '💼', '🎯', '⚡', '🔥', '💡', '🚀', 
  '🌟', '✨'
]

// 当前选中的图标
const selectedAvatar = computed({
  get: () => props.modelValue,
  set: (value: string) => emit('update:modelValue', value)
})

// 选择图标
function selectAvatar(emoji: string) {
  selectedAvatar.value = emoji
}
</script>

<template>
  <div class="avatar-selector">
    <div
      v-for="emoji in avatarOptions"
      :key="emoji"
      :class="['avatar-option', { active: selectedAvatar === emoji }]"
      @click="selectAvatar(emoji)"
    >
      {{ emoji }}
    </div>
  </div>
</template>

<style scoped>
.avatar-selector {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
  max-width: 100%;
  box-sizing: border-box;
  padding: 4px;
}

.avatar-option {
  font-size: 16px;
  padding: 6px;
  text-align: center;
  cursor: pointer;
  border-radius: 6px;
  border: 2px solid transparent;
  transition: all 0.2s ease;
  background-color: white;
  min-height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-option:hover {
  background-color: #f0f0f0;
  transform: scale(1.05);
}

.avatar-option.active {
  background-color: #e6f7ef;
  border-color: #42b883;
  transform: scale(1.1);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .avatar-selector {
    grid-template-columns: repeat(4, 1fr);
    gap: 4px;
  }
  
  .avatar-option {
    font-size: 14px;
    padding: 4px;
    min-height: 28px;
  }
}
</style>

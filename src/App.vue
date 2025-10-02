<script setup lang="ts">
import { RouterView } from 'vue-router'
import CustomAlert from '@/components/CustomAlert.vue'
</script>

<template>
  <div id="app">
    <RouterView />
    <!-- 全局 Alert 组件 -->
    <CustomAlert />
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif;
  color: #333;
  background-color: #f5f5f5;
}
</style>

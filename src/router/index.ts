import { createRouter, createWebHashHistory } from 'vue-router'
import KnowledgeBaseList from '@/views/KnowledgeBaseList.vue'
import KnowledgeBaseDetail from '@/views/KnowledgeBaseDetail.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: KnowledgeBaseList
    },
    {
      path: '/knowledge-base/:id',
      name: 'knowledge-base-detail',
      component: KnowledgeBaseDetail
    }
  ]
})

export default router


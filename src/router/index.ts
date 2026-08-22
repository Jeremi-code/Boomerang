import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/lost',
      name: 'lost',
      component: () => import('../views/LostReportView.vue')
    },
    {
      path: '/found',
      name: 'found',
      component: () => import('../views/FoundReportView.vue')
    },
    {
      path: '/matches',
      name: 'matches',
      component: () => import('../views/MatchesView.vue')
    }
  ]
})

export default router
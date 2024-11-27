import { createRouter, createWebHistory } from 'vue-router'
import GaussianSplatViewer from '../views/GaussianSplatView.vue';

import ContactMe from '../views/ContactMeView.vue';


const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
    },
    {
      path: '/splats',
      name: 'splats',
      component: GaussianSplatViewer
    },
    {
      path: '/contactme',
      name: 'contactme',
      component: ContactMe
    }
  ]
})

export default router

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
      path: '/projects',
      name: 'projects'
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
    // {
    //   path: '/opensource',
    //   name: 'opensource',
    //   // route level code-splitting
    //   // this generates a separate chunk (About.[hash].js) for this route
    //   // which is lazy-loaded when the route is visited.
    //   // component: () => import('../views/AboutView.vue')
    // }
  ]
})

export default router

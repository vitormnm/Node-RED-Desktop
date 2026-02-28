import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/projects'
  },
  {
    path: '/',
    component: () => import('../layouts/DefaultLayout.vue'),
    children: [
      { path: 'projects', name: 'projects', meta: { title: "Projects" }, component: () => import('../pages/Projects.vue') },
      { path: 'settings', name: 'settings', meta: { title: "Settings" }, component: () => import('../pages/Settings.vue') },
      { path: 'tab3', name: 'tab3', meta: { title: "Tab 3" }, component: () => import('../pages/Tab3.vue') },
    ]
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

// ⭐ AQUI: troca o título!
router.beforeEach((to, from, next) => {
 

  if (to.meta && to.meta.title) {
    document.title = `${to.meta.title}`
  } else {
    document.title = baseTitle
  }

  next()
})

export default router

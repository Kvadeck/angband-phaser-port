import { createRouter, createWebHistory } from 'vue-router'
import DevShell from './layouts/DevShell.vue'
import ParityBoardView from './views/ParityBoardView.vue'
import SandboxView from './views/SandboxView.vue'
import TestsView from './views/TestsView.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/dev/parity' },
    {
      path: '/dev',
      component: DevShell,
      children: [
        { path: '', redirect: { name: 'dev-parity' } },
        { path: 'parity', name: 'dev-parity', component: ParityBoardView },
        { path: 'sandbox', name: 'dev-sandbox', component: SandboxView },
        { path: 'tests', name: 'dev-tests', component: TestsView },
      ],
    },
  ],
})

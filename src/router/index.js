import { createRouter, createWebHistory } from 'vue-router';
import ShowModel from '../components/ShowModel.vue';

const router = createRouter({
  history: createWebHistory('/panorama/'),
  routes: [
    {
      path: '/',
      name: 'home',
      component: ShowModel
    }
  ]
});

export default router
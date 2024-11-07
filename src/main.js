import { createApp } from 'vue';
import App from './App.vue';
import { createRouter, createWebHistory } from 'vue-router'; // Importar Vue Router
import routes from './router.js'; // Importar las rutas configuradas
import './assets/main.css'

// Crear el enrutador
const router = createRouter({
  history: createWebHistory(),
  routes, // Pasar las rutas
});

createApp(App)
  .use(router)  // Usar Vue Router
  .mount('#app');
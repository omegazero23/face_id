import { createApp } from 'vue';
import App from './App.vue';
import router from './router'; // Importar el enrutador completo
import './assets/main.css';

createApp(App)
  .use(router) // Usar el enrutador
  .mount('#app');

// Importa las vistas
import FileUploadPage from '@/views/FileUploadPage.vue';
import OtherPage from '@/views/OtherPage.vue';
import BiometricVerifications from './views/BiometricVerifications.vue';

const routes = [
  { path: '/', component: FileUploadPage },
  { path: '/other', component: OtherPage },
  {path: '/verificacionBiometrica', component: BiometricVerifications},
  // Nueva ruta
];

export default routes;
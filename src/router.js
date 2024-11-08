import { createRouter, createWebHistory } from 'vue-router';
import { jwtDecode } from 'jwt-decode'; // Importa jwtDecode como una exportación nombrada
import Cookies from 'js-cookie';
import FileUploadPage from './views/FileUploadPage.vue';
import LoginPage from './views/LoginPage.vue';
import ErrorPage from './views/ErrorPage.vue';
import BiometricVerifications from './views/BiometricVerifications.vue'; // Asegúrate de que la ruta de importación es correcta

const routes = [
  {
    path: '/',
    name: '/FileUploadPage',
    component: FileUploadPage,
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginPage
  },
  {
    path: '/error',
    name: 'Error',
    component: ErrorPage
  },
  {
    path: '/verificacion-biometrica/:path',
    name: 'VerificacionBiometrica',
    component: BiometricVerifications,
  }
];

// Crear el enrutador
const router = createRouter({
  history: createWebHistory(),
  routes
});

// Guard de navegación para verificar el token
router.beforeEach((to, from, next) => {
  // Verifica si la ruta necesita autenticación
  if (to.matched.some(record => record.meta.requiresAuth)) {
    const storedToken = Cookies.get('jwt'); // Obtén el token desde las cookies
    const isAuthenticated = storedToken && jwtDecode(storedToken).exp * 1000 > Date.now();

    if (!isAuthenticated) {
      next({ path: '/error' }); // Redirige si no hay token válido
    } else {
      next(); // Permite la navegación si el token es válido
    }
  } else {
    next(); // Permite la navegación si la ruta no necesita autenticación
  }
});

export default router;
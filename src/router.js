import { createRouter, createWebHistory } from 'vue-router';
import { jwtDecode } from 'jwt-decode';
import Cookies from 'js-cookie';
import FileUploadPage from './views/FileUploadPage.vue';
import LoginPage from './views/LoginPage.vue';
import ErrorPage from './views/ErrorPage.vue';
import BiometricVerifications from './views/BiometricVerifications.vue';
import verify_liveness from './views/verify_liveness.vue';
import SuccessProcess from './views/SuccessProcess.vue';
import PendingApproval from './views/PendingApproval.vue';
import NotFound from './views/NotFound.vue';


const routes = [
  {
    path: '/',
    name: 'FileUploadPage',
    component: FileUploadPage,
    meta: { requiresAuth: true }
  },
  {
    path: '/register/:jwt',
    name: 'Register',
    component: LoginPage
  },
  {
    path: '/error',
    name: 'Error',
    component: ErrorPage,

  },
  {
    path: '/verificacion-biometrica',
    name: 'VerificacionBiometrica',
    component: BiometricVerifications,
    meta: { requiresAuth: true }

  },
  {
    path: '/verify_liveness',
    name: 'verify_liveness',
    component: verify_liveness,
    meta: { requiresAuth: true }
  },
  {
    path: '/success',
    name: 'SuccessProcess',
    component: SuccessProcess,
    
  },
  {
    path: '/outstanding',
    name: 'Outstanding',
    component: PendingApproval
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFound
  }


];

const router = createRouter({
  history: createWebHistory(),
  routes
});

const isTokenValid = (token) => {
  if (!token) return false;
  try {
    const decodedToken = jwtDecode(token);
    return decodedToken.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

router.beforeEach((to, from, next) => {
  const token = Cookies.get('token');

  // Si la ruta requiere autenticación
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!isTokenValid(token)) {
      next({ path: '/error' });
      return;
    }
  }

  // Si va a register y ya tiene token válido
  if (to.name === 'Register' && isTokenValid(token)) {
    next({ path: '/' });
    return;
  }

  next();
});

export default router;
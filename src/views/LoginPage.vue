<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-4">
    <div class="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
      <!-- Loading State -->
      <div v-if="loading" class="flex flex-col items-center">
        <div class="flex justify-center mb-6">
          <div class="relative">
            <div class="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
            <LockIcon
              class="w-8 h-8 text-blue-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
        </div>

        <h1 class="text-2xl font-semibold text-gray-900 mb-2">
          Verificando Acceso
        </h1>

        <p class="text-gray-600 mb-4">
          Estamos verificando tu token de acceso. Por favor, espera un momento.
        </p>

        <div class="bg-blue-50 border-l-4 border-blue-400 p-4 text-left">
          <p class="text-blue-700">
            Este proceso puede tardar unos segundos. Gracias por tu paciencia.
          </p>
        </div>
      </div>

      <!-- Error State -->
      <div v-if="error" class="text-center">
        <div class="mb-6">
          <XCircleIcon class="w-16 h-16 text-red-500 mx-auto" />
        </div>
        <h1 class="text-2xl font-semibold text-gray-900 mb-2">
          Error de Verificación
        </h1>
        <p class="text-gray-600 mb-4">
          {{ error }}
        </p>
        <button @click="retryValidation"
          class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
          Intentar nuevamente
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { LockIcon, XCircleIcon } from 'lucide-vue-next';

export default {
  name: 'RegisterPage',

  components: {
    LockIcon,
    XCircleIcon
  },

  setup() {
    const router = useRouter();
    const loading = ref(true);
    const error = ref(null);

    const validateToken = async (token) => {

      try {

        const response = await fetch(
          `${process.env.VUE_APP_LOGIN}${token}`,
          {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        console.log('Status:', response.status);
        console.log('Headers:', Object.fromEntries(response.headers));
        const data = await response.json();



        console.log('Datos recibidos:', data);
        console.log('Status:', data.status);
        console.log(data.status === 'success');
        

        // Si la validación es exitosa, redirigir a la página principal
        if (data.status === 'success') {
          console.log('111111:');

          router.push('/');
          console.log('222222:');

        } else {
          throw new Error('Error validando el token');
        }

      } catch (err) {
        console.error('Error en validación:', err);
        error.value = 'No se pudo validar tu acceso. Por favor, intenta nuevamente.';
        loading.value = false;
      }
    };

    const retryValidation = () => {
      loading.value = true;
      error.value = null;
      const token = router.currentRoute.value.params.jwt;
      validateToken(token);
    };

    onMounted(() => {
      const token = router.currentRoute.value.params.jwt;
      if (!token) {
        error.value = 'Token no proporcionado';
        loading.value = false;
        return;
      }
      validateToken(token);
    });

    return {
      loading,
      error,
      retryValidation
    };
  }
};
</script>

<style scoped>
@keyframes pulse {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>

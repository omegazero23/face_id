  <template>
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div class="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
        <div class="flex justify-center mb-6">
          <div class="relative">
            <div class="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
            <LockIcon class="w-8 h-8 text-blue-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
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
    </div>
  </template>

<script setup>
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Cookies from 'js-cookie';
import { LockIcon } from 'lucide-vue-next';

const router = useRouter();
const route = useRoute();

// Función para verificar el JWT
const verifyJWT = async (jwt) => {
  try {
    const response = await fetch(`/login/${jwt}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      mode: 'cors'
    });

    if (response.ok) {
      const data = await response.json(); // Suponiendo que la respuesta es un JSON
      if (data.valid) {
        Cookies.set('jwt', jwt, { expires: 7 }); // Configura la cookie con el JWT
        router.push('/'); // Redirigir a la página principal
      } else {
        console.error('Token no válido:', data);
        router.push('/error'); // Redirigir al error si no es válido
      }
    } else {
      console.error('Error en la respuesta del servidor:', response.statusText);
      router.push('/error'); // Redirigir al error en caso de fallo en la petición
    }
  } catch (error) {
    console.error('Error al verificar el JWT:', error);
    router.push('/error'); // Redirigir al error en caso de fallo en la petición
  }
};

// Obtener el JWT del path
onMounted(() => {
  const jwt = route.params.jwt;
  if (jwt) {
    verifyJWT(jwt);
  } else {
    setTimeout(() => {
      router.push('/error'); // Redirigir al error si no hay JWT en el path
    }, 3000);
  }
});
</script>


  <style scoped>
  @keyframes pulse {
    0%, 100% {
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
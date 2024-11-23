<template>
  <div class="min-h-screen bg-gray-100 flex items-center justify-center p-4">
    <div class="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
      <!-- Loading Overlay -->
      <transition name="fade">
        <div v-if="isLoading" class="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg z-10">
          <div class="text-center">
            <div class="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black mb-4"></div>
            <p class="text-gray-700 font-semibold">Procesando...</p>
          </div>
        </div>
      </transition>

      <!-- Botón Regresar -->
      <transition name="fade">
        <button 
          v-if="currentView !== 'main'"
          @click="goBack" 
          class="mb-4 flex items-center text-gray-600 hover:text-gray-800 transition-colors duration-200"
        >
          <ArrowLeftIcon class="h-5 w-5 mr-1" />
          Regresar
        </button>
      </transition>

      <!-- Logo -->
      <img 
        src="@/assets/logo_trans.png" 
        alt="SoftCrédito Logo" 
        class="w-64 mx-auto mb-6"
      />

      <h2 class="text-2xl font-bold text-center mb-6">
        {{ currentView === 'main' ? 'Subir INE o Pasaporte' : currentView === 'ine' ? 'Subir INE' : 'Subir Pasaporte' }}
      </h2>

      <!-- Vista Principal -->
      <transition name="fade" mode="out-in">
        <div v-if="currentView === 'main'" class="space-y-4">
          <button
            @click="currentView = 'ine'"
            class="w-full bg-black text-white rounded-md py-3 px-4 hover:bg-gray-800 transition-colors duration-200"
          >
            Subir INE
          </button>
          <button
            @click="currentView = 'passport'"
            class="w-full bg-black text-white rounded-md py-3 px-4 hover:bg-gray-800 transition-colors duration-200"
          >
            Subir Pasaporte
          </button>
        </div>

        <!-- Vista INE -->
        <div v-else-if="currentView === 'ine'" class="space-y-6">
          <!-- INE Frente -->
          <div>
            <h3 class="text-lg font-medium mb-2">INE Frente</h3>
            <div 
              class="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-gray-400 transition-colors duration-200"
              @click="triggerFileInput('ineFront')"
            >
              <input
                type="file"
                ref="ineFrontInput"
                class="hidden"
                @change="handleFileSelect('ineFront', $event)"
                accept="image/*"
              />
              <UploadIcon v-if="!ineFrontFile" class="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <img v-else :src="ineFrontPreview" alt="INE Frente Preview" class="max-h-40 mx-auto mb-2" />
              <p class="text-gray-500">
                {{ ineFrontFile ? ineFrontFile.name : 'Elige archivo para INE Frente' }}
              </p>
            </div>
          </div>

          <!-- INE Reverso -->
          <div>
            <h3 class="text-lg font-medium mb-2">INE Reverso</h3>
            <div 
              class="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-gray-400 transition-colors duration-200"
              @click="triggerFileInput('ineBack')"
            >
              <input
                type="file"
                ref="ineBackInput"
                class="hidden"
                @change="handleFileSelect('ineBack', $event)"
                accept="image/*"
              />
              <UploadIcon v-if="!ineBackFile" class="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <img v-else :src="ineBackPreview" alt="INE Reverso Preview" class="max-h-40 mx-auto mb-2" />
              <p class="text-gray-500">
                {{ ineBackFile ? ineBackFile.name : 'Elige archivo para INE Reverso' }}
              </p>
            </div>
          </div>

          <!-- Botón Subir INE -->
          <button
            @click="uploadINE"
            class="w-full bg-black text-white rounded-md py-3 px-4 hover:bg-gray-800 transition-colors duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="!ineFrontFile || !ineBackFile || isLoading"
          >
            <UploadIcon class="h-5 w-5 mr-2" />
            Subir INE (Frente y Reverso)
          </button>
        </div>

        <!-- Vista Pasaporte -->
        <div v-else-if="currentView === 'passport'" class="space-y-6">
          <!-- Pasaporte -->
          <div>
            <h3 class="text-lg font-medium mb-2">Pasaporte</h3>
            <div 
              class="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-gray-400 transition-colors duration-200"
              @click="triggerFileInput('passport')"
            >
              <input
                type="file"
                ref="passportInput"
                class="hidden"
                @change="handleFileSelect('passport', $event)"
                accept="image/*"
              />
              <UploadIcon v-if="!passportFile" class="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <img v-else :src="passportPreview" alt="Pasaporte Preview" class="max-h-40 mx-auto mb-2" />
              <p class="text-gray-500">
                {{ passportFile ? passportFile.name : 'Elige archivo para Pasaporte' }}
              </p>
            </div>
          </div>

          <!-- Botón Subir Pasaporte -->
          <button
            @click="uploadPassport"
            class="w-full bg-black text-white rounded-md py-3 px-4 hover:bg-gray-800 transition-colors duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="!passportFile || isLoading"
          >
            <UploadIcon class="h-5 w-5 mr-2" />
            Subir Pasaporte
          </button>
        </div>
      </transition>

      <!-- Error Message -->
      <transition name="fade">
        <div v-if="errorMessage" class="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded relative" role="alert">
          <strong class="font-bold">Error:</strong>
          <span class="block sm:inline">{{ errorMessage }}</span>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ArrowLeftIcon, UploadIcon } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import Cookies from 'js-cookie'
import Swal from 'sweetalert2'

const currentView = ref('main')
const ineFrontFile = ref(null)
const ineBackFile = ref(null)
const passportFile = ref(null)
const ineFrontPreview = ref('')
const ineBackPreview = ref('')
const passportPreview = ref('')
const errorMessage = ref('')
const isLoading = ref(false)

const ineFrontInput = ref(null)
const ineBackInput = ref(null)
const passportInput = ref(null)

const router = useRouter()
const token = Cookies.get('token')

onMounted(async () => {
  try {
    console.log('VUE_APP_STAGE:', process.env.VUE_APP_STAGE);

    
    const response = await fetch(process.env.VUE_APP_STAGE, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json', // Asegúrate de que el servidor espera JSON
        'Accept': 'application/json',
        'ngrok-skip-browser-warning': 'true'

      },
      mode: 'cors'
    })

    console.log('Response status:', response.status);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.body}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const errorText = await response.text(); // Obtener el texto del cuerpo de la respuesta
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);

    }


    if (response.ok) {
      const stage = await response.json()
      console.log('Stage:', stage)

      const routes = {
        PROCESS_AND_VALIDATE_DOC: '/',
        VALIDATE_IDENTITY: '/verificacion-biometrica',
        VERIFY_LIVENESS: '/verify_liveness',
        COMPLETED: '/success',
      }

      const expectedRoute = routes[stage.stage]
      if (expectedRoute && expectedRoute !== router.currentRoute.value.path) {
        router.push(expectedRoute)
        return
      } else {
        console.log("El stage actual coincide con la ruta, no se hace redirección.")
      }
    }

    Swal.fire({
      title: 'Instrucciones para subir INE o Pasaporte',
      html: `
        <ul style="text-align: left;">
          <li>Asegúrate de que el documento esté bien iluminado.</li>
          <li>Evita reflejos o sombras en el documento.</li>
          <li>Asegúrate de que todo el documento sea visible y legible.</li>
          <li>No cubras ninguna parte del documento con tus dedos.</li>
          <li>Sube una imagen en formato JPG o PNG.</li>
          <li>El tamaño del archivo no debe exceder los 5MB.</li>
        </ul>
      `,
      icon: 'info',
      confirmButtonText: 'Aceptar'
    })
  } catch (error) {
    console.error('Error checking stage:', error)
  }
})

const goBack = () => {
  currentView.value = 'main'
  ineFrontFile.value = null
  ineBackFile.value = null
  passportFile.value = null
  ineFrontPreview.value = ''
  ineBackPreview.value = ''
  passportPreview.value = ''
  errorMessage.value = ''
}

const triggerFileInput = (type) => {
  if (type === 'ineFront') ineFrontInput.value.click()
  else if (type === 'ineBack') ineBackInput.value.click()
  else if (type === 'passport') passportInput.value.click()
}

const handleFileSelect = (type, event) => {
  const file = event.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      if (type === 'ineFront') {
        ineFrontFile.value = file
        ineFrontPreview.value = e.target.result
      } else if (type === 'ineBack') {
        ineBackFile.value = file
        ineBackPreview.value = e.target.result
      } else if (type === 'passport') {
        passportFile.value = file
        passportPreview.value = e.target.result
      }
    }
    reader.readAsDataURL(file)
  }
}

const uploadINE = async () => {
  if (!ineFrontFile.value || !ineBackFile.value) return
  isLoading.value = true
  errorMessage.value = ''

  try {
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject)
    })

    const formData = new FormData()
    formData.append('ineFront', ineFrontFile.value)
    formData.append('ineBack', ineBackFile.value)
    formData.append('latitude', position.coords.latitude)
    formData.append('longitude', position.coords.longitude)

    console.log('Coordenadas:', position.coords.latitude, position.coords.longitude)

    const response = await fetch(process.env.VUE_APP_INE, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${token}`,
        'ngrok-skip-browser-warning': 'true'

      },
    })

    if (!response.ok) {
      throw new Error('Error al subir los archivos de INE')
    }

    const result = await response.json()
    console.log('Archivos de INE subidos exitosamente:', result)
    router.push('/verificacion-biometrica')
  } catch (error) {
    console.error('Error:', error)
    errorMessage.value = error.message
  } finally {
    isLoading.value = false
  }
}

const uploadPassport = async () => {
  if (!passportFile.value) return
  isLoading.value = true
  errorMessage.value = ''

  try {
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject)
    })

    const formData = new FormData()
    formData.append('passport', passportFile.value)
    formData.append('latitude', position.coords.latitude)
    formData.append('longitude', position.coords.longitude)

    console.log('Coordenadas:', position.coords.latitude, position.coords.longitude)

    const response = await fetch(process.env.VUE_APP_PASSPORT, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error('Error al subir el archivo de Pasaporte')
    }

    const result = await response.json()
    console.log('Archivo de Pasaporte subido exitosamente:', result)
    router.push('/verificacion-biometrica')
  } catch (error) {
    console.error('Error:', error)
    errorMessage.value = error.message
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
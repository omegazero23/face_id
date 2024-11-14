<template>
    <div class="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div class="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
        <!-- Botón Regresar (solo visible cuando no estamos en el menú principal) -->
        <button 
          v-if="currentView !== 'main'"
          @click="goBack" 
          class="mb-4 flex items-center text-gray-600 hover:text-gray-800"
        >
          <ArrowLeftIcon class="h-5 w-5 mr-1" />
          Regresar
        </button>
  
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
        <div v-if="currentView === 'main'" class="space-y-4">
          <button
            @click="currentView = 'ine'"
            class="w-full bg-black text-white rounded-md py-3 px-4 hover:bg-gray-800 transition-colors"
          >
            Subir INE
          </button>
          <button
            @click="currentView = 'passport'"
            class="w-full bg-black text-white rounded-md py-3 px-4 hover:bg-gray-800 transition-colors"
          >
            Subir Pasaporte
          </button>
        </div>
  
        <!-- Vista INE -->
        <div v-if="currentView === 'ine'" class="space-y-6">
          <!-- INE Frente -->
          <div>
            <h3 class="text-lg font-medium mb-2">INE Frente</h3>
            <div 
              class="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-gray-400"
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
              class="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-gray-400"
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
            class="w-full bg-black text-white rounded-md py-3 px-4 hover:bg-gray-800 transition-colors flex items-center justify-center"
            :disabled="!ineFrontFile || !ineBackFile"
          >
            <UploadIcon class="h-5 w-5 mr-2" />
            Subir INE (Frente y Reverso)
          </button>
        </div>
  
        <!-- Vista Pasaporte -->
        <div v-if="currentView === 'passport'" class="space-y-6">
          <!-- Pasaporte Frente -->
          <div>
            <h3 class="text-lg font-medium mb-2">Pasaporte</h3>
            <div 
              class="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-gray-400"
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
            class="w-full bg-black text-white rounded-md py-3 px-4 hover:bg-gray-800 transition-colors flex items-center justify-center"
            :disabled="!passportFile"
          >
            <UploadIcon class="h-5 w-5 mr-2" />
            Subir Pasaporte
          </button>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  import { ArrowLeftIcon, UploadIcon } from 'lucide-vue-next'
  import { useRouter } from 'vue-router'; // Importar useRouter
  import Cookie from 'js-cookie';

  const currentView = ref('main')
  const ineFrontFile = ref(null)
  const ineBackFile = ref(null)
  const passportFile = ref(null)
  const ineFrontInput = ref(null)
  const ineBackInput = ref(null)
  const passportInput = ref(null)
  const router = useRouter(); // Definir router usando useRouter

  const ineFrontPreview = ref('')
  const ineBackPreview = ref('')
  const passportPreview = ref('')
  
  const goBack = () => {
    currentView.value = 'main'
    ineFrontFile.value = null
    ineBackFile.value = null
    passportFile.value = null
    ineFrontPreview.value = ''
    ineBackPreview.value = ''
    passportPreview.value = ''
  }
  
  const triggerFileInput = (type) => {
    if (type === 'ineFront') {
      ineFrontInput.value.click()
    } else if (type === 'ineBack') {
      ineBackInput.value.click()
    } else if (type === 'passport') {
      passportInput.value.click()
    }
  }
  
  const handleFileSelect = (type, event) => {
    const file = event.target.files[0]
    if (file) {
      if (type === 'ineFront') {
        ineFrontFile.value = file
        createPreview(file, 'ineFront')
      } else if (type === 'ineBack') {
        ineBackFile.value = file
        createPreview(file, 'ineBack')
      } else if (type === 'passport') {
        passportFile.value = file
        createPreview(file, 'passport')
      }
    }
  }
  
  const createPreview = (file, type) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      if (type === 'ineFront') {
        ineFrontPreview.value = e.target.result
      } else if (type === 'ineBack') {
        ineBackPreview.value = e.target.result
      } else if (type === 'passport') {
        passportPreview.value = e.target.result
      }
    }
    reader.readAsDataURL(file)
  }
  const uploadINE = async () => {
  if (!ineFrontFile.value || !ineBackFile.value) return;

  const formData = new FormData();
  formData.append('ineFront', ineFrontFile.value);
  formData.append('ineBack', ineBackFile.value);
  
  // Obtener el token desde la cookie
  const token = Cookie.get('token'); 
  console.log('Token:', token);
  
  try {
    // Obtener coordenadas de geolocalización
    navigator.geolocation.getCurrentPosition(async (position) => {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;

      // Añadir coordenadas al FormData
      formData.append('latitude', latitude);
      formData.append('longitude', longitude);
      console.log('Coordenadas:', latitude, longitude);
      
      // Hacer la petición
      const response = await fetch(process.env.VUE_APP_INE, {
        method: 'POST',
        body: formData,
        mode: 'cors', // Permite CORS
        headers: {
          'Authorization': `Bearer ${token}`, // Incluir el token de autorización
        },
      });

      if (!response.ok) {
        throw new Error('Error al subir los archivos de INE');
      }

      const result = await response.json();
      console.log('Archivos de INE subidos exitosamente:', result);

      // Redirigir a otra ruta con parámetros de ruta
      router.push({
        name: 'VerificacionBiometrica', // Nombre de la ruta de redirección
        // params: {
        //   path: result.path, // Parámetro de ruta de ejemplo
        // }
      });
    }, 
    (error) => {
      console.error("Error al obtener las coordenadas:", error);
    });
  } catch (error) {
    console.error('Error al subir los archivos de INE:', error);
  }
};      
  
  const uploadPassport = async () => {
  if (!passportFile.value) return

  const formData = new FormData()
  formData.append('passport', passportFile.value)

  try {
    const response = await fetch('https://your-backend-url.com/upload', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error('Failed to upload file')
    }

    const result = await response.json()
    console.log('File uploaded successfully:', result)
  } catch (error) {
    console.error('Error uploading file:', error)
  }
}
  </script>
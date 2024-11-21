<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100">
    <div class="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
      <div class="text-center">
        <ClockIcon class="mx-auto h-16 w-16 text-yellow-500" />
        <h1 class="mt-4 text-3xl font-bold text-gray-900">Pendiente de Aprobación</h1>
      </div>
      <div class="mt-6 text-center">
        <p class="text-xl text-gray-700">Tu documento de identificación está en revisión</p>
        <p class="mt-2 text-gray-600">Te avisaremos cuando hayamos completado el proceso de validación.</p>
      </div>
      <div class="mt-8 space-y-4">
        <div class="flex items-center justify-center space-x-2 text-yellow-600">
          <AlertCircleIcon class="h-5 w-5" />
          <span class="text-sm font-medium">Este proceso puede tomar hasta 48 horas hábiles</span>
        </div>
        <button @click="showNextSteps" class="w-full px-6 py-3 bg-yellow-500 text-white font-semibold rounded-lg shadow-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-75 transition duration-300 ease-in-out">
          ¿Qué sigue?
        </button>
      </div>
      <div v-if="nextStepsVisible" class="mt-6 text-sm text-gray-600">
        <h2 class="font-semibold mb-2">Próximos pasos:</h2>
        <ul class="list-disc list-inside space-y-1">
          <li>Recibirás un correo electrónico con el resultado de la validación.</li>
          <li>Si se requiere información adicional, te contactaremos.</li>
          <li>Una vez aprobado, podrás continuar con el proceso.</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ClockIcon, AlertCircleIcon } from 'lucide-vue-next'

const nextStepsVisible = ref(false)

const showNextSteps = () => {
  nextStepsVisible.value = !nextStepsVisible.value
}
</script>

<style scoped>
/* Add any additional custom styles here if needed */
</style>
<template>
  <div class="min-h-screen bg-gray-100 flex flex-col justify-center items-center px-4 py-8">
    <div class="text-center">
      <h1 class="text-6xl font-bold text-gray-900 mb-4">404</h1>
      <h2 class="text-3xl font-semibold text-gray-700 mb-6">Página no encontrada</h2>
      <p class="text-xl text-gray-600 mb-8">Lo sentimos, la página que estás buscando no existe.</p>
      <router-link 
        to="/" 
        class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out"
      >
        <HomeIcon class="w-5 h-5 mr-2" />
        Volver al inicio
      </router-link>
    </div>
    <div class="mt-12">
      <AlertTriangleIcon class="w-24 h-24 text-yellow-500 mx-auto" />
    </div>
  </div>
</template>

<script setup>
import { HomeIcon, AlertTriangleIcon } from 'lucide-vue-next'
</script>
<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-4">
    <div class="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
      <div class="flex justify-center mb-6">
        <div class="bg-red-100 rounded-full p-4">
          <LockIcon class="w-8 h-8 text-red-400" />
        </div>
      </div>

      <h1 class="text-2xl font-semibold text-gray-900 text-center mb-2">
        Acceso Denegado
      </h1>
      
      <p class="text-gray-600 text-center mb-2">
        Error 401
      </p>

      <p class="text-gray-600 text-center mb-6">
        Lo sentimos, pero no podemos procesar tu solicitud en este momento.
      </p>

      <div class="bg-amber-50 border-l-4 border-amber-400 p-4 mb-6">
        <p class="text-amber-700 mb-2">
          Tu token ha expirado o es inválido. Esto puede ocurrir si:
        </p>
        <ul class="text-amber-700 list-disc pl-5 space-y-1">
          <li>Has utilizado un enlace antiguo</li>
          <li>El enlace ha caducado por razones de seguridad</li>
          <li>Has cerrado sesión recientemente</li>
        </ul>
      </div>

      <p class="text-gray-600 text-center text-sm">
        Si el problema persiste, por favor contacta a nuestro 
        <a href="#" class="text-blue-500 hover:text-blue-600">equipo de soporte</a>.
      </p>
    </div>
  </div>
</template>

<script setup>
import { LockIcon } from 'lucide-vue-next'
</script>
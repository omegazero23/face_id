<template>
    <div class="min-h-screen flex items-center justify-center bg-gray-100 overflow-hidden">
      <div class="bg-white rounded-lg shadow-xl p-8 max-w-md w-full relative">
        <div class="text-center">
          <svg class="mx-auto h-16 w-16 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M22 4L12 14.01l-3-3" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <h1 class="mt-4 text-3xl font-bold text-gray-900">¡Listo!</h1>
        </div>
        <div class="mt-6 text-center">
          <p class="text-xl text-gray-700">Terminaste el proceso correctamente</p>
          <p class="mt-2 text-gray-600">Lograste validar tu identidad de manera exitosa.</p>
        </div>
        <div class="mt-8 flex justify-center">
          <button @click="celebrate" class="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75 transition duration-300 ease-in-out">
            Continuar
          </button>
        </div>
      </div>
      <div v-if="showConfetti" class="confetti-container">
        <div v-for="n in 50" :key="n" class="confetti" :style="{ '--delay': `${Math.random() * 5}s`, '--x': `${Math.random() * 100}%` }"></div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  
  const showConfetti = ref(false)
  
  const celebrate = () => {
    showConfetti.value = true
    setTimeout(() => {
      showConfetti.value = false
    }, 5000) // Hide confetti after 5 seconds
  }
  </script>
  
  <style scoped>
  .confetti-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    pointer-events: none;
  }
  
  .confetti {
    position: absolute;
    width: 10px;
    height: 10px;
    background-color: #f0f;
    top: -10px;
    left: var(--x);
    opacity: 0;
    transform: translateY(0) rotate(0);
    animation: confetti 5s ease-in-out var(--delay) forwards;
  }
  
  .confetti:nth-child(4n) { background-color: #0ff; }
  .confetti:nth-child(4n+1) { background-color: #f00; }
  .confetti:nth-child(4n+2) { background-color: #0f0; }
  .confetti:nth-child(4n+3) { background-color: #00f; }
  
  @keyframes confetti {
    0% {
      opacity: 1;
      transform: translateY(0) rotate(0);
    }
    100% {
      opacity: 0;
      transform: translateY(100vh) rotate(720deg);
    }
  }
  </style>
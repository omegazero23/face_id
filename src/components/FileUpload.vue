<!-- src/components/FileUpload.vue -->
<template>
    <div class="file-upload">
      <h1>Sube tu archivo</h1>
      <input type="file" @change="handleFileUpload" />
      <button @click="uploadFile">Subir archivo</button>
    </div>
  </template>
  
  <script>
  export default {
    name: 'FileUpload',
    methods: {
      handleFileUpload(event) {
        // Lógica para manejar el archivo seleccionado
        const file = event.target.files[0];
        console.log('Archivo seleccionado:', file);
      },
      uploadFile() {
        // Lógica para subir el archivo
        console.log('Archivo subido');
      },
    },
  };
  </script>
  
  <style scoped>
  /* Estilos específicos para este componente */
  .file-upload {
    margin-top: 20px;
  }
  
  input[type="file"] {
    margin-bottom: 10px;
  }
  </style>
  
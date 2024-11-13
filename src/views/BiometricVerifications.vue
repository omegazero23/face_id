<template>
  <div class="container">
    <img src="@/assets/logo_trans.png" alt="Logo" class="logo">
    <div class="video-container" v-show="!isCapturing">
      <input type="hidden" id="ine-file" :value="ineFile">
      <video id="input-video" style="display: none;" autoplay></video>
      <canvas id="output-canvas" ref="outputCanvas"></canvas>
    </div>
    <div id="message" class="message">{{ message }}</div>
    <button id="capture-button" @click="captureImage" :disabled="!criteriaMet" :class="{ enabled: criteriaMet }">
      Estoy listo
    </button>
    <div id="preloader_1" v-show="isCapturing">
      <span v-for="i in 5" :key="i"></span>
    </div>
    <div id="captured-image-container" ref="capturedImageContainer"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { Camera } from '@mediapipe/camera_utils';
import { FaceMesh, FACEMESH_TESSELATION, FACEMESH_RIGHT_EYE, FACEMESH_RIGHT_EYEBROW, FACEMESH_RIGHT_IRIS, FACEMESH_LEFT_EYE, FACEMESH_LEFT_EYEBROW, FACEMESH_LEFT_IRIS, FACEMESH_FACE_OVAL, FACEMESH_LIPS } from '@mediapipe/face_mesh';
import { drawConnectors } from '@mediapipe/drawing_utils';
import Swal from 'sweetalert2';
import { useRoute } from 'vue-router';
import Cookie from 'js-cookie';

const outputCanvas = ref(null);
const capturedImageContainer = ref(null);
const message = ref('Ajusta tu posición para centrar tu rostro.');
const criteriaMet = ref(false);
const isCapturing = ref(false);
const lastImageData = ref(null);
const ineFile = ref('');
const route = useRoute(); // Usar useRoute para obtener el parámetro de ruta

let videoElement, canvasCtx, faceMesh, camera;

onMounted(() => {
  videoElement = document.getElementById('input-video');
  canvasCtx = outputCanvas.value.getContext('2d');

  const videoWidth = window.innerWidth < 768 ? window.innerWidth : 640;
  const videoHeight = window.innerWidth > 768 ? (videoWidth * 3) / 4 : (videoWidth * 4) / 4;
  outputCanvas.value.width = videoWidth;
  outputCanvas.value.height = videoHeight;

  setupFaceMesh();
  setupCamera();

  window.addEventListener('resize', handleResize);

  Swal.fire({
    title: 'Reglas para la Verificación Biométrica',
    html: `
        <ul style="text-align: left;">
          <li>Asegúrate de que tu rostro esté bien iluminado.</li>
          <li>Evita usar gafas o sombreros.</li>
          <li>Mantén una expresión neutral.</li>
          <li>Coloca tu rostro dentro del óvalo en la pantalla.</li>
          <li>No te muevas mientras se captura la imagen.</li>
        </ul>
      `,
    icon: 'info',
    confirmButtonText: 'Aceptar'
  });
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  if (camera) {
    camera.stop();
  }
});

function handleResize() {
  const isMobile = window.innerWidth < 768;
  const newWidth = isMobile ? window.innerWidth : 640;
  const newHeight = (newWidth * 3) / 4;
  outputCanvas.value.width = newWidth;
  outputCanvas.value.height = newHeight;
}

function setupFaceMesh() {
  faceMesh = new FaceMesh({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
  });

  faceMesh.setOptions({
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
  });

  faceMesh.onResults(onResults);
}

function setupCamera() {
  camera = new Camera(videoElement, {
    onFrame: async () => {
      await faceMesh.send({ image: videoElement });
    },
    width: outputCanvas.value.width,
    height: outputCanvas.value.height
  });

  camera.start();
}

function onResults(results) {
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, outputCanvas.value.width, outputCanvas.value.height);

  canvasCtx.drawImage(results.image, 0, 0, outputCanvas.value.width, outputCanvas.value.height);

  lastImageData.value = canvasCtx.getImageData(0, 0, outputCanvas.value.width, outputCanvas.value.height);

  canvasCtx.fillStyle = 'rgba(0, 0, 0, 0.75)';
  canvasCtx.fillRect(0, 0, outputCanvas.value.width, outputCanvas.value.height);

  const ovalWidth = outputCanvas.value.width * 0.4;
  const ovalHeight = outputCanvas.value.height * 0.7;
  const centerX = outputCanvas.value.width / 2;
  const centerY = outputCanvas.value.height / 2;

  canvasCtx.beginPath();
  canvasCtx.ellipse(centerX, centerY, ovalWidth / 2, ovalHeight / 2, 0, 0, 2 * Math.PI);
  canvasCtx.clip();

  canvasCtx.drawImage(results.image, 0, 0, outputCanvas.value.width, outputCanvas.value.height);

  canvasCtx.restore();

  canvasCtx.strokeStyle = 'white';
  canvasCtx.lineWidth = 2;
  canvasCtx.beginPath();
  canvasCtx.ellipse(centerX, centerY, ovalWidth / 2, ovalHeight / 2, 0, 0, 2 * Math.PI);
  canvasCtx.stroke();

  if (results.multiFaceLandmarks) {
    for (const landmarks of results.multiFaceLandmarks) {
      drawConnectors(canvasCtx, landmarks, FACEMESH_TESSELATION, { color: '#C0C0C070', lineWidth: 0.5 });
      drawConnectors(canvasCtx, landmarks, FACEMESH_RIGHT_EYE, { color: '#FFFFFF', lineWidth: 0.5 });
      drawConnectors(canvasCtx, landmarks, FACEMESH_RIGHT_EYEBROW, { color: '#FFFFFF', lineWidth: 0.5 });
      drawConnectors(canvasCtx, landmarks, FACEMESH_RIGHT_IRIS, { color: '#FFFFFF', lineWidth: 0.5 });
      drawConnectors(canvasCtx, landmarks, FACEMESH_LEFT_EYE, { color: '#FFFFFF', lineWidth: 0.5 });
      drawConnectors(canvasCtx, landmarks, FACEMESH_LEFT_EYEBROW, { color: '#FFFFFF', lineWidth: 0.5 });
      drawConnectors(canvasCtx, landmarks, FACEMESH_LEFT_IRIS, { color: '#FFFFFF', lineWidth: 0.5 });
      drawConnectors(canvasCtx, landmarks, FACEMESH_FACE_OVAL, { color: '#E0E0E0', lineWidth: 0.5 });
      drawConnectors(canvasCtx, landmarks, FACEMESH_LIPS, { color: '#E0E0E0', lineWidth: 0.5 });

      criteriaMet.value = validateFacePositionAndQuality(landmarks);
    }
  } else {
    message.value = "No se detectó ningún rostro. Ajusta tu posición.";
    criteriaMet.value = false;
    console.log("No se detectó ningún rostro");
  }
}

function validateFacePositionAndQuality(landmarks) {
  const pixelLandmarks = landmarks.map(landmark => ({
    x: landmark.x * outputCanvas.value.width,
    y: landmark.y * outputCanvas.value.height,
    z: landmark.z
  }));

  const brightnessCheck = checkBrightness(outputCanvas.value, landmarks);
  if (!brightnessCheck.isOptimal) {
    message.value = brightnessCheck.message;
    console.log("Problema de iluminación:", brightnessCheck.message);
    return false;
  }

  const faceWidth = Math.abs(pixelLandmarks[234].x - pixelLandmarks[454].x);
  const faceHeight = Math.abs(pixelLandmarks[10].y - pixelLandmarks[152].y);

  const isMobile = window.innerWidth < 768;
  const minFaceSize = isMobile ? Math.min(outputCanvas.value.width, outputCanvas.value.height) * 0.30 : Math.min(outputCanvas.value.width, outputCanvas.value.height) * 0.45;
  const maxFaceSize = isMobile ? Math.min(outputCanvas.value.width, outputCanvas.value.height) * 0.60 : Math.min(outputCanvas.value.width, outputCanvas.value.height) * 0.65;

  if (faceWidth < minFaceSize || faceHeight < minFaceSize) {
    message.value = "Acércate más a la cámara.";
    console.log("La cara está muy lejos");
    return false;
  } else if (faceWidth > maxFaceSize || faceHeight > maxFaceSize) {
    message.value = "Aléjate un poco de la cámara.";
    console.log("La cara está muy cerca");
    return false;
  }

  message.value = "Posición correcta. Puedes capturar la imagen.";
  return true;
}

function checkBrightness(canvasElement, landmarks) {
  const ctx = canvasElement.getContext('2d');

  const faceContour = landmarks.filter((_, index) => FACEMESH_FACE_OVAL.includes(index));

  let minX = canvasElement.width;
  let minY = canvasElement.height;
  let maxX = 0;
  let maxY = 0;

  faceContour.forEach(point => {
    const x = point.x * canvasElement.width;
    const y = point.y * canvasElement.height;
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  });

  const margin = 10;
  minX = Math.max(0, minX - margin);
  minY = Math.max(0, minY - margin);
  maxX = Math.min(canvasElement.width, maxX + margin);
  maxY = Math.min(canvasElement.height, maxY + margin);

  const faceWidth = maxX - minX;
  const faceHeight = maxY - minY;
  const imageData = ctx.getImageData(minX, minY, faceWidth, faceHeight);
  const data = imageData.data;

  let totalBrightness = 0;
  let pixelCount = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const brightness = (0.299 * r + 0.587 * g + 0.114 * b);
    totalBrightness += brightness;
    pixelCount++;
  }

  const averageBrightness = totalBrightness / pixelCount;

  const minBrightness = 50;
  const maxBrightness = 220;

  return {
    brightness: averageBrightness,
    isOptimal: averageBrightness >= minBrightness && averageBrightness <= maxBrightness,
    message: averageBrightness < minBrightness ?
      `La iluminación es muy baja (${averageBrightness.toFixed(2)}). Busca un lugar más iluminado.` :
      averageBrightness > maxBrightness ?
        `Hay demasiada luz (${averageBrightness.toFixed(2)}). Busca un lugar con menos iluminación.` :
        `La iluminación es adecuada (${averageBrightness.toFixed(2)}).`
  };
}
async function captureImage() {
  if (criteriaMet.value && lastImageData.value) {
    isCapturing.value = true;

    // Intentar obtener la ubicación geográfica
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;

      const originalCanvas = document.createElement('canvas');
      originalCanvas.width = outputCanvas.value.width;
      originalCanvas.height = outputCanvas.value.height;
      const originalCtx = originalCanvas.getContext('2d');
      originalCtx.putImageData(lastImageData.value, 0, 0);

      originalCanvas.toBlob(async (blob) => {
        const formData = new FormData();
        formData.append('person_image', blob, 'image.jpg');
        formData.append('latitude', latitude); // Añadir latitud al formulario
        formData.append('longitude', longitude); // Añadir longitud al formulario
        const pathParam = route.params.path;
        formData.append('path_img', pathParam);
        const imgURL = URL.createObjectURL(blob);
        const imgElement = document.createElement('img');
        imgElement.src = imgURL;
        imgElement.alt = 'Imagen Capturada';
        imgElement.style.maxWidth = '100%';
        capturedImageContainer.value.appendChild(imgElement);

        for (let [key, value] of formData.entries()) {
          console.log(`${key}: ${value}`);
        }

        const token = Cookie.get('token'); 
        console.log('Token:', token);

        try {
          
          const response = await fetch('https://127.0.0.1:443/ValidateIdenty', {
            method: 'POST',
            body: formData,
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          const data = await response.json();
          if (response.status >= 400) {
            Swal.fire({
              title: 'Error',
              text: 'Vuelve a tomar la imagen siguiendo las indicaciones.',
              icon: 'error',
              confirmButtonText: 'Aceptar'
            }).then(() => {
              location.reload();
            });
            message.value = data.error;
          } else {
            Swal.fire({
              title: 'Éxito',
              text: data.message,
              icon: 'success',
              confirmButtonText: 'Aceptar'
            }).then((result) => {
              if (result.isConfirmed) {
                const filePath = encodeURIComponent(data.filePath);

                const jwt = encodeURIComponent(localStorage.getItem('jwtToken'));
                console.log(jwt);

                window.location.href = `/verify_liveness/${filePath}`;
              }
            });
            message.value = data.message;
          }
        } catch (error) {
          Swal.fire({
            title: 'Error',
            text: 'Vuelve a tomar la imagen siguiendo las indicaciones.',
            icon: 'error',
            confirmButtonText: 'Aceptar'
          }).then(() => {
            location.reload();
          });
          message.value = "Error al enviar la imagen.";
          console.error(error);
        } finally {
          isCapturing.value = false;
        }
      }, 'image/jpeg');
    }, (error) => {
      console.error('Error al obtener la ubicación:', error);
      isCapturing.value = false;
    });
  }
}
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 1rem;
  background-color: #f0f0f0;
  width: 100%;
  /* Asegura que el contenedor ocupe todo el ancho */
  max-width: 100%;
  /* Evita que el contenedor exceda el ancho de la ventana */
  box-sizing: border-box;
  /* Incluye padding en el cálculo del ancho */
  margin: 0;
  /* Elimina cualquier margen */
  overflow-x: hidden;
}

.logo {
  max-width: 200px;
  margin-bottom: 2rem;
}

canvas {
  transform: scaleX(-1);
}

.video-container {
  width: 100%;
  max-width: 640px;
  margin-bottom: 1rem;
}

.message {
  font-size: 1.2rem;
  margin-bottom: 1rem;
  text-align: center;
}

#capture-button {
  padding: 0.5rem 1rem;
  font-size: 1rem;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

#capture-button:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}

#capture-button.enabled:hover {
  background-color: #2980b9;
}

#preloader_1 {
  display: flex;
  justify-content: center;
  margin-top: 1rem;
}

#preloader_1 span {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #3498db;
  margin: 0 5px;
  animation: preloader_1 0.8s linear infinite alternate;
}

#preloader_1 span:nth-child(2) {
  animation-delay: 0.1s;
}

#preloader_1 span:nth-child(3) {
  animation-delay: 0.2s;
}

#preloader_1 span:nth-child(4) {
  animation-delay: 0.3s;
}

#preloader_1 span:nth-child(5) {
  animation-delay: 0.4s;
}

@keyframes preloader_1 {
  0% {
    transform: scale(1);
  }

  100% {
    transform: scale(0);
  }
}

#captured-image-container {
  margin-top: 1rem;
  width: 100%;
  max-width: 640px;
}
</style>
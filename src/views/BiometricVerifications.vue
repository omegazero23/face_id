<template>
  <div class="container">
    <img src="@/assets/logo_trans.png" alt="Logo" class="logo">
    <div class="video-container" v-show="!isCapturing">
      <input type="hidden" id="ine-file" :value="ineFile">
      <video id="input-video" style="display: none;" autoplay></video>
      <canvas id="output-canvas" ref="outputCanvas"></canvas>
    </div>
    <div id="message" class="message" v-show="!isCapturing">{{ message }}</div>
    <button id="capture-button" @click="captureImage" :disabled="!criteriaMet" :class="{ enabled: criteriaMet }"
      v-show="!isCapturing">
      Estoy listo
    </button>
    <div id="preloader_1" v-show="isCapturing">
      <span v-for="i in 5" :key="i"></span>
    </div>
    <div v-show="isLoading" class="loading-overlay">
      <div class="loading-content">
        <div class="spinner"></div>
        <p>Cargando...</p>
      </div>
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
//import { useRoute } from 'vue-router';
import Cookie from 'js-cookie';
import { useRouter } from 'vue-router';

const outputCanvas = ref(null);
const capturedImageContainer = ref(null);
const message = ref('Ajusta tu posición para centrar tu rostro.');
const criteriaMet = ref(false);
const isCapturing = ref(false);
const lastImageData = ref(null);
const ineFile = ref('');
const router = useRouter();
const isLoading = ref(false); // Estado de carga

//const route = useRoute(); // Usar useRoute para obtener el parámetro de ruta

let videoElement, canvasCtx, faceMesh, camera;

onMounted(async () => {
  const token = Cookie.get('token');

  const response = await fetch(process.env.VUE_APP_STAGE, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'ngrok-skip-browser-warning': 'true'

    },
  });

  // Imprimir el estado de la respuesta y verificar si es 200 (éxito)
  console.log('Response status:', response.status);
  console.log('Response headers:', response.headers);

  if (response.ok) { // Verifica si la respuesta es exitosa
    const stage = await response.json();
    console.log('Stage:', stage);
    console.log(stage.stage);

    // Mapeo de rutas basado en cada stage
    const routes = {
      PROCESS_AND_VALIDATE_DOC: '/',
      VALIDATE_IDENTITY: '/verificacion-biometrica',
      VERIFY_LIVENESS: '/verify_liveness',
      COMPLETED: '/success',
    };

    // Obtener la ruta actual
    const currentRoute = router.currentRoute.value.path;
    console.log('Current route:', currentRoute);

    // Redireccionar solo si la ruta actual no coincide con la ruta esperada para el stage actual
    const expectedRoute = routes[stage.stage];
    if (expectedRoute && expectedRoute !== currentRoute) {
      router.push(expectedRoute);
      return; // Salir de la función para evitar que se ejecute el SweetAlert y la cámara
    } else {
      console.log("El stage actual coincide con la ruta, no se hace redirección.");
    }
  }




  videoElement = document.getElementById('input-video');
  canvasCtx = outputCanvas.value.getContext('2d');

  const videoWidth = window.innerWidth < 768 ? window.innerWidth : 640;
  const videoHeight = window.innerWidth > 768 ? (videoWidth * 3) / 4 : (videoWidth * 4) / 4;
  outputCanvas.value.width = videoWidth;
  outputCanvas.value.height = videoHeight;

  setupFaceMesh();
  await setupCamera();

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
} function validateFacePositionAndQuality(landmarks) {
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

  // Verificar si la cara está centrada en el canvas
  const centerX = outputCanvas.value.width / 2;
  const centerY = outputCanvas.value.height / 2;
  const faceCenterX = (pixelLandmarks[234].x + pixelLandmarks[454].x) / 2;
  const faceCenterY = (pixelLandmarks[10].y + pixelLandmarks[152].y) / 2;

  // Ajustar el rango permitido para el desplazamiento del centro de la cara
  const tolerance = 0.20; // Permitir un cuarto del tamaño de la cara en cualquier dirección
  const faceCentered = Math.abs(faceCenterX - centerX) < faceWidth * tolerance && Math.abs(faceCenterY - centerY) < faceHeight * tolerance;
  // Verificar si la cara está mirando al frente
  const nose = pixelLandmarks[1];
  const leftEye = pixelLandmarks[159];
  const rightEye = pixelLandmarks[386];
  const noseToLeftEye = Math.sqrt(Math.pow(nose.x - leftEye.x, 2) + Math.pow(nose.y - leftEye.y, 2));
  const noseToRightEye = Math.sqrt(Math.pow(nose.x - rightEye.x, 2) + Math.pow(nose.y - rightEye.y, 2));
  const lookingForward = Math.abs(noseToLeftEye - noseToRightEye) < faceWidth * 0.1;

  // Verificar si la cara está recta
  const eyeSlope = (rightEye.y - leftEye.y) / (rightEye.x - leftEye.x);
  const eyeAngle = Math.atan(eyeSlope) * (180 / Math.PI);
  const faceStraight = Math.abs(eyeAngle) < 10; // Permitir una inclinación de hasta 10 grados

  if (!faceCentered) {
    message.value = "Por favor, centra tu rostro en el marco.";
    console.log("La cara no está centrada");
    return false;
  } else if (!lookingForward) {
    message.value = "Por favor, mira al frente.";
    console.log("La cara no está mirando al frente");
    return false;
  } else if (!faceStraight) {
    message.value = "Por favor, mantén tu rostro recto.";
    console.log("La cara está inclinada");
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

  const minBrightness = 40;
  const maxBrightness = 220;

  return {
    brightness: averageBrightness,
    isOptimal: averageBrightness >= minBrightness && averageBrightness <= maxBrightness,
    message: averageBrightness < minBrightness ?
      `La iluminación es muy baja. Busca un lugar más iluminado.` :
      averageBrightness > maxBrightness ?
        `Hay demasiada luz. Busca un lugar con menos iluminación.` :
        `La iluminación es adecuada.`
  };
}
async function captureImage() {
  if (criteriaMet.value) {
    isCapturing.value = true;
    isLoading.value = true; // Mostrar indicador de carga

    // Intentar obtener la ubicación geográfica
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;

      // Crear un canvas temporal para capturar la imagen del video
      const videoElement = document.getElementById('input-video');
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = videoElement.videoWidth;
      tempCanvas.height = videoElement.videoHeight;
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.drawImage(videoElement, 0, 0, tempCanvas.width, tempCanvas.height);

      // Convertir el canvas a un blob
      tempCanvas.toBlob(async (blob) => {
        const formData = new FormData();
        formData.append('person_image', blob, 'image.jpg');
        formData.append('latitude', latitude); // Añadir latitud al formulario
        formData.append('longitude', longitude); // Añadir longitud al formulario

        const token = Cookie.get('token');
        console.log('Token:', token);

        try {
          const response = await fetch(process.env.VUE_APP_BIOMETRIC, {
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
                router.push('/verify_liveness');
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
  padding: 2rem;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  margin: 0;
  overflow-x: hidden;
}

.logo {
  max-width: 200px;
  margin-bottom: 2rem;
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
}

.output-canvas {
  transform: scaleX(-1);
  border-radius: 10px;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.output-canvas:hover {
  transform: scaleX(-1) scale(1.02);
}

.video-container {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  width: 90%;
}

.message {
  font-size: 1.2rem;
  margin-bottom: 1.5rem;
  text-align: center;
  color: #2c3e50;
  font-weight: 500;
}

#capture-button {
  padding: 0.75rem 1.5rem;
  font-size: 1.1rem;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

#capture-button:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}

#capture-button.enabled:hover {
  background-color: #2980b9;
  transform: translateY(-2px);
  box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
}

.loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 2rem;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 5px solid #f3f3f3;
  border-top: 5px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loader p {
  margin-top: 1rem;
  color: #2c3e50;
  font-weight: 500;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.captured-image-container {
  margin-top: 2rem;
  width: 100%;
  max-width: 640px;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}


.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.loading-content {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 10px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.loading-content p {
  margin: 0;
  font-size: 16px;
  color: #333;
}
</style>
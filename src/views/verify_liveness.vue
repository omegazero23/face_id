<template>
  <div class="container">
    <div class="content-wrapper">
      <img 
        src="../assets/logo_trans.png" 
        alt="SoftCrédito" 
        class="logo"
      >
      <div class="video-container">
        <video ref="inputVideo" autoplay></video>
        <canvas ref="outputCanvas"></canvas>
      </div>
      <div class="message">{{ message }}</div>
      <div class="progress-bar" v-show="isRecording">
        <div class="progress" :style="{ width: `${progress}%` }"></div>
      </div>
      <button 
        @click="startRecording" 
        :disabled="isRecording"
        class="verification-button"
      >
        Iniciar Verificación
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Camera } from '@mediapipe/camera_utils';
import { FaceMesh } from '@mediapipe/face_mesh';
import { drawConnectors } from '@mediapipe/drawing_utils';
import { FACEMESH_TESSELATION } from '@mediapipe/face_mesh';
import Swal from 'sweetalert2';
import Cookie from 'js-cookie';
import { useRoute } from 'vue-router';

// mounted() {
//     const urlParams = new URLSearchParams(window.location.search);
//     const filePath = urlParams.get('filePath');
//     const jwt = urlParams.get('jwt');
//     console.log('Ruta del archivo:', filePath);
//     console.log('JWT:', jwt);
//     // Aquí puedes usar `filePath` y `jwt` según sea necesario
//   }



const token = Cookie.get('token'); 

const inputVideo = ref(null);
const outputCanvas = ref(null);
const message = ref('Cámara lista. Presiona "Iniciar Verificación" para comenzar');
const showTimer = ref(false);
const timeLeft = ref(20);
const progress = ref(0);
const isRecording = ref(false);
const route = useRoute(); // Usar useRoute para obtener el parámetro de ruta

let mediaRecorder;
let recordedChunks = [];
let faceMesh;
let stepsCompleted = {
  left: false,
  right: false,
  center: false,
  phrase: false
};
let timerInterval;
let lastStepTime = 0;
const MIN_TIME_BETWEEN_STEPS = 2250;

const randomPhrases = [
  "El sol brilla en el cielo azul",
  "Los pájaros cantan en primavera",
  "El viento sopla entre los árboles",
  "Las olas del mar son tranquilas",
  "La luna ilumina la noche oscura"
];

let currentPhrase = '';

const steps = [
  { message: "Gira lentamente tu cabeza hacia la izquierda", validation: isHeadTurnedLeft },
  { message: "Gira lentamente tu cabeza hacia la derecha", validation: isHeadTurnedRight },
  { message: "Vuelve lentamente al centro", validation: isHeadCentered },
  { message: "", validation: null },
  { message: "¡Verificación completada!", validation: null }
];


onMounted(async () => {
  await startCamera();
});

function startTimer() {
  timeLeft.value = 20;
  showTimer.value = true;
  
  timerInterval = setInterval(() => {
    timeLeft.value--;
    
    if (timeLeft.value <= 0) {
      resetVerification();
      Swal.fire({
        title: 'Tiempo agotado',
        text: 'No se completó la verificación en el tiempo establecido',
        icon: 'warning'
      });
    }
  }, 1000);
}

function isHeadTurnedLeft(landmarks) {
  const leftEye = landmarks[33];
  const rightEye = landmarks[263];
  const nose = landmarks[1];
  const noseToLeftEye = nose.x - leftEye.x;
  const noseToRightEye = rightEye.x - nose.x;
  const threshold = 0.05;
  return noseToLeftEye > noseToRightEye + threshold;
}

function isHeadTurnedRight(landmarks) {
  const leftEye = landmarks[33];
  const rightEye = landmarks[263];
  const nose = landmarks[1];
  const noseToLeftEye = nose.x - leftEye.x;
  const noseToRightEye = rightEye.x - nose.x;
  const threshold = 0.05;
  return noseToRightEye > noseToLeftEye + threshold;
}

function isHeadCentered(landmarks) {
  const leftEye = landmarks[33];
  const rightEye = landmarks[263];
  const nose = landmarks[1];
  const noseToLeftEye = nose.x - leftEye.x;
  const noseToRightEye = rightEye.x - nose.x;
  const threshold = 0.02;
  return Math.abs(noseToLeftEye - noseToRightEye) < threshold;
}

function stopTimer() {
  clearInterval(timerInterval);
  showTimer.value = false;
}

function resetVerification() {
  stopTimer();
  stopRecording();
  stepsCompleted = {
    left: false,
    right: false,
    center: false,
    phrase: false
  };
  recordedChunks = [];
  isRecording.value = false;
  message.value = "Cámara lista. Presiona 'Iniciar Verificación' para comenzar";
  progress.value = 0;
  lastStepTime = 0;
}

function updateProgress() {
  const completedSteps = Object.values(stepsCompleted).filter(v => v).length;
  const totalSteps = Object.keys(stepsCompleted).length;
  progress.value = (completedSteps / totalSteps) * 100;
}

function onResults(results) {
  const canvasCtx = outputCanvas.value.getContext('2d');
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, outputCanvas.value.width, outputCanvas.value.height);
  canvasCtx.drawImage(results.image, 0, 0, outputCanvas.value.width, outputCanvas.value.height);
  canvasCtx.scale(-1, 1); // Invertir la imagen horizontalmente

  if (results.multiFaceLandmarks) {
    for (const landmarks of results.multiFaceLandmarks) {
      drawConnectors(canvasCtx, landmarks, FACEMESH_TESSELATION, 
        {color: '#C0C0C070', lineWidth: 1});
      
      if (mediaRecorder && mediaRecorder.state === 'recording') {
        validateHeadPosition(landmarks);
      }
    }
  }
  canvasCtx.restore();
}

function validateHeadPosition(landmarks) {
  const currentTime = Date.now();
  if (currentTime - lastStepTime < MIN_TIME_BETWEEN_STEPS) {
    return;
  }

  if (!stepsCompleted.left && isHeadTurnedLeft(landmarks)) {
    stepsCompleted.left = true;
    lastStepTime = currentTime;
    message.value = "¡Izquierda completado! " + steps[1].message;
    updateProgress();
  } 
  else if (stepsCompleted.left && !stepsCompleted.right && isHeadTurnedRight(landmarks)) {
    stepsCompleted.right = true;
    lastStepTime = currentTime;
    message.value = "¡Derecha completado! " + steps[2].message;
    updateProgress();
  }
  else if (stepsCompleted.left && stepsCompleted.right && !stepsCompleted.center && isHeadCentered(landmarks)) {
    stepsCompleted.center = true;
    lastStepTime = currentTime;
    currentPhrase = randomPhrases[Math.floor(Math.random() * randomPhrases.length)];
    message.value = `Por favor, di en voz alta: "${currentPhrase}"`;
    startPhraseValidation();
    updateProgress();
  }
}

function startPhraseValidation() {
  setTimeout(() => {
    stepsCompleted.phrase = true;
    message.value = steps[4].message;
    updateProgress();
    stopTimer();
    stopRecording();
  }, 3000);
}

async function setupFaceMesh() {
  faceMesh = new FaceMesh({
    locateFile: (file) => {
      return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
    }
  });

  faceMesh.setOptions({
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
  });

  faceMesh.onResults(onResults);
}

function sendVideoToServer(blob) {

  const formData = new FormData();
  const pathParam = route.params.path;
  formData.append("video", blob, "video_verificacion.webm");
  formData.append('image_path', pathParam);
  formData.append("frase_esperada", currentPhrase);



  for (let [key, value] of formData.entries()) {
          console.log(`${key}: ${value}`);
        }

  
  fetch("https://localhost:443/verify-liveness", {
    method: "POST",
    body: formData,
    headers: {
              'Authorization': `Bearer ${token}`,
            },
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      Swal.fire({
        title: '¡Verificación completada!',
        text: 'El video ha sido enviado exitosamente',
        icon: 'success'
      });
    } else {
      Swal.fire({
        title: 'Error',
        text: 'Hubo un problema al enviar el video. Intenta nuevamente',
        icon: 'error'
      });
    }
  })
  .catch(error => {
    console.error('Error al enviar el video:', error);
    Swal.fire({
      title: 'Error de conexión',
      text: 'No se pudo conectar al servidor. Intenta nuevamente',
      icon: 'error'
    });
  });
}

async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    inputVideo.value.srcObject = stream;

    inputVideo.value.width = 640;
    inputVideo.value.height = 480;
    outputCanvas.value.width = 640;
    outputCanvas.value.height = 480;

    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      sendVideoToServer(blob);
      recordedChunks = [];
    };

    await setupFaceMesh();
    const camera = new Camera(inputVideo.value, {
      onFrame: async () => {
        await faceMesh.send({image: inputVideo.value});
      },
      width: 640,
      height: 480
    });
    camera.start();
    
    message.value = "Cámara lista. Presiona 'Iniciar Verificación' para comenzar";
    isRecording.value = false;
  } catch (error) {
    console.error('Error accessing camera:', error);
    message.value = "Error al acceder a la cámara";
  }
}

function startRecording() {
  resetVerification();
  recordedChunks = [];
  mediaRecorder.start();
  message.value = steps[0].message;
  isRecording.value = true;
  startTimer();
  lastStepTime = Date.now();
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop();
    isRecording.value = false;
  }
}
</script>

<style scoped>
.container {
  min-height: 100vh;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f5f5;
  padding: 20px;
  box-sizing: border-box;
  width: 100%; /* Asegura que el contenedor ocupe todo el ancho */
  max-width: 100%; /* Evita que el contenedor exceda el ancho de la ventana */
  box-sizing: border-box; /* Incluye padding en el cálculo del ancho */
  margin: 0; /* Elimina cualquier margen */

}

.content-wrapper {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 600px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  margin: 0 auto;
}

.logo {
  width: 280px;
  height: auto;
  margin-bottom: 1rem;
}

.video-container {
  width: 100%;
  aspect-ratio: 4/3;
  position: relative;
  border-radius: 4px;
  overflow: hidden;
  background-color: #f8f8f8;
}

video, canvas {
  position: absolute;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

canvas {
  transform: scaleX(-1);
}

.message {
  text-align: center;
  color: #333;
  font-size: 1rem;
  line-height: 1.5;
  margin: 1rem 0;
}

.verification-button {
  background-color: #666;
  color: white;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: 9999px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s ease;
  width: auto;
  min-width: 200px;
  text-align: center;
}

.verification-button:hover {
  background-color: #555;
}

.verification-button:disabled {
  background-color: #999;
  cursor: not-allowed;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background-color: #eee;
  border-radius: 3px;
  overflow: hidden;
  margin-top: -1rem;
}

.progress {
  height: 100%;
  background-color: #4CAF50;
  transition: width 0.3s ease-in-out;
}

@media (max-width: 640px) {
  .content-wrapper {
    padding: 1rem;
  }
  
  .logo {
    width: 200px;
  }
  
  .verification-button {
    width: 100%;
  }
}
</style>
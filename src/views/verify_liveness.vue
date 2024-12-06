  <template>
    <div class="container">
      <transition name="fade">
          <div v-if="isLoading" class="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg z-10">
            <div class="text-center">
              <div class="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black mb-4"></div>
              <p class="text-gray-700 font-semibold">Procesando...</p>
            </div>
          </div>
        </transition>
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

  import Swal from 'sweetalert2';
  import Cookie from 'js-cookie';
  import { useRouter } from 'vue-router';


  const token = Cookie.get('token'); 
  const latitude = ref(null);
  const longitude = ref(null);
  const inputVideo = ref(null);
  const outputCanvas = ref(null);
  const message = ref('Cámara lista. Presiona "Iniciar Verificación" para comenzar');
  const showTimer = ref(false);
  const timeLeft = ref(20);
  const progress = ref(0);
  const isRecording = ref(false);
  const router = useRouter();
  const isLoading = ref(false)

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
  const MIN_TIME_BETWEEN_STEPS = 1400;

  const colores = [
    'rojo', 'azul', 'verde', 'amarillo', 'negro', 'blanco', 'morado', 'naranja', 
    'gris', 'rosa', 'celeste', 'turquesa', 'beige', 'granate', 'ocre', 'carmesí', 
    'lavanda', 'dorado', 'plateado', 'verde oliva'
  ];

  const animales = [
    'perro', 'gato', 'elefante', 'león', 'jirafa', 'zorro', 'lobo', 'águila', 
    'serpiente', 'tigre', 'canguro', 'oso', 'mono', 'delfín', 'pingüino', 
    'caballo', 'vaca', 'oveja', 'pollo', 'tortuga'
  ];

  const lugares = [
    'parque', 'ciudad', 'playa', 'bosque', 'montaña', 'desierto', 'río', 
    'lago', 'pradera', 'volcán', 'cueva', 'jungla', 'isla', 'pueblo', 
    'puente', 'aeropuerto', 'estación', 'mercado', 'castillo', 'calle'
  ];

  const verbos = [
    'corre', 'salta', 'descansa', 'juega', 'camina', 'nada', 'vuela', 'duerme', 
    'caza', 'explora', 'come', 'bebe', 'grita', 'baila', 'canta', 'escribe', 
    'pinta', 'construye', 'rompe', 'arregla', 'besa', 'ama'
  ];

  const objetos = [
    'pelota', 'sombrero', 'bicicleta', 'computadora', 'teléfono', 'lámpara', 
    'reloj', 'libro', 'bolsa', 'mesa', 'silla', 'ventana', 'puerta', 
    'cuchillo', 'cuchara', 'lápiz', 'borrador', 'pluma', 'cámara', 'televisor'
  ];

  const nombres = [
    'Luis', 'Ana', 'Carlos', 'María', 'Pedro', 'Elena', 'Juan', 'Claudia', 
    'Diego', 'Sofía', 'Miguel', 'Laura', 'Daniel', 'Valeria', 'Fernando', 
    'Isabel', 'Jorge', 'Lucía', 'Ricardo', 'Gabriela', 'Brayan'
  ];
  function getRandomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  function generateRandomPhrase() {
    const structures = [
      () => {
        const color = getRandomItem(colores);
        const animal = getRandomItem(animales);
        const lugar = getRandomItem(lugares);
        return `El ${color} ${animal} corre rápido hacia el ${lugar}`;
      },
      () => {
        const nombre = getRandomItem(nombres);
        const objeto = getRandomItem(objetos);
        const lugar = getRandomItem(lugares);
        return `${nombre} compró un nuevo ${objeto} ayer en ${lugar}`;
      },
      () => {
        const verbo = getRandomItem(verbos);
        const animal = getRandomItem(animales);
        const lugar = getRandomItem(lugares);
        return `Un ${animal} ${verbo} felizmente en medio del ${lugar}`;
      },
      () => {
        const objeto = getRandomItem(objetos);
        const color = getRandomItem(colores);
        const lugar = getRandomItem(lugares);
        return `Encontré un ${objeto} ${color} escondido en el ${lugar}`;
      },
      () => {
        const nombre = getRandomItem(nombres);
        const verbo = getRandomItem(verbos);
        const lugar = getRandomItem(lugares);
        return `${nombre} siempre ${verbo} con entusiasmo en el ${lugar}`;
      }
    ];

    let phrase = '';
    let wordCount = 0;

    // Repetir hasta que la frase tenga 8 o 9 palabras
    do {
      const selectedStructure = structures[Math.floor(Math.random() * structures.length)];
      phrase = selectedStructure();
      wordCount = phrase.split(' ').length;
    } while (wordCount !== 8 && wordCount !== 9);

    return phrase;
  }

  let currentPhrase = '';

  const steps = [
    { message: "Gira lentamente tu cabeza hacia la izquierda", validation: isHeadTurnedLeft },
    { message: "Gira lentamente tu cabeza hacia la derecha", validation: isHeadTurnedRight },
    { message: "Vuelve lentamente al centro", validation: isHeadCentered },
    { message: "", validation: null },
    { message: "¡Verificación completada!", validation: null }
  ];


  onMounted(async () => {


    navigator.geolocation.getCurrentPosition((position) => {
      latitude.value = position.coords.latitude;
      longitude.value = position.coords.longitude;
    }, (error) => {
      console.error('Geolocation error:', error);
    });

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
        console.log('Redirigiendo a:', expectedRoute);
        
        return; // Salir de la función para evitar que se ejecute el SweetAlert y la cámara
      } else {
        console.log("El stage actual coincide con la ruta, no se hace redirección.");
      }
    }

    Swal.fire({
      title: 'Instrucciones para la prueba de vida',
      html: `
        <ul style="text-align: left;">
          <li>Por favor, asegúrese de que su rostro esté bien iluminado y completamente visible.</li>
          <li>Mire hacia la izquierda durante unos segundos.</li>
          <li>Mire hacia la derecha durante unos segundos.</li>
          <li>Mire directamente al centro de la cámara.</li>
          <li>Finalmente, pronuncie claramente la frase que se le indicará en pantalla.</li>
        </ul>
        `,
      icon: 'info',
      confirmButtonText: 'Aceptar'
    });

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
        // drawConnectors(canvasCtx, landmarks, FACEMESH_TESSELATION, 
        //   {color: '#C0C0C070', lineWidth: 1});
        
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
      currentPhrase = generateRandomPhrase();
      message.value = `Por favor, di en voz alta: "${currentPhrase}"`;
      startPhraseValidation();
      updateProgress();
    }
  }

  function startPhraseValidation() {
    setTimeout(() => {
      // Validación de la frase y luego detener la grabación
      stepsCompleted.phrase = true;
      message.value = steps[4].message;
      updateProgress();
      
      // Detener la grabación después de una breve pausa (para asegurar que se capture el video completo)
      setTimeout(() => {
        stopTimer();
        stopRecording();
      }, 3000);  // Aumentar este valor si es necesario para asegurar que se capture el final de la frase

    }, 6000);  // Ajustar este tiempo si es necesario
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
  async function sendVideoToServer(blob) {
    isLoading.value = true;

    const formData = new FormData();
    formData.append("video", blob, "video_verificacion.webm");
    formData.append("frase_esperada", currentPhrase);
    formData.append("latitude", latitude.value);
    formData.append("longitude", longitude.value);

    for (let [key, value] of formData.entries()) {
      console.log(`${key}: ${value}`);
    }

    try {
      const response = await fetch(process.env.VUE_APP_LIVENESS, {
        method: "POST",
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true'

        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new TypeError("La respuesta no es JSON");
      }

      const data = await response.json();
      if (data.success) {
        Swal.fire({
          title: '¡Verificación completada!',
          text: 'El video ha sido enviado exitosamente',
          icon: 'success'
        }).then(() => {
          // Redirigir a la siguiente página
          router.push({ name: 'SuccessProcess' });
        });
      } else {
        Swal.fire({
          title: 'Error',
          text: 'Hubo un problema al enviar el video. Intenta nuevamente',
          icon: 'error'
        }).then(() => {
          window.location.reload();
        });
      }
    } catch (error) {
      console.error('Error al enviar el video:', error);
      Swal.fire({
        title: 'Error de conexión',
        text: 'No se pudo conectar al servidor. Intenta nuevamente',
        icon: 'error'
      }).then(() => {
        window.location.reload();
      });
    } finally {
      isLoading.value = false;
    }
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
  height: 0;
  padding-bottom: 75%; /* Mantiene una proporción de 4:3 */
  position: relative;
  border-radius: 4px;
  overflow: hidden;
  background-color: #f8f8f8;
}

video, canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover; /* Asegura que el contenido llene el contenedor manteniendo la proporción */
}.video-container {
  width: 100%;
  height: 0;
  padding-bottom: 75%; /* Mantiene una proporción de 4:3 */
  position: relative;
  border-radius: 4px;
  overflow: hidden;
  background-color: #f8f8f8;
}

video, canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover; /* Asegura que el contenido llene el contenedor manteniendo la proporción */
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
    
    .video-container {
      height: 40vh; /* Ajusta la altura del contenedor de video en dispositivos móviles */
    }
  }
  </style>
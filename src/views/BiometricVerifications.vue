<template>
  <div class="container">
    <img src="/logo_trans.png" alt="Logo" class="logo" />
    <div class="video-container">
      <video ref="videoRef" class="video-element" autoplay playsinline></video>
      <canvas ref="canvasRef" class="output-canvas"></canvas>
    </div>
    <div class="message">{{ message }}</div>
    <button
      @click="captureImage"
      :disabled="!criteriaMet || isCapturing"
      :class="['capture-button', { enabled: criteriaMet }]"
    >
      Estoy listo
    </button>
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-content">
        <div class="spinner"></div>
        <p>Cargando...</p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'
import { Camera } from '@mediapipe/camera_utils'
import { FaceMesh } from '@mediapipe/face_mesh'
import { drawConnectors } from '@mediapipe/drawing_utils'
import {
  FACEMESH_TESSELATION,
  FACEMESH_RIGHT_EYE,
  FACEMESH_RIGHT_EYEBROW,
  FACEMESH_RIGHT_IRIS,
  FACEMESH_LEFT_EYE,
  FACEMESH_LEFT_EYEBROW,
  FACEMESH_LEFT_IRIS,
  FACEMESH_FACE_OVAL,
  FACEMESH_LIPS
} from '@mediapipe/face_mesh'
import Swal from 'sweetalert2'
import { useRouter } from 'vue-router'
import Cookies from 'js-cookie'

export default {
  setup() {
    const videoRef = ref(null)
    const canvasRef = ref(null)
    const message = ref('Ajusta tu posición para centrar tu rostro.')
    const criteriaMet = ref(false)
    const isCapturing = ref(false)
    const isLoading = ref(false)
    const router = useRouter()

    let camera = null
    let faceMesh = null

    onMounted(() => {
      checkStage()
      setupCamera()
      setupFaceMesh()

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
      })
    })

    onUnmounted(() => {
      if (camera) {
        camera.stop()
      }
    })

    const checkStage = async () => {
      const token = Cookies.get('token')
      try {
        const response = await fetch(process.env.VUE_APP_STAGE, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true'
          },
        })

        if (response.ok) {
          const stage = await response.json()
          const routes = {
            PROCESS_AND_VALIDATE_DOC: '/',
            VALIDATE_IDENTITY: '/verificacion-biometrica',
            VERIFY_LIVENESS: '/verify_liveness',
            COMPLETED: '/success',
          }

          const expectedRoute = routes[stage.stage]
          if (expectedRoute && expectedRoute !== window.location.pathname) {
            router.push(expectedRoute)
            return
          }
        }
      } catch (error) {
        console.error('Error checking stage:', error)
      }
    }

    const setupCamera = () => {
      if (videoRef.value) {
        camera = new Camera(videoRef.value, {
          onFrame: async () => {
            await faceMesh.send({ image: videoRef.value })
          },
          width: 640,
          height: 480
        })
        camera.start()
      }
    }

    const setupFaceMesh = () => {
      faceMesh = new FaceMesh({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
      })

      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      })

      faceMesh.onResults(onResults)
    }

    const onResults = (results) => {
      if (canvasRef.value) {
        const canvasCtx = canvasRef.value.getContext('2d')
        canvasCtx.save()
        canvasCtx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height)
        canvasCtx.drawImage(results.image, 0, 0, canvasRef.value.width, canvasRef.value.height)

        if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
          for (const landmarks of results.multiFaceLandmarks) {
            drawConnectors(canvasCtx, landmarks, FACEMESH_TESSELATION, { color: '#C0C0C070', lineWidth: 0.5 })
            drawConnectors(canvasCtx, landmarks, FACEMESH_RIGHT_EYE, { color: '#FFFFFF', lineWidth: 0.5 })
            drawConnectors(canvasCtx, landmarks, FACEMESH_RIGHT_EYEBROW, { color: '#FFFFFF', lineWidth: 0.5 })
            drawConnectors(canvasCtx, landmarks, FACEMESH_RIGHT_IRIS, { color: '#FFFFFF', lineWidth: 0.5 })
            drawConnectors(canvasCtx, landmarks, FACEMESH_LEFT_EYE, { color: '#FFFFFF', lineWidth: 0.5 })
            drawConnectors(canvasCtx, landmarks, FACEMESH_LEFT_EYEBROW, { color: '#FFFFFF', lineWidth: 0.5 })
            drawConnectors(canvasCtx, landmarks, FACEMESH_LEFT_IRIS, { color: '#FFFFFF', lineWidth: 0.5 })
            drawConnectors(canvasCtx, landmarks, FACEMESH_FACE_OVAL, { color: '#E0E0E0', lineWidth: 0.5 })
            drawConnectors(canvasCtx, landmarks, FACEMESH_LIPS, { color: '#E0E0E0', lineWidth: 0.5 })

            criteriaMet.value = validateFacePositionAndQuality(landmarks)
          }
        } else {
          message.value = "No se detectó ningún rostro. Ajusta tu posición."
          criteriaMet.value = false
        }

        canvasCtx.restore()
      }
    }

    const validateFacePositionAndQuality = (landmarks) => {
      const imageWidth = canvasRef.value.width
      const imageHeight = canvasRef.value.height

      // Check if face is centered
      const noseTip = landmarks[4]
      const centerX = noseTip.x * imageWidth
      const centerY = noseTip.y * imageHeight
      const isCentered = (
        centerX > imageWidth * 0.4 &&
        centerX < imageWidth * 0.6 &&
        centerY > imageHeight * 0.4 &&
        centerY < imageHeight * 0.6
      )

      // Check face size
      const leftEye = landmarks[33]
      const rightEye = landmarks[263]
      const mouthLeft = landmarks[61]
      const mouthRight = landmarks[291]
      const eyeDistance = Math.sqrt(
        Math.pow((rightEye.x - leftEye.x) * imageWidth, 2) +
        Math.pow((rightEye.y - leftEye.y) * imageHeight, 2)
      )
      const mouthWidth = Math.sqrt(
        Math.pow((mouthRight.x - mouthLeft.x) * imageWidth, 2) +
        Math.pow((mouthRight.y - mouthLeft.y) * imageHeight, 2)
      )
      const isCorrectSize = (
        eyeDistance > imageWidth * 0.2 &&
        eyeDistance < imageWidth * 0.4 &&
        mouthWidth > imageWidth * 0.2 &&
        mouthWidth < imageWidth * 0.5
      )

      // Update message based on criteria
      if (!isCentered) {
        message.value = "Centra tu rostro en la pantalla."
      } else if (!isCorrectSize) {
        message.value = "Acércate o aléjate de la cámara."
      } else {
        message.value = "Posición correcta. Puedes capturar la imagen."
      }

      return isCentered && isCorrectSize
    }

    const captureImage = async () => {
      if (criteriaMet.value && videoRef.value) {
        isCapturing.value = true
        isLoading.value = true

        try {
          const canvas = document.createElement('canvas')
          canvas.width = videoRef.value.videoWidth
          canvas.height = videoRef.value.videoHeight
          canvas.getContext('2d').drawImage(videoRef.value, 0, 0)
          const photo = canvas.toDataURL('image/jpeg')
          const position = await getCurrentPosition()

          const formData = new FormData()
          formData.append('person_image', dataURItoBlob(photo), 'capture.jpg')
          formData.append('latitude', position.latitude.toString())
          formData.append('longitude', position.longitude.toString())

          const token = Cookies.get('token')
          const response = await fetch(process.env.VUE_APP_BIOMETRIC, {
            method: 'POST',
            body: formData,
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          })

          const data = await response.json()

          if (response.status >= 400) {
            Swal.fire({
              title: 'Error',
              text: 'Vuelve a tomar la imagen siguiendo las indicaciones.',
              icon: 'error',
              confirmButtonText: 'Aceptar'
            }).then(() => {
              window.location.reload()
            })
            message.value = data.error
          } else {
            Swal.fire({
              title: 'Éxito',
              text: data.message,
              icon: 'success',
              confirmButtonText: 'Aceptar'
            }).then((result) => {
              if (result.isConfirmed) {
                router.push('/verify_liveness')
              }
            })
            message.value = data.message
          }
        } catch (error) {
          console.error(error)
          Swal.fire({
            title: 'Error',
            text: 'Vuelve a tomar la imagen siguiendo las indicaciones.',
            icon: 'error',
            confirmButtonText: 'Aceptar'
          }).then(() => {
            window.location.reload()
          })
          message.value = "Error al enviar la imagen."
        } finally {
          isCapturing.value = false
          isLoading.value = false
        }
      }
    }

    const getCurrentPosition = () => {
      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => resolve(position.coords),
          (error) => reject(error)
        )
      })
    }

    const dataURItoBlob = (dataURI) => {
      const byteString = atob(dataURI.split(',')[1])
      const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]
      const ab = new ArrayBuffer(byteString.length)
      const ia = new Uint8Array(ab)
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i)
      }
      return new Blob([ab], { type: mimeString })
    }

    return {
      videoRef,
      canvasRef,
      message,
      criteriaMet,
      isCapturing,
      isLoading,
      captureImage
    }
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

.video-container {
  position: relative;
  width: 90%;
  max-width: 640px;
  aspect-ratio: 4 / 3;
}

.video-element {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scaleX(-1);
}

.output-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  transform: scaleX(-1);
}

.message {
  font-size: 1.2rem;
  margin-top: 1.5rem;
  margin-bottom: 1.5rem;
  text-align: center;
  color: #2c3e50;
  font-weight: 500;
}

.capture-button {
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

.capture-button:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}

.capture-button.enabled:hover {
  background-color: #2980b9;
  transform: translateY(-2px);
  box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
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
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-content p {
  margin: 0;
  font-size: 16px;
  color: #333;
}
</style>
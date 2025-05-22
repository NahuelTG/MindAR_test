import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { MindARThree } from 'mind-ar/dist/mindar-image-three.prod.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

const ARScene = () => {
  const sceneRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [model, setModel] = useState(null)
  const mixerRef = useRef(null)
  const clockRef = useRef(new THREE.Clock())

  useEffect(() => {
    document.body.classList.add('ar-active') // Clase para gestionar estilos globales durante AR
    return () => {
      document.body.classList.remove('ar-active')
    }
  }, [])

  useEffect(() => {
    const loadModel = async () => {
      try {
        const loader = new GLTFLoader()
        loader.load(
          '/bee.glb', // Asegúrate que bee.glb esté en la carpeta public
          (gltf) => {
            const loadedModel = gltf.scene
            loadedModel.scale.set(0.1, 0.1, 0.1)
            loadedModel.position.set(0, -0.2, 0) // Ligeramente abajo para que parezca posada
            // loadedModel.rotation.y = Math.PI / 2; // Rotación inicial si es necesaria

            if (gltf.animations.length > 0) {
              mixerRef.current = new THREE.AnimationMixer(loadedModel)
              gltf.animations.forEach((clip) => {
                const action = mixerRef.current.clipAction(clip)
                action.timeScale = 0.6 // Ajusta velocidad de animación
                action.play()
              })
            }
            setModel(loadedModel)
            setLoading(false)
          },
          undefined,
          (error) => {
            console.error('Error loading GLB model:', error)
            setLoading(false) // Considerar mostrar un mensaje de error al usuario
          }
        )
      } catch (error) {
        console.error('Error in loadModel setup:', error)
        setLoading(false)
      }
    }
    loadModel()
  }, [])

  useEffect(() => {
    if (loading || !model || !sceneRef.current) return

    let mindarInstance = null // Para limpieza

    const startMindAR = async () => {
      try {
        mindarInstance = new MindARThree({
          container: sceneRef.current,
          imageTargetSrc: '/bee.mind', // Asegúrate que bee.mind esté en la carpeta public
          // uiLoading: "no", // Opcional: deshabilitar UI de carga de MindAR si usas una personalizada
          // uiScanning: "no", // Opcional: deshabilitar UI de escaneo de MindAR
        })

        const { renderer, scene, camera } = mindarInstance

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.9)
        scene.add(ambientLight)

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
        directionalLight.position.set(3, 5, 4)
        scene.add(directionalLight)

        const anchor = mindarInstance.addAnchor(0)
        anchor.group.add(model)
        model.visible = false // Ocultar modelo hasta que se detecte el target

        anchor.onTargetFound = () => {
          model.visible = true
          if (!clockRef.current.running && mixerRef.current) {
            clockRef.current.start()
          }
          console.log('Target Found')
        }

        anchor.onTargetLost = () => {
          model.visible = false
          // No es estrictamente necesario parar el clock si las actualizaciones dependen de 'model.visible'
          // if (clockRef.current.running) clockRef.current.stop();
          console.log('Target Lost')
        }

        await mindarInstance.start()

        renderer.setAnimationLoop(() => {
          const delta = clockRef.current.getDelta()
          if (model.visible) {
            if (mixerRef.current) {
              mixerRef.current.update(delta)
            }
            model.rotation.y += delta * (Math.PI / 5) // Rotación continua más lenta
          }
          renderer.render(scene, camera)
        })

        const onResize = () => {
          if (sceneRef.current && renderer && camera) {
            const { clientWidth, clientHeight } = sceneRef.current
            renderer.setSize(clientWidth, clientHeight)
            camera.aspect = clientWidth / clientHeight
            camera.updateProjectionMatrix()
          }
        }
        window.addEventListener('resize', onResize)
        onResize() // Ajustar tamaño inicial

        // Devolver función de limpieza
        return () => {
          console.log('Cleaning up ARScene')
          window.removeEventListener('resize', onResize)
          if (renderer) renderer.setAnimationLoop(null)
          if (mindarInstance) {
            mindarInstance.stop()
          }
        }
      } catch (e) {
        console.error('Error starting MindAR:', e)
      }
    }

    // Guardar la función de limpieza retornada por startMindAR
    let cleanupFunction
    startMindAR().then((cleanup) => {
      cleanupFunction = cleanup
    })

    return () => {
      if (typeof cleanupFunction === 'function') {
        cleanupFunction()
      }
    }
  }, [loading, model]) // No incluir sceneRef.current si es estable

  return (
    <div
      ref={sceneRef}
      style={{
        width: '100vw',
        height: '100vh',
        position: 'absolute', // o 'fixed' para asegurar que cubra todo sobre otros elementos
        top: 0,
        left: 0,
        overflow: 'hidden',
      }}
    >
      {loading && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(20, 20, 20, 0.95)',
            color: 'white',
            zIndex: 10,
            fontFamily: 'system-ui, Avenir, Helvetica, Arial, sans-serif',
          }}
        >
          <svg
            aria-hidden="true"
            style={{ width: '60px', height: '60px', marginBottom: '24px', color: '#EAB308' /* amber-500 */ }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1.2s" repeatCount="indefinite" />
          </svg>
          <p style={{ fontSize: '1.3em', fontWeight: '600', marginBottom: '12px' }}>Cargando Experiencia AR...</p>
          <p style={{ fontSize: '1em', color: '#D1D5DB' /* gray-300 */ }}>Por favor, espera un momento.</p>
        </div>
      )}
    </div>
  )
}

export default ARScene

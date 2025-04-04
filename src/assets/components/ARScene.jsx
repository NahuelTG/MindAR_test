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
    document.body.classList.add('unstyled')
    return () => {
      document.body.classList.remove('unstyled')
    }
  }, [])

  useEffect(() => {
    const loadModel = async () => {
      const loader = new GLTFLoader()
      loader.load('/bee.glb', (gltf) => {
        const model = gltf.scene

        // Ajustes iniciales del modelo
        model.scale.set(0.1, 0.1, 0.1)
        model.position.set(0, 0, 0)
        model.rotation.y = Math.PI / 2

        // Configuración de animaciones
        if (gltf.animations.length > 0) {
          mixerRef.current = new THREE.AnimationMixer(model)
          gltf.animations.forEach((clip) => {
            const action = mixerRef.current.clipAction(clip)
            action.timeScale = 0.5
            action.play()
          })
        }

        setModel(model)
        setLoading(false)
      })
    }

    loadModel()
  }, [])

  useEffect(() => {
    if (loading || !model) return

    const startMindAR = async () => {
      const mindarThree = new MindARThree({
        container: sceneRef.current,
        imageTargetSrc: '/targets.mind',
      })

      const { renderer, scene, camera } = mindarThree

      // Configuración de iluminación
      const ambientLight = new THREE.AmbientLight(0xffffff, 1)
      scene.add(ambientLight)

      const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
      directionalLight.position.set(0, 1, 0)
      scene.add(directionalLight)

      // Añadir modelo al anchor
      const anchor = mindarThree.addAnchor(0)
      anchor.group.add(model)

      // Manejo de eventos de detección
      anchor.onTargetFound = () => {
        model.visible = true
        clockRef.current.start() // Reiniciar el reloj al detectar
      }
      anchor.onTargetLost = () => {
        model.visible = false
        clockRef.current.stop()
      }

      // Iniciar AR
      await mindarThree.start()

      // Configurar el bucle de animación único
      renderer.setAnimationLoop(() => {
        const delta = clockRef.current.getDelta()

        // Actualizar animaciones del modelo
        if (mixerRef.current) {
          mixerRef.current.update(delta)
        }

        // Rotación continua sobre el eje Y
        model.rotation.y += (delta * Math.PI) / 2 // Ajustar velocidad aquí

        renderer.render(scene, camera)
      })

      // Manejo de redimensionado
      const onResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
        renderer.setSize(window.innerWidth, window.innerHeight)
      }
      window.addEventListener('resize', onResize)

      // Limpieza
      return () => {
        window.removeEventListener('resize', onResize)
        renderer.setAnimationLoop(null)
        mindarThree.stop()
      }
    }

    startMindAR()
  }, [loading, model])

  return (
    <div
      ref={sceneRef}
      style={{
        width: '100%',
        height: '100vh',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {loading && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: 'white',
          }}
        >
          Cargando...
        </div>
      )}
    </div>
  )
}

export default ARScene

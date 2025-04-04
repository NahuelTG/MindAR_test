import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { MindARThree } from 'mind-ar/dist/mindar-image-three.prod.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

const ARScene = () => {
  const sceneRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [model, setModel] = useState(null)
  const mixerRef = useRef(null)

  useEffect(() => {
    const loadModel = async () => {
      const loader = new GLTFLoader()
      loader.load(
        '/steve.glb', // Ruta a tu modelo 3D
        (gltf) => {
          setModel(gltf.scene)
          gltf.scene.visible = false

          // Configura animaciones
          mixerRef.current = new THREE.AnimationMixer(gltf.scene)
          gltf.animations.forEach((clip) => {
            mixerRef.current.clipAction(clip).play()
          })

          setLoading(false)
        }
      )
    }

    loadModel()
  }, [])

  useEffect(() => {
    if (loading || !model) return

    const startMindAR = async () => {
      const mindarThree = new MindARThree({
        container: sceneRef.current,
        imageTargetSrc: '/targets.mind', // Ruta a tu archivo .mind
      })

      const { renderer, scene, camera } = mindarThree

      // Configura iluminación
      const ambientLight = new THREE.AmbientLight(0xffffff, 1)
      scene.add(ambientLight)

      const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
      directionalLight.position.set(0, 1, 0)
      scene.add(directionalLight)

      // Añade modelo 3D
      const anchor = mindarThree.addAnchor(0)
      anchor.group.add(model)

      // Maneja eventos de detección
      anchor.onTargetFound = () => {
        model.visible = true
      }
      anchor.onTargetLost = () => {
        model.visible = false
      }

      // Inicia el motor AR
      await mindarThree.start()
      renderer.setAnimationLoop(() => {
        if (mixerRef.current) mixerRef.current.update(0.0167)
        renderer.render(scene, camera)
      })

      // Maneja redimensionado
      window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
        renderer.setSize(window.innerWidth, window.innerHeight)
      })
    }

    startMindAR()

    return () => {
      window.location.reload() // Limpieza básica para prevenir memory leaks
    }
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

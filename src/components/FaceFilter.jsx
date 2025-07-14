import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import * as THREE from 'three'
import { MindARThree } from 'mind-ar/dist/mindar-face-three.prod.js'

const FaceFilter = () => {
  const navigate = useNavigate()
  const sceneRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [arSystem, setArSystem] = useState(null)
  const faceMeshRef = useRef(null)
  const [usingFrontCamera, setUsingFrontCamera] = useState(true)

  useEffect(() => {
    document.body.classList.add('unstyled')
    return () => {
      document.body.classList.remove('unstyled')
    }
  }, [])

  const startAR = async (useFrontCamera = true) => {
    // Detener el sistema AR anterior si existe
    if (arSystem) {
      arSystem.stop()
      arSystem.renderer.dispose()
    }

    setLoading(true)

    try {
      const mindarThree = new MindARThree({
        container: sceneRef.current,
        uiLoading: 'no',
        uiScanning: 'no',
        uiError: 'no',
        // Especificar la cámara frontal o trasera
        facingMode: useFrontCamera ? 'user' : 'environment',
      })

      const { renderer, scene, camera } = mindarThree

      // Configurar el renderer para usar todo el espacio disponible
      renderer.setSize(window.innerWidth, window.innerHeight)

      // Asegurar que la cámara se ajuste correctamente
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()

      // Crear una malla facial que se ajustará a la cara detectada
      // En lugar de una geometría básica, usaremos los vértices proporcionados por MindAR
      const textureLoader = new THREE.TextureLoader()
      textureLoader.load('/mesh_map.png', (texture) => {
        texture.flipY = false

        // Material que utilizará la textura del filtro facial
        const material = new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          opacity: 1.0,
          side: THREE.DoubleSide,
        })

        // En lugar de crear nuestra propia geometría, vamos a esperar a que MindAR
        // proporcione los puntos de referencia faciales
        const faceMesh = new THREE.Mesh(
          new THREE.PlaneGeometry(1, 1), // Geometría temporal
          material
        )

        // Configuración inicial
        faceMesh.position.set(0, 0, 0)
        faceMesh.scale.set(1, 1, 1)
        faceMesh.visible = false

        // Guardar referencia
        faceMeshRef.current = faceMesh

        // Si el controlador facial está disponible, añadimos la malla
        if (mindarThree.controller) {
          const anchor = mindarThree.addFaceMesh()
          anchor.group.add(faceMesh)
        } else {
          // Si no hay controlador facial, añadimos directamente a la escena
          scene.add(faceMesh)
        }

        setLoading(false)
      })

      // Manejar cambios de tamaño de ventana
      const onResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
        renderer.setSize(window.innerWidth, window.innerHeight)
      }

      window.addEventListener('resize', onResize)

      // Iniciar AR
      await mindarThree.start()

      const update = () => {
        if (!mindarThree.controller) return

        const faceVisible = mindarThree.controller.visible

        if (faceMeshRef.current) {
          faceMeshRef.current.visible = faceVisible
        }

        renderer.render(scene, camera)
        requestAnimationFrame(update)
      }

      update()
      setArSystem(mindarThree)

      return () => {
        window.removeEventListener('resize', onResize)
      }
    } catch (error) {
      console.error('Error al iniciar AR:', error)
      setLoading(false)
    }
  }

  useEffect(() => {
    startAR(usingFrontCamera)

    return () => {
      if (arSystem) {
        arSystem.stop()
        arSystem.renderer.dispose()
      }
    }
  }, [usingFrontCamera]) // Reiniciar cuando cambie la cámara

  const toggleCamera = () => {
    setUsingFrontCamera(!usingFrontCamera)
  }

  return (
    <div style={{ position: 'relative' }}>
      <div
        ref={sceneRef}
        style={{
          width: '100%',
          height: '100vh',
          position: 'relative',
          overflow: 'hidden',
        }}
      />

      <button
        onClick={() => navigate('/')}
        style={{
          position: 'absolute',
          bottom: '16px',
          left: '16px',
          zIndex: 50,
          padding: '8px 16px',
          backgroundColor: 'rgba(31, 41, 55, 0.8)',
          color: 'white',
          borderRadius: '8px',
          cursor: 'pointer',
          border: 'none',
          transition: 'background-color 0.3s',
        }}
      >
        Volver al Selector
      </button>

      <button
        onClick={toggleCamera}
        style={{
          position: 'absolute',
          bottom: '16px',
          right: '16px',
          zIndex: 50,
          padding: '8px 16px',
          backgroundColor: 'rgba(31, 41, 55, 0.8)',
          color: 'white',
          borderRadius: '8px',
          cursor: 'pointer',
          border: 'none',
          transition: 'background-color 0.3s',
        }}
      >
        {usingFrontCamera ? 'Cambiar a Cámara Trasera' : 'Cambiar a Cámara Frontal'}
      </button>

      {loading && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: 'white',
            fontSize: '18px',
          }}
        >
          Cargando filtro facial...
        </div>
      )}
    </div>
  )
}

export default FaceFilter

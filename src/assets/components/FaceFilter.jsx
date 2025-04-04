import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import * as THREE from 'three'
import { MindARThree } from 'mind-ar/dist/mindar-image-three.prod.js'

const FaceFilter = () => {
  const navigate = useNavigate()
  const sceneRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [arSystem, setArSystem] = useState(null)
  const faceMeshRef = useRef(null)

  useEffect(() => {
    document.body.classList.add('unstyled')
    return () => {
      document.body.classList.remove('unstyled')
    }
  }, [])

  useEffect(() => {
    const initFaceFilter = async () => {
      const mindarThree = new MindARThree({
        container: sceneRef.current,
        uiLoading: 'no',
        uiScanning: 'no',
        uiError: 'no',
      })

      const { renderer, scene, camera } = mindarThree

      // Configurar el renderer para usar todo el espacio disponible
      renderer.setSize(window.innerWidth, window.innerHeight)

      // Asegurar que la cámara se ajuste correctamente
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()

      // Crear geometría facial básica
      const geometry = new THREE.BufferGeometry()
      const vertices = new Float32Array([
        // Triángulo 1
        -1, -1, 0, 1, -1, 0, 1, 1, 0,
        // Triángulo 2
        -1, -1, 0, 1, 1, 0, -1, 1, 0,
      ])

      const uvs = new Float32Array([
        // UVs correspondientes
        0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1,
      ])

      geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
      geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))

      // Cargar textura PNG
      const textureLoader = new THREE.TextureLoader()
      textureLoader.load('/mesh_map.png', (texture) => {
        texture.flipY = false // Ajustar según necesidad de la textura

        const material = new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          side: THREE.DoubleSide,
        })

        faceMeshRef.current = new THREE.Mesh(geometry, material)
        faceMeshRef.current.visible = false
        scene.add(faceMeshRef.current)
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
        if (!mindarThree.controller || !faceMeshRef.current) return

        const { faceGeometry } = mindarThree.controller.currentFace || {}
        faceMeshRef.current.visible = !!faceGeometry

        if (faceGeometry) {
          faceMeshRef.current.position.copy(faceGeometry.position)
          faceMeshRef.current.rotation.copy(faceGeometry.rotation)
          faceMeshRef.current.scale.copy(faceGeometry.scale)
        }

        renderer.render(scene, camera)
        requestAnimationFrame(update)
      }

      update()
      setArSystem(mindarThree)

      return () => {
        window.removeEventListener('resize', onResize)
      }
    }

    initFaceFilter()

    return () => {
      if (arSystem) {
        arSystem.stop()
        arSystem.renderer.dispose()
      }
    }
  }, [])

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
        onMouseOver={(e) => (e.target.style.backgroundColor = 'rgba(55, 65, 81, 0.8)')}
        onMouseOut={(e) => (e.target.style.backgroundColor = 'rgba(31, 41, 55, 0.8)')}
      >
        Volver al Selector
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

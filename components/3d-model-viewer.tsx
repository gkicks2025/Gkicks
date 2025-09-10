'use client'

import React, { Suspense, useRef, useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Maximize2, Minimize2, RotateCcw, Sun, ChevronDown, ChevronUp } from 'lucide-react'

// Dynamic imports for Three.js components to avoid SSR issues
const Canvas = dynamic(() => import('@react-three/fiber').then(mod => ({ default: mod.Canvas })), { ssr: false })
const OrbitControls = dynamic(() => import('@react-three/drei').then(mod => ({ default: mod.OrbitControls })), { ssr: false })

// Dynamic imports for Three.js itself
let THREE: any = null
let OBJLoader: any = null
let MTLLoader: any = null
let GLTFLoader: any = null
let useFrame: any = null

// Initialize Three.js modules on client side
if (typeof window !== 'undefined') {
  import('three').then(module => {
    THREE = module
  })
  import('three/examples/jsm/loaders/OBJLoader.js').then(module => {
    OBJLoader = module.OBJLoader
  })
  import('three/examples/jsm/loaders/MTLLoader.js').then(module => {
    MTLLoader = module.MTLLoader
  })
  import('three/examples/jsm/loaders/GLTFLoader.js').then(module => {
    GLTFLoader = module.GLTFLoader
  })
  import('@react-three/fiber').then(module => {
    useFrame = module.useFrame
  })
}

// 3D Model Component
function Model3D({ url, productColors = [] }: { url: string; productColors?: string[] }) {
  const meshRef = useRef<any>(null)
  const [loadedModel, setLoadedModel] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!url || !THREE || !OBJLoader || !GLTFLoader) return

    const loadModel = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        const filename = url.split('/').pop() || ''
        const fileExtension = filename.split('.').pop()?.toLowerCase()
        
        let obj: any
        
        // Handle GLB/GLTF files
        if (fileExtension === 'glb' || fileExtension === 'gltf') {
          const gltfLoader = new GLTFLoader()
          const gltf = await gltfLoader.loadAsync(url)
          obj = gltf.scene
        } else {
          // Handle OBJ files
          const objLoader = new OBJLoader()
          obj = await objLoader.loadAsync(url)
        }
        
        // Process the model
        obj.traverse((child: any) => {
          if (child.isMesh) {
            child.castShadow = true
            child.receiveShadow = true
            
            // Apply materials if available
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach((mat: any) => {
                  mat.roughness = 0.3
                  mat.metalness = 0.1
                })
              } else {
                child.material.roughness = 0.3
                child.material.metalness = 0.1
              }
            }
          }
        })
        
        // Center and scale the model
        const box = new THREE.Box3().setFromObject(obj)
        const center = box.getCenter(new THREE.Vector3())
        const size = box.getSize(new THREE.Vector3())
        const maxDim = Math.max(size.x, size.y, size.z)
        const scale = 3 / maxDim
        
        obj.scale.setScalar(scale)
        obj.position.sub(center.multiplyScalar(scale))
        
        setLoadedModel(obj)
        setIsLoading(false)
      } catch (error) {
        console.error('Error loading 3D model:', error)
        setError(error instanceof Error ? error.message : 'Failed to load 3D model')
        setIsLoading(false)
      }
    }

    loadModel()
  }, [url])

  // Auto-rotation using useFrame
  if (useFrame) {
    useFrame(() => {
      if (meshRef.current) {
        meshRef.current.rotation.y += 0.01
      }
    })
  }

  if (error) {
    return (
      <mesh ref={meshRef}>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial color="red" />
      </mesh>
    )
  }

  if (isLoading || !loadedModel) {
    return (
      <mesh ref={meshRef}>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial color="gray" />
      </mesh>
    )
  }

  return <primitive ref={meshRef} object={loadedModel} />
}

// Loading component
function Loader({ error }: { error?: string | null }) {
  if (error) {
    return (
      <div className="text-white text-center bg-red-500/20 p-4 rounded-lg backdrop-blur-sm absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="text-red-400 mb-2">⚠️</div>
        <div className="text-sm">Failed to load 3D model</div>
        <div className="text-xs text-red-300 mt-1">{error}</div>
      </div>
    )
  }
  
  return (
    <div className="text-white text-center absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
      <div>Loading 3D Model...</div>
    </div>
  )
}

interface ModelViewer3DProps {
  modelUrl: string
  filename?: string
  className?: string
  productColors?: string[]
}

export default function ModelViewer3D({ modelUrl, filename, className = '', productColors = [] }: ModelViewer3DProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [autoRotate, setAutoRotate] = useState(false)
  const [brightness, setBrightness] = useState(1.0)
  const [isBrightnessMinimized, setIsBrightnessMinimized] = useState(false)

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  const resetView = () => {
    // Reset camera position and rotation
    setBrightness(1.0)
    setAutoRotate(false)
  }

  if (!modelUrl) {
    return (
      <div className={`relative aspect-square bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center p-6 ${className}`}>
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-yellow-400 rounded-full flex items-center justify-center">
            <Sun className="w-8 h-8 text-black" />
          </div>
          <div>
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No 3D Model Available</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">This product doesn't have a 3D model yet.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Regular view */}
      {!isFullscreen && (
        <div className={`relative aspect-square bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 ${className}`}>
          <Canvas
            camera={{ position: [0, 0, 8], fov: 50 }}
            style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' }}
            gl={{ antialias: true, alpha: true }}
          >
            <ambientLight intensity={0.5 * brightness} />
            <directionalLight position={[10, 10, 5]} intensity={1 * brightness} />
            <pointLight position={[-10, -10, -5]} intensity={0.5 * brightness} />
            
            <Suspense fallback={null}>
              <Model3D url={modelUrl} productColors={productColors} />
            </Suspense>
            
            <OrbitControls 
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              autoRotate={autoRotate}
              autoRotateSpeed={2}
              minDistance={2}
              maxDistance={15}
            />
          </Canvas>
          
          {/* Controls */}
          <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              size="sm"
              onClick={toggleFullscreen}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              size="sm"
              onClick={resetView}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Model Info */}
          <div className="absolute bottom-4 left-4 z-10">
            <div className="bg-black/50 rounded px-3 py-2">
              <p className="text-white text-sm font-medium">
                {filename ? filename.replace(/\.[^/.]+$/, '') : 'Interactive 3D Model'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen view */}
      {isFullscreen && (
        <div className="fixed inset-0 z-[9999] bg-gray-900">
          <Canvas
            camera={{ position: [0, 0, 8], fov: 75 }}
            style={{ background: 'linear-gradient(135deg, #2a2a3e 0%, #1e2a4e 100%)' }}
            gl={{ antialias: true, alpha: true }}
          >
            <ambientLight intensity={0.5 * brightness} />
            <directionalLight position={[10, 10, 5]} intensity={1 * brightness} />
            <pointLight position={[-10, -10, -5]} intensity={0.5 * brightness} />
            
            <Suspense fallback={null}>
              <Model3D url={modelUrl} productColors={productColors} />
            </Suspense>
            
            <OrbitControls 
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              autoRotate={autoRotate}
              autoRotateSpeed={2}
              minDistance={2}
              maxDistance={15}
            />
          </Canvas>
          
          {/* Fullscreen Controls */}
          <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
            <Button
              className="bg-green-600 hover:bg-green-700"
              size="sm"
              onClick={resetView}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            
            {/* Brightness Control */}
            <div className="bg-black/50 rounded-lg p-3 min-w-[200px]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white text-sm font-medium">Brightness</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20 h-6 w-6 p-0"
                  onClick={() => setIsBrightnessMinimized(!isBrightnessMinimized)}
                >
                  {isBrightnessMinimized ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
                </Button>
              </div>
              {!isBrightnessMinimized && (
                <Slider
                  value={[brightness]}
                  onValueChange={(value) => setBrightness(value[0])}
                  max={3}
                  min={0.1}
                  step={0.1}
                  className="w-full"
                />
              )}
            </div>
          </div>

          {/* Close button */}
          <Button
            className="absolute top-4 left-4 z-10 bg-red-600 hover:bg-red-700"
            size="sm"
            onClick={toggleFullscreen}
          >
            <Minimize2 className="h-4 w-4 mr-2" />
            Close
          </Button>

          {/* Model Info */}
          <div className="absolute bottom-4 left-4 z-10">
            <div className="bg-black/50 rounded px-3 py-2">
              <p className="text-white text-sm font-medium">
                {filename ? filename.replace(/\.[^/.]+$/, '') : 'Interactive 3D Model'}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
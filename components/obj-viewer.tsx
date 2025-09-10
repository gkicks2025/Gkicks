"use client"

import React, { useRef, useEffect, useState } from 'react'
import { AlertCircle, Download, FileType } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface OBJViewerProps {
  modelUrl: string
  productName: string
  autoRotate?: boolean
  zoom?: number
  onLoad?: () => void
  onError?: () => void
}

export default function OBJViewer({
  modelUrl,
  productName,
  autoRotate = false,
  zoom = 1,
  onLoad,
  onError
}: OBJViewerProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<any>(null)
  const sceneRef = useRef<any>(null)
  const animationIdRef = useRef<number | null>(null)

  useEffect(() => {
    if (!modelUrl) {
      setIsLoading(false)
      setHasError(true)
      onError?.()
      return
    }

    // Load Three.js and OBJ loader dynamically
    const loadThreeJS = async () => {
      try {
        const THREE = await import('three')
        const { OBJLoader } = await import('three/examples/jsm/loaders/OBJLoader.js')
        const { MTLLoader } = await import('three/examples/jsm/loaders/MTLLoader.js')
        
        if (!canvasRef.current) return

        // Scene setup
        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000)
        const renderer = new THREE.WebGLRenderer({ 
          canvas: canvasRef.current,
          antialias: true,
          alpha: true
        })
        
        // Store references for cleanup
        rendererRef.current = renderer
        sceneRef.current = scene
        
        renderer.setSize(400, 400)
        renderer.setClearColor(0x000000, 0)
        renderer.shadowMap.enabled = true
        renderer.shadowMap.type = THREE.PCFSoftShadowMap

        // Lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6)
        scene.add(ambientLight)
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
        directionalLight.position.set(10, 10, 5)
        directionalLight.castShadow = true
        scene.add(directionalLight)

        // Load OBJ model
        const objLoader = new OBJLoader()
        
        // Try to load MTL file first (if exists)
        const mtlPath = modelUrl.replace('.obj', '.mtl')
        const mtlLoader = new MTLLoader()
        
        try {
          const materials = await new Promise<any>((resolve, reject) => {
            mtlLoader.load(
              mtlPath,
              resolve,
              undefined,
              () => resolve(null) // MTL not found, continue without materials
            )
          })
          
          if (materials && typeof materials.preload === 'function') {
            materials.preload()
            objLoader.setMaterials(materials)
          }
        } catch (e) {
          console.log('MTL file not found, loading OBJ without materials')
        }

        objLoader.load(
          modelUrl,
          (object) => {
            // Center and scale the model
            const box = new THREE.Box3().setFromObject(object)
            const center = box.getCenter(new THREE.Vector3())
            const size = box.getSize(new THREE.Vector3())
            
            object.position.sub(center)
            const maxDim = Math.max(size.x, size.y, size.z)
            const scale = 2 / maxDim
            object.scale.setScalar(scale)
            
            // Add default material if none exists
            object.traverse((child: any) => {
              if (child.isMesh && !child.material) {
                child.material = new THREE.MeshLambertMaterial({ color: 0x888888 })
              }
            })
            
            scene.add(object)
            camera.position.z = 3
            
            // Animation loop
            const animate = () => {
              animationIdRef.current = requestAnimationFrame(animate)
              if (autoRotate) {
                object.rotation.y += 0.01
              }
              renderer.render(scene, camera)
            }
            animate()
            
            setIsLoading(false)
            setHasError(false)
            onLoad?.()
          },
          (progress) => {
            console.log('Loading progress:', (progress.loaded / progress.total * 100) + '%')
          },
          (error) => {
            console.error('Error loading OBJ model:', error)
            setIsLoading(false)
            setHasError(true)
            onError?.()
          }
        )
        
      } catch (error) {
        console.error('Error loading Three.js:', error)
        setIsLoading(false)
        setHasError(true)
        onError?.()
      }
    }

    loadThreeJS()
    
    // Cleanup function
    return () => {
      // Cancel animation frame
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
        animationIdRef.current = null
      }
      
      // Dispose of Three.js resources
      if (rendererRef.current) {
        rendererRef.current.dispose()
        rendererRef.current = null
      }
      
      if (sceneRef.current) {
        // Dispose of all objects in the scene
        sceneRef.current.traverse((object: any) => {
          if (object.geometry) {
            object.geometry.dispose()
          }
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach((material: any) => material.dispose())
            } else {
              object.material.dispose()
            }
          }
        })
        sceneRef.current = null
      }
    }
  }, [modelUrl, autoRotate, onLoad, onError])

  if (isLoading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50/50 to-indigo-100/50 dark:from-gray-800/50 dark:to-gray-900/50">
        <div className="text-center space-y-4 p-6 bg-white/80 dark:bg-gray-800/80 rounded-lg backdrop-blur-sm">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">Loading OBJ Model</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Preparing 3D viewer...</p>
        </div>
      </div>
    )
  }

  if (hasError) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-red-50/50 to-orange-100/50 dark:from-gray-800/50 dark:to-gray-900/50">
        <div className="text-center space-y-4 p-6 bg-white/80 dark:bg-gray-800/80 rounded-lg backdrop-blur-sm">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
              3D Model Unavailable
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              The 3D model could not be displayed
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              The model file may be missing or corrupted
            </p>
          </div>
          <Button 
            onClick={() => window.location.reload()}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
      <canvas 
        ref={canvasRef}
        className="w-full h-full"
        style={{ display: 'block' }}
      />
    </div>
  )
}
'use client'

import React, { Suspense, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, useProgress, Environment } from '@react-three/drei'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { Mesh, Group, Material } from 'three'
import * as THREE from 'three'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Maximize2, Minimize2, RotateCcw, Sun, ChevronDown, ChevronUp } from 'lucide-react'

// Color mapping function for sneaker parts
function getColorForMesh(mesh: Mesh, productColors: string[]): number {
  const meshName = mesh.name?.toLowerCase() || ''
  const position = mesh.position
  
  // Color mapping based on common sneaker color schemes
  const colorMap: { [key: string]: number } = {
    'black': 0x1a1a1a,
    'white': 0xf5f5f5,
    'red': 0xdc2626,
    'blue': 0x2563eb,
    'green': 0x16a34a,
    'yellow': 0xeab308,
    'orange': 0xea580c,
    'purple': 0x9333ea,
    'pink': 0xec4899,
    'gray': 0x6b7280,
    'grey': 0x6b7280,
    'brown': 0x92400e,
    'navy': 0x1e3a8a,
    'silver': 0xd1d5db
  }
  
  // If no product colors available, use default scheme
  if (productColors.length === 0) {
    return 0xf5f5f5 // Default white
  }
  
  // Assign colors based on mesh characteristics and position
  const primaryColor = productColors[0]?.toLowerCase() || 'white'
  const secondaryColor = productColors[1]?.toLowerCase() || primaryColor
  const accentColor = productColors[2]?.toLowerCase() || secondaryColor
  
  // Sole (bottom part) - usually white or secondary color
  if (position.y < -0.5 || meshName.includes('sole') || meshName.includes('bottom')) {
    return colorMap[secondaryColor] || colorMap['white'] || 0xf5f5f5
  }
  
  // Laces and small details - accent color
  if (meshName.includes('lace') || meshName.includes('eyelet') || meshName.includes('logo')) {
    return colorMap[accentColor] || colorMap[primaryColor] || 0x1a1a1a
  }
  
  // Upper part of shoe - primary color
  if (position.y > 0 || meshName.includes('upper') || meshName.includes('body')) {
    return colorMap[primaryColor] || 0xf5f5f5
  }
  
  // Default to primary color
  return colorMap[primaryColor] || 0xf5f5f5
}

interface Model3DProps {
  url: string
  productColors?: string[]
}

function Model3D({ url, productColors = [] }: Model3DProps) {
  const meshRef = useRef<Group>(null)
  const [isRotating, setIsRotating] = useState(false)
  const [loadedModel, setLoadedModel] = useState<THREE.Group | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useFrame((state, delta) => {
    if (meshRef.current && isRotating) {
      meshRef.current.rotation.y += delta * 0.5
    }
  })

  // Load model with materials (OBJ + MTL with fallback)
  React.useEffect(() => {
    const loadModel = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        const filename = url.split('/').pop() || ''
        const fileExtension = filename.split('.').pop()?.toLowerCase()
        
        console.log('🔄 Starting 3D model loading:', url, 'Extension:', fileExtension)
        
        let obj: THREE.Group
        
        // Handle GLB/GLTF files
        if (fileExtension === 'glb' || fileExtension === 'gltf') {
          console.log('🔄 Loading GLB/GLTF file:', url)
          const gltfLoader = new GLTFLoader()
          const gltf = await gltfLoader.loadAsync(url)
          obj = gltf.scene
          console.log('✅ GLB/GLTF file loaded:', obj)
        } else {
          // Handle OBJ files with MTL materials
          console.log('🔄 Starting OBJ+MTL loading:', url)
          // Extract base filename from URL (without .obj extension)
          const objFilename = filename
          const baseFilename = objFilename.replace('.obj', '')
          
          const objLoader = new OBJLoader()
        
        // Try to find the corresponding MTL file
        // Try multiple patterns to find the MTL file
        const possibleMtlPatterns = [
          `${baseFilename}.mtl`, // Simple pattern
          `${baseFilename}-nike_air_zoom_pegasus_36.mtl`, // Nike shoe pattern with prefix
          `${baseFilename}-model.mtl`, // Generic model pattern
          `${baseFilename}-material.mtl`, // Material pattern
          `${baseFilename}-*.mtl`, // Wildcard pattern (will be handled specially)
          `nike_air_zoom_pegasus_36.mtl` // Original filename pattern
        ]
        
        // Also try to find MTL files that match the prefix pattern
        // Extract the prefix from the OBJ filename (e.g., "3d-model-1755423231919-lzj3n5dmhs8")
        const prefixMatch = baseFilename.match(/^(3d-model-\d+-[a-z0-9]+)$/)
        if (prefixMatch) {
          const prefix = prefixMatch[1]
          // Add patterns with the extracted prefix
          possibleMtlPatterns.unshift(
            `${prefix}-nike_air_zoom_pegasus_36.mtl`,
            `${prefix}-material.mtl`,
            `${prefix}-model.mtl`
          )
        }
        
        // Try to find any MTL file with the same prefix by scanning directory
        try {
          const response = await fetch('/api/list-3d-files', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prefix: baseFilename })
          })
          
          if (response.ok) {
            const data = await response.json()
            if (data.mtlFiles && data.mtlFiles.length > 0) {
              // Add any found MTL files to the beginning of the patterns list
              data.mtlFiles.forEach((mtlFile: string) => {
                possibleMtlPatterns.unshift(mtlFile)
              })
              console.log('🔍 Found MTL files via API:', data.mtlFiles)
            }
          }
        } catch (apiError) {
          console.log('⚠️ Could not fetch MTL files via API, using fallback patterns')
        }
        
        let mtlUrl = ''
        let mtlFound = false
        
        console.log('🔍 All MTL patterns to try:', possibleMtlPatterns)
        
        // Try each pattern to find the MTL file
        for (const pattern of possibleMtlPatterns) {
          // Skip wildcard patterns in direct testing
          if (pattern.includes('*')) {
            continue;
          }
          
          try {
            const testUrl = `/uploads/3d-models/${pattern}`
            console.log('🔍 Checking for MTL file:', testUrl)
            const response = await fetch(testUrl, { method: 'HEAD' })
            if (response.ok) {
              mtlUrl = testUrl
              mtlFound = true
              console.log('✅ Found MTL file:', mtlUrl)
              break
            } else {
              console.log('❌ MTL file not found:', testUrl, 'Status:', response.status)
            }
          } catch (e) {
            console.log('❌ MTL file not found:', pattern)
          }
        }
        
        if (mtlFound && mtlUrl) {
          try {
            // Try to load MTL file
            console.log('🔄 Loading MTL file:', mtlUrl)
            const mtlLoader = new MTLLoader()
            
            // Set the resource path for textures - this is crucial for texture loading
            mtlLoader.setResourcePath('/uploads/3d-models/')
            
            // Configure material options for better rendering
            // Note: setMaterialOptions may not be available in newer Three.js versions
            // mtlLoader.setMaterialOptions({ 
            //   side: THREE.DoubleSide,
            //   transparent: false,
            //   alphaTest: 0.1
            // })
            
            const materials = await mtlLoader.loadAsync(mtlUrl)
            
            // Enhanced material processing with texture loading fixes
            console.log('🔄 Processing MTL materials...')
            materials.preload()
            
            // Fix texture loading issues by ensuring proper texture configuration
            Object.values(materials.materials).forEach((material: any) => {
              if (material) {
                // Ensure textures are properly configured
                if (material.map) {
                  material.map.wrapS = THREE.RepeatWrapping
                  material.map.wrapT = THREE.RepeatWrapping
                  material.map.flipY = false
                  console.log('🎨 Configured diffuse texture:', material.map.image?.src || 'loading...')
                }
                
                // Configure normal maps
                if (material.normalMap) {
                  material.normalMap.wrapS = THREE.RepeatWrapping
                  material.normalMap.wrapT = THREE.RepeatWrapping
                  material.normalMap.flipY = false
                  console.log('🎨 Configured normal map:', material.normalMap.image?.src || 'loading...')
                }
                
                // Configure roughness/metallic maps
                if (material.roughnessMap) {
                  material.roughnessMap.wrapS = THREE.RepeatWrapping
                  material.roughnessMap.wrapT = THREE.RepeatWrapping
                  material.roughnessMap.flipY = false
                  console.log('🎨 Configured roughness map:', material.roughnessMap.image?.src || 'loading...')
                }
                
                // Ensure proper material properties
                material.side = THREE.DoubleSide
                material.needsUpdate = true
                
                console.log('🎨 Enhanced material:', material.name, {
                  hasTexture: !!material.map,
                  hasNormal: !!material.normalMap,
                  hasRoughness: !!material.roughnessMap,
                  color: material.color
                })
              }
            })
            
            console.log('✅ MTL materials loaded and enhanced:', materials)
            
            // Load OBJ file with materials
            console.log('🔄 Loading OBJ file with materials:', url)
            objLoader.setMaterials(materials)
            obj = await objLoader.loadAsync(url)
            console.log('✅ OBJ file loaded with materials:', obj)
          } catch (mtlError) {
            console.warn('⚠️ Failed to load MTL materials:', mtlError)
            console.log('🔄 Loading OBJ without materials as fallback')
            
            // Fallback: Load OBJ without materials
            obj = await objLoader.loadAsync(url)
            console.log('✅ OBJ loaded without materials (fallback):', obj)
          }
        } else {
          console.log('⚠️ No MTL file found, loading OBJ only')
          // Fallback to OBJ-only loading
          obj = await objLoader.loadAsync(url)
          console.log('✅ OBJ file loaded without materials:', obj)
        }
        } // End of OBJ handling
        
        // Calculate bounding box to center and scale the model
        const box = new THREE.Box3().setFromObject(obj)
        const center = box.getCenter(new THREE.Vector3())
        const size = box.getSize(new THREE.Vector3())
        
        console.log('📏 Model dimensions:', size)
        console.log('📍 Model center:', center)
        
        // Center the model
        obj.position.sub(center)
        
        // Scale the model to fit in view
        const maxDim = Math.max(size.x, size.y, size.z)
        const scale = 2 / maxDim
        obj.scale.setScalar(scale)
        
        console.log('🔧 Applied scale:', scale)
        
        // Enhance materials for better rendering while preserving textures
        obj.traverse((child) => {
          if (child instanceof Mesh) {
            if (child.material) {
              // Enhance existing material from MTL - preserve textures!
              if (Array.isArray(child.material)) {
                child.material.forEach(mat => {
                  if (mat instanceof THREE.Material) {
                    mat.side = THREE.DoubleSide
                    
                    // Enhance MTL materials with better lighting while preserving textures
                    if (mat instanceof THREE.MeshLambertMaterial || mat instanceof THREE.MeshPhongMaterial) {
                      (mat as any).shininess = (mat as any).shininess || 30
                    }
                    
                    // Ensure textures are properly applied and visible
                    if ((mat as any).map) {
                      (mat as any).map.needsUpdate = true
                      console.log('🎨 Preserved diffuse texture on material:', (mat as any).map.image?.src)
                    }
                    
                    if ((mat as any).normalMap) {
                      (mat as any).normalMap.needsUpdate = true
                      console.log('🎨 Preserved normal map on material:', (mat as any).normalMap.image?.src)
                    }
                    
                    mat.needsUpdate = true
                  }
                })
              } else if (child.material instanceof THREE.Material) {
                child.material.side = THREE.DoubleSide
                
                // Enhance MTL materials with better lighting while preserving textures
                if (child.material instanceof THREE.MeshLambertMaterial || child.material instanceof THREE.MeshPhongMaterial) {
                  (child.material as any).shininess = (child.material as any).shininess || 30
                }
                
                // Ensure textures are properly applied and visible
                if ((child.material as any).map) {
                  (child.material as any).map.needsUpdate = true
                  console.log('🎨 Preserved diffuse texture on material:', (child.material as any).map.image?.src)
                }
                
                if ((child.material as any).normalMap) {
                  (child.material as any).normalMap.needsUpdate = true
                  console.log('🎨 Preserved normal map on material:', (child.material as any).normalMap.image?.src)
                }
                
                child.material.needsUpdate = true
              }
              
              console.log('🎨 Enhanced MTL material for mesh:', child.name, {
                material: child.material,
                hasTexture: !!(child.material as any).map,
                hasNormal: !!(child.material as any).normalMap,
                textureUrl: (child.material as any).map?.image?.src
              })
            } else {
              // Apply realistic colored material based on product colors as fallback
              const materialColor = getColorForMesh(child, productColors)
              child.material = new THREE.MeshPhongMaterial({
                color: materialColor,
                shininess: 30,
                side: THREE.DoubleSide,
                transparent: false
              })
              console.log('🎨 Applied fallback colored material to mesh:', materialColor.toString(16))
            }
          }
        })
        
        console.log('✅ Model processed and ready to render')
        
        setLoadedModel(obj)
        setIsLoading(false)
        console.log('✅ Model set in state:', obj)
      } catch (error) {
        console.error('❌ Error loading 3D model:', error)
        setError(error instanceof Error ? error.message : 'Failed to load 3D model')
        setIsLoading(false)
      }
    }
    
    loadModel()
  }, [url])

  console.log('🎨 Rendering Model3D component, loadedModel:', loadedModel)
  
  return (
    <group ref={meshRef}>
      {loadedModel && (
        <>
          {console.log('🎨 Rendering primitive with model:', loadedModel)}
          <primitive object={loadedModel} />
        </>
      )}
      
      {/* Show loading indicator if no model is loaded yet */}
      {!loadedModel && !error && isLoading && (
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshLambertMaterial color="#4CAF50" transparent opacity={0.7} />
        </mesh>
      )}
      
      {/* Show error indicator if loading failed */}
      {error && (
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshLambertMaterial color="#f87171" transparent opacity={0.7} />
        </mesh>
      )}
    </group>
  )
}

function Loader({ error }: { error?: string | null }) {
  const { progress } = useProgress()
  
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
      <div>Loading 3D Model... {progress.toFixed(0)}%</div>
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

  const resetCamera = () => {
    // This will be handled by OrbitControls reset
    window.location.reload() // Simple reset for now
  }

  return (
    <>
      {/* Normal view container */}
      {!isFullscreen && (
        <div className={`relative ${className}`}>
          <div className="relative bg-gray-900 rounded-lg overflow-hidden transition-all duration-300 w-full h-96">
            {/* Controls */}
            <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-black/50 border-gray-600 text-white hover:bg-black/70"
                  onClick={() => setAutoRotate(!autoRotate)}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-black/50 border-gray-600 text-white hover:bg-black/70"
                  onClick={toggleFullscreen}
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>
              {/* Brightness Control */}
              <div className="bg-black/50 border border-gray-600 rounded-md p-2">
                <div className="flex items-center gap-2 justify-between">
                  <div className="flex items-center gap-2">
                    <Sun className="h-4 w-4 text-white" />
                    {!isBrightnessMinimized && (
                      <>
                        <Slider
                          value={[brightness]}
                          onValueChange={(value) => setBrightness(value[0])}
                          max={3.0}
                          min={0.1}
                          step={0.1}
                          className="flex-1 min-w-[100px]"
                        />
                        <span className="text-white text-xs min-w-[30px]">{brightness.toFixed(1)}</span>
                      </>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 text-white hover:bg-white/20"
                    onClick={() => setIsBrightnessMinimized(!isBrightnessMinimized)}
                  >
                    {isBrightnessMinimized ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
            </div>

            {/* Model Info */}
            <div className="absolute bottom-4 left-4 z-10">
              <div className="bg-black/50 rounded px-3 py-2">
                <p className="text-white text-sm font-medium">
                  {filename ? filename.replace(/\.[^/.]+$/, '') : 'Interactive 3D Model'}
                </p>
              </div>
            </div>

            {/* 3D Canvas */}
            <Canvas 
              camera={{ position: [0, 0, 8], fov: 75 }}
              style={{ background: 'linear-gradient(135deg, #2a2a3e 0%, #1e2a4e 100%)' }}
              gl={{ antialias: true, alpha: true }}
            >
              {/* Professional lighting setup for enhanced 3D model visibility - Brightness Controlled */}
               {/* Ambient base lighting - Brightness Controlled */}
               <ambientLight intensity={2.0 * brightness} color="#ffffff" />
               
               {/* Hemisphere light for natural sky/ground lighting - Brightness Controlled */}
               <hemisphereLight 
                 args={["#ffffff", "#ffffff", 2.5 * brightness]}
               />
               
               {/* Main key light - primary illumination - Brightness Controlled */}
               <directionalLight 
                 position={[10, 10, 5]} 
                 intensity={3.5 * brightness} 
                 color="#ffffff"
                 castShadow 
                 shadow-mapSize-width={2048}
                 shadow-mapSize-height={2048}
                 shadow-camera-far={50}
                 shadow-camera-left={-10}
                 shadow-camera-right={10}
                 shadow-camera-top={10}
                 shadow-camera-bottom={-10}
               />
               
               {/* Fill light - softer secondary lighting - Brightness Controlled */}
               <directionalLight 
                 position={[-8, 6, -3]} 
                 intensity={2.2 * brightness} 
                 color="#ffffff"
               />
               
               {/* Rim light - creates edge definition - Brightness Controlled */}
               <directionalLight 
                 position={[0, 0, -10]} 
                 intensity={2.5 * brightness} 
                 color="#ffffff"
               />
               
               {/* Spot lights for dramatic effect - Brightness Controlled */}
               <spotLight 
                 position={[5, 8, 5]} 
                 intensity={1.2 * brightness}
                 angle={Math.PI / 6}
                 penumbra={0.3}
                 color="#ffffff"
                 castShadow
               />
               
               {/* Bottom fill light to reduce harsh shadows - Brightness Controlled */}
               <pointLight 
                 position={[0, -5, 3]} 
                 intensity={0.7 * brightness} 
                 color="#87CEEB"
               />
               
               {/* Side accent lights - Brightness Controlled */}
                 <pointLight 
                   position={[8, 2, 0]} 
                   intensity={0.6 * brightness} 
                   color="#ffb347"
                 />
                 <pointLight 
                   position={[-8, 2, 0]} 
                   intensity={0.6 * brightness} 
                   color="#b3d9ff"
                 />
                 
                 {/* Additional comprehensive lighting for maximum brightness */}
                 {/* Top ring lights for even illumination */}
                 <pointLight 
                   position={[0, 8, 8]} 
                   intensity={0.8} 
                   color="#ffffff"
                 />
                 <pointLight 
                   position={[0, 8, -8]} 
                   intensity={0.8} 
                   color="#ffffff"
                 />
                 
                 {/* Corner fill lights */}
                 <pointLight 
                   position={[6, 6, 6]} 
                   intensity={0.5} 
                   color="#f0f8ff"
                 />
                 <pointLight 
                   position={[-6, 6, 6]} 
                   intensity={0.5} 
                   color="#f0f8ff"
                 />
                 <pointLight 
                   position={[6, 6, -6]} 
                   intensity={0.5} 
                   color="#f0f8ff"
                 />
                 <pointLight 
                   position={[-6, 6, -6]} 
                   intensity={0.5} 
                   color="#f0f8ff"
                 />
                 
                 {/* Mid-level ring lights */}
                 <pointLight 
                   position={[10, 0, 0]} 
                   intensity={0.4} 
                   color="#ffe4b5"
                 />
                 <pointLight 
                   position={[-10, 0, 0]} 
                   intensity={0.4} 
                   color="#e6f3ff"
                 />
                 <pointLight 
                   position={[0, 0, 10]} 
                   intensity={0.4} 
                   color="#fff8dc"
                 />
                 
                 {/* Additional spot lights for enhanced drama */}
                 <spotLight 
                   position={[-5, 8, -5]} 
                   intensity={0.9}
                   angle={Math.PI / 4}
                   penumbra={0.4}
                   color="#ffffff"
                 />
                 <spotLight 
                   position={[5, -3, 8]} 
                   intensity={0.7}
                   angle={Math.PI / 5}
                   penumbra={0.3}
                   color="#f5f5dc"
                 />
                 
                 {/* Environment simulation lights */}
                 <directionalLight 
                   position={[3, 3, 3]} 
                   intensity={0.4} 
                   color="#ffefd5"
                 />
                 <directionalLight 
                   position={[-3, -3, 3]} 
                   intensity={0.4} 
                   color="#e0f6ff"
                 />
               
               {/* Additional comprehensive lighting for maximum brightness */}
               {/* Top ring lights for even illumination */}
               <pointLight 
                 position={[0, 8, 8]} 
                 intensity={0.8} 
                 color="#ffffff"
               />
               <pointLight 
                 position={[0, 8, -8]} 
                 intensity={0.8} 
                 color="#ffffff"
               />
               
               {/* Corner fill lights */}
               <pointLight 
                 position={[6, 6, 6]} 
                 intensity={0.5} 
                 color="#f0f8ff"
               />
               <pointLight 
                 position={[-6, 6, 6]} 
                 intensity={0.5} 
                 color="#f0f8ff"
               />
               <pointLight 
                 position={[6, 6, -6]} 
                 intensity={0.5} 
                 color="#f0f8ff"
               />
               <pointLight 
                 position={[-6, 6, -6]} 
                 intensity={0.5} 
                 color="#f0f8ff"
               />
               
               {/* Mid-level ring lights */}
               <pointLight 
                 position={[10, 0, 0]} 
                 intensity={0.4} 
                 color="#ffe4b5"
               />
               <pointLight 
                 position={[-10, 0, 0]} 
                 intensity={0.4} 
                 color="#e6f3ff"
               />
               <pointLight 
                 position={[0, 0, 10]} 
                 intensity={0.4} 
                 color="#fff8dc"
               />
               
               {/* Additional spot lights for enhanced drama */}
               <spotLight 
                 position={[-5, 8, -5]} 
                 intensity={0.9}
                 angle={Math.PI / 4}
                 penumbra={0.4}
                 color="#ffffff"
               />
               <spotLight 
                 position={[5, -3, 8]} 
                 intensity={0.7}
                 angle={Math.PI / 5}
                 penumbra={0.3}
                 color="#f5f5dc"
               />
               
               {/* Environment simulation lights */}
               <directionalLight 
                 position={[3, 3, 3]} 
                 intensity={0.4} 
                 color="#ffefd5"
               />
               <directionalLight 
                 position={[-3, -3, 3]} 
                 intensity={0.4} 
                 color="#e0f6ff"
               />
              
              <Suspense fallback={<Loader />}>
                  <Model3D url={modelUrl} productColors={productColors} />
                </Suspense>
              
              <OrbitControls 
                enablePan={true}
                enableZoom={true}
                enableRotate={true}
                autoRotate={autoRotate}
                autoRotateSpeed={2}
                minDistance={1}
                maxDistance={10}
              />
            </Canvas>
          </div>
        </div>
      )}

      {/* Fullscreen view - completely independent */}
      {isFullscreen && (
        <div className="fixed inset-0 z-[9999] bg-gray-900 overflow-hidden">
           {/* Controls */}
           <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
             <div className="flex gap-2">
               <Button
                 size="sm"
                 variant="outline"
                 className="bg-black/50 border-gray-600 text-white hover:bg-black/70"
                 onClick={() => setAutoRotate(!autoRotate)}
               >
                 <RotateCcw className="h-4 w-4" />
               </Button>
               <Button
                 size="sm"
                 variant="outline"
                 className="bg-black/50 border-gray-600 text-white hover:bg-black/70"
                 onClick={toggleFullscreen}
               >
                 <Minimize2 className="h-4 w-4" />
               </Button>
             </div>
             {/* Brightness Control */}
             <div className="bg-black/50 border border-gray-600 rounded-md p-2">
               <div className="flex items-center gap-2 justify-between">
                 <div className="flex items-center gap-2">
                   <Sun className="h-4 w-4 text-white" />
                   {!isBrightnessMinimized && (
                     <>
                       <Slider
                         value={[brightness]}
                         onValueChange={(value) => setBrightness(value[0])}
                         max={3.0}
                         min={0.1}
                         step={0.1}
                         className="flex-1 min-w-[100px]"
                       />
                       <span className="text-white text-xs min-w-[30px]">{brightness.toFixed(1)}</span>
                     </>
                   )}
                 </div>
                 <Button
                   size="sm"
                   variant="ghost"
                   className="h-6 w-6 p-0 text-white hover:bg-white/20"
                   onClick={() => setIsBrightnessMinimized(!isBrightnessMinimized)}
                 >
                   {isBrightnessMinimized ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
                 </Button>
               </div>
             </div>
           </div>

           {/* Close button for fullscreen */}
           <Button
             className="absolute top-4 left-4 z-10 bg-red-600 hover:bg-red-700"
             size="sm"
             onClick={toggleFullscreen}
           >
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

           {/* 3D Canvas */}
           <Canvas
              camera={{ position: [0, 0, 8], fov: 75 }}
              style={{ background: 'linear-gradient(135deg, #2a2a3e 0%, #1e2a4e 100%)' }}
              gl={{ antialias: true, alpha: true }}
            >
             {/* Professional lighting setup for enhanced 3D model visibility - Brightness Controlled */}
               {/* Ambient base lighting - Brightness Controlled */}
               <ambientLight intensity={2.0 * brightness} color="#ffffff" />
              
              {/* Hemisphere light for natural sky/ground lighting - Brightness Controlled */}
               <hemisphereLight 
                 args={["#ffffff", "#ffffff", 2.5 * brightness]}
               />
              
              {/* Main key light - primary illumination - Brightness Controlled */}
               <directionalLight 
                 position={[10, 10, 5]} 
                 intensity={3.5 * brightness} 
                 color="#ffffff"
                 castShadow 
                 shadow-mapSize-width={2048}
                 shadow-mapSize-height={2048}
                 shadow-camera-far={50}
                 shadow-camera-left={-10}
                 shadow-camera-right={10}
                 shadow-camera-top={10}
                 shadow-camera-bottom={-10}
               />
              
              {/* Fill light - softer secondary lighting - Brightness Controlled */}
               <directionalLight 
                 position={[-8, 6, -3]} 
                 intensity={2.2 * brightness} 
                 color="#ffffff"
               />
              
              {/* Rim light - creates edge definition - Brightness Controlled */}
               <directionalLight 
                 position={[0, 0, -10]} 
                 intensity={2.5 * brightness} 
                 color="#ffffff"
               />
              
              {/* Spot lights for dramatic effect - Brightness Controlled */}
              <spotLight 
                position={[5, 8, 5]} 
                intensity={1.2 * brightness}
                angle={Math.PI / 6}
                penumbra={0.3}
                color="#ffffff"
                castShadow
              />
              
              {/* Bottom fill light to reduce harsh shadows - Brightness Controlled */}
              <pointLight 
                position={[0, -5, 3]} 
                intensity={0.7 * brightness} 
                color="#87CEEB"
              />
              
              {/* Side accent lights - Brightness Controlled */}
              <pointLight 
                position={[8, 2, 0]} 
                intensity={0.6 * brightness} 
                color="#ffb347"
              />
              <pointLight 
                position={[-8, 2, 0]} 
                intensity={0.6 * brightness} 
                color="#b3d9ff"
              />
             
             <Suspense fallback={<Loader />}>
                 <Model3D url={modelUrl} productColors={productColors} />
               </Suspense>
             
             <OrbitControls 
               enablePan={true}
               enableZoom={true}
               enableRotate={true}
               autoRotate={autoRotate}
               autoRotateSpeed={2}
               minDistance={1}
               maxDistance={10}
             />
           </Canvas>
         </div>
       )}
    </>
  )
}
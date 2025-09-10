"use client"

import React, { useState, useRef, useEffect, Suspense } from "react"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Play, 
  Pause,
  RotateCw,
  Move3D,
  Eye,
  Settings,
  Download,
  FileType,
  AlertCircle
} from "lucide-react"

// Dynamic import for Three.js components with SSR disabled
const OBJViewer = dynamic(() => import('@/components/obj-viewer'), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-gray-200 w-full h-full rounded" />
})

interface ThreeDProductViewerProps {
  modelUrl?: string
  productName: string
  fallbackImage?: string
  className?: string
}

// Supported 3D file formats
const SUPPORTED_FORMATS = {
  GLB: ['.glb'],
  GLTF: ['.gltf'],
  OBJ: ['.obj'],
  MTL: ['.mtl'],
  ZIP: ['.zip']
} as const

type SupportedFormat = keyof typeof SUPPORTED_FORMATS

export function ThreeDProductViewer({ 
  modelUrl, 
  productName, 
  fallbackImage,
  className = "" 
}: ThreeDProductViewerProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [scriptError, setScriptError] = useState(false)
  const [isAutoRotate, setIsAutoRotate] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState({ x: 0, y: 0 })
  const [isClient, setIsClient] = useState(false)
  const viewerRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Check if 3D model is available
  const has3DModel = modelUrl && modelUrl.trim() !== ""
  
  // Detect file format
  const getFileFormat = (url: string): SupportedFormat | null => {
    if (!url) return null
    const lowerUrl = url.toLowerCase()
    
    for (const [format, extensions] of Object.entries(SUPPORTED_FORMATS)) {
      if (extensions.some(ext => lowerUrl.endsWith(ext))) {
        return format as SupportedFormat
      }
    }
    return null
  }
  
  const fileFormat = modelUrl ? getFileFormat(modelUrl) : null
  const isWebViewerSupported = fileFormat === 'GLB' || fileFormat === 'GLTF'
  const isOBJFormat = fileFormat === 'OBJ'
  const isZipFormat = fileFormat === 'ZIP'
  
  // Handle client-side rendering for Next.js SSR compatibility
  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (has3DModel) {
      console.log('3D Model URL:', modelUrl)
      console.log('Has 3D Model:', has3DModel)
      
      // Function to check and initialize model viewer
      const initializeModelViewer = () => {
        let attempts = 0
        const maxAttempts = 300 // 15 seconds with 50ms intervals
        
        const checkModelViewer = () => {
          attempts++
          
          if (typeof window !== 'undefined' && window.customElements && window.customElements.get('model-viewer')) {
            console.log('model-viewer is available')
            setIsLoading(false)
            setHasError(false)
            setScriptError(false)
            return
          }
          
          if (attempts >= maxAttempts) {
            console.error('model-viewer failed to load after timeout')
            setScriptError(true)
            setHasError(true)
            setIsLoading(false)
            return
          }
          
          setTimeout(checkModelViewer, 50)
        }
        
        checkModelViewer()
      }
      
      // Initialize model viewer
      initializeModelViewer()
      
      console.log('Initializing model-viewer...')
      setIsLoading(true)
      
      // Wait for model-viewer to load with more frequent checks
      const checkModelViewer = setInterval(() => {
        if (typeof window !== 'undefined' && window.customElements && window.customElements.get('model-viewer')) {
          console.log('model-viewer is now available')
          setIsLoading(false)
          setHasError(false)
          clearInterval(checkModelViewer)
        }
      }, 50) // Check every 50ms for faster response
      
      // Timeout after 15 seconds (increased timeout)
      const timeout = setTimeout(() => {
        clearInterval(checkModelViewer)
        console.error('model-viewer failed to load after 15 seconds')
        setHasError(true)
        setIsLoading(false)
      }, 15000)
      
      // Cleanup function
      return () => {
        clearInterval(checkModelViewer)
        clearTimeout(timeout)
      }
    } else {
      setIsLoading(false)
    }
  }, [has3DModel, modelUrl])

  const handleAutoRotateToggle = () => {
    setIsAutoRotate(!isAutoRotate)
  }

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.2, 3))
  }

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.2, 0.5))
  }

  const handleResetView = () => {
    setZoom(1)
    setRotation({ x: 0, y: 0 })
  }

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      viewerRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const handleRotateX = () => {
    setRotation(prev => ({ ...prev, x: prev.x + 90 }))
  }

  const handleRotateY = () => {
    setRotation(prev => ({ ...prev, y: prev.y + 90 }))
  }

  // If no 3D model is available, show fallback
  if (!has3DModel) {
    return (
      <Card className={`bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-2 border-dashed border-gray-300 dark:border-gray-600 ${className}`}>
        <CardContent className="p-8 text-center">
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <Move3D className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                3D Model Not Available
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                This product doesn't have a 3D model yet. Check back later for an interactive 3D view!
              </p>
            </div>
            <Badge variant="outline" className="text-xs">
              Coming Soon
            </Badge>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`relative ${className}`} ref={viewerRef}>
      <Card className="bg-card border-border shadow-lg overflow-hidden">
        <CardContent className="p-0 relative">
          {/* 3D Viewer Header */}
          <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/50 to-transparent p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Badge className="bg-blue-500 text-white text-xs">
                  <Move3D className="w-3 h-3 mr-1" />
                  3D Model
                </Badge>
                <Badge variant="outline" className="text-xs text-white border-white/30">
                  Interactive
                </Badge>
              </div>
              <div className="flex items-center space-x-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleAutoRotateToggle}
                  className="text-white hover:bg-white/20 h-8 w-8 p-0"
                  title={isAutoRotate ? "Pause rotation" : "Start rotation"}
                >
                  {isAutoRotate ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleFullscreen}
                  className="text-white hover:bg-white/20 h-8 w-8 p-0"
                  title="Fullscreen"
                >
                  <Maximize2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* 3D Viewer Content */}
          <div className="relative aspect-square bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50/50 to-indigo-100/50 dark:from-gray-800/50 dark:to-gray-900/50">
                <div className="text-center space-y-4 p-6 bg-white/80 dark:bg-gray-800/80 rounded-lg backdrop-blur-sm">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 bg-blue-500 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">Loading 3D Model</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Initializing 3D viewer...</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">This may take a few moments</p>
                  </div>
                </div>
              </div>
            ) : hasError ? (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-red-50/50 to-orange-100/50 dark:from-gray-800/50 dark:to-gray-900/50">
                <div className="text-center space-y-4 p-6 bg-white/80 dark:bg-gray-800/80 rounded-lg backdrop-blur-sm">
                  <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto">
                    <Eye className="w-8 h-8 text-red-500" />
                  </div>
                  <div>
                     <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                       {scriptError ? '3D Viewer Script Failed' : '3D Model Unavailable'}
                     </p>
                     <p className="text-sm text-gray-500 dark:text-gray-400">
                       {scriptError 
                         ? 'Failed to load the 3D viewer library' 
                         : 'The 3D model could not be displayed'
                       }
                     </p>
                     <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                       {scriptError 
                         ? 'Check your internet connection and firewall settings' 
                         : 'The model file may be missing or corrupted'
                       }
                     </p>
                   </div>
                  <Button 
                    onClick={() => window.location.reload()} 
                    size="sm" 
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    Retry
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {/* Render based on detected format and client-side state */}
                {!isClient ? (
                  /* SSR Placeholder */
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50/50 to-indigo-100/50 dark:from-gray-800/50 dark:to-gray-900/50">
                    <div className="text-center space-y-4 p-6 bg-white/80 dark:bg-gray-800/80 rounded-lg backdrop-blur-sm">
                      <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                      <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">Preparing 3D Viewer</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Initializing for optimal performance...</p>
                    </div>
                  </div>
                ) : isWebViewerSupported ? (
                  /* GLB/GLTF Model Viewer */
                  <Suspense fallback={
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="animate-pulse bg-gray-200 w-full h-full rounded" />
                    </div>
                  }>
                    {React.createElement('model-viewer', {
                      src: modelUrl,
                      alt: `3D model of ${productName}`,
                      'auto-rotate': isAutoRotate,
                      'camera-controls': true,
                      'disable-zoom': false,
                      'disable-pan': false,
                      style: {
                        width: '100%',
                        height: '100%',
                        transform: `scale(${zoom})`,
                        transition: 'transform 0.3s ease',
                        backgroundColor: 'transparent'
                      },
                      loading: "eager",
                      reveal: "auto",
                      'environment-image': "neutral",
                      'shadow-intensity': "1",
                      'shadow-softness': "0.5",
                      exposure: "1",
                      'tone-mapping': "aces",
                      'interaction-prompt': "auto",
                      'ar': false,
                      'ar-modes': "webxr scene-viewer quick-look",
                      onLoad: () => {
                        console.log('3D model loaded successfully:', modelUrl)
                        setIsLoading(false)
                        setHasError(false)
                      },
                      onError: (e: Event) => {
                        console.error('Failed to load 3D model:', modelUrl, e)
                        setHasError(true)
                        setIsLoading(false)
                      },
                      onProgress: (e: any) => {
                        console.log('3D model loading progress:', e.detail?.totalProgress || 'unknown')
                      }
                    } as any)}
                  </Suspense>
                ) : isOBJFormat ? (
                  /* OBJ Format Handler */
                  <Suspense fallback={
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="animate-pulse bg-gray-200 w-full h-full rounded" />
                    </div>
                  }>
                    <OBJViewer 
                      modelUrl={modelUrl!} 
                      productName={productName}
                      autoRotate={isAutoRotate}
                      zoom={zoom}
                      onLoad={() => {
                        setIsLoading(false)
                        setHasError(false)
                      }}
                      onError={() => {
                        setHasError(true)
                        setIsLoading(false)
                      }}
                    />
                  </Suspense>
                ) : isZipFormat ? (
                  /* ZIP Format Information */
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-50/50 to-blue-100/50 dark:from-gray-800/50 dark:to-gray-900/50">
                    <div className="text-center space-y-4 p-6 bg-white/80 dark:bg-gray-800/80 rounded-lg backdrop-blur-sm max-w-md">
                      <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto">
                        <Download className="w-8 h-8 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                          3D Model Archive
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          This is a ZIP archive containing 3D model files
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                          Extract and upload individual GLB/GLTF files for web viewing
                        </p>
                      </div>
                      <Button 
                        onClick={() => window.open(modelUrl, '_blank')} 
                        size="sm" 
                        className="bg-purple-500 hover:bg-purple-600 text-white"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download Archive
                      </Button>
                    </div>
                  </div>
                ) : fileFormat ? (
                  /* Other supported formats */
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-orange-50/50 to-red-100/50 dark:from-gray-800/50 dark:to-gray-900/50">
                    <div className="text-center space-y-4 p-6 bg-white/80 dark:bg-gray-800/80 rounded-lg backdrop-blur-sm max-w-md">
                      <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mx-auto">
                        <FileType className="w-8 h-8 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                          {fileFormat} Format Detected
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          This format is supported for upload but requires conversion for web viewing
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                          Supported formats: GLB, GLTF (web viewer) • OBJ, MTL, ZIP (download)
                        </p>
                      </div>
                      <Button 
                        onClick={() => window.open(modelUrl, '_blank')} 
                        size="sm" 
                        className="bg-orange-500 hover:bg-orange-600 text-white"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download File
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* Unknown format */
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-red-50/50 to-orange-100/50 dark:from-gray-800/50 dark:to-gray-900/50">
                    <div className="text-center space-y-4 p-6 bg-white/80 dark:bg-gray-800/80 rounded-lg backdrop-blur-sm max-w-md">
                      <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto">
                        <AlertCircle className="w-8 h-8 text-red-600" />
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                          Unsupported Format
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          This file format is not recognized by the 3D viewer
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                          Supported: GLB, GLTF, OBJ, MTL, ZIP
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Loading overlay for model */}
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="bg-black/50 backdrop-blur-sm rounded-lg p-3">
                    <div className="flex items-center justify-between text-white text-xs">
                      <span>Drag to rotate • Scroll to zoom</span>
                      <Badge className="bg-green-500 text-white text-xs">
                        Ready
                      </Badge>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* 3D Viewer Controls */}
          <div className="absolute bottom-4 right-4 flex flex-col space-y-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleZoomIn}
              className="h-8 w-8 p-0 bg-white/90 hover:bg-white shadow-lg"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleZoomOut}
              className="h-8 w-8 p-0 bg-white/90 hover:bg-white shadow-lg"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleRotateX}
              className="h-8 w-8 p-0 bg-white/90 hover:bg-white shadow-lg"
              title="Rotate X"
            >
              <RotateCw className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleRotateY}
              className="h-8 w-8 p-0 bg-white/90 hover:bg-white shadow-lg"
              title="Rotate Y"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleResetView}
              className="h-8 w-8 p-0 bg-white/90 hover:bg-white shadow-lg"
              title="Reset View"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 3D Model Info */}
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          <Move3D className="w-4 h-4 inline mr-1" />
          Interactive 3D model of {productName}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
          Drag to rotate • Scroll to zoom • Click controls to adjust view
        </p>
      </div>
    </div>
  )
}

export default ThreeDProductViewer
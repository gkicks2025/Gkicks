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
  console.log('🚀 ThreeDProductViewer component rendered with modelUrl:', modelUrl)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [scriptError, setScriptError] = useState(false)
  const [isAutoRotate, setIsAutoRotate] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState({ x: 0, y: 0 })
  const [isClient, setIsClient] = useState(false)
  // Removed loadingTimeout - using infinite loading instead
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
    console.log('🔄 ThreeDProductViewer: Component mounting...')
    console.log('🔍 ThreeDProductViewer: has3DModel:', has3DModel)
    console.log('🔍 ThreeDProductViewer: modelUrl:', modelUrl)
    console.log('🔍 ThreeDProductViewer: fileFormat:', fileFormat)
    console.log('🔍 ThreeDProductViewer: isWebViewerSupported:', isWebViewerSupported)
    
    setIsClient(true)
    
    // Load model-viewer script if not already loaded
    if (typeof window !== 'undefined') {
      console.log('🌐 ThreeDProductViewer: Window is available')
      
      // Check if model-viewer is already loaded
      if (window.customElements && window.customElements.get('model-viewer')) {
        console.log('✅ ThreeDProductViewer: model-viewer already loaded')
        setScriptError(false)
        return
      }

      // Check if script is already in the document
      const existingScript = document.querySelector('script[src*="model-viewer"]')
      if (existingScript) {
        console.log('🔄 ThreeDProductViewer: model-viewer script already exists, waiting for load')
        // Wait for the existing script to load
        const checkInterval = setInterval(() => {
          if (window.customElements && window.customElements.get('model-viewer')) {
            console.log('✅ ThreeDProductViewer: model-viewer loaded from existing script')
            setScriptError(false)
            clearInterval(checkInterval)
          }
        }, 100)
        
        // Clear interval after 10 seconds to prevent infinite checking
        setTimeout(() => clearInterval(checkInterval), 10000)
        return
      }
      
      console.log('📦 ThreeDProductViewer: Loading model-viewer component (prefer local, fallback to CDN)')
      const load = async () => {
        try {
          await import('@google/model-viewer')
          console.log('✅ ThreeDProductViewer: Loaded @google/model-viewer via npm package')
          setScriptError(false)
        } catch (err) {
          console.warn('⚠️ ThreeDProductViewer: Import failed, falling back to CDN', err)
          const existing = document.querySelector(
            'script[src*="@google/model-viewer"],script[src*="model-viewer.min.js"]'
          ) as HTMLScriptElement | null
          if (!existing) {
            const script = document.createElement('script')
            script.type = 'module'
            script.src = 'https://cdn.jsdelivr.net/npm/@google/model-viewer@3.5.0/dist/model-viewer.min.js'
            script.onload = () => {
              console.log('✅ ThreeDProductViewer: Model-viewer script loaded successfully from CDN')
              setTimeout(() => {
                if (window.customElements && window.customElements.get('model-viewer')) {
                  console.log('✅ ThreeDProductViewer: model-viewer custom element is ready')
                  setScriptError(false)
                } else {
                  console.warn('⚠️ ThreeDProductViewer: model-viewer script loaded but custom element not ready')
                }
              }, 500)
            }
            script.onerror = (error) => {
              console.error('❌ ThreeDProductViewer: Failed to load model-viewer script from CDN:', error)
              setScriptError(true)
              setHasError(true)
              setIsLoading(false)
            }
            document.head.appendChild(script)
          }
        }
      }
      load()
    }
    
    // Log initial 3D model loading info
    if (has3DModel && modelUrl) {
      console.log('🔄 ThreeDProductViewer: Initializing 3D model loading for:', modelUrl)
      console.log('🌐 ThreeDProductViewer: Full URL will be:', window.location.origin + modelUrl)
    }
  }, [has3DModel, modelUrl])

  // Set up model-viewer event listeners
  useEffect(() => {
    console.log('🎯 ThreeDProductViewer: Setting up model-viewer event listeners')
    if (!has3DModel || !isClient) {
      console.log('⏭️ ThreeDProductViewer: Skipping event listeners - no 3D model or not client-side')
      return
    }

    const checkForViewer = () => {
      console.log('🔍 ThreeDProductViewer: Checking for model-viewer element')
      
      // First check if model-viewer custom element is defined
      if (!window.customElements?.get('model-viewer')) {
        console.log('⏳ ThreeDProductViewer: model-viewer custom element not yet defined')
        return null
      }
      
      const viewer = viewerRef.current?.querySelector('model-viewer')
      
      if (viewer) {
        console.log('✅ ThreeDProductViewer: Found model-viewer element, attaching listeners')
        console.log('📍 ThreeDProductViewer: Model URL being loaded:', modelUrl)
        
        const handleLoad = () => {
          console.log('🎉 ThreeDProductViewer: Model loaded successfully')
          setIsLoading(false)
          setHasError(false)
        }
        
        const handleError = (event: any) => {
          console.error('❌ ThreeDProductViewer: Model loading error:', event)
          console.error('❌ ThreeDProductViewer: Error details:', {
            type: event.type,
            target: event.target,
            detail: event.detail,
            modelUrl: modelUrl
          })
          setHasError(true)
          setIsLoading(false)
        }
        
        const handleProgress = (event: any) => {
          const progress = event.detail?.totalProgress || 0
          console.log('📊 ThreeDProductViewer: Loading progress:', Math.round(progress * 100) + '%')
        }
        
        viewer.addEventListener('load', handleLoad)
        viewer.addEventListener('error', handleError)
        viewer.addEventListener('progress', handleProgress)
        
        // Also listen for model-viewer specific events
        viewer.addEventListener('model-visibility', (event: any) => {
          console.log('👁️ ThreeDProductViewer: Model visibility changed:', event.detail)
        })
        
        return () => {
          console.log('🧹 ThreeDProductViewer: Cleaning up event listeners')
          viewer.removeEventListener('load', handleLoad)
          viewer.removeEventListener('error', handleError)
          viewer.removeEventListener('progress', handleProgress)
        }
      } else {
        console.log('⏳ ThreeDProductViewer: model-viewer element not found yet, will retry')
        return null
      }
    }

    // Try to find the viewer immediately
    const cleanup = checkForViewer()
    if (cleanup) return cleanup

    // If not found, set up an interval to check periodically
    console.log('⏰ ThreeDProductViewer: Setting up interval to check for model-viewer element')
    const interval = setInterval(() => {
      const cleanup = checkForViewer()
      if (cleanup) {
        clearInterval(interval)
        return cleanup
      }
    }, 100)

    // Clean up interval after 15 seconds
    const timeout = setTimeout(() => {
      console.log('⏰ ThreeDProductViewer: Timeout reached, stopping model-viewer search')
      clearInterval(interval)
      if (!viewerRef.current?.querySelector('model-viewer')) {
        console.error('❌ ThreeDProductViewer: Failed to initialize model-viewer after 15 seconds')
        setHasError(true)
        setIsLoading(false)
      }
    }, 15000)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [has3DModel, isClient, modelUrl])

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
                  <div className="w-full h-full relative">
                    {isClient && (
                      <div 
                        ref={viewerRef}
                        dangerouslySetInnerHTML={{
                          __html: `
                            <model-viewer
                              src="${modelUrl}"
                              alt="3D model of ${productName}"
                              ${isAutoRotate ? 'auto-rotate' : ''}
                              camera-controls
                              preload
                              loading="eager"
                              reveal="auto"
                              environment-image="neutral"
                              shadow-intensity="1"
                              shadow-softness="0.5"
                              exposure="1"
                              tone-mapping="aces"
                              interaction-prompt="auto"
                              style="width: 100%; height: 100%; transform: scale(${zoom}); transition: transform 0.3s ease; background-color: transparent;"
                            ></model-viewer>
                          `
                        }}
                      />
                    )}
                  </div>
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
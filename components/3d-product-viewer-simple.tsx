"use client"

import React, { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import OBJViewer from "@/components/obj-viewer"
import { 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Play, 
  Pause,
  Move3D,
  Eye,
  AlertCircle,
  Image,
  Zap,
  MapPin,
  Smartphone,
  Sun,
  Sparkles,
  Settings,
  Info
} from "lucide-react"

interface ThreeDProductViewerProps {
  modelUrl?: string
  productName: string
  fallbackImage?: string
  className?: string
}

// Simple 3D viewer using only Google Model Viewer
export function ThreeDProductViewer({ 
  modelUrl, 
  productName, 
  fallbackImage,
  className = "" 
}: ThreeDProductViewerProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const [isAutoRotate, setIsAutoRotate] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showFallback, setShowFallback] = useState(true)
  const [modelLoaded, setModelLoaded] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [forceImageView, setForceImageView] = useState(false)
  const [showAnnotations, setShowAnnotations] = useState(false)
  const [isARSupported, setIsARSupported] = useState(false)
  const [lightingIntensity, setLightingIntensity] = useState(1)
  const [enablePostProcessing, setEnablePostProcessing] = useState(false)
  const [showAdvancedControls, setShowAdvancedControls] = useState(false)
  const viewerRef = useRef<HTMLDivElement>(null)
  const modelViewerRef = useRef<any>(null)

  // 3D Annotations data for shoe features
  const annotations = [
    {
      id: 'sole',
      position: '0 -0.1 0.05',
      normal: '0 -1 0',
      title: 'Premium Sole',
      description: 'High-quality rubber sole with enhanced grip and durability'
    },
    {
      id: 'upper',
      position: '0 0.05 0.1',
      normal: '0 0 1',
      title: 'Upper Material',
      description: 'Premium leather/synthetic upper for comfort and style'
    },
    {
      id: 'laces',
      position: '0 0.08 0.12',
      normal: '0 1 0',
      title: 'Lacing System',
      description: 'Secure and adjustable lacing for perfect fit'
    }
  ]

  // Check if 3D model is available and determine format
  const has3DModel = modelUrl && modelUrl.trim() !== ""
  const isGLBModel = modelUrl?.toLowerCase().endsWith('.glb') || modelUrl?.toLowerCase().endsWith('.gltf')
  const isOBJModel = modelUrl?.toLowerCase().endsWith('.obj')
  const is3DModel = isGLBModel || isOBJModel
  
  // If no 3D model, don't show loading state
  useEffect(() => {
    if (!has3DModel || !is3DModel) {
      setIsLoading(false)
      setShowFallback(true)
    }
  }, [has3DModel, is3DModel])
  
  // Debug logging
  console.log('🔍 ThreeDProductViewer Debug:')
  console.log('  - modelUrl:', modelUrl)
  console.log('  - has3DModel:', has3DModel)
  console.log('  - isGLBModel:', isGLBModel)
  console.log('  - isOBJModel:', isOBJModel)
  console.log('  - is3DModel:', is3DModel)
  console.log('  - productName:', productName)
  console.log('  - fallbackImage:', fallbackImage)
  console.log('  - showFallback:', showFallback)
  console.log('  - forceImageView:', forceImageView)
  console.log('  - modelLoaded:', modelLoaded)
  console.log('  - hasError:', hasError)
  console.log('  - isLoading:', isLoading)

  // Check AR support
  useEffect(() => {
    const checkARSupport = async () => {
      if ('xr' in navigator) {
        try {
          const isSupported = await (navigator as any).xr?.isSessionSupported?.('immersive-ar')
          setIsARSupported(isSupported || false)
        } catch (error) {
          console.log('AR not supported:', error)
          setIsARSupported(false)
        }
      } else {
        // Fallback: check for mobile device
        const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        setIsARSupported(isMobile)
      }
    }
    checkARSupport()
  }, [])

  // Load model-viewer script
  useEffect(() => {
    if (!has3DModel || !isGLBModel) return

    // Check if already loaded
    if (window.customElements?.get('model-viewer')) {
      setScriptLoaded(true)
      return
    }

    // Prefer local npm package if available, fallback to CDN
    (async () => {
      try {
        await import('@google/model-viewer')
        setScriptLoaded(true)
        return
      } catch {
        // Continue to CDN fallback
      }
    })()

    // Check if script already exists
    if (document.querySelector('script[src*="model-viewer"]')) {
      const checkInterval = setInterval(() => {
        if (window.customElements?.get('model-viewer')) {
          setScriptLoaded(true)
          clearInterval(checkInterval)
        }
      }, 100)
      setTimeout(() => clearInterval(checkInterval), 10000)
      return
    }

    // Load the script with preload for faster loading
    const script = document.createElement('script')
    script.type = 'module'
    script.src = 'https://cdn.jsdelivr.net/npm/@google/model-viewer@3.5.0/dist/model-viewer.min.js'
    script.crossOrigin = 'anonymous'
    
    // Add preload link for even faster loading
    const preloadLink = document.createElement('link')
    preloadLink.rel = 'modulepreload'
    preloadLink.href = 'https://cdn.jsdelivr.net/npm/@google/model-viewer@3.5.0/dist/model-viewer.min.js'
    preloadLink.crossOrigin = 'anonymous'
    document.head.appendChild(preloadLink)
    
    script.onload = () => {
      setTimeout(() => {
        if (window.customElements?.get('model-viewer')) {
          setScriptLoaded(true)
        }
      }, 500)
    }
    
    script.onerror = () => {
      setHasError(true)
      setIsLoading(false)
    }
    
    document.head.appendChild(script)
  }, [has3DModel, isGLBModel])

  // Set up model viewer after script loads
  useEffect(() => {
    console.log('🔧 Model viewer setup effect triggered:', {
      scriptLoaded,
      has3DModel,
      isGLBModel,
      modelUrl,
      viewerRefExists: !!viewerRef.current
    })
    
    if (!scriptLoaded || !has3DModel || !isGLBModel || !viewerRef.current) {
      console.log('⏸️ Skipping model viewer setup - requirements not met')
      return
    }

    const setupViewer = async () => {
      console.log('🚀 Starting model viewer setup process')
      
      // Clear any existing content
      if (viewerRef.current) {
        console.log('🧹 Clearing existing content')
        viewerRef.current.innerHTML = ''
      }

      // Skip fetch test - let model-viewer handle the loading
      console.log('🌐 Using GLB file:', modelUrl)

      // Ensure model-viewer is available
      if (!customElements.get('model-viewer')) {
        console.log('⏳ model-viewer not yet defined, waiting...')
        setTimeout(() => setupViewer(), 500)
        return
      }
      console.log('✅ model-viewer is ready')

      // Create model-viewer element
      console.log('🏗️ Creating model-viewer element')
      const modelViewer = document.createElement('model-viewer') as any
      
      // Set attributes
      console.log('⚙️ Setting model-viewer attributes')
      modelViewer.src = modelUrl!
      modelViewer.alt = `3D model of ${productName}`
      modelViewer.setAttribute('camera-controls', '')
      modelViewer.setAttribute('touch-action', 'pan-y')
      modelViewer.setAttribute('preload', '')
      modelViewer.setAttribute('loading', 'eager')
      modelViewer.setAttribute('reveal', 'auto')
      modelViewer.setAttribute('quick-look-browsers', 'safari chrome')
      modelViewer.setAttribute('ios-src', modelUrl!)
      modelViewer.setAttribute('environment-image', 'neutral')
      modelViewer.setAttribute('shadow-intensity', lightingIntensity.toString())
      modelViewer.setAttribute('shadow-softness', '0.5')
      modelViewer.setAttribute('exposure', lightingIntensity.toString())
      modelViewer.setAttribute('tone-mapping', 'aces')
      modelViewer.setAttribute('interaction-prompt', 'auto')
      
      // AR capabilities
      if (isARSupported) {
        modelViewer.setAttribute('ar', '')
        modelViewer.setAttribute('ar-modes', 'webxr scene-viewer quick-look')
        modelViewer.setAttribute('ar-scale', 'auto')
      }
      
      // Enhanced rendering features
      if (enablePostProcessing) {
        modelViewer.setAttribute('skybox-image', 'https://modelviewer.dev/shared-assets/environments/spruit_sunrise_1k_HDR.hdr')
        modelViewer.setAttribute('environment-image', 'https://modelviewer.dev/shared-assets/environments/spruit_sunrise_1k_HDR.hdr')
      }
      
      // Add annotations if enabled
      if (showAnnotations) {
        annotations.forEach(annotation => {
          const hotspot = document.createElement('button')
          hotspot.className = 'annotation-hotspot'
          hotspot.setAttribute('slot', `hotspot-${annotation.id}`)
          hotspot.setAttribute('data-position', annotation.position)
          hotspot.setAttribute('data-normal', annotation.normal)
          hotspot.innerHTML = `
            <div class="annotation-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </div>
            <div class="annotation-tooltip">
              <h4>${annotation.title}</h4>
              <p>${annotation.description}</p>
            </div>
          `
          modelViewer.appendChild(hotspot)
        })
      }
      
      if (isAutoRotate) {
        modelViewer.setAttribute('auto-rotate', '')
      }
      
      // Style the element
      modelViewer.style.width = '100%'
      modelViewer.style.height = '100%'
      modelViewer.style.backgroundColor = '#f8fafc'
      modelViewer.style.borderRadius = '8px'
      
      // Add CSS for annotations
      const style = document.createElement('style')
      style.textContent = `
        .annotation-hotspot {
          position: absolute;
          background: rgba(59, 130, 246, 0.9);
          border: 2px solid white;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          z-index: 10;
        }
        
        .annotation-hotspot:hover {
          transform: scale(1.1);
          background: rgba(59, 130, 246, 1);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
        }
        
        .annotation-icon {
          color: white;
          width: 20px;
          height: 20px;
        }
        
        .annotation-tooltip {
          position: absolute;
          bottom: 40px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 0, 0, 0.9);
          color: white;
          padding: 12px 16px;
          border-radius: 8px;
          min-width: 200px;
          max-width: 300px;
          opacity: 0;
          visibility: hidden;
          transition: all 0.3s ease;
          pointer-events: none;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .annotation-hotspot:hover .annotation-tooltip {
          opacity: 1;
          visibility: visible;
          transform: translateX(-50%) translateY(-5px);
        }
        
        .annotation-tooltip h4 {
          margin: 0 0 8px 0;
          font-size: 14px;
          font-weight: 600;
          color: #60a5fa;
        }
        
        .annotation-tooltip p {
          margin: 0;
          font-size: 12px;
          line-height: 1.4;
          color: #e5e7eb;
        }
        
        .annotation-tooltip::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border: 6px solid transparent;
          border-top-color: rgba(0, 0, 0, 0.9);
        }
      `
      document.head.appendChild(style)

      // Add event listeners
      console.log('👂 Setting up event listeners')
      
      // Add a timeout fallback
      const loadTimeout = setTimeout(() => {
        console.warn('⏰ Model loading timeout after 15 seconds')
        if (isLoading) {
          setHasError(true)
          setIsLoading(false)
        }
      }, 15000)
      
      modelViewer.addEventListener('load', () => {
        console.log('✅ Model loaded successfully!')
        clearTimeout(loadTimeout)
        setIsLoading(false)
        setHasError(false)
        setModelLoaded(true)
        setLoadingProgress(100)
        // Only hide fallback if user hasn't forced image view
        if (!forceImageView) {
          setShowFallback(false)
        }
      })

      modelViewer.addEventListener('error', (event: any) => {
        console.error('❌ Model loading error:', event)
        console.error('❌ Error details:', event.detail)
        console.error('❌ Error type:', event.type)
        setHasError(true)
        setIsLoading(false)
      })

      modelViewer.addEventListener('progress', (event: any) => {
        const progress = event.detail?.totalProgress || 0
        setLoadingProgress(progress * 100)
        console.log(`📊 Loading progress: ${(progress * 100).toFixed(1)}%`)
        // Keep fallback visible during loading for better UX
        if (progress > 0.8) {
          setShowFallback(false)
        }
      })

      modelViewer.addEventListener('model-visibility', (event: any) => {
        console.log(`👁️ Model visibility changed: ${event.detail?.visible}`)
      })

      // Add to DOM
      console.log('🏠 Adding model-viewer to DOM')
      if (viewerRef.current) {
        viewerRef.current.appendChild(modelViewer)
        modelViewerRef.current = modelViewer
        console.log('✅ Model-viewer added to DOM successfully')
      } else {
        console.error('❌ Container ref is null')
        setHasError(true)
        setIsLoading(false)
      }
    }

    setupViewer()
    
    return () => {
      console.log('🧹 Cleaning up model viewer')
      if (viewerRef.current) {
        viewerRef.current.innerHTML = ''
      }
    }
  }, [scriptLoaded, has3DModel, isGLBModel, modelUrl, productName, isAutoRotate, showAnnotations, lightingIntensity, enablePostProcessing])

  // Update lighting when intensity changes
  useEffect(() => {
    if (modelViewerRef.current && !isLoading) {
      modelViewerRef.current.setAttribute('shadow-intensity', lightingIntensity.toString())
      modelViewerRef.current.setAttribute('exposure', lightingIntensity.toString())
    }
  }, [lightingIntensity, isLoading])

  // Update post-processing effects
  useEffect(() => {
    if (modelViewerRef.current && !isLoading) {
      if (enablePostProcessing) {
        modelViewerRef.current.setAttribute('skybox-image', 'https://modelviewer.dev/shared-assets/environments/spruit_sunrise_1k_HDR.hdr')
        modelViewerRef.current.setAttribute('environment-image', 'https://modelviewer.dev/shared-assets/environments/spruit_sunrise_1k_HDR.hdr')
      } else {
        modelViewerRef.current.setAttribute('environment-image', 'neutral')
        modelViewerRef.current.removeAttribute('skybox-image')
      }
    }
  }, [enablePostProcessing, isLoading])

  // Update annotations visibility
  useEffect(() => {
    if (modelViewerRef.current && !isLoading) {
      const hotspots = modelViewerRef.current.querySelectorAll('.annotation-hotspot')
      hotspots.forEach((hotspot: HTMLElement) => {
        hotspot.style.display = showAnnotations ? 'flex' : 'none'
      })
    }
  }, [showAnnotations, isLoading])

  const handleAutoRotateToggle = () => {
    setIsAutoRotate(!isAutoRotate)
    if (modelViewerRef.current) {
      if (!isAutoRotate) {
        modelViewerRef.current.setAttribute('auto-rotate', '')
      } else {
        modelViewerRef.current.removeAttribute('auto-rotate')
      }
    }
  }

  const handleResetView = () => {
    if (modelViewerRef.current) {
      modelViewerRef.current.resetTurntableRotation()
    }
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

  // If no 3D model is available
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
                This product doesn't have a 3D model yet.
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

  // If not GLB/GLTF format
  if (!isGLBModel) {
    return (
      <Card className={`bg-gradient-to-br from-orange-50 to-yellow-100 dark:from-gray-800 dark:to-gray-900 border-2 border-dashed border-orange-300 dark:border-orange-600 ${className}`}>
        <CardContent className="p-8 text-center">
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-orange-200 dark:bg-orange-700 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Unsupported 3D Format
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Only GLB and GLTF files are supported for web viewing.
              </p>
            </div>
            <Badge variant="outline" className="text-xs">
              GLB/GLTF Required
            </Badge>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <Card className="bg-card border-border shadow-lg overflow-hidden">
        <CardContent className="p-0 relative">
          {/* Header */}
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
                {/* Advanced Controls Toggle */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowAdvancedControls(!showAdvancedControls)}
                  className="text-white hover:bg-white/20 h-8 w-8 p-0"
                  title="Advanced Controls"
                >
                  <Settings className="w-4 h-4" />
                </Button>
                
                {/* Advanced Controls Panel */}
                {showAdvancedControls && (
                  <div className="absolute top-12 right-0 bg-black/80 backdrop-blur-sm rounded-lg p-3 space-y-2 min-w-48">
                    {/* Annotations Toggle */}
                    <Button
                      size="sm"
                      variant={showAnnotations ? "default" : "ghost"}
                      onClick={() => setShowAnnotations(!showAnnotations)}
                      className="w-full justify-start text-white hover:bg-white/20 h-8"
                    >
                      <MapPin className="w-4 h-4 mr-2" />
                      <span className="text-xs">Annotations</span>
                    </Button>
                    
                    {/* AR Button */}
                    {isARSupported && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (modelViewerRef.current) {
                            modelViewerRef.current.activateAR()
                          }
                        }}
                        className="w-full justify-start text-white hover:bg-white/20 h-8"
                      >
                        <Smartphone className="w-4 h-4 mr-2" />
                        <span className="text-xs">View in AR</span>
                      </Button>
                    )}
                    
                    {/* Lighting Control */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white flex items-center">
                          <Sun className="w-4 h-4 mr-1" />
                          Lighting
                        </span>
                        <span className="text-xs text-white">{lightingIntensity.toFixed(1)}</span>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="2"
                        step="0.1"
                        value={lightingIntensity}
                        onChange={(e) => setLightingIntensity(parseFloat(e.target.value))}
                        className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                    
                    {/* Post-processing Toggle */}
                    <Button
                      size="sm"
                      variant={enablePostProcessing ? "default" : "ghost"}
                      onClick={() => setEnablePostProcessing(!enablePostProcessing)}
                      className="w-full justify-start text-white hover:bg-white/20 h-8"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      <span className="text-xs">Enhanced Rendering</span>
                    </Button>
                  </div>
                )}
                

                {isLoading && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setIsLoading(false)
                      setShowFallback(false)
                    }}
                    className="text-white hover:bg-white/20 h-8 px-2"
                    title="Skip loading and show 3D model"
                  >
                    <Zap className="w-4 h-4 mr-1" />
                    <span className="text-xs">SKIP</span>
                  </Button>
                )}
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

            {/* Fallback Image - Shows immediately */}
            {(showFallback || forceImageView || !has3DModel || hasError || !modelLoaded) && fallbackImage && (
              <div className="absolute inset-0 z-10">
                <img 
                  src={fallbackImage} 
                  alt={productName}
                  className="w-full h-full object-cover"
                  onLoad={() => console.log('✅ Fallback image loaded successfully:', fallbackImage)}
                  onError={(e) => console.error('❌ Fallback image failed to load:', fallbackImage, e)}
                />
                {isLoading && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="text-center space-y-3 p-4 bg-white/90 dark:bg-gray-800/90 rounded-lg backdrop-blur-sm">
                      <div className="w-12 h-12 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                      <div>
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Loading 3D Model</p>
                        <div className="w-32 bg-gray-200 rounded-full h-2 mt-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${loadingProgress}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{Math.round(loadingProgress)}%</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Loading state for when no fallback */}
             {isLoading && !fallbackImage && (
               <div className="absolute inset-0 flex items-center justify-center z-20">
                 <div className="text-center space-y-4 p-6 bg-white/80 dark:bg-gray-800/80 rounded-lg backdrop-blur-sm">
                   <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                   <div>
                     <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">Loading 3D Model</p>
                     <div className="w-40 bg-gray-200 rounded-full h-2 mt-2">
                       <div 
                         className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                         style={{ width: `${loadingProgress}%` }}
                       ></div>
                     </div>
                     <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{Math.round(loadingProgress)}%</p>
                   </div>
                 </div>
               </div>
             )}
             
             {hasError ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-4 p-6 bg-white/80 dark:bg-gray-800/80 rounded-lg backdrop-blur-sm">
                  <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto">
                    <Eye className="w-8 h-8 text-red-500" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                      3D Model Unavailable
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      The 3D model could not be displayed
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
                {/* GLB/GLTF Model Viewer - Only render if GLB model */}
                {isGLBModel && !isOBJModel && (
                  <div ref={viewerRef} className="w-full h-full" />
                )}
                
                {/* OBJ Model Viewer - Only render if OBJ model */}
                {isOBJModel && !isGLBModel && (
                  <OBJViewer
                    productName={productName}
                    modelUrl={modelUrl!}
                    autoRotate={isAutoRotate}
                    onLoad={() => {
                      setIsLoading(false)
                      setHasError(false)
                      setModelLoaded(true)
                      setShowFallback(false)
                    }}
                    onError={() => {
                      setHasError(true)
                      setIsLoading(false)
                    }}
                  />
                )}
              </>
            )}
          </div>

          {/* Controls */}
          <div className="absolute bottom-4 right-4 flex flex-col space-y-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleResetView}
              className="bg-white/90 hover:bg-white text-gray-700 shadow-lg h-10 w-10 p-0"
              title="Reset view"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>

          {/* Info overlay */}
          <div className="absolute bottom-4 left-4 right-16">
            <div className="bg-black/50 backdrop-blur-sm rounded-lg p-3">
              <div className="flex items-center justify-between text-white text-xs">
                <div className="space-y-1">
                  <div>Drag to rotate • Scroll to zoom</div>
                  {showAnnotations && (
                    <div className="flex items-center text-blue-300">
                      <Info className="w-3 h-3 mr-1" />
                      <span>Hover annotations for details</span>
                    </div>
                  )}
                  {isARSupported && (
                    <div className="flex items-center text-green-300">
                      <Smartphone className="w-3 h-3 mr-1" />
                      <span>AR Ready</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end space-y-1">
                  <Badge className="bg-green-500 text-white text-xs">
                    Enhanced
                  </Badge>
                  {enablePostProcessing && (
                    <Badge className="bg-purple-500 text-white text-xs">
                      HDR
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ThreeDProductViewer
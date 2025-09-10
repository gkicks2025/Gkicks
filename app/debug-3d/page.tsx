'use client'

import React, { useEffect, useState } from 'react'

export default function Debug3DPage() {
  const [modelViewerReady, setModelViewerReady] = useState(false)
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    console.log(message)
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  useEffect(() => {
    addLog('🔍 Checking model-viewer availability...')
    
    const checkModelViewer = () => {
      if (typeof window !== 'undefined' && window.customElements) {
        if (window.customElements.get('model-viewer')) {
          addLog('✅ model-viewer is available!')
          setModelViewerReady(true)
        } else {
          addLog('⏳ model-viewer not yet available, waiting...')
          setTimeout(checkModelViewer, 100)
        }
      } else {
        addLog('❌ customElements not available')
      }
    }

    checkModelViewer()
  }, [])

  const handleModelLoad = () => {
    addLog('✅ Model loaded successfully!')
  }

  const handleModelError = (e: any) => {
    addLog(`❌ Model failed to load: ${e.type}`)
    console.error('Model error details:', e)
  }

  const handleModelProgress = (e: any) => {
    const progress = Math.round(e.detail.totalProgress * 100)
    addLog(`🔄 Loading progress: ${progress}%`)
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">3D Model Debug Page</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 3D Viewer */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">3D Model Viewer</h2>
          <div className="bg-gray-100 rounded-lg p-4" style={{ height: '400px' }}>
            {modelViewerReady ? (
              React.createElement('model-viewer', {
                src: '/uploads/3d-models/3d-model-1757479007733-tqe0o56m9l.glb',
                alt: 'Test 3D Model',
                'auto-rotate': true,
                'camera-controls': true,
                loading: 'eager',
                reveal: 'auto',
                'environment-image': 'neutral',
                'shadow-intensity': '1',
                'shadow-softness': '0.5',
                exposure: '1',
                'tone-mapping': 'aces',
                style: {
                  width: '100%',
                  height: '100%',
                  backgroundColor: '#f8f9fa'
                },
                onLoad: handleModelLoad,
                onError: handleModelError,
                onProgress: handleModelProgress
              })
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                  <p>Waiting for model-viewer to load...</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Debug Logs */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Debug Logs</h2>
          <div className="bg-black text-green-400 p-4 rounded-lg h-96 overflow-y-auto font-mono text-sm">
            {logs.map((log, index) => (
              <div key={index} className="mb-1">
                {log}
              </div>
            ))}
          </div>
          
          <div className="space-y-2">
            <h3 className="font-semibold">Quick Tests</h3>
            <button 
              onClick={() => {
                fetch('/uploads/3d-models/3d-model-1757479007733-tqe0o56m9l.glb', { method: 'HEAD' })
                  .then(response => {
                    addLog(`📁 File accessibility: ${response.status} ${response.statusText}`)
                    addLog(`📏 Content-Length: ${response.headers.get('content-length')} bytes`)
                    addLog(`🏷️ Content-Type: ${response.headers.get('content-type')}`)
                  })
                  .catch(error => {
                    addLog(`❌ File access error: ${error.message}`)
                  })
              }}
              className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
            >
              Test File Access
            </button>
            
            <button 
              onClick={() => {
                addLog(`🌐 Current URL: ${window.location.href}`)
                addLog(`🔧 User Agent: ${navigator.userAgent}`)
                addLog(`🎯 Custom Elements: ${typeof window.customElements}`)
                addLog(`📦 Model Viewer: ${window.customElements?.get('model-viewer') ? 'Available' : 'Not Available'}`)
              }}
              className="bg-green-500 text-white px-4 py-2 rounded"
            >
              System Info
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
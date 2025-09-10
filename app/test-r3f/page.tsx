"use client"

import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Box, Sphere } from '@react-three/drei'

function Scene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <Box position={[-1.2, 0, 0]} />
      <Sphere position={[1.2, 0, 0]} />
      <OrbitControls />
    </>
  )
}

export default function TestR3FPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">React Three Fiber Test</h1>
        <div className="w-full h-96 bg-white rounded-lg shadow-lg">
          <Canvas>
            <Suspense fallback={null}>
              <Scene />
            </Suspense>
          </Canvas>
        </div>
        <div className="mt-8 text-center">
          <p className="text-gray-600">
            This is a test page for React Three Fiber (R3F) integration.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            You should see a 3D scene with a cube and sphere above.
          </p>
        </div>
      </div>
    </div>
  )
}
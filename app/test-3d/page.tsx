"use client"

import { ThreeDProductViewer } from "@/components/3d-product-viewer-simple"

export default function Test3DPage() {
  console.log('🔍 Test3DPage component rendering')
  
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-8">3D Viewer Test - GLB Model</h1>
      
      <div className="max-w-2xl mx-auto">
{(() => {
  console.log('🎯 Rendering ThreeDProductViewer with GLB model');
  return null;
})()}
        <ThreeDProductViewer
          modelUrl="/uploads/3d-models/3d-model-1757479007733-tqe0o56m9l.glb"
          productName="Sambahin Moko (GLB)"
          className="w-full"
        />
      </div>
      
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-600">
          Testing GLB model: /uploads/3d-models/3d-model-1757479007733-tqe0o56m9l.glb
        </p>
      </div>
    </div>
  )
}
"use client"

import { ThreeDProductViewer } from "@/components/3d-product-viewer-simple"

export default function Test3DPage() {
  console.log('🔍 Test3DPage component rendering')
  
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-8">3D Viewer Test - OBJ Model</h1>
      
      <div className="max-w-2xl mx-auto">
{(() => {
  console.log('🎯 Rendering ThreeDProductViewer with GLB model');
  return null;
})()}
        <ThreeDProductViewer
          modelUrl="/uploads/3d-models/3d-model-1755411424493-95utc4wf0kg.obj"
          productName="Nike Air Force 1 Low Sneaker"
          className="w-full"
        />
      </div>
      
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-600">
          Testing OBJ model: /uploads/3d-models/3d-model-1755411424493-95utc4wf0kg.obj
        </p>
      </div>
    </div>
  )
}
"use client"

import { ThreeDProductViewer } from "@/components/3d-product-viewer"

export default function Test3DPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-8">3D Viewer Test</h1>
      
      <div className="max-w-2xl mx-auto">
        <ThreeDProductViewer
          modelUrl="/uploads/3d-models/3d-model-1755423231919-lzj3n5dmhs8.obj"
          productName="Nike Air Max 90"
          className="w-full"
        />
      </div>
      
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-600">
          Testing 3D model: /uploads/3d-models/3d-model-1755423231919-lzj3n5dmhs8.obj
        </p>
      </div>
    </div>
  )
}
"use client"

import { ThreeDProductViewer } from "@/components/3d-product-viewer-simple"

const products3D = [
  {
    id: 4,
    name: "Nike Air Max 90",
    modelUrl: "/uploads/3d-models/3d-model-1755401068512-crbyfclm9bd.obj",
    fallbackImage: "/images/air-max-97-se.png"
  },
  {
    id: 5,
    name: "Adidas Ultraboost 22",
    modelUrl: "/uploads/3d-models/3d-model-1755401258080-qbpz0hc4gq9.obj",
    fallbackImage: "/images/ultraboost-23.png"
  },
  {
    id: 6,
    name: "Converse Chuck Taylor",
    modelUrl: "/uploads/3d-models/3d-model-1755401734176-77w7afsi6dd.obj",
    fallbackImage: "/images/chuck-taylor.png"
  },
  {
    id: 7,
    name: "Nike Air Force 1 Low Sneaker for Men",
    modelUrl: "/uploads/3d-models/3d-model-1755401741211-hxf7jkowt3.obj",
    fallbackImage: "/uploads/products/product-1756053416272-uu6dltiu3ma.png"
  },
  {
    id: 17,
    name: "Adizero EVO SL Shoes",
    modelUrl: "/uploads/3d-models/3d-model-1755401963319-7iripzl10m5.obj",
    fallbackImage: "/uploads/products/product-1756558359905-72uo5icwvwe.avif"
  }
]

export default function TestAll3DPage() {
  console.log('🔍 TestAll3DPage component rendering')
  
  return (
    <div className="container mx-auto p-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          🎯 All 3D Models Showcase
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Interactive 3D viewer for all products with 3D models. Drag to rotate, scroll to zoom, and explore every angle!
        </p>
        <div className="mt-4 flex justify-center space-x-4 text-sm text-gray-500">
          <span className="flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            {products3D.length} Products with 3D Models
          </span>
          <span className="flex items-center">
            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
            OBJ Format Support
          </span>
          <span className="flex items-center">
            <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
            Interactive Controls
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {products3D.map((product, index) => (
          <div key={product.id} className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow duration-300">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    {product.name}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Product ID: {product.id} • Model #{index + 1}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                    3D Ready
                  </span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                    OBJ
                  </span>
                </div>
              </div>
            </div>
            
            <div className="h-96">
              <ThreeDProductViewer
                modelUrl={product.modelUrl}
                productName={product.name}
                fallbackImage={product.fallbackImage}
                className="w-full h-full"
              />
            </div>
            
            <div className="p-4 bg-gray-50">
              <div className="text-xs text-gray-500 space-y-1">
                <div className="flex justify-between">
                  <span>Model File:</span>
                  <span className="font-mono text-gray-700">
                    {product.modelUrl.split('/').pop()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Format:</span>
                  <span className="font-semibold text-blue-600">OBJ</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="font-semibold text-green-600">Active</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-12 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-8">
        <h3 className="text-2xl font-bold text-center mb-6 text-gray-800">
          🎮 How to Use the 3D Viewer
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🖱️</span>
            </div>
            <h4 className="font-semibold text-gray-800 mb-2">Rotate</h4>
            <p className="text-sm text-gray-600">
              Click and drag to rotate the 3D model in any direction
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔍</span>
            </div>
            <h4 className="font-semibold text-gray-800 mb-2">Zoom</h4>
            <p className="text-sm text-gray-600">
              Use mouse wheel or pinch gestures to zoom in and out
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔄</span>
            </div>
            <h4 className="font-semibold text-gray-800 mb-2">Reset</h4>
            <p className="text-sm text-gray-600">
              Click the reset button to return to the original view
            </p>
          </div>
        </div>
      </div>
      
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500">
          💡 All 3D models are now enabled and ready for interactive viewing!
        </p>
      </div>
    </div>
  )
}
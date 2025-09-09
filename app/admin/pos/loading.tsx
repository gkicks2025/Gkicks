import { Loader2 } from "lucide-react"

export default function POSLoading() {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading Point of Sale...</p>
        </div>
      </div>
    </div>
  )
}

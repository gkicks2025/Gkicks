import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function FAQLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Skeleton */}
      <div className="bg-black h-20">
        <div className="container mx-auto px-4 h-full flex items-center justify-between">
          <Skeleton className="h-12 w-12 rounded-full bg-gray-700" />
          <div className="flex space-x-4">
            <Skeleton className="h-8 w-16 bg-gray-700" />
            <Skeleton className="h-8 w-16 bg-gray-700" />
            <Skeleton className="h-8 w-16 bg-gray-700" />
          </div>
          <div className="flex space-x-2">
            <Skeleton className="h-8 w-8 rounded-full bg-gray-700" />
            <Skeleton className="h-8 w-8 rounded-full bg-gray-700" />
            <Skeleton className="h-8 w-8 rounded-full bg-gray-700" />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Header Section Skeleton */}
        <div className="text-center mb-12">
          <Skeleton className="h-10 w-96 mx-auto mb-4" />
          <Skeleton className="h-6 w-[600px] mx-auto" />
        </div>

        {/* Search and Filter Section Skeleton */}
        <div className="max-w-4xl mx-auto mb-8">
          <Card className="p-6">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <Skeleton className="h-12 flex-1" />
            </div>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-16" />
              ))}
            </div>
          </Card>
        </div>

        {/* FAQ Items Skeleton */}
        <div className="max-w-4xl mx-auto space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="flex items-center justify-between p-6">
                <div className="flex items-center space-x-4">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div>
                    <Skeleton className="h-5 w-64 mb-2" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
                <Skeleton className="h-5 w-5" />
              </div>
            </Card>
          ))}
        </div>

        {/* Contact Section Skeleton */}
        <div className="max-w-4xl mx-auto mt-12">
          <Card className="p-8 text-center">
            <Skeleton className="h-8 w-48 mx-auto mb-4" />
            <Skeleton className="h-5 w-96 mx-auto mb-6" />
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Skeleton className="h-10 w-40" />
              <Skeleton className="h-10 w-40" />
              <Skeleton className="h-10 w-40" />
            </div>
          </Card>
        </div>
      </div>

      {/* Footer Skeleton */}
      <div className="bg-black py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-6 w-32 bg-gray-700" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24 bg-gray-700" />
                  <Skeleton className="h-4 w-28 bg-gray-700" />
                  <Skeleton className="h-4 w-20 bg-gray-700" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

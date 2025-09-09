"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Star, MessageSquare } from "lucide-react"
import { useState } from "react"
import { ReviewForm } from "@/components/review-form-modal"

interface CustomerReviewsProps {
  productName: string
  productId: number
}

interface Review {
  id: number
  userName: string
  rating: number
  title: string
  comment: string
  date: string
  verified: boolean
}

export function CustomerReviews({ productName, productId }: CustomerReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [showReviewForm, setShowReviewForm] = useState(false)

  // Calculate rating statistics
  const totalReviews = reviews.length
  const averageRating = totalReviews > 0 ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews : 0

  const ratingCounts = {
    5: reviews.filter((r) => r.rating === 5).length,
    4: reviews.filter((r) => r.rating === 4).length,
    3: reviews.filter((r) => r.rating === 3).length,
    2: reviews.filter((r) => r.rating === 2).length,
    1: reviews.filter((r) => r.rating === 1).length,
  }

  const handleWriteReview = () => {
    setShowReviewForm(true)
  }

  const handleSubmitReview = (reviewData: {
    rating: number
    comment: string
    userName: string
    email?: string
    photos?: File[]
  }) => {
    const newReview: Review = {
      id: Date.now(),
      userName: reviewData.userName,
      rating: reviewData.rating,
      title: "", // Remove title since it's no longer in the form
      comment: reviewData.comment,
      date: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      verified: Math.random() > 0.5, // Randomly assign verified status for demo
    }

    setReviews((prev) => [newReview, ...prev])
    setShowReviewForm(false)
  }

  const handleCancelReview = () => {
    setShowReviewForm(false)
  }

  const renderStars = (rating: number, filled = true) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`h-4 w-4 ${filled && index < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300 dark:text-gray-600"}`}
      />
    ))
  }

  const renderRatingBar = (stars: number, count: number) => {
    const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0

    return (
      <div className="flex items-center space-x-3">
        <span className="text-sm font-medium w-2 text-gray-900 dark:text-gray-300">{stars}</span>
        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-sm text-gray-600 dark:text-gray-400 w-8 text-right">{count}</span>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <Card className="shadow-lg bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold text-gray-900 dark:text-yellow-400">Customer Reviews</CardTitle>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Share your experience with {productName}</p>
            </div>
            {!showReviewForm && (
              <Button
                className="bg-yellow-400 text-black hover:bg-yellow-500 shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={handleWriteReview}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Write a Review
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Rating Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Overall Rating */}
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 dark:text-yellow-400 mb-2">
                {totalReviews > 0 ? averageRating.toFixed(1) : "0.0"}
              </div>
              <div className="flex justify-center mb-2">{renderStars(Math.round(averageRating))}</div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Based on {totalReviews} review{totalReviews !== 1 ? "s" : ""}
              </p>
            </div>

            {/* Rating Breakdown */}
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((stars) => (
                <div key={stars}>{renderRatingBar(stars, ratingCounts[stars as keyof typeof ratingCounts])}</div>
              ))}
            </div>
          </div>

          <Separator className="bg-gray-200 dark:bg-gray-700" />

          {/* Reviews List */}
          {totalReviews === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">
                No reviews yet. Be the first to review this product!
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-sm">
                Help other customers by sharing your experience with {productName}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <Card key={review.id} className="border border-border bg-card">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-gray-900 dark:text-white">{review.userName}</span>
                          {review.verified && (
                            <span className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 text-xs px-2 py-1 rounded-full">
                              Verified Purchase
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="flex">{renderStars(review.rating)}</div>
                          <span className="text-sm text-gray-500 dark:text-gray-400">{review.date}</span>
                        </div>
                        {review.title && (
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{review.title}</h4>
                        )}
                      </div>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{review.comment}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Load More Reviews Button (if there are many reviews) */}
          {totalReviews > 5 && (
            <div className="text-center">
              <Button
                variant="outline"
                className="border-yellow-400 hover:bg-yellow-400 hover:text-black bg-transparent text-yellow-400 dark:text-yellow-400"
              >
                Load More Reviews
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      {/* Review Form - Inline instead of modal */}
      {showReviewForm && (
        <ReviewForm
          productName={productName}
          productId={productId}
          onSubmitReview={handleSubmitReview}
          onCancel={handleCancelReview}
        />
      )}
    </div>
  )
}

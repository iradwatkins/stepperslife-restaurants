"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Star, ThumbsUp, Flag, CheckCircle, User, ChevronDown, MessageSquare } from "lucide-react";
import { StarRating } from "./StarRating";
import { ReviewForm } from "./ReviewForm";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

interface RestaurantReviewsProps {
  restaurantId: Id<"restaurants">;
  userId: Id<"users"> | null;
}

export function RestaurantReviews({ restaurantId, userId }: RestaurantReviewsProps) {
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [reportingReviewId, setReportingReviewId] = useState<Id<"restaurantReviews"> | null>(null);

  const stats = useQuery(api.restaurantReviews.getRestaurantStats, { restaurantId });
  const reviews = useQuery(api.restaurantReviews.getByRestaurant, { restaurantId, limit: 50 });
  const voteHelpful = useMutation(api.restaurantReviews.voteHelpful);
  const reportReview = useMutation(api.restaurantReviews.reportReview);

  const displayedReviews = showAllReviews ? reviews : reviews?.slice(0, 3);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleVoteHelpful = async (reviewId: Id<"restaurantReviews">) => {
    if (!userId) return;
    try {
      await voteHelpful({ reviewId });
    } catch (err) {
      console.error("Failed to vote:", err);
    }
  };

  const handleReport = (reviewId: Id<"restaurantReviews">) => {
    if (!userId) return;
    setReportingReviewId(reviewId);
  };

  const confirmReport = async () => {
    if (!reportingReviewId) return;
    try {
      await reportReview({ reviewId: reportingReviewId });
    } catch (err) {
      console.error("Failed to report:", err);
    }
    setReportingReviewId(null);
  };

  return (
    <div className="space-y-6">
      {/* Report Confirmation Dialog */}
      <AlertDialog open={!!reportingReviewId} onOpenChange={(open) => !open && setReportingReviewId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Report this review?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to report this review for inappropriate content?
              Our team will review it and take appropriate action.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setReportingReviewId(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmReport}>
              Report Review
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rating Summary */}
      <div className="bg-white dark:bg-card rounded-lg p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          {/* Overall Rating */}
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-5xl font-bold text-foreground dark:text-white">
                {stats?.averageRating?.toFixed(1) || "0.0"}
              </div>
              <StarRating rating={stats?.averageRating || 0} size="md" />
              <p className="text-sm text-muted-foreground mt-1">
                {stats?.totalReviews || 0} {stats?.totalReviews === 1 ? "review" : "reviews"}
              </p>
            </div>

            {/* Rating Breakdown */}
            <div className="flex-1 min-w-[200px]">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = stats?.ratingBreakdown?.[stars as 1 | 2 | 3 | 4 | 5] || 0;
                const percentage = stats?.totalReviews ? (count / stats.totalReviews) * 100 : 0;
                return (
                  <div key={stars} className="flex items-center gap-2 text-sm">
                    <span className="w-8 text-muted-foreground dark:text-muted-foreground">{stars}★</span>
                    <div className="flex-1 h-2 bg-muted dark:bg-card rounded-full overflow-hidden">
                      <div
                        className="h-full bg-warning/100 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-8 text-muted-foreground text-xs">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Write Review Button */}
          <div>
            <Button
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="bg-primary hover:bg-primary/90"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Write a Review
            </Button>
          </div>
        </div>
      </div>

      {/* Review Form */}
      {showReviewForm && (
        <ReviewForm
          restaurantId={restaurantId}
          userId={userId}
          onSuccess={() => setShowReviewForm(false)}
          onCancel={() => setShowReviewForm(false)}
        />
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Customer Reviews</h3>

        {!reviews || reviews.length === 0 ? (
          <div className="bg-card dark:bg-card rounded-lg p-8 text-center">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground dark:text-muted-foreground mb-4">
              No reviews yet. Be the first to share your experience!
            </p>
            <Button
              onClick={() => setShowReviewForm(true)}
              className="bg-primary hover:bg-primary/90"
            >
              Write the First Review
            </Button>
          </div>
        ) : (
          <>
            {displayedReviews?.map((review) => (
              <div
                key={review._id}
                className="bg-white dark:bg-card rounded-lg p-6 shadow-sm"
              >
                {/* Review Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {review.customerImage ? (
                      <img
                        src={review.customerImage}
                        alt={review.customerName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-muted dark:bg-card flex items-center justify-center">
                        <User className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground dark:text-white">
                          {review.customerName}
                        </span>
                        {review.isVerifiedPurchase && (
                          <span className="flex items-center gap-1 text-xs text-success dark:text-success">
                            <CheckCircle className="h-3 w-3" />
                            Verified
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{formatDate(review.createdAt)}</p>
                    </div>
                  </div>
                  <StarRating rating={review.rating} size="sm" />
                </div>

                {/* Review Title */}
                {review.title && (
                  <h4 className="font-semibold text-foreground dark:text-white mb-2">
                    {review.title}
                  </h4>
                )}

                {/* Review Text */}
                {review.reviewText && (
                  <p className="text-foreground dark:text-muted-foreground mb-4">{review.reviewText}</p>
                )}

                {/* Restaurant Response */}
                {review.restaurantResponse && (
                  <div className="mt-4 pl-4 border-l-2 border-primary bg-primary/5 dark:bg-primary/20 p-4 rounded-r-lg">
                    <p className="text-sm font-medium text-primary dark:text-primary mb-1">
                      Restaurant Response
                    </p>
                    <p className="text-foreground dark:text-muted-foreground text-sm">
                      {review.restaurantResponse}
                    </p>
                    {review.restaurantResponseAt && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(review.restaurantResponseAt)}
                      </p>
                    )}
                  </div>
                )}

                {/* Review Actions */}
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border dark:border">
                  <button
                    type="button"
                    onClick={() => handleVoteHelpful(review._id)}
                    disabled={!userId}
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground dark:hover:text-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ThumbsUp className="h-4 w-4" />
                    Helpful ({review.helpfulCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReport(review._id)}
                    disabled={!userId}
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-destructive disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Flag className="h-4 w-4" />
                    Report
                  </button>
                </div>
              </div>
            ))}

            {/* Show More Button */}
            {reviews.length > 3 && !showAllReviews && (
              <Button
                variant="outline"
                onClick={() => setShowAllReviews(true)}
                className="w-full"
              >
                <ChevronDown className="h-4 w-4 mr-2" />
                Show All {reviews.length} Reviews
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

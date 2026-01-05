"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Star, Camera, X, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ReviewFormProps {
  restaurantId: Id<"restaurants">;
  userId: Id<"users"> | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ReviewForm({ restaurantId, userId, onSuccess, onCancel }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const canReviewData = useQuery(
    api.restaurantReviews.canReview,
    userId ? { restaurantId, userId } : "skip"
  );
  const createReview = useMutation(api.restaurantReviews.create);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId) {
      setError("Please sign in to leave a review");
      return;
    }

    if (rating === 0) {
      setError("Please select a rating");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await createReview({
        restaurantId,
        customerId: userId,
        rating,
        title: title.trim() || undefined,
        reviewText: reviewText.trim() || undefined,
      });

      // Reset form
      setRating(0);
      setTitle("");
      setReviewText("");

      toast.success("Thank you for your review!");
      onSuccess?.();
    } catch (err: any) {
      const errorMessage = err.message || "Failed to submit review";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Not logged in
  if (!userId) {
    return (
      <div className="bg-card dark:bg-card rounded-lg p-6 text-center">
        <p className="text-muted-foreground dark:text-muted-foreground mb-4">
          Sign in to leave a review
        </p>
        <Button asChild>
          <a href="/login">Sign In</a>
        </Button>
      </div>
    );
  }

  // Already reviewed
  if (canReviewData && !canReviewData.canReview && canReviewData.reason === "already_reviewed") {
    return (
      <div className="bg-success/10 dark:bg-success/15 rounded-lg p-6 text-center">
        <CheckCircle className="h-8 w-8 text-success mx-auto mb-2" />
        <p className="text-success dark:text-success">
          You&apos;ve already reviewed this restaurant
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-card rounded-lg p-6 shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Write a Review</h3>

      {/* Verified Purchase Badge */}
      {canReviewData?.hasCompletedOrder && (
        <div className="flex items-center gap-2 mb-4 text-sm text-success dark:text-success">
          <CheckCircle className="h-4 w-4" />
          <span>Verified Purchase - Your review will be marked as verified</span>
        </div>
      )}

      {/* Star Rating */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-foreground dark:text-muted-foreground mb-2">
          Your Rating *
        </label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-1 transition-transform hover:scale-110"
            >
              <Star
                className={`h-8 w-8 ${
                  star <= (hoverRating || rating)
                    ? "text-warning fill-yellow-500"
                    : "text-muted-foreground dark:text-muted-foreground"
                }`}
              />
            </button>
          ))}
          {rating > 0 && (
            <span className="ml-2 self-center text-sm text-muted-foreground">
              {rating === 1 && "Poor"}
              {rating === 2 && "Fair"}
              {rating === 3 && "Good"}
              {rating === 4 && "Very Good"}
              {rating === 5 && "Excellent"}
            </span>
          )}
        </div>
      </div>

      {/* Title */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-foreground dark:text-muted-foreground mb-2">
          Review Title (optional)
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Sum up your experience"
          maxLength={100}
          className="w-full px-4 py-2 rounded-lg border border dark:border bg-white dark:bg-background text-foreground dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Review Text */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-foreground dark:text-muted-foreground mb-2">
          Your Review (optional)
        </label>
        <textarea
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          placeholder="Tell others about your experience..."
          rows={4}
          maxLength={1000}
          className="w-full px-4 py-2 rounded-lg border border dark:border bg-white dark:bg-background text-foreground dark:text-white focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        />
        <p className="text-xs text-muted-foreground mt-1">
          {reviewText.length}/1000 characters
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-destructive/10 dark:bg-destructive/15 text-destructive dark:text-destructive rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={isSubmitting || rating === 0}
          className="flex-1 bg-primary hover:bg-primary/90"
        >
          {isSubmitting ? "Submitting..." : "Submit Review"}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

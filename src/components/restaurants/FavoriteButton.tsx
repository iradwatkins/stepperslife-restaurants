"use client";

import { Heart } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useState } from "react";
import { toast } from "sonner";

interface FavoriteButtonProps {
  restaurantId: Id<"restaurants">;
  userId: Id<"users"> | null;
  size?: "sm" | "md" | "lg";
  showCount?: boolean;
  className?: string;
}

export function FavoriteButton({
  restaurantId,
  userId,
  size = "md",
  showCount = false,
  className = "",
}: FavoriteButtonProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  const isFavorited = useQuery(
    api.favoriteRestaurants.isFavorited,
    userId ? { userId, restaurantId } : "skip"
  );
  const favoriteCount = useQuery(
    api.favoriteRestaurants.getRestaurantFavoriteCount,
    showCount ? { restaurantId } : "skip"
  );
  const toggleFavorite = useMutation(api.favoriteRestaurants.toggle);

  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  const buttonSizeClasses = {
    sm: "p-1.5",
    md: "p-2",
    lg: "p-2.5",
  };

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation if inside a link
    e.stopPropagation();

    if (!userId) {
      toast.error("Please sign in to save favorites");
      window.location.href = "/login";
      return;
    }

    setIsAnimating(true);
    try {
      // Note: toggle mutation gets userId from auth context, only pass restaurantId
      await toggleFavorite({ restaurantId });
      // Show success toast based on new state
      if (isFavorited) {
        toast.success("Removed from favorites");
      } else {
        toast.success("Added to favorites");
      }
    } catch (err) {
      console.error("Failed to toggle favorite:", err);
      toast.error("Failed to update favorites");
    }
    setTimeout(() => setIsAnimating(false), 300);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`
        ${buttonSizeClasses[size]}
        rounded-full
        transition-all duration-200
        ${isFavorited
          ? "bg-destructive/10 dark:bg-destructive/20 text-destructive"
          : "bg-white/80 dark:bg-card/80 text-muted-foreground hover:text-destructive"
        }
        hover:scale-110
        ${isAnimating ? "scale-125" : ""}
        backdrop-blur-sm
        shadow-sm
        ${className}
      `}
      aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
    >
      <Heart
        className={`
          ${sizeClasses[size]}
          transition-all duration-200
          ${isFavorited ? "fill-red-500" : ""}
          ${isAnimating ? "animate-pulse" : ""}
        `}
      />
      {showCount && favoriteCount !== undefined && favoriteCount > 0 && (
        <span className="ml-1 text-xs font-medium">{favoriteCount}</span>
      )}
    </button>
  );
}

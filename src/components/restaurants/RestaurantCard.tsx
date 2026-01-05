"use client";

import Link from "next/link";
import { MapPin, Clock, CircleDot, Moon, Shirt, Users, Music } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { StarRating } from "./StarRating";
import { FavoriteButton } from "./FavoriteButton";
import { ShareButton } from "./ShareButton";
import { RestaurantImage } from "./RestaurantImage";

interface RestaurantCardProps {
  restaurant: {
    _id: Id<"restaurants">;
    name: string;
    slug: string;
    coverImageUrl?: string;
    cuisine?: string[];
    city: string;
    state: string;
    estimatedPickupTime?: number;
    acceptingOrders: boolean;
    isOpenLateNight?: boolean;
    lateNightDays?: string[];
    // Stepper-specific fields (Phase 2)
    dressCode?: "casual" | "smart-casual" | "upscale" | "stepping-attire";
    priceRange?: "$" | "$$" | "$$$" | "$$$$";
    vibeTags?: string[];
    groupInfo?: {
      maxPartySize?: number;
      groupDiscounts?: boolean;
      privateRoomAvailable?: boolean;
    };
    entertainment?: {
      hasLiveMusic?: boolean;
      hasDJ?: boolean;
      musicGenres?: string[];
    };
  };
}

// Dress code display config
const dressCodeConfig: Record<string, { label: string; color: string }> = {
  "casual": { label: "Casual", color: "bg-slate-500" },
  "smart-casual": { label: "Smart Casual", color: "bg-blue-600" },
  "upscale": { label: "Upscale", color: "bg-purple-600" },
  "stepping-attire": { label: "Stepping Attire", color: "bg-amber-600" },
};

export function RestaurantCard({ restaurant }: RestaurantCardProps) {
  const currentUser = useQuery(api.users.queries.getCurrentUser);
  const reviewStats = useQuery(api.restaurantReviews.getRestaurantStats, {
    restaurantId: restaurant._id,
  });
  const isOpen = useQuery(api.restaurantHours.isCurrentlyOpen, {
    restaurantId: restaurant._id,
  });

  return (
    <Link
      href={`/restaurants/${restaurant.slug}`}
      className="group bg-card rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
    >
      <div className="relative h-48 overflow-hidden">
        <RestaurantImage
          src={restaurant.coverImageUrl}
          alt={restaurant.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Status Badge - Real-time open/closed based on hours */}
        <div className="absolute top-4 right-4 flex flex-col gap-1.5 items-end">
          {isOpen === undefined ? (
            <span className="px-3 py-1 text-xs font-semibold bg-muted/80 text-muted-foreground rounded-full shadow-lg animate-pulse">
              ...
            </span>
          ) : isOpen ? (
            <span className="px-3 py-1 text-xs font-semibold bg-success text-success-foreground rounded-full shadow-lg flex items-center gap-1.5">
              <CircleDot className="h-3 w-3 animate-pulse" />
              Open Now
            </span>
          ) : (
            <span className="px-3 py-1 text-xs font-semibold bg-muted text-muted-foreground rounded-full shadow-lg">
              Closed
            </span>
          )}

          {/* Late Night Badge */}
          {restaurant.isOpenLateNight && (
            <span className="px-2.5 py-1 text-xs font-semibold bg-indigo-600 text-white rounded-full shadow-lg flex items-center gap-1" title="Open after 2am on select days">
              <Moon className="h-3 w-3" />
              Open Late
            </span>
          )}
        </div>

        {/* Favorite & Share Buttons */}
        <div className="absolute top-4 left-4 flex gap-2">
          <FavoriteButton
            restaurantId={restaurant._id}
            userId={currentUser?._id || null}
            size="md"
          />
          <ShareButton
            title={restaurant.name}
            text={`Check out ${restaurant.name} on SteppersLife!`}
            url={`/restaurants/${restaurant.slug}`}
            variant="icon"
            size="md"
          />
        </div>
      </div>

      <div className="p-5">
        <h3 className="text-lg font-bold text-foreground mb-1">
          {restaurant.name}
        </h3>

        {/* Rating Display */}
        {reviewStats && reviewStats.totalReviews > 0 && (
          <div className="flex items-center gap-2 mb-2">
            <StarRating rating={reviewStats.averageRating} size="sm" />
            <span className="text-sm text-muted-foreground">
              {reviewStats.averageRating.toFixed(1)} ({reviewStats.totalReviews})
            </span>
          </div>
        )}

        {restaurant.cuisine && restaurant.cuisine.length > 0 && (
          <p className="text-sm text-primary mb-2">
            {restaurant.cuisine.join(" • ")}
          </p>
        )}

        {/* Stepper-Specific Badges */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {/* Price Range */}
          {restaurant.priceRange && (
            <span className="px-2 py-0.5 text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded-full">
              {restaurant.priceRange}
            </span>
          )}

          {/* Dress Code */}
          {restaurant.dressCode && dressCodeConfig[restaurant.dressCode] && (
            <span className={`px-2 py-0.5 text-xs font-semibold text-white rounded-full flex items-center gap-1 ${dressCodeConfig[restaurant.dressCode].color}`}>
              <Shirt className="h-3 w-3" />
              {dressCodeConfig[restaurant.dressCode].label}
            </span>
          )}

          {/* Group Friendly */}
          {restaurant.groupInfo?.maxPartySize && restaurant.groupInfo.maxPartySize >= 8 && (
            <span className="px-2 py-0.5 text-xs font-semibold bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300 rounded-full flex items-center gap-1" title={`Up to ${restaurant.groupInfo.maxPartySize} guests`}>
              <Users className="h-3 w-3" />
              Groups
            </span>
          )}

          {/* Live Music / DJ */}
          {(restaurant.entertainment?.hasLiveMusic || restaurant.entertainment?.hasDJ) && (
            <span className="px-2 py-0.5 text-xs font-semibold bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300 rounded-full flex items-center gap-1">
              <Music className="h-3 w-3" />
              {restaurant.entertainment.hasLiveMusic ? "Live Music" : "DJ"}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            {restaurant.city}, {restaurant.state}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            ~{restaurant.estimatedPickupTime || 30} min
          </span>
        </div>
      </div>
    </Link>
  );
}

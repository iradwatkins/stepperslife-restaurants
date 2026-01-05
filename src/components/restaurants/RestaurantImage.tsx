"use client";

import { useState } from "react";
import { Utensils, Store } from "lucide-react";
import { cn } from "@/lib/utils";

interface RestaurantImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackIcon?: "utensils" | "store";
  iconClassName?: string;
  variant?: "cover" | "logo";
}

/**
 * RestaurantImage - Reusable image component with graceful error handling.
 * Shows a gradient fallback with icon when:
 * - src is undefined/null
 * - Image fails to load (network error, 404, etc.)
 */
export function RestaurantImage({
  src,
  alt,
  className,
  fallbackIcon = "utensils",
  iconClassName,
  variant = "cover",
}: RestaurantImageProps) {
  const [hasError, setHasError] = useState(false);

  const Icon = fallbackIcon === "store" ? Store : Utensils;

  // Determine gradient colors based on variant
  const gradientClasses =
    variant === "logo"
      ? "bg-gradient-to-br from-primary/80 to-sky-500/80"
      : "bg-gradient-to-br from-primary to-sky-600";

  // Default icon sizes based on variant
  const defaultIconClasses =
    variant === "logo"
      ? "h-8 w-8 text-primary-foreground opacity-60"
      : "h-16 w-16 text-primary-foreground opacity-50";

  // Show fallback if no src or error occurred
  if (!src || hasError) {
    return (
      <div
        className={cn(
          gradientClasses,
          "flex items-center justify-center",
          className
        )}
        role="img"
        aria-label={`${alt} - no image available`}
      >
        <Icon className={cn(defaultIconClasses, iconClassName)} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
      loading="lazy"
    />
  );
}

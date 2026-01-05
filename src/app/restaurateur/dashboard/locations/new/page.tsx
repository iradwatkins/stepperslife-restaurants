"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { LocationForm } from "@/components/restaurateur/LocationForm";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NewLocationPage() {
  const myRestaurants = useQuery(api.restaurants.getMyRestaurants);
  const restaurant = myRestaurants?.[0];

  // Loading state
  if (myRestaurants === undefined) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Skeleton className="h-4 w-32 mb-6" />
        <div className="mb-8">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  // No restaurant
  if (!restaurant) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto text-center">
          <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">No Restaurant Found</h1>
          <p className="text-muted-foreground mb-6">
            You need to create a restaurant before you can add locations.
          </p>
          <Link href="/restaurateur/apply">
            <Button>Apply to Partner</Button>
          </Link>
        </div>
      </div>
    );
  }

  return <LocationForm restaurantId={restaurant._id} />;
}

import { Metadata } from "next";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import RestaurantsListClient from "./RestaurantsListClient";

// Force dynamic rendering - always fetch fresh data
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Restaurants | SteppersLife",
  description: "Order food for pickup from local restaurants on SteppersLife",
  openGraph: {
    title: "Restaurants | SteppersLife",
    description: "Order food for pickup from local restaurants",
    type: "website",
  },
};

// Server-side data fetching with timeout
async function fetchWithTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 10000,
  fallback: T
): Promise<T> {
  const timeoutPromise = new Promise<T>((_, reject) =>
    setTimeout(() => reject(new Error("Query timeout")), timeoutMs)
  );

  try {
    return await Promise.race([promise, timeoutPromise]);
  } catch (error) {
    console.error("[RestaurantsPage] Query error:", error);
    return fallback;
  }
}

export default async function RestaurantsPage() {
  // Initialize Convex HTTP client for server-side data fetching
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL!;
  const convex = new ConvexHttpClient(convexUrl);

  // Fetch initial restaurants data
  const initialRestaurants = await fetchWithTimeout(
    convex.query(api.public.queries.getActiveRestaurants),
    10000,
    []
  );

  return <RestaurantsListClient initialRestaurants={initialRestaurants} />;
}

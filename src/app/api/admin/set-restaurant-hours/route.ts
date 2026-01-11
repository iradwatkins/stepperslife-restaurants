import { NextRequest, NextResponse } from "next/server";
import { convexClient as convex } from "@/lib/auth/convex-client";
import { api } from "@/convex/_generated/api";

/**
 * Admin endpoint to set restaurant operating hours
 * POST /api/admin/set-restaurant-hours
 *
 * Body: {
 *   adminSecret: string,
 *   slug: string,
 *   operatingHours: { monday: {...}, ... },
 *   acceptingOrders?: boolean
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { adminSecret, slug, operatingHours, acceptingOrders } = body;

    if (!adminSecret || !slug || !operatingHours) {
      return NextResponse.json(
        { error: "Missing required fields: adminSecret, slug, operatingHours" },
        { status: 400 }
      );
    }

    // Call the Convex mutation
    const result = await convex.mutation(api.restaurants.adminSetHours, {
      adminSecret,
      slug,
      operatingHours,
      acceptingOrders,
    });

    return NextResponse.json(result);

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[SetRestaurantHours] Error:", errorMessage);

    if (errorMessage.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { convexClient as convex } from "@/lib/auth/convex-client";
import { api } from "@/convex/_generated/api";

/**
 * Admin endpoint to delete all menu items for a restaurant
 * POST /api/admin/delete-menu-items
 *
 * Body: {
 *   adminSecret: string,
 *   restaurantSlug: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { adminSecret, restaurantSlug } = body;

    if (!adminSecret || !restaurantSlug) {
      return NextResponse.json(
        { error: "Missing required fields: adminSecret, restaurantSlug" },
        { status: 400 }
      );
    }

    const result = await convex.mutation(api.menuItems.adminDeleteAllMenuItems, {
      adminSecret,
      restaurantSlug,
    });

    return NextResponse.json(result);

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[DeleteMenuItems] Error:", errorMessage);

    if (errorMessage.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

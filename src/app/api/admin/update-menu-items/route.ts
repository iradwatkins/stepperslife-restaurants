import { NextRequest, NextResponse } from "next/server";
import { convexClient as convex } from "@/lib/auth/convex-client";
import { api } from "@/convex/_generated/api";

interface MenuItemUpdate {
  itemName: string;
  price?: number;
  description?: string;
  isAvailable?: boolean;
}

/**
 * Admin endpoint to update menu items
 * POST /api/admin/update-menu-items
 *
 * Body: {
 *   adminSecret: string,
 *   restaurantSlug: string,
 *   items: MenuItemUpdate[]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { adminSecret, restaurantSlug, items } = body;

    if (!adminSecret || !restaurantSlug || !items) {
      return NextResponse.json(
        { error: "Missing required fields: adminSecret, restaurantSlug, items" },
        { status: 400 }
      );
    }

    const results = {
      updated: [] as { name: string; itemId: string }[],
      errors: [] as { name: string; error: string }[],
    };

    // Update each menu item
    for (const item of items as MenuItemUpdate[]) {
      try {
        const result = await convex.mutation(api.menuItems.adminUpdateMenuItem, {
          adminSecret,
          restaurantSlug,
          itemName: item.itemName,
          price: item.price,
          description: item.description,
          isAvailable: item.isAvailable,
        });
        results.updated.push({ name: item.itemName, itemId: result.itemId });
      } catch (error) {
        console.error(`Error updating menu item ${item.itemName}:`, error);
        results.errors.push({
          name: item.itemName,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }

    return NextResponse.json({
      success: true,
      updated: results.updated.length,
      errors: results.errors.length,
      results,
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[UpdateMenuItems] Error:", errorMessage);

    if (errorMessage.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

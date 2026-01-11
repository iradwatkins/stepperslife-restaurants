import { NextRequest, NextResponse } from "next/server";
import { convexClient as convex } from "@/lib/auth/convex-client";
import { api } from "@/convex/_generated/api";

interface MenuCategory {
  name: string;
  description?: string;
  sortOrder: number;
}

interface MenuItem {
  categoryName?: string;
  name: string;
  description?: string;
  price: number;
  sortOrder: number;
  isVegetarian?: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  isSpicy?: boolean;
}

/**
 * Admin endpoint to add menu categories and items
 * POST /api/admin/add-menu-items
 *
 * Body: {
 *   adminSecret: string,
 *   restaurantSlug: string,
 *   categories?: MenuCategory[],
 *   items: MenuItem[]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { adminSecret, restaurantSlug, categories, items } = body;

    if (!adminSecret || !restaurantSlug) {
      return NextResponse.json(
        { error: "Missing required fields: adminSecret, restaurantSlug" },
        { status: 400 }
      );
    }

    const results = {
      categories: [] as { name: string; categoryId: string }[],
      items: [] as { name: string; menuItemId: string }[],
    };

    // Create categories first
    if (categories && Array.isArray(categories)) {
      for (const category of categories) {
        try {
          const result = await convex.mutation(api.menuItems.adminCreateCategory, {
            adminSecret,
            restaurantSlug,
            name: category.name,
            description: category.description,
            sortOrder: category.sortOrder,
          });
          results.categories.push({ name: category.name, categoryId: result.categoryId });
        } catch (error) {
          console.error(`Error creating category ${category.name}:`, error);
        }
      }
    }

    // Create menu items
    if (items && Array.isArray(items)) {
      for (const item of items) {
        try {
          const result = await convex.mutation(api.menuItems.adminCreateMenuItem, {
            adminSecret,
            restaurantSlug,
            categoryName: item.categoryName,
            name: item.name,
            description: item.description,
            price: item.price,
            sortOrder: item.sortOrder,
            isVegetarian: item.isVegetarian,
            isVegan: item.isVegan,
            isGlutenFree: item.isGlutenFree,
            isSpicy: item.isSpicy,
          });
          results.items.push({ name: item.name, menuItemId: result.menuItemId });
        } catch (error) {
          console.error(`Error creating menu item ${item.name}:`, error);
        }
      }
    }

    return NextResponse.json({
      success: true,
      created: {
        categories: results.categories.length,
        items: results.items.length,
      },
      results,
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[AddMenuItems] Error:", errorMessage);

    if (errorMessage.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireRestaurantRole } from "./lib/restaurantAuth";

// Constants for analytics
const MAX_DAYS_RANGE = 365; // Maximum days to query
const DEFAULT_DAYS = 30;
const MIN_DAYS = 1;

/**
 * Validate and normalize the days parameter
 */
function validateDays(days: number | undefined): number {
  const value = days ?? DEFAULT_DAYS;
  if (!Number.isFinite(value) || value < MIN_DAYS) {
    return DEFAULT_DAYS;
  }
  return Math.min(Math.floor(value), MAX_DAYS_RANGE);
}

// Get order stats for a restaurant (requires MANAGER role or higher)
export const getOrderStats = query({
  args: {
    restaurantId: v.id("restaurants"),
    days: v.optional(v.number()), // Last N days, default 30, max 365
  },
  handler: async (ctx, args) => {
    // Verify user has at least MANAGER role for this restaurant
    await requireRestaurantRole(ctx, args.restaurantId, "RESTAURANT_MANAGER");

    const days = validateDays(args.days);
    const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000;

    const allOrders = await ctx.db
      .query("foodOrders")
      .withIndex("by_restaurant", (q) => q.eq("restaurantId", args.restaurantId))
      .collect();

    const recentOrders = allOrders.filter((o) => o.placedAt >= cutoffTime);

    // Calculate stats
    const totalOrders = recentOrders.length;
    const completedOrders = recentOrders.filter((o) => o.status === "COMPLETED");
    const cancelledOrders = recentOrders.filter((o) => o.status === "CANCELLED");
    const pendingOrders = recentOrders.filter((o) =>
      ["PENDING", "CONFIRMED", "PREPARING", "READY_FOR_PICKUP"].includes(o.status)
    );

    const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const averageOrderValue = completedOrders.length > 0
      ? totalRevenue / completedOrders.length
      : 0;

    return {
      totalOrders,
      completedOrders: completedOrders.length,
      cancelledOrders: cancelledOrders.length,
      pendingOrders: pendingOrders.length,
      totalRevenue,
      averageOrderValue,
      completionRate: totalOrders > 0
        ? Math.round((completedOrders.length / totalOrders) * 100)
        : 0,
    };
  },
});

// Get daily order trends (requires MANAGER role or higher)
export const getDailyTrends = query({
  args: {
    restaurantId: v.id("restaurants"),
    days: v.optional(v.number()), // Last N days, default 14, max 365
  },
  handler: async (ctx, args) => {
    // Verify user has at least MANAGER role for this restaurant
    await requireRestaurantRole(ctx, args.restaurantId, "RESTAURANT_MANAGER");

    const days = validateDays(args.days) || 14;
    const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000;

    const orders = await ctx.db
      .query("foodOrders")
      .withIndex("by_restaurant", (q) => q.eq("restaurantId", args.restaurantId))
      .collect();

    const recentOrders = orders.filter((o) => o.placedAt >= cutoffTime);

    // Group by day
    const dailyData: Record<string, { orders: number; revenue: number }> = {};

    // Initialize all days with zero
    for (let i = 0; i < days; i++) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split("T")[0];
      dailyData[dateStr] = { orders: 0, revenue: 0 };
    }

    // Fill in actual data
    recentOrders.forEach((order) => {
      const dateStr = new Date(order.placedAt).toISOString().split("T")[0];
      if (dailyData[dateStr]) {
        dailyData[dateStr].orders++;
        if (order.status === "COMPLETED") {
          dailyData[dateStr].revenue += order.total || 0;
        }
      }
    });

    // Convert to array sorted by date
    return Object.entries(dailyData)
      .map(([date, data]) => ({
        date,
        ...data,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  },
});

// Type for order items in analytics
interface OrderItem {
  menuItemId?: string;
  id?: string;
  name: string;
  quantity?: number;
  price?: number;
}

// Get popular menu items (requires MANAGER role or higher)
export const getPopularItems = query({
  args: {
    restaurantId: v.id("restaurants"),
    limit: v.optional(v.number()), // Max items to return, default 10, max 50
  },
  handler: async (ctx, args) => {
    // Verify user has at least MANAGER role for this restaurant
    await requireRestaurantRole(ctx, args.restaurantId, "RESTAURANT_MANAGER");

    // Validate limit (1-50 range)
    const limit = Math.min(Math.max(args.limit || 10, 1), 50);

    // Get completed orders
    const orders = await ctx.db
      .query("foodOrders")
      .withIndex("by_restaurant", (q) => q.eq("restaurantId", args.restaurantId))
      .filter((q) => q.eq(q.field("status"), "COMPLETED"))
      .collect();

    // Count item occurrences with proper typing
    const itemCounts: Record<string, { name: string; count: number; revenue: number }> = {};

    for (const order of orders) {
      if (order.items && Array.isArray(order.items)) {
        for (const item of order.items as OrderItem[]) {
          const id = item.menuItemId || item.id || item.name;
          if (!id) continue; // Skip items without an identifier

          if (!itemCounts[id]) {
            itemCounts[id] = { name: item.name || "Unknown Item", count: 0, revenue: 0 };
          }
          const quantity = Math.max(item.quantity || 1, 0);
          const price = Math.max(item.price || 0, 0);
          itemCounts[id].count += quantity;
          itemCounts[id].revenue += price * quantity;
        }
      }
    }

    // Sort by count and return top items
    return Object.entries(itemCounts)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  },
});

// Get hourly distribution of orders (requires MANAGER role or higher)
export const getHourlyDistribution = query({
  args: {
    restaurantId: v.id("restaurants"),
    days: v.optional(v.number()), // Last N days, default 30, max 365
  },
  handler: async (ctx, args) => {
    // Verify user has at least MANAGER role for this restaurant
    await requireRestaurantRole(ctx, args.restaurantId, "RESTAURANT_MANAGER");

    const days = validateDays(args.days);
    const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000;

    const orders = await ctx.db
      .query("foodOrders")
      .withIndex("by_restaurant", (q) => q.eq("restaurantId", args.restaurantId))
      .collect();

    const recentOrders = orders.filter((o) => o.placedAt >= cutoffTime);

    // Count orders by hour
    const hourlyData: number[] = new Array(24).fill(0);

    recentOrders.forEach((order) => {
      const hour = new Date(order.placedAt).getHours();
      hourlyData[hour]++;
    });

    return hourlyData.map((count, hour) => ({
      hour,
      label: `${hour === 0 ? 12 : hour > 12 ? hour - 12 : hour}${hour < 12 ? "AM" : "PM"}`,
      orders: count,
    }));
  },
});

// Get review stats summary (requires MANAGER role or higher)
export const getReviewSummary = query({
  args: { restaurantId: v.id("restaurants") },
  handler: async (ctx, args) => {
    // Verify user has at least MANAGER role for this restaurant
    await requireRestaurantRole(ctx, args.restaurantId, "RESTAURANT_MANAGER");

    const reviews = await ctx.db
      .query("restaurantReviews")
      .withIndex("by_restaurant", (q) => q.eq("restaurantId", args.restaurantId))
      .filter((q) => q.eq(q.field("status"), "published"))
      .collect();

    if (reviews.length === 0) {
      return {
        totalReviews: 0,
        averageRating: 0,
        recentReviews: [],
      };
    }

    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalRating / reviews.length;

    // Get 5 most recent reviews
    const recentReviews = reviews
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5)
      .map((r) => ({
        rating: r.rating,
        title: r.title,
        createdAt: r.createdAt,
      }));

    return {
      totalReviews: reviews.length,
      averageRating: Math.round(averageRating * 10) / 10,
      recentReviews,
    };
  },
});

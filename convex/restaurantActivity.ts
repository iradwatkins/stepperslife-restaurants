import { v } from "convex/values";
import { query } from "./_generated/server";
import { getCurrentUser } from "./lib/auth";
import { getMyRestaurants, getRestaurantAccess } from "./lib/restaurantAuth";
import { Id } from "./_generated/dataModel";

// Activity item type
interface ActivityItem {
  id: string;
  type: "order" | "review" | "staff" | "status";
  title: string;
  description: string;
  timestamp: number;
  restaurantId: string;
  restaurantName?: string;
  metadata?: Record<string, unknown>;
}

// Max items per category per restaurant (prevents memory issues)
const MAX_ITEMS_PER_CATEGORY = 10;
const MAX_TOTAL_ACTIVITY = 100;

/**
 * Get recent activity for user's restaurants
 * Combines orders, reviews, and staff changes into a single feed
 * Optimized to batch database queries and avoid N+1 patterns
 */
export const getRecentActivity = query({
  args: {
    restaurantId: v.optional(v.id("restaurants")),
    limit: v.optional(v.number()), // Max activities to return, default 20, max 100
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    // Validate limit (1-100 range)
    const limit = Math.min(Math.max(args.limit || 20, 1), MAX_TOTAL_ACTIVITY);

    // Get restaurants the user has access to
    let restaurantIds: Id<"restaurants">[] = [];

    if (args.restaurantId) {
      // Verify user has access to this restaurant
      const access = await getRestaurantAccess(ctx, args.restaurantId);
      if (!access) {
        throw new Error("Not authorized to view this restaurant's activity");
      }
      restaurantIds = [args.restaurantId];
    } else {
      // Get all restaurants user owns or manages
      const myRestaurants = await getMyRestaurants(ctx);
      restaurantIds = myRestaurants.map((r) => r.restaurant._id);
    }

    if (restaurantIds.length === 0) {
      return [];
    }

    // OPTIMIZATION: Batch fetch all restaurants at once
    const restaurants = await Promise.all(restaurantIds.map((id) => ctx.db.get(id)));
    const restaurantMap = new Map<string, string>();
    for (let i = 0; i < restaurantIds.length; i++) {
      const restaurant = restaurants[i];
      if (restaurant) {
        restaurantMap.set(restaurantIds[i], restaurant.name);
      }
    }

    // OPTIMIZATION: Batch fetch orders, reviews, and staff for all restaurants in parallel
    const [allOrders, allReviews, allStaff] = await Promise.all([
      // Fetch orders for all restaurants
      Promise.all(
        restaurantIds.map((restaurantId) =>
          ctx.db
            .query("foodOrders")
            .withIndex("by_restaurant", (q) => q.eq("restaurantId", restaurantId))
            .order("desc")
            .take(MAX_ITEMS_PER_CATEGORY)
        )
      ),
      // Fetch reviews for all restaurants
      Promise.all(
        restaurantIds.map((restaurantId) =>
          ctx.db
            .query("restaurantReviews")
            .withIndex("by_restaurant", (q) => q.eq("restaurantId", restaurantId))
            .order("desc")
            .take(MAX_ITEMS_PER_CATEGORY)
        )
      ),
      // Fetch staff changes for all restaurants
      Promise.all(
        restaurantIds.map((restaurantId) =>
          ctx.db
            .query("restaurantStaff")
            .withIndex("by_restaurant", (q) => q.eq("restaurantId", restaurantId))
            .order("desc")
            .take(MAX_ITEMS_PER_CATEGORY)
        )
      ),
    ]);

    // OPTIMIZATION: Collect all user IDs that need to be fetched
    const userIdsToFetch = new Set<Id<"users">>();
    for (const reviews of allReviews) {
      for (const review of reviews) {
        userIdsToFetch.add(review.customerId);
      }
    }
    for (const staffList of allStaff) {
      for (const staff of staffList) {
        if (staff.userId) {
          userIdsToFetch.add(staff.userId);
        }
      }
    }

    // OPTIMIZATION: Batch fetch all users at once
    const userIds = [...userIdsToFetch];
    const users = await Promise.all(userIds.map((id) => ctx.db.get(id)));
    const userMap = new Map<string, { name?: string }>();
    for (let i = 0; i < userIds.length; i++) {
      const user = users[i];
      if (user) {
        userMap.set(userIds[i], { name: user.name });
      }
    }

    // Build activities array
    const activities: ActivityItem[] = [];

    // Process orders
    for (let i = 0; i < restaurantIds.length; i++) {
      const restaurantId = restaurantIds[i];
      const restaurantName = restaurantMap.get(restaurantId);
      const orders = allOrders[i];

      for (const order of orders) {
        activities.push({
          id: order._id,
          type: "order",
          title: `New order #${order.orderNumber}`,
          description: `${order.customerName} - $${(order.total / 100).toFixed(2)}`,
          timestamp: order.placedAt,
          restaurantId,
          restaurantName,
          metadata: {
            status: order.status,
            total: order.total,
            itemCount: order.items.length,
          },
        });
      }
    }

    // Process reviews
    for (let i = 0; i < restaurantIds.length; i++) {
      const restaurantId = restaurantIds[i];
      const restaurantName = restaurantMap.get(restaurantId);
      const reviews = allReviews[i];

      for (const review of reviews) {
        const reviewer = userMap.get(review.customerId);
        activities.push({
          id: review._id,
          type: "review",
          title: `New ${review.rating}-star review`,
          description: review.reviewText
            ? review.reviewText.substring(0, 80) + (review.reviewText.length > 80 ? "..." : "")
            : "No comment",
          timestamp: review.createdAt,
          restaurantId,
          restaurantName,
          metadata: {
            rating: review.rating,
            reviewerName: reviewer?.name || "Anonymous",
          },
        });
      }
    }

    // Process staff changes
    for (let i = 0; i < restaurantIds.length; i++) {
      const restaurantId = restaurantIds[i];
      const restaurantName = restaurantMap.get(restaurantId);
      const staffList = allStaff[i];

      for (const staff of staffList) {
        const staffUser = staff.userId ? userMap.get(staff.userId) : null;
        const statusLabel =
          staff.status === "ACTIVE"
            ? "joined"
            : staff.status === "PENDING"
              ? "was invited"
              : "left";
        activities.push({
          id: staff._id,
          type: "staff",
          title: `${staffUser?.name || staff.name} ${statusLabel}`,
          description: `Role: ${staff.role === "RESTAURANT_MANAGER" ? "Manager" : "Staff"}`,
          timestamp: staff.updatedAt || staff.createdAt,
          restaurantId,
          restaurantName,
          metadata: {
            role: staff.role,
            status: staff.status,
          },
        });
      }
    }

    // Sort by timestamp (most recent first) and limit
    activities.sort((a, b) => b.timestamp - a.timestamp);
    return activities.slice(0, limit);
  },
});

/**
 * Get order stats for dashboard
 * Optimized to batch queries across restaurants
 */
export const getOrderStats = query({
  args: {
    restaurantId: v.optional(v.id("restaurants")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    // Get restaurants the user has access to
    let restaurantIds: Id<"restaurants">[] = [];

    if (args.restaurantId) {
      const access = await getRestaurantAccess(ctx, args.restaurantId);
      if (!access) {
        throw new Error("Not authorized");
      }
      restaurantIds = [args.restaurantId];
    } else {
      const myRestaurants = await getMyRestaurants(ctx);
      restaurantIds = myRestaurants.map((r) => r.restaurant._id);
    }

    if (restaurantIds.length === 0) {
      return {
        pendingOrders: 0,
        todayOrders: 0,
        todayRevenue: 0,
        averageRating: 0,
      };
    }

    const todayStart = new Date().setHours(0, 0, 0, 0);

    // OPTIMIZATION: Fetch all orders for all restaurants in parallel
    const [allOrders, allReviews] = await Promise.all([
      Promise.all(
        restaurantIds.map((restaurantId) =>
          ctx.db
            .query("foodOrders")
            .withIndex("by_restaurant", (q) => q.eq("restaurantId", restaurantId))
            .collect()
        )
      ),
      Promise.all(
        restaurantIds.map((restaurantId) =>
          ctx.db
            .query("restaurantReviews")
            .withIndex("by_restaurant", (q) => q.eq("restaurantId", restaurantId))
            .filter((q) => q.eq(q.field("status"), "published"))
            .collect()
        )
      ),
    ]);

    // Calculate stats across all restaurants
    let pendingOrders = 0;
    let todayOrders = 0;
    let todayRevenue = 0;
    let totalRating = 0;
    let reviewCount = 0;

    for (const orders of allOrders) {
      for (const order of orders) {
        // Count pending orders
        if (["PENDING", "CONFIRMED", "PREPARING"].includes(order.status)) {
          pendingOrders++;
        }
        // Count today's orders
        if (order.placedAt >= todayStart) {
          todayOrders++;
          todayRevenue += order.total;
        }
      }
    }

    for (const reviews of allReviews) {
      for (const review of reviews) {
        totalRating += review.rating;
        reviewCount++;
      }
    }

    return {
      pendingOrders,
      todayOrders,
      todayRevenue,
      averageRating: reviewCount > 0 ? Math.round((totalRating / reviewCount) * 10) / 10 : 0,
    };
  },
});

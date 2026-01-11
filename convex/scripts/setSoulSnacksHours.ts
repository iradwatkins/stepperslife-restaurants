import { internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";

/**
 * Set operating hours for Soul Snacks restaurant
 * Run via: npx convex run scripts/setSoulSnacksHours:run
 */
export const run = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Soul Snacks hours - typical soul food restaurant hours
    const operatingHours = {
      monday: { open: "11:00", close: "21:00", closed: false },
      tuesday: { open: "11:00", close: "21:00", closed: false },
      wednesday: { open: "11:00", close: "21:00", closed: false },
      thursday: { open: "11:00", close: "22:00", closed: false },
      friday: { open: "11:00", close: "23:00", closed: false },
      saturday: { open: "12:00", close: "23:00", closed: false },
      sunday: { open: "12:00", close: "20:00", closed: false },
    };

    // Find Soul Snacks by slug
    const restaurant = await ctx.db
      .query("restaurants")
      .withIndex("by_slug", (q) => q.eq("slug", "soul-snacks"))
      .first();

    if (!restaurant) {
      throw new Error("Soul Snacks restaurant not found");
    }

    // Update the restaurant with hours and enable accepting orders
    await ctx.db.patch(restaurant._id, {
      operatingHours,
      acceptingOrders: true,
      updatedAt: Date.now(),
    });

    return {
      success: true,
      restaurant: restaurant.name,
      hours: operatingHours,
    };
  },
});

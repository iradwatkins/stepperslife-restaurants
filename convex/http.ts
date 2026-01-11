import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

// Admin endpoint to set restaurant hours
// Call via: POST https://convex.toolboxhosting.com/admin/setHours
// Body: { "adminSecret": "...", "slug": "soul-snacks", "operatingHours": {...} }
http.route({
  path: "/admin/setHours",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();
      const { adminSecret, slug, operatingHours, acceptingOrders } = body;

      // Verify admin secret (use environment variable in production)
      const expectedSecret = process.env.ADMIN_SECRET || "stepperslife-admin-2024";
      if (adminSecret !== expectedSecret) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Call the internal mutation
      const result = await ctx.runMutation(internal.restaurants.updateHoursInternal, {
        slug,
        operatingHours,
        acceptingOrders,
      });

      return new Response(JSON.stringify({ success: true, result }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error setting hours:", error);
      return new Response(
        JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }),
});

// Health check endpoint
http.route({
  path: "/health",
  method: "GET",
  handler: httpAction(async () => {
    return new Response(JSON.stringify({ status: "ok", timestamp: Date.now() }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

export default http;

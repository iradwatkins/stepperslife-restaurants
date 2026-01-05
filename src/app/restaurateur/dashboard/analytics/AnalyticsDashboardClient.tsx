"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { RestaurantsSubNav } from "@/components/layout/RestaurantsSubNav";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  BarChart3,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Clock,
  Star,
  Loader2,
  LogIn,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AnalyticsDashboardClient() {
  const currentUser = useQuery(api.users.queries.getCurrentUser);
  const restaurant = useQuery(
    api.menuItems.getRestaurantByOwner,
    currentUser?._id ? { ownerId: currentUser._id } : "skip"
  );

  const orderStats = useQuery(
    api.restaurantAnalytics.getOrderStats,
    restaurant?._id ? { restaurantId: restaurant._id, days: 30 } : "skip"
  );
  const dailyTrends = useQuery(
    api.restaurantAnalytics.getDailyTrends,
    restaurant?._id ? { restaurantId: restaurant._id, days: 14 } : "skip"
  );
  const popularItems = useQuery(
    api.restaurantAnalytics.getPopularItems,
    restaurant?._id ? { restaurantId: restaurant._id, limit: 5 } : "skip"
  );
  const hourlyDist = useQuery(
    api.restaurantAnalytics.getHourlyDistribution,
    restaurant?._id ? { restaurantId: restaurant._id, days: 30 } : "skip"
  );
  const reviewSummary = useQuery(
    api.restaurantAnalytics.getReviewSummary,
    restaurant?._id ? { restaurantId: restaurant._id } : "skip"
  );

  // Loading state
  if (currentUser === undefined) {
    return (
      <>
        <PublicHeader />
        <RestaurantsSubNav />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <PublicFooter />
      </>
    );
  }

  // Not logged in
  if (!currentUser) {
    return (
      <>
        <PublicHeader />
        <RestaurantsSubNav />
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-16">
            <div className="max-w-md mx-auto bg-card rounded-2xl shadow-lg p-8 text-center border border-border">
              <LogIn className="w-12 h-12 text-primary mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-4">Sign In Required</h1>
              <p className="text-muted-foreground mb-6">
                Please sign in to view your restaurant analytics.
              </p>
              <Button asChild className="w-full bg-primary hover:bg-primary/90">
                <Link href="/login">Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
        <PublicFooter />
      </>
    );
  }

  // No restaurant
  if (restaurant === null) {
    return (
      <>
        <PublicHeader />
        <RestaurantsSubNav />
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-16">
            <div className="max-w-md mx-auto bg-card rounded-2xl shadow-lg p-8 text-center border border-border">
              <AlertCircle className="w-12 h-12 text-warning mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-4">No Restaurant Found</h1>
              <p className="text-muted-foreground mb-6">
                You don't have a restaurant registered yet.
              </p>
              <Button asChild className="w-full bg-primary hover:bg-primary/90">
                <Link href="/restaurateur/apply">Apply Now</Link>
              </Button>
            </div>
          </div>
        </div>
        <PublicFooter />
      </>
    );
  }

  // Loading data
  if (!orderStats || !dailyTrends || !popularItems || !hourlyDist || !reviewSummary) {
    return (
      <>
        <PublicHeader />
        <RestaurantsSubNav />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <PublicFooter />
      </>
    );
  }

  // Find peak hour
  const peakHour = hourlyDist.reduce((max, curr) =>
    curr.orders > max.orders ? curr : max
  , hourlyDist[0]);

  // Calculate max for chart scaling
  const maxDailyOrders = Math.max(...dailyTrends.map((d) => d.orders), 1);
  const maxHourlyOrders = Math.max(...hourlyDist.map((h) => h.orders), 1);

  return (
    <>
      <PublicHeader />
      <RestaurantsSubNav />
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-gradient-to-br from-sky-600 to-primary py-6">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-4">
              <Link
                href="/restaurateur/dashboard"
                className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Analytics</h1>
                  <p className="text-white/80 text-sm">{restaurant?.name} - Last 30 Days</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-info/20 dark:bg-primary/20 rounded-lg">
                    <ShoppingBag className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{orderStats.totalOrders}</p>
                    <p className="text-xs text-muted-foreground">Total Orders</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-success/20 dark:bg-success/20 rounded-lg">
                    <DollarSign className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">${(orderStats.totalRevenue / 100).toFixed(0)}</p>
                    <p className="text-xs text-muted-foreground">Revenue</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-sky-100 dark:bg-sky-900/30 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">${(orderStats.averageOrderValue / 100).toFixed(0)}</p>
                    <p className="text-xs text-muted-foreground">Avg Order</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-warning/20 dark:bg-warning/20 rounded-lg">
                    <Star className="w-5 h-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{reviewSummary.averageRating || "N/A"}</p>
                    <p className="text-xs text-muted-foreground">Avg Rating</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Order Status Breakdown */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Order Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Completed</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-muted dark:bg-card rounded-full overflow-hidden">
                        <div
                          className="h-full bg-success rounded-full"
                          style={{ width: `${orderStats.totalOrders ? (orderStats.completedOrders / orderStats.totalOrders) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-8">{orderStats.completedOrders}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Pending</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-muted dark:bg-card rounded-full overflow-hidden">
                        <div
                          className="h-full bg-warning/100 rounded-full"
                          style={{ width: `${orderStats.totalOrders ? (orderStats.pendingOrders / orderStats.totalOrders) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-8">{orderStats.pendingOrders}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Cancelled</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-muted dark:bg-card rounded-full overflow-hidden">
                        <div
                          className="h-full bg-destructive/100 rounded-full"
                          style={{ width: `${orderStats.totalOrders ? (orderStats.cancelledOrders / orderStats.totalOrders) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-8">{orderStats.cancelledOrders}</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground">
                      Completion Rate: <span className="font-semibold text-foreground">{orderStats.completionRate}%</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Popular Items */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Top Selling Items</CardTitle>
              </CardHeader>
              <CardContent>
                {popularItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No order data yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {popularItems.map((item, index) => (
                      <div key={item.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-primary/10 dark:bg-primary/20 text-primary text-xs flex items-center justify-center font-semibold">
                            {index + 1}
                          </span>
                          <span className="text-sm font-medium">{item.name}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">{item.count} sold</p>
                          <p className="text-xs text-muted-foreground">${(item.revenue / 100).toFixed(0)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Daily Orders Chart */}
          <Card className="mb-8">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Daily Orders (Last 14 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-40 flex items-end gap-1">
                {dailyTrends.map((day) => (
                  <div
                    key={day.date}
                    className="flex-1 flex flex-col items-center gap-1"
                  >
                    <div
                      className="w-full bg-primary/50 rounded-t transition-all hover:bg-primary"
                      style={{ height: `${(day.orders / maxDailyOrders) * 100}%`, minHeight: day.orders > 0 ? "4px" : "0" }}
                      title={`${day.date}: ${day.orders} orders, $${(day.revenue / 100).toFixed(0)}`}
                    />
                    <span className="text-[10px] text-muted-foreground rotate-45 origin-left">
                      {new Date(day.date).getDate()}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Peak Hours */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Order Times</CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  Peak: {peakHour.label}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-24 flex items-end gap-0.5">
                {hourlyDist.map((hour) => (
                  <div
                    key={hour.hour}
                    className="flex-1 flex flex-col items-center"
                  >
                    <div
                      className={`w-full rounded-t transition-all ${
                        hour.hour === peakHour.hour ? "bg-primary/50" : "bg-muted dark:bg-accent"
                      }`}
                      style={{ height: `${(hour.orders / maxHourlyOrders) * 100}%`, minHeight: hour.orders > 0 ? "2px" : "0" }}
                      title={`${hour.label}: ${hour.orders} orders`}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
                <span>12AM</span>
                <span>6AM</span>
                <span>12PM</span>
                <span>6PM</span>
                <span>11PM</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <PublicFooter />
    </>
  );
}

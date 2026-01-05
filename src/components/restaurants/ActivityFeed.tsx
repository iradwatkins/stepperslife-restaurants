"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  ShoppingBag,
  Star,
  Users,
  Clock,
  ArrowRight,
  Bell,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

interface ActivityFeedProps {
  restaurantId?: Id<"restaurants">;
  limit?: number;
  showStats?: boolean;
}

export function ActivityFeed({
  restaurantId,
  limit = 10,
  showStats = true,
}: ActivityFeedProps) {
  const activity = useQuery(api.restaurantActivity.getRecentActivity, {
    restaurantId,
    limit,
  });

  const stats = useQuery(api.restaurantActivity.getOrderStats, {
    restaurantId,
  });

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "order":
        return ShoppingBag;
      case "review":
        return Star;
      case "staff":
        return Users;
      default:
        return Bell;
    }
  };

  const getActivityColor = (type: string, metadata?: Record<string, unknown>) => {
    switch (type) {
      case "order":
        if (metadata?.status === "PENDING") return "text-warning bg-warning/20 dark:bg-warning/20";
        if (metadata?.status === "COMPLETED") return "text-success bg-success/20 dark:bg-success/20";
        return "text-primary bg-info/20 dark:bg-primary/20";
      case "review":
        const rating = metadata?.rating as number;
        if (rating >= 4) return "text-success bg-success/20 dark:bg-success/20";
        if (rating >= 3) return "text-warning bg-warning/20 dark:bg-warning/20";
        return "text-destructive bg-destructive/20 dark:bg-destructive/20";
      case "staff":
        if (metadata?.status === "ACTIVE") return "text-success bg-success/20 dark:bg-success/20";
        if (metadata?.status === "PENDING") return "text-warning bg-warning/20 dark:bg-warning/20";
        return "text-muted-foreground bg-muted dark:bg-background/30";
      default:
        return "text-muted-foreground bg-muted dark:bg-background/30";
    }
  };

  if (activity === undefined || (showStats && stats === undefined)) {
    return (
      <div className="animate-pulse space-y-4">
        {showStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-muted rounded-xl h-24" />
            ))}
          </div>
        )}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="h-4 bg-muted rounded w-1/4 mb-4" />
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-10 h-10 bg-muted rounded-lg" />
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded w-1/2 mb-2" />
                  <div className="h-3 bg-muted rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {showStats && stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-warning/20 dark:bg-warning/20 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {stats.pendingOrders}
                </p>
                <p className="text-xs text-muted-foreground">Pending Orders</p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-info/20 dark:bg-primary/20 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {stats.todayOrders}
                </p>
                <p className="text-xs text-muted-foreground">Today's Orders</p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/20 dark:bg-success/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  ${stats.todayRevenue.toFixed(0)}
                </p>
                <p className="text-xs text-muted-foreground">Today's Revenue</p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-info/20 dark:bg-primary/20 flex items-center justify-center">
                <Star className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "-"}
                </p>
                <p className="text-xs text-muted-foreground">Avg Rating</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Activity Feed */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Recent Activity
          </h3>
          <Link
            href="/restaurateur/dashboard/orders"
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            View all orders
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {activity.length === 0 ? (
          <div className="p-8 text-center">
            <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No recent activity</p>
            <p className="text-sm text-muted-foreground mt-1">
              Orders, reviews, and staff updates will appear here
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {activity.map((item) => {
              const Icon = getActivityIcon(item.type);
              const colorClass = getActivityColor(item.type, item.metadata);

              return (
                <div
                  key={item.id}
                  className="flex items-start gap-3 p-4 hover:bg-muted/50 transition-colors"
                >
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-foreground text-sm">
                          {item.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {item.description}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatTime(item.timestamp)}
                      </span>
                    </div>
                    {item.restaurantName && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {item.restaurantName}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default ActivityFeed;

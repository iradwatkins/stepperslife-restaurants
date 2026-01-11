"use client";

import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { RestaurantsSubNav } from "@/components/layout/RestaurantsSubNav";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { Id } from "@/convex/_generated/dataModel";
import {
  ChefHat,
  Clock,
  CheckCircle,
  XCircle,
  Package,
  Phone,
  Mail,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  LogIn,
  Bell,
  BellOff,
  Volume2,
  VolumeX,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";

type OrderStatus = "PENDING" | "CONFIRMED" | "PREPARING" | "READY_FOR_PICKUP" | "COMPLETED" | "CANCELLED";

interface OrderItem {
  menuItemId: Id<"menuItems">;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
}

interface FoodOrder {
  _id: Id<"foodOrders">;
  _creationTime: number;
  orderNumber: string;
  restaurantId: Id<"restaurants">;
  customerId?: Id<"users">;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  pickupTime?: number;
  specialInstructions?: string;
  status: string;
  paymentStatus: string;
  paymentMethod?: string;
  placedAt: number;
  readyAt?: number;
  completedAt?: number;
}

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bgColor: string; icon: typeof Clock; pulse?: boolean }> = {
  PENDING: { label: "New Order", color: "text-warning", bgColor: "bg-warning/20 dark:bg-warning/20", icon: Clock, pulse: true },
  CONFIRMED: { label: "Confirmed", color: "text-info", bgColor: "bg-info/20 dark:bg-primary/20", icon: CheckCircle },
  PREPARING: { label: "Preparing", color: "text-primary", bgColor: "bg-primary/10 dark:bg-primary/20", icon: ChefHat },
  READY_FOR_PICKUP: { label: "Ready", color: "text-success", bgColor: "bg-success/20 dark:bg-success/20", icon: Package },
  COMPLETED: { label: "Completed", color: "text-foreground", bgColor: "bg-muted dark:bg-card", icon: CheckCircle },
  CANCELLED: { label: "Cancelled", color: "text-destructive", bgColor: "bg-destructive/20 dark:bg-destructive/20", icon: XCircle },
};

const STATUS_FLOW: OrderStatus[] = ["PENDING", "CONFIRMED", "PREPARING", "READY_FOR_PICKUP", "COMPLETED"];

export default function RestaurateurOrdersClient() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [selectedRestaurant, setSelectedRestaurant] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "ALL">("ALL");

  // Audio and notification states
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | null>(null);
  const previousOrderCountRef = useRef<number>(0);
  const previousPendingOrderIdsRef = useRef<Set<string>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isFirstLoadRef = useRef(true);

  // Get all restaurants the user has access to (owned + staff assignments)
  const accessibleRestaurants = useQuery(api.restaurantStaff.getMyAccessibleRestaurants);

  // Get orders for selected restaurant
  const orders = useQuery(
    api.foodOrders.getByRestaurant,
    selectedRestaurant ? { restaurantId: selectedRestaurant as Id<"restaurants"> } : "skip"
  );

  const updateOrderStatus = useAction(api.foodOrders.updateStatusWithNotification);
  const updatePaymentStatus = useMutation(api.foodOrders.updatePaymentStatus);

  // Initialize audio element
  useEffect(() => {
    // Create audio element with a simple beep sound (base64 encoded)
    audioRef.current = new Audio();
    // Use a data URL for a simple notification sound
    audioRef.current.src = "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fZmVoaWRfW15hX2BhYWFgYGBhYWJiY2NkZGRjY2NiYmFhYGBeXl1cW1pZWFhXV1dXV1hYWVlZWltbXF1eX2BhYmNkZWZnZ2hoaWlpaWlpaWhoZ2dmZWRjYmFgX15dXFtaWVhXVlVUU1NSUVFQUFBQUFBRUVJSU1NUVVZXWFlbXF1fYGJjZWdoamtsbW5vb29vbm5tbGtqaGdmZGNhYF5dW1pYV1VTUlBPTk1MS0tLS0tLTExNTk9QUVNUVVZYWV1gYWJkZ2lqbG1ub3Bxc3NycnJxcG9ubGtpZ2ZkYmBfXVtZV1VTUU9OTEtKSUhIR0dHSEhISUpKTE1OT1FSVFZYWltdX2FjZWdpamxub3BxcXFxcXBwb25sa2lpZ2VkYmBfXVtZV1VTUQ==";

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Check notification permission on mount
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationPermission(Notification.permission);
      setNotificationsEnabled(Notification.permission === "granted");
    }
  }, []);

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((e) => {
        console.log("Audio play failed:", e);
      });
    }
  }, [soundEnabled]);

  // Show browser notification
  const showBrowserNotification = useCallback((title: string, body: string) => {
    if (notificationsEnabled && Notification.permission === "granted") {
      const notification = new Notification(title, {
        body,
        icon: "/logos/stepperslife-logo-dark.png",
        badge: "/logos/stepperslife-logo-dark.png",
        tag: "new-food-order",
        requireInteraction: true,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Auto-close after 10 seconds
      setTimeout(() => notification.close(), 10000);
    }
  }, [notificationsEnabled]);

  // Request notification permission
  const requestNotificationPermission = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      setNotificationsEnabled(permission === "granted");
    }
  };

  // Watch for new orders and trigger alerts
  useEffect(() => {
    if (!orders || isFirstLoadRef.current) {
      // On first load, just set the initial state without alerting
      if (orders) {
        const pendingOrders = orders.filter((o: FoodOrder) => o.status === "PENDING");
        previousOrderCountRef.current = orders.length;
        previousPendingOrderIdsRef.current = new Set(pendingOrders.map((o: FoodOrder) => o._id));
        isFirstLoadRef.current = false;
      }
      return;
    }

    const pendingOrders = orders.filter((o: FoodOrder) => o.status === "PENDING");
    const currentPendingIds = new Set(pendingOrders.map((o: FoodOrder) => o._id));

    // Find new pending orders (orders that weren't in the previous set)
    const newPendingOrders = pendingOrders.filter(
      (o: FoodOrder) => !previousPendingOrderIdsRef.current.has(o._id)
    );

    if (newPendingOrders.length > 0) {
      // New order(s) arrived!
      playNotificationSound();

      // Show browser notification for each new order
      newPendingOrders.forEach((order: FoodOrder) => {
        const itemCount = order.items.reduce((sum: number, item: OrderItem) => sum + item.quantity, 0);
        showBrowserNotification(
          "🍽️ New Food Order!",
          `${order.customerName} ordered ${itemCount} item${itemCount > 1 ? "s" : ""} - $${(order.total / 100).toFixed(2)}`
        );
      });

      // Update page title to indicate new orders
      const pendingCount = pendingOrders.length;
      if (pendingCount > 0) {
        document.title = `(${pendingCount}) New Orders - SteppersLife`;
      }
    } else if (pendingOrders.length === 0) {
      // All orders processed, reset title
      document.title = "Order Management - SteppersLife";
    }

    // Update refs for next comparison
    previousOrderCountRef.current = orders.length;
    previousPendingOrderIdsRef.current = currentPendingIds;
  }, [orders, playNotificationSound, showBrowserNotification]);

  // Loading state
  if (authLoading) {
    return (
      <>
        <PublicHeader />
        <RestaurantsSubNav />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
        <PublicFooter />
      </>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <>
        <PublicHeader />
        <RestaurantsSubNav />
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-16">
            <div className="max-w-md mx-auto bg-card rounded-2xl shadow-lg p-8 text-center border border-border">
              <div className="w-16 h-16 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <LogIn className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-4">Sign In Required</h1>
              <p className="text-muted-foreground mb-8">
                Please sign in to manage your restaurant orders.
              </p>
              <Link
                href={`/login?redirect=${encodeURIComponent("/restaurateur/dashboard/orders")}`}
                className="block w-full px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
        <PublicFooter />
      </>
    );
  }

  // No restaurants (no owned or staff assignments)
  if (accessibleRestaurants && accessibleRestaurants.length === 0) {
    return (
      <>
        <PublicHeader />
        <RestaurantsSubNav />
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-16">
            <div className="max-w-md mx-auto bg-card rounded-2xl shadow-lg p-8 text-center border border-border">
              <div className="w-16 h-16 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-4">No Restaurants Found</h1>
              <p className="text-muted-foreground mb-8">
                You don't have any restaurants registered yet. Apply to become a restaurant partner!
              </p>
              <Link
                href="/restaurateur/apply"
                className="block w-full px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              >
                Apply Now
              </Link>
            </div>
          </div>
        </div>
        <PublicFooter />
      </>
    );
  }

  // Auto-select first restaurant if none selected
  if (accessibleRestaurants && accessibleRestaurants.length > 0 && !selectedRestaurant) {
    setSelectedRestaurant(accessibleRestaurants[0].restaurant._id);
  }

  const handleStatusUpdate = async (orderId: Id<"foodOrders">, newStatus: OrderStatus) => {
    await updateOrderStatus({ id: orderId, status: newStatus });
  };

  const handleMarkPaid = async (orderId: Id<"foodOrders">) => {
    await updatePaymentStatus({ orderId, paymentStatus: "paid", paymentMethod: "cash" });
  };

  const filteredOrders = orders?.filter((order: FoodOrder) =>
    statusFilter === "ALL" || order.status === statusFilter
  ) || [];

  const activeOrders = orders?.filter((order: FoodOrder) =>
    !["COMPLETED", "CANCELLED"].includes(order.status)
  ).length || 0;

  return (
    <>
      <PublicHeader />
      <RestaurantsSubNav />
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-gradient-to-br from-sky-600 to-primary py-6">
          <div className="container mx-auto px-4">
            <Link
              href="/restaurateur/dashboard"
              className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <ChefHat className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Order Management</h1>
                  <p className="text-white/80">{activeOrders} active orders</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Sound Toggle */}
                <button
                  type="button"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    soundEnabled ? "bg-white/20 text-white" : "bg-white/10 text-white/60"
                  }`}
                  title={soundEnabled ? "Mute sounds" : "Enable sounds"}
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>

                {/* Notification Toggle */}
                {notificationPermission !== "granted" ? (
                  <button
                    type="button"
                    onClick={requestNotificationPermission}
                    className="flex items-center gap-2 px-3 py-2 bg-warning/100/80 text-white rounded-lg hover:bg-warning/100 transition-colors"
                    title="Enable browser notifications"
                  >
                    <Bell className="w-4 h-4" />
                    <span className="hidden sm:inline">Enable Alerts</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                      notificationsEnabled ? "bg-white/20 text-white" : "bg-white/10 text-white/60"
                    }`}
                    title={notificationsEnabled ? "Disable notifications" : "Enable notifications"}
                  >
                    {notificationsEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                  </button>
                )}

                {/* Refresh Button */}
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          {/* Restaurant Selector */}
          {accessibleRestaurants && accessibleRestaurants.length > 1 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Select Restaurant
              </label>
              <select
                value={selectedRestaurant || ""}
                onChange={(e) => setSelectedRestaurant(e.target.value)}
                className="w-full max-w-xs px-4 py-2 bg-card border border-input rounded-lg"
              >
                {accessibleRestaurants.map((item) => (
                  <option key={item.restaurant._id} value={item.restaurant._id}>
                    {item.restaurant.name} {item.role !== "OWNER" ? `(${item.role === "RESTAURANT_MANAGER" ? "Manager" : "Staff"})` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Status Filters */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              type="button"
              onClick={() => setStatusFilter("ALL")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                statusFilter === "ALL"
                  ? "bg-primary text-white"
                  : "bg-card border border-input hover:bg-muted"
              }`}
            >
              All Orders
            </button>
            {(Object.keys(STATUS_CONFIG) as OrderStatus[]).map((status) => {
              const config = STATUS_CONFIG[status];
              const count = orders?.filter((o: FoodOrder) => o.status === status).length || 0;
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                    statusFilter === status
                      ? "bg-primary text-white"
                      : "bg-card border border-input hover:bg-muted"
                  }`}
                >
                  {config.label}
                  {count > 0 && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      statusFilter === status ? "bg-white/20" : config.bgColor
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Orders List */}
          {orders === undefined ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-xl border border-border">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Orders Found</h3>
              <p className="text-muted-foreground">
                {statusFilter === "ALL"
                  ? "No orders have been placed yet."
                  : `No ${STATUS_CONFIG[statusFilter].label.toLowerCase()} orders.`}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order: FoodOrder) => {
                const statusConfig = STATUS_CONFIG[order.status as OrderStatus] || STATUS_CONFIG.PENDING;
                const StatusIcon = statusConfig.icon;
                const currentStatusIndex = STATUS_FLOW.indexOf(order.status as OrderStatus);
                const nextStatus = currentStatusIndex >= 0 && currentStatusIndex < STATUS_FLOW.length - 1
                  ? STATUS_FLOW[currentStatusIndex + 1]
                  : null;

                return (
                  <div
                    key={order._id}
                    className="bg-card rounded-xl border border-border p-6"
                  >
                    {/* Order Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-lg">
                            #{order.orderNumber}
                          </span>
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${statusConfig.bgColor} ${statusConfig.color} ${statusConfig.pulse ? "animate-pulse" : ""}`}>
                            <StatusIcon className="w-4 h-4" />
                            {statusConfig.label}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Placed {new Date(order.placedAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-xl">${(order.total / 100).toFixed(2)}</p>
                        <p className={`text-sm ${order.paymentStatus === "paid" ? "text-success" : "text-warning"}`}>
                          {order.paymentStatus === "paid" ? "Paid" : "Payment Pending"}
                        </p>
                      </div>
                    </div>

                    {/* Customer Info */}
                    <div className="bg-muted/50 rounded-lg p-4 mb-4">
                      <h4 className="font-medium mb-2">Customer</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                        <span className="font-medium">{order.customerName}</span>
                        <a href={`tel:${order.customerPhone}`} className="flex items-center gap-1 text-primary hover:underline">
                          <Phone className="w-3 h-3" />
                          {order.customerPhone}
                        </a>
                        <a href={`mailto:${order.customerEmail}`} className="flex items-center gap-1 text-primary hover:underline">
                          <Mail className="w-3 h-3" />
                          {order.customerEmail}
                        </a>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="mb-4">
                      <h4 className="font-medium mb-2">Items</h4>
                      <div className="space-y-2">
                        {order.items.map((item: OrderItem, idx: number) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span>
                              {item.quantity}x {item.name}
                              {item.notes && (
                                <span className="text-muted-foreground ml-2">({item.notes})</span>
                              )}
                            </span>
                            <span className="font-medium">${((item.price * item.quantity) / 100).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                      {order.specialInstructions && (
                        <div className="mt-3 p-3 bg-warning/10 dark:bg-warning/15 rounded-lg">
                          <p className="text-sm">
                            <span className="font-medium">Special Instructions:</span>{" "}
                            {order.specialInstructions}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Order Totals */}
                    <div className="border-t pt-4 mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>${(order.subtotal / 100).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Tax</span>
                        <span>${(order.tax / 100).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold">
                        <span>Total</span>
                        <span>${(order.total / 100).toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    {order.status !== "COMPLETED" && order.status !== "CANCELLED" && (
                      <div className="flex flex-wrap gap-3">
                        {nextStatus && (
                          <button
                            type="button"
                            onClick={() => handleStatusUpdate(order._id, nextStatus)}
                            className="flex-1 sm:flex-none px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
                          >
                            Mark as {STATUS_CONFIG[nextStatus].label}
                          </button>
                        )}
                        {order.paymentStatus !== "paid" && (
                          <button
                            type="button"
                            onClick={() => handleMarkPaid(order._id)}
                            className="flex-1 sm:flex-none px-4 py-2 bg-success text-white rounded-lg font-medium hover:bg-success/80 transition-colors"
                          >
                            Mark as Paid
                          </button>
                        )}
                        {order.status === "PENDING" && (
                          <button
                            type="button"
                            onClick={() => handleStatusUpdate(order._id, "CANCELLED")}
                            className="px-4 py-2 border border-destructive/50 text-destructive rounded-lg font-medium hover:bg-destructive/10 dark:hover:bg-destructive/20 transition-colors"
                          >
                            Cancel Order
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <PublicFooter />
    </>
  );
}

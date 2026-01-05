"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { RestaurantsSubNav } from "@/components/layout/RestaurantsSubNav";
import { PublicFooter } from "@/components/layout/PublicFooter";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  ChefHat,
  Search,
  Utensils,
  MapPin,
  Phone,
  RefreshCw,
  LogIn,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { useFoodCart } from "@/contexts/FoodCartContext";
import { useRouter } from "next/navigation";
import type { Id, Doc } from "@/convex/_generated/dataModel";

type OrderStatus = "PENDING" | "CONFIRMED" | "PREPARING" | "READY_FOR_PICKUP" | "COMPLETED" | "CANCELLED";

interface FoodOrder extends Doc<"foodOrders"> {
  _id: Id<"foodOrders">;
  orderNumber: string;
  restaurantId: Id<"restaurants">;
  customerId?: Id<"users">;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: Array<{
    menuItemId: Id<"menuItems">;
    name: string;
    price: number;
    quantity: number;
    notes?: string;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  pickupTime?: number;
  specialInstructions?: string;
  status: string;
  paymentStatus: string;
  placedAt: number;
  readyAt?: number;
  completedAt?: number;
  paymentMethod?: string;
}

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bgColor: string; icon: typeof Clock }> = {
  PENDING: { label: "Order Placed", color: "text-warning dark:text-warning", bgColor: "bg-warning/20 dark:bg-warning/20", icon: Clock },
  CONFIRMED: { label: "Confirmed", color: "text-info dark:text-primary", bgColor: "bg-info/20 dark:bg-primary/20", icon: CheckCircle },
  PREPARING: { label: "Preparing", color: "text-primary dark:text-primary", bgColor: "bg-primary/10 dark:bg-primary/20", icon: ChefHat },
  READY_FOR_PICKUP: { label: "Ready for Pickup", color: "text-success dark:text-success", bgColor: "bg-success/20 dark:bg-success/20", icon: Package },
  COMPLETED: { label: "Completed", color: "text-foreground dark:text-muted-foreground", bgColor: "bg-muted dark:bg-card", icon: CheckCircle },
  CANCELLED: { label: "Cancelled", color: "text-destructive dark:text-destructive", bgColor: "bg-destructive/20 dark:bg-destructive/20", icon: XCircle },
};

export default function MyFoodOrdersPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "ALL">("ALL");
  const { reorderItems } = useFoodCart();
  const router = useRouter();

  // Get food orders for the current user
  const orders = useQuery(
    api.foodOrders.getByCustomer,
    user?._id ? { customerId: user._id as Id<"users"> } : "skip"
  );

  // Get all restaurants to map IDs to slugs/names
  const restaurants = useQuery(api.restaurants.getAll, {});

  // Create a map of restaurant ID to restaurant info
  const restaurantMap = new Map<string, { slug: string; name: string }>();
  restaurants?.forEach((r: { _id: Id<"restaurants">; slug: string; name: string }) => {
    restaurantMap.set(r._id, { slug: r.slug, name: r.name });
  });

  // Handle reorder click
  const handleReorder = (order: FoodOrder) => {
    const restaurant = restaurantMap.get(order.restaurantId);
    if (!restaurant) {
      toast.error("Restaurant not found. Please browse restaurants to place a new order.");
      return;
    }

    // Convert order items to cart items
    const cartItems = order.items.map(item => ({
      menuItemId: item.menuItemId as unknown as string,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      notes: item.notes,
    }));

    reorderItems(order.restaurantId, restaurant.slug, restaurant.name, cartItems);
    router.push(`/restaurants/${restaurant.slug}`);
  };

  // Loading state
  if (authLoading) {
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
                Please sign in to view your food order history.
              </p>
              <Link
                href={`/login?redirect=${encodeURIComponent("/restaurants/my-orders")}`}
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

  // Filter orders
  const filteredOrders = orders?.filter((order: FoodOrder) => {
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchesOrderNumber = order.orderNumber.toLowerCase().includes(term);
      const matchesItems = order.items.some(item => item.name.toLowerCase().includes(term));
      if (!matchesOrderNumber && !matchesItems) return false;
    }

    // Status filter
    if (statusFilter !== "ALL" && order.status !== statusFilter) return false;

    return true;
  }) || [];

  // Calculate stats
  const totalOrders = orders?.length || 0;
  const totalSpent = orders?.reduce((sum: number, o: FoodOrder) => sum + o.total, 0) || 0;
  const activeOrders = orders?.filter((o: FoodOrder) => !["COMPLETED", "CANCELLED"].includes(o.status)).length || 0;

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status as OrderStatus] || STATUS_CONFIG.PENDING;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full ${config.bgColor} ${config.color}`}>
        <Icon className="h-3.5 w-3.5" />
        {config.label}
      </span>
    );
  };

  return (
    <>
      <PublicHeader />
      <RestaurantsSubNav />
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-gradient-to-br from-sky-600 to-primary py-8">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
                <Package className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">My Food Orders</h1>
                <p className="text-white/80">Track and view your order history</p>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                  <p className="text-2xl font-bold mt-1">{totalOrders}</p>
                </div>
                <Package className="h-8 w-8 text-primary" />
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Spent</p>
                  <p className="text-2xl font-bold mt-1">${(totalSpent / 100).toFixed(2)}</p>
                </div>
                <Utensils className="h-8 w-8 text-primary" />
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Orders</p>
                  <p className="text-2xl font-bold mt-1">{activeOrders}</p>
                </div>
                <Clock className="h-8 w-8 text-primary" />
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by order number or item..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as OrderStatus | "ALL")}
              className="px-4 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Order Placed</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PREPARING">Preparing</option>
              <option value="READY_FOR_PICKUP">Ready for Pickup</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Orders Loading */}
          {orders === undefined ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredOrders.length === 0 ? (
            /* Empty State */
            <div className="text-center py-16">
              <div className="inline-block p-8 bg-primary/5 dark:bg-primary/20 rounded-3xl">
                <Package className="h-16 w-16 mx-auto text-primary mb-4" />
                <h3 className="text-xl font-bold text-foreground mb-2">
                  {searchTerm || statusFilter !== "ALL" ? "No Orders Found" : "No Orders Yet"}
                </h3>
                <p className="text-muted-foreground mb-4 max-w-md">
                  {searchTerm || statusFilter !== "ALL"
                    ? "Try adjusting your search or filters."
                    : "Your food order history will appear here after you place an order."}
                </p>
                {!searchTerm && statusFilter === "ALL" && (
                  <Link
                    href="/restaurants"
                    className="inline-block px-6 py-3 bg-primary text-white rounded-full font-semibold hover:bg-primary/90 transition-colors"
                  >
                    Browse Restaurants
                  </Link>
                )}
              </div>
            </div>
          ) : (
            /* Orders List */
            <div className="space-y-4">
              {filteredOrders.map((order: FoodOrder) => (
                <div
                  key={order._id}
                  className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Order Header */}
                  <div className="p-5 border-b border-border">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-mono font-bold text-lg">#{order.orderNumber}</span>
                          {getStatusBadge(order.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Placed on {formatDate(order.placedAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Total</p>
                        <p className="text-2xl font-bold">${(order.total / 100).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="p-5 bg-muted/30">
                    <div className="space-y-2 mb-4">
                      {order.items.map((item: FoodOrder['items'][number], idx: number) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span>
                            <span className="font-medium">{item.quantity}x</span> {item.name}
                            {item.notes && (
                              <span className="text-muted-foreground ml-2">({item.notes})</span>
                            )}
                          </span>
                          <span className="font-medium">${((item.price * item.quantity) / 100).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    {order.specialInstructions && (
                      <div className="text-sm bg-warning/10 dark:bg-warning/15 rounded-lg p-3 mb-4">
                        <span className="font-medium">Special Instructions:</span> {order.specialInstructions}
                      </div>
                    )}

                    {/* Order Summary */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-border">
                      <div className="text-sm text-muted-foreground">
                        <div className="flex items-center gap-4">
                          <span>Subtotal: ${(order.subtotal / 100).toFixed(2)}</span>
                          <span>Tax: ${(order.tax / 100).toFixed(2)}</span>
                        </div>
                        <div className="mt-1">
                          Payment: {order.paymentStatus === "paid" ? (
                            <span className="text-success font-medium">Paid</span>
                          ) : (
                            <span className="text-warning font-medium">Pay at Pickup</span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        {order.status === "READY_FOR_PICKUP" && (
                          <span className="px-4 py-2 bg-success text-white rounded-lg text-sm font-medium animate-pulse">
                            Ready for Pickup!
                          </span>
                        )}
                        {order.status === "COMPLETED" && (
                          <button
                            onClick={() => handleReorder(order)}
                            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 inline-flex items-center gap-2"
                          >
                            <RotateCcw className="h-4 w-4" />
                            Order Again
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Refresh hint */}
          {activeOrders > 0 && (
            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Orders update automatically when status changes
              </p>
            </div>
          )}
        </div>
      </div>
      <PublicFooter />
    </>
  );
}

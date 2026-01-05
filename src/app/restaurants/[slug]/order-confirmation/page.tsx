"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { RestaurantsSubNav } from "@/components/layout/RestaurantsSubNav";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { CheckCircle, Clock, MapPin, Phone, Receipt, ArrowRight, ChefHat, Bell, Package } from "lucide-react";
import Link from "next/link";
import { Id } from "@/convex/_generated/dataModel";

// Order status flow for tracking
const ORDER_STATUSES = [
  { key: "PENDING", label: "Order Received", icon: Receipt, description: "Restaurant received your order" },
  { key: "CONFIRMED", label: "Confirmed", icon: CheckCircle, description: "Order confirmed by restaurant" },
  { key: "PREPARING", label: "Preparing", icon: ChefHat, description: "Your food is being prepared" },
  { key: "READY_FOR_PICKUP", label: "Ready!", icon: Bell, description: "Your order is ready for pickup" },
] as const;

function OrderProgressTracker({ currentStatus }: { currentStatus: string }) {
  const currentIndex = ORDER_STATUSES.findIndex((s) => s.key === currentStatus);
  const isCompleted = currentStatus === "COMPLETED";
  const isCancelled = currentStatus === "CANCELLED";

  if (isCancelled) {
    return (
      <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center">
            <Package className="w-6 h-6 text-destructive" />
          </div>
          <div>
            <p className="font-semibold text-destructive">Order Cancelled</p>
            <p className="text-sm text-muted-foreground">This order has been cancelled</p>
          </div>
        </div>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="bg-success/10 border border-success/30 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-success" />
          </div>
          <div>
            <p className="font-semibold text-success">Order Completed</p>
            <p className="text-sm text-muted-foreground">Thank you for your order!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="relative">
          <div className="w-3 h-3 bg-primary rounded-full animate-pulse" />
          <div className="absolute inset-0 w-3 h-3 bg-primary rounded-full animate-ping opacity-75" />
        </div>
        <span className="text-sm font-medium text-primary">Live Order Tracking</span>
      </div>

      {/* Progress Bar */}
      <div className="relative mb-6">
        <div className="absolute top-4 left-6 right-6 h-1 bg-muted rounded-full" />
        <div
          className="absolute top-4 left-6 h-1 bg-primary rounded-full transition-all duration-500"
          style={{ width: `calc(${(currentIndex / (ORDER_STATUSES.length - 1)) * 100}% - 48px)` }}
        />
        <div className="relative flex justify-between">
          {ORDER_STATUSES.map((status, index) => {
            const Icon = status.icon;
            const isPast = index < currentIndex;
            const isCurrent = index === currentIndex;

            return (
              <div key={status.key} className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isPast
                      ? "bg-primary text-white"
                      : isCurrent
                      ? "bg-primary text-white ring-4 ring-primary/30"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span
                  className={`text-xs mt-2 text-center max-w-[80px] ${
                    isCurrent ? "font-semibold text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {status.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Current Status Message */}
      <div className="bg-primary/5 rounded-lg p-4">
        <p className="font-medium text-foreground">
          {ORDER_STATUSES[currentIndex]?.description || "Processing your order..."}
        </p>
        {currentStatus === "READY_FOR_PICKUP" && (
          <p className="text-sm text-success mt-1 font-medium">
            Head to the restaurant to pick up your order!
          </p>
        )}
      </div>
    </div>
  );
}

export default function OrderConfirmationPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const orderId = searchParams.get("orderId");

  const restaurant = useQuery(api.restaurants.getBySlug, { slug });
  const order = useQuery(
    api.foodOrders.getById,
    orderId ? { id: orderId as Id<"foodOrders"> } : "skip"
  );

  if (restaurant === undefined || order === undefined) {
    return (
      <>
        <PublicHeader />
        <RestaurantsSubNav />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
        <PublicFooter />
      </>
    );
  }

  if (restaurant === null || !orderId || order === null) {
    return (
      <>
        <PublicHeader />
        <RestaurantsSubNav />
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8 text-center">
            <h1 className="text-2xl font-bold mb-4">Order not found</h1>
            <Link
              href="/restaurants"
              className="text-primary hover:underline"
            >
              Browse restaurants
            </Link>
          </div>
        </div>
        <PublicFooter />
      </>
    );
  }

  return (
    <>
      <PublicHeader />
      <RestaurantsSubNav />
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          {/* Header with Order Number */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold mb-2">
              {order.status === "READY_FOR_PICKUP"
                ? "Your Order is Ready!"
                : order.status === "COMPLETED"
                ? "Order Complete"
                : "Order Confirmed"}
            </h1>
            <p className="text-muted-foreground">
              Order #{order.orderNumber} from {restaurant.name}
            </p>
          </div>

          {/* Real-Time Order Progress Tracker */}
          <OrderProgressTracker currentStatus={order.status} />

          {/* Order Details Card */}
          <div className="bg-card rounded-lg border p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Receipt className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Order Details</h2>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Payment</p>
                <p className="font-medium">
                  {order.paymentStatus === "paid" ? "Paid Online" : "Pay at Pickup"}
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Pickup Time</p>
                <p className="font-medium">
                  {order.pickupTime
                    ? new Date(order.pickupTime).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })
                    : `~${restaurant.estimatedPickupTime} min`}
                </p>
              </div>
            </div>

            {/* Order Items */}
            <div className="border-t pt-4">
              <h3 className="font-medium mb-3">Items Ordered</h3>
              <div className="space-y-2">
                {order.items.map((item: { name: string; quantity: number; price: number }, idx: number) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span>{item.quantity}x {item.name}</span>
                    <span>${((item.price * item.quantity) / 100).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between font-bold text-lg mt-4 pt-3 border-t">
                <span>Total</span>
                <span>${(order.total / 100).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Pickup Location Card */}
          <div className="bg-card rounded-lg border p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Pickup Location</h2>
            </div>

            <div className="space-y-3">
              <p className="font-semibold text-lg">{restaurant.name}</p>
              <p className="text-muted-foreground">
                {restaurant.address}<br />
                {restaurant.city}, {restaurant.state} {restaurant.zipCode}
              </p>
              <a
                href={`tel:${restaurant.phone}`}
                className="inline-flex items-center gap-2 text-primary hover:text-primary"
              >
                <Phone className="h-4 w-4" />
                {restaurant.phone}
              </a>
            </div>
          </div>

          {/* What's Next - Only show if order is still in progress */}
          {order.status !== "COMPLETED" && order.status !== "CANCELLED" && (
            <div className="bg-muted/50 rounded-lg border p-4 mb-8">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Stay on this page</span> — it updates automatically as your order progresses. You'll also receive email notifications.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href={`/restaurants/${slug}`}
              className="flex-1 py-3 px-6 border rounded-lg font-medium text-center hover:bg-accent transition-colors"
            >
              Order More
            </Link>
            <Link
              href="/restaurants"
              className="flex-1 py-3 px-6 bg-primary text-white rounded-lg font-medium text-center hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              Browse Restaurants
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
      <PublicFooter />
    </>
  );
}

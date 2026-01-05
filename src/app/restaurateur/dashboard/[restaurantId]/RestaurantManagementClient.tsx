"use client";

import Link from "next/link";
import { useQuery, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  ChefHat,
  Utensils,
  ClipboardList,
  Settings,
  BarChart3,
  Clock,
  LogIn,
  Users,
  ArrowLeft,
  MapPin,
  Camera,
  AlertCircle,
  Phone,
  Globe,
  CheckCircle2,
  XCircle,
} from "lucide-react";

interface Props {
  restaurantId: string;
}

export default function RestaurantManagementClient({ restaurantId }: Props) {
  const { isLoading: isAuthLoading, isAuthenticated } = useConvexAuth();
  const restaurant = useQuery(
    api.restaurants.getById,
    { id: restaurantId as Id<"restaurants"> }
  );

  // Loading state
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Not signed in
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto bg-card rounded-2xl shadow-lg p-8 text-center border border-border">
            <div className="w-16 h-16 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <LogIn className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-4">
              Sign In Required
            </h1>
            <p className="text-muted-foreground mb-8">
              Please sign in to access restaurant management.
            </p>
            <Link
              href={`/login?redirect=${encodeURIComponent(`/restaurateur/dashboard/${restaurantId}`)}`}
              className="block w-full px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Loading restaurant data
  if (restaurant === undefined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading restaurant...</p>
        </div>
      </div>
    );
  }

  // Restaurant not found
  if (restaurant === null) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto bg-card rounded-2xl shadow-lg p-8 text-center border border-border">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-4">
              Restaurant Not Found
            </h1>
            <p className="text-muted-foreground mb-8">
              The restaurant you're looking for doesn't exist or has been removed.
            </p>
            <Link
              href="/admin/restaurants"
              className="block w-full px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              Back to Restaurants
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard items
  const dashboardItems = [
    {
      icon: ClipboardList,
      title: "Orders",
      description: "View and manage incoming orders",
      href: `/restaurateur/dashboard/orders`,
    },
    {
      icon: Utensils,
      title: "Menu",
      description: "Edit menu items and prices",
      href: `/restaurateur/dashboard/menu`,
    },
    {
      icon: Camera,
      title: "Photos",
      description: "Upload logo and cover images",
      href: `/restaurateur/dashboard/photos`,
    },
    {
      icon: MapPin,
      title: "Locations",
      description: "Manage restaurant locations",
      href: `/restaurateur/dashboard/locations`,
    },
    {
      icon: BarChart3,
      title: "Analytics",
      description: "Track sales and performance",
      href: `/restaurateur/dashboard/analytics`,
    },
    {
      icon: Clock,
      title: "Hours",
      description: "Set operating hours",
      href: `/restaurateur/dashboard/hours`,
    },
    {
      icon: Users,
      title: "Staff",
      description: "Manage team members",
      href: `/restaurateur/dashboard/staff`,
    },
    {
      icon: Settings,
      title: "Settings",
      description: "Manage restaurant settings",
      href: `/restaurateur/dashboard/settings`,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-sky-600 to-primary py-8">
        <div className="container mx-auto px-4">
          <Link
            href="/admin/restaurants"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Restaurants
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center overflow-hidden">
              {restaurant.logoUrl ? (
                <img
                  src={restaurant.logoUrl}
                  alt={restaurant.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <ChefHat className="w-8 h-8 text-white" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white">{restaurant.name}</h1>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    restaurant.isActive
                      ? "bg-success/20 text-success-foreground"
                      : "bg-destructive/20 text-destructive-foreground"
                  }`}
                >
                  {restaurant.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="flex items-center gap-4 text-white/80 text-sm mt-1">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {restaurant.city}, {restaurant.state}
                </span>
                {restaurant.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    {restaurant.phone}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Notice */}
      <div className="container mx-auto px-4 py-4">
        <div className="bg-accent/50 border border-accent rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="text-sm text-foreground">
            <p className="font-medium mb-1">Admin Support Mode</p>
            <p className="text-muted-foreground">
              You are managing this restaurant on behalf of its owner. Changes you make
              will affect the live restaurant.
            </p>
          </div>
        </div>
      </div>

      {/* Restaurant Info */}
      <div className="container mx-auto px-4 py-4">
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Restaurant Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="font-medium flex items-center gap-1">
                {restaurant.isActive ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    Active
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-destructive" />
                    Inactive
                  </>
                )}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Accepting Orders</p>
              <p className="font-medium flex items-center gap-1">
                {restaurant.acceptingOrders ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    Yes
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-destructive" />
                    No
                  </>
                )}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Address</p>
              <p className="font-medium">{restaurant.address || "Not set"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Slug</p>
              <p className="font-medium flex items-center gap-1">
                <Globe className="w-4 h-4 text-muted-foreground" />
                {restaurant.slug}
              </p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-border">
            <Link
              href={`/restaurants/${restaurant.slug}`}
              target="_blank"
              className="inline-flex items-center gap-2 text-primary hover:underline text-sm"
            >
              <Globe className="w-4 h-4" />
              View Public Page
            </Link>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dashboardItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.title}
                href={item.href}
                className="bg-card rounded-xl border border-border p-6 hover:border-primary/30 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/restaurateur/dashboard/orders"
              className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              View Orders
            </Link>
            <Link
              href="/restaurateur/dashboard/menu"
              className="px-4 py-2 border border-input rounded-lg font-medium hover:bg-muted transition-colors"
            >
              Edit Menu
            </Link>
            <Link
              href="/restaurateur/dashboard/photos"
              className="px-4 py-2 border border-input rounded-lg font-medium hover:bg-muted transition-colors"
            >
              Manage Photos
            </Link>
            <Link
              href={`/restaurants/${restaurant.slug}`}
              target="_blank"
              className="px-4 py-2 border border-input rounded-lg font-medium hover:bg-muted transition-colors"
            >
              View Public Page
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

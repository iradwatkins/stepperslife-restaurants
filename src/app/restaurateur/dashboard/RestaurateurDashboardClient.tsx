"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ActivityFeed } from "@/components/restaurants/ActivityFeed";
import { OnboardingProgress } from "@/components/restaurateur/OnboardingProgress";
import {
  ChefHat,
  Utensils,
  ClipboardList,
  Settings,
  BarChart3,
  Clock,
  LogIn,
  Construction,
  Users,
  ArrowRight,
  MapPin,
  Camera,
} from "lucide-react";

export default function RestaurateurDashboardClient() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const myRestaurants = useQuery(api.restaurants.getMyRestaurants);
  const hasRestaurant = myRestaurants && myRestaurants.length > 0;

  // Loading state
  if (isLoading) {
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
              Please sign in to access your restaurant dashboard.
            </p>
            <Link
              href={`/login?redirect=${encodeURIComponent("/restaurateur/dashboard")}`}
              className="block w-full px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              Sign In
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
      href: "/restaurateur/dashboard/orders",
      comingSoon: false,
    },
    {
      icon: Utensils,
      title: "Menu",
      description: "Edit your menu items and prices",
      href: "/restaurateur/dashboard/menu",
      comingSoon: false,
    },
    {
      icon: Camera,
      title: "Photos",
      description: "Upload logo and cover images",
      href: "/restaurateur/dashboard/photos",
      comingSoon: false,
    },
    {
      icon: MapPin,
      title: "Locations",
      description: "Manage your restaurant locations",
      href: "/restaurateur/dashboard/locations",
      comingSoon: false,
    },
    {
      icon: BarChart3,
      title: "Analytics",
      description: "Track your sales and performance",
      href: "/restaurateur/dashboard/analytics",
      comingSoon: false,
    },
    {
      icon: Clock,
      title: "Hours",
      description: "Set your operating hours",
      href: "/restaurateur/dashboard/hours",
      comingSoon: false,
    },
    {
      icon: Users,
      title: "Staff",
      description: "Manage your team members",
      href: "/restaurateur/dashboard/staff",
      comingSoon: false,
    },
    {
      icon: Settings,
      title: "Settings",
      description: "Manage restaurant settings",
      href: "/restaurateur/dashboard/settings",
      comingSoon: false,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-sky-600 to-primary py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <ChefHat className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Restaurant Dashboard</h1>
              <p className="text-white/80">Welcome back, {user?.name || "Restaurant Owner"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Show Activity Feed and Onboarding Progress if user has restaurants */}
        {hasRestaurant ? (
          <div className="space-y-6 mb-8">
            {/* Onboarding Progress - shown until setup is complete */}
            <OnboardingProgress
              restaurantId={myRestaurants[0]._id}
              dismissible={true}
            />

            {/* Activity Feed */}
            <ActivityFeed showStats={true} limit={10} />
          </div>
        ) : (
          /* Show Application Notice if no restaurant */
          <div className="bg-warning/10 dark:bg-warning/20 border border-warning/30 dark:border-warning/40 rounded-xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <Construction className="w-6 h-6 text-warning flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-foreground dark:text-warning mb-2">
                  Get Started with Your Restaurant
                </h2>
                <p className="text-warning dark:text-warning mb-4">
                  You haven't set up a restaurant yet. Submit an application to join our
                  restaurant partner network and start receiving orders.
                </p>
                <Link
                  href="/restaurateur/apply"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
                >
                  Apply Now
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dashboardItems.map((item) => {
            const Icon = item.icon;
            const CardContent = (
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground">{item.title}</h3>
                    {item.comingSoon && (
                      <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">
                        Coming Soon
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </div>
            );

            if (item.comingSoon) {
              return (
                <div
                  key={item.title}
                  className="bg-card rounded-xl border border-border p-6 opacity-60"
                >
                  {CardContent}
                </div>
              );
            }

            return (
              <Link
                key={item.title}
                href={item.href}
                className="bg-card rounded-xl border border-border p-6 hover:border-primary/30 hover:shadow-md transition-all"
              >
                {CardContent}
              </Link>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-4">
            {hasRestaurant ? (
              <>
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
                  href="/restaurateur/dashboard/locations"
                  className="px-4 py-2 border border-input rounded-lg font-medium hover:bg-muted transition-colors"
                >
                  Manage Locations
                </Link>
                <Link
                  href="/restaurateur/dashboard/staff"
                  className="px-4 py-2 border border-input rounded-lg font-medium hover:bg-muted transition-colors"
                >
                  Manage Staff
                </Link>
                <Link
                  href="/restaurateur/onboarding"
                  className="px-4 py-2 border border-input rounded-lg font-medium hover:bg-muted transition-colors"
                >
                  Setup Guide
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/restaurateur/apply"
                  className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
                >
                  Submit Application
                </Link>
                <Link
                  href="/restaurants"
                  className="px-4 py-2 border border-input rounded-lg font-medium hover:bg-muted transition-colors"
                >
                  Browse Restaurants
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

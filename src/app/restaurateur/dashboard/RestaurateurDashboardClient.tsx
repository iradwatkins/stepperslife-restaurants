"use client";

import Link from "next/link";
import { useMemo } from "react";
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
  type LucideIcon,
} from "lucide-react";

// Types for role and permissions
type RestaurantRole = "OWNER" | "RESTAURANT_MANAGER" | "RESTAURANT_STAFF";

interface StaffPermissions {
  canManageMenu?: boolean;
  canManageHours?: boolean;
  canManageOrders?: boolean;
  canViewAnalytics?: boolean;
  canManageSettings?: boolean;
}

interface DashboardItem {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
  comingSoon: boolean;
}

/**
 * Determines which dashboard items a user can see based on their role and permissions.
 *
 * Permission rules:
 * - Owner: sees everything
 * - Manager: sees everything EXCEPT Settings and Locations
 * - Staff: sees only what their permissions allow (default: Orders only)
 */
function getVisibleDashboardItems(
  allItems: DashboardItem[],
  role: RestaurantRole,
  permissions?: StaffPermissions
): DashboardItem[] {
  // Owner sees everything
  if (role === "OWNER") {
    return allItems;
  }

  // Manager sees everything except Settings and Locations
  if (role === "RESTAURANT_MANAGER") {
    return allItems.filter(
      (item) => item.title !== "Settings" && item.title !== "Locations"
    );
  }

  // Staff sees based on permissions
  if (role === "RESTAURANT_STAFF") {
    return allItems.filter((item) => {
      switch (item.title) {
        case "Orders":
          // Staff always has order access (or based on canManageOrders)
          return permissions?.canManageOrders !== false;
        case "Menu":
        case "Photos":
          return permissions?.canManageMenu === true;
        case "Analytics":
          return permissions?.canViewAnalytics === true;
        case "Hours":
          return permissions?.canManageHours === true;
        case "Staff":
          // Staff cannot manage other staff
          return false;
        case "Settings":
        case "Locations":
          // Only Owner can access these
          return false;
        default:
          return false;
      }
    });
  }

  // Fallback: show nothing
  return [];
}

/**
 * Determines which quick actions a user can see based on their role and permissions.
 */
function getVisibleQuickActions(
  role: RestaurantRole,
  permissions?: StaffPermissions
): {
  showOrders: boolean;
  showMenu: boolean;
  showPhotos: boolean;
  showLocations: boolean;
  showStaff: boolean;
  showSetupGuide: boolean;
} {
  if (role === "OWNER") {
    return {
      showOrders: true,
      showMenu: true,
      showPhotos: true,
      showLocations: true,
      showStaff: true,
      showSetupGuide: true,
    };
  }

  if (role === "RESTAURANT_MANAGER") {
    return {
      showOrders: true,
      showMenu: true,
      showPhotos: true,
      showLocations: false,
      showStaff: true,
      showSetupGuide: true,
    };
  }

  // Staff
  return {
    showOrders: permissions?.canManageOrders !== false,
    showMenu: permissions?.canManageMenu === true,
    showPhotos: permissions?.canManageMenu === true,
    showLocations: false,
    showStaff: false,
    showSetupGuide: false,
  };
}

export default function RestaurateurDashboardClient() {
  const { user, isAuthenticated, isLoading } = useAuth();
  // Use getMyAccessibleRestaurants to include both owned restaurants AND staff assignments
  const accessibleRestaurants = useQuery(api.restaurantStaff.getMyAccessibleRestaurants);
  const hasRestaurant = accessibleRestaurants && accessibleRestaurants.length > 0;
  // Extract first restaurant for components that need it (restaurant object is nested)
  const firstRestaurantAccess = hasRestaurant ? accessibleRestaurants[0] : null;
  const firstRestaurant = firstRestaurantAccess?.restaurant ?? null;

  // Get user's role and permissions for the selected restaurant
  const userRole = firstRestaurantAccess?.role as RestaurantRole | undefined;
  const userPermissions = firstRestaurantAccess?.permissions as StaffPermissions | undefined;

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

  // All dashboard items (unfiltered)
  const allDashboardItems: DashboardItem[] = useMemo(
    () => [
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
    ],
    []
  );

  // Filter dashboard items based on user's role and permissions
  const visibleDashboardItems = useMemo(() => {
    if (!userRole) {
      // No role yet (loading or no restaurant) - show all items
      // This allows non-staff users to see the dashboard structure
      return allDashboardItems;
    }
    return getVisibleDashboardItems(allDashboardItems, userRole, userPermissions);
  }, [allDashboardItems, userRole, userPermissions]);

  // Get visible quick actions
  const quickActions = useMemo(() => {
    if (!userRole) {
      // Default to owner-level access when no role (e.g., for owners)
      return getVisibleQuickActions("OWNER");
    }
    return getVisibleQuickActions(userRole, userPermissions);
  }, [userRole, userPermissions]);

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
              restaurantId={firstRestaurant!._id}
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
          {visibleDashboardItems.map((item) => {
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
                {quickActions.showOrders && (
                  <Link
                    href="/restaurateur/dashboard/orders"
                    className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
                  >
                    View Orders
                  </Link>
                )}
                {quickActions.showMenu && (
                  <Link
                    href="/restaurateur/dashboard/menu"
                    className="px-4 py-2 border border-input rounded-lg font-medium hover:bg-muted transition-colors"
                  >
                    Edit Menu
                  </Link>
                )}
                {quickActions.showPhotos && (
                  <Link
                    href="/restaurateur/dashboard/photos"
                    className="px-4 py-2 border border-input rounded-lg font-medium hover:bg-muted transition-colors"
                  >
                    Manage Photos
                  </Link>
                )}
                {quickActions.showLocations && (
                  <Link
                    href="/restaurateur/dashboard/locations"
                    className="px-4 py-2 border border-input rounded-lg font-medium hover:bg-muted transition-colors"
                  >
                    Manage Locations
                  </Link>
                )}
                {quickActions.showStaff && (
                  <Link
                    href="/restaurateur/dashboard/staff"
                    className="px-4 py-2 border border-input rounded-lg font-medium hover:bg-muted transition-colors"
                  >
                    Manage Staff
                  </Link>
                )}
                {quickActions.showSetupGuide && (
                  <Link
                    href="/restaurateur/onboarding"
                    className="px-4 py-2 border border-input rounded-lg font-medium hover:bg-muted transition-colors"
                  >
                    Setup Guide
                  </Link>
                )}
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

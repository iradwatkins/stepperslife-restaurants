"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { RoleBasedSidebar } from "@/components/navigation";
import { AppHeader } from "@/components/sidebar/app-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import { NavUser } from "@/lib/navigation/types";
import { generateUserInitials } from "@/lib/navigation/utils";
import { useWorkspaceAccess } from "@/hooks/useWorkspaceAccess";
import Link from "next/link";

// Wrapper component to check workspace access (must be inside WorkspaceProvider)
function WorkspaceAccessCheck({ children }: { children: React.ReactNode }) {
  useWorkspaceAccess();
  return <>{children}</>;
}

// Public paths that don't require restaurateur role
const PUBLIC_PATHS = ["/restaurateur/apply", "/restaurateur/status"];

// Component to check staff access via Convex query
function StaffAccessGate({
  children,
  onAccessDenied,
}: {
  children: React.ReactNode;
  onAccessDenied: () => void;
}) {
  // Query accessible restaurants (includes owned + staff assignments)
  const accessibleRestaurants = useQuery(api.restaurantStaff.getMyAccessibleRestaurants);
  const [hasCheckedAccess, setHasCheckedAccess] = useState(false);

  useEffect(() => {
    // Wait for query to complete
    if (accessibleRestaurants === undefined) return;

    // If user has any accessible restaurants (owner or staff), grant access
    if (accessibleRestaurants.length > 0) {
      setHasCheckedAccess(true);
    } else {
      // No accessible restaurants, deny access
      onAccessDenied();
    }
  }, [accessibleRestaurants, onAccessDenied]);

  // Show loading while checking staff access
  if (accessibleRestaurants === undefined || !hasCheckedAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function RestaurateurLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<NavUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  // Track if user has immediate access via platform role (admin/restaurateur/organizer)
  const [hasPlatformAccess, setHasPlatformAccess] = useState(false);
  // Track if we need to check staff access via Convex
  const [needsStaffCheck, setNeedsStaffCheck] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Check if current path is public (doesn't require restaurateur role)
  const isPublicPath = PUBLIC_PATHS.some((path) => pathname.startsWith(path));

  // Stable callback for access denied (must be declared before conditional returns)
  const handleAccessDenied = useCallback(() => {
    setAccessDenied(true);
  }, []);

  // Fetch user data from auth API
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const data = await response.json();
          const apiUser = data.user;

          // Convert API user to NavUser format
          const navUser: NavUser = {
            id: apiUser._id,
            email: apiUser.email,
            name: apiUser.name,
            role: apiUser.role || "user",
            avatar: apiUser.avatar,
            initials: generateUserInitials(apiUser.name, apiUser.email),
            staffRoles: [],
          };

          setUser(navUser);

          // Check if user has restaurateur or admin access via platform role
          // For public paths, allow any authenticated user
          if (!isPublicPath) {
            const hasRoleAccess =
              navUser.role === "admin" ||
              navUser.role === "restaurateur" ||
              navUser.role === "organizer"; // Organizers may also manage restaurants

            if (hasRoleAccess) {
              // Immediate access via platform role
              setHasPlatformAccess(true);
            } else {
              // Need to check staff assignments via Convex query
              setNeedsStaffCheck(true);
            }
          }
        } else {
          // Not authenticated
          if (!isPublicPath) {
            // Redirect to login for protected paths
            const returnUrl = encodeURIComponent(pathname);
            router.push(`/login?returnUrl=${returnUrl}`);
          }
          // For public paths, allow unauthenticated access
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
        if (!isPublicPath) {
          // On error, redirect to login for protected paths
          const returnUrl = encodeURIComponent(pathname);
          router.push(`/login?returnUrl=${returnUrl}`);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router, pathname, isPublicPath]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // For public paths (like apply), render without sidebar
  if (isPublicPath) {
    return <>{children}</>;
  }

  // Show access denied message if user doesn't have restaurateur role
  if (accessDenied) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-6 max-w-md p-8">
          <div className="w-16 h-16 mx-auto bg-warning/20 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-warning"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold">Restaurateur Access Required</h2>
          <p className="text-muted-foreground">
            You need to be a registered restaurant partner to access this area. If you&apos;ve
            applied, please check your application status.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link
              href="/restaurateur/status"
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Check Status
            </Link>
            <Link
              href="/restaurateur/apply"
              className="px-6 py-3 border border-border rounded-lg hover:bg-card transition-colors"
            >
              Apply to Partner
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Show login prompt with link if redirect didn't happen
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Please log in to continue</p>
          <Link
            href={`/login?returnUrl=${encodeURIComponent(pathname)}`}
            className="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  // Main dashboard content
  const dashboardContent = (
    <WorkspaceProvider initialUser={user} initialRole="restaurateur">
      <WorkspaceAccessCheck>
        <SidebarProvider defaultOpen={true}>
          <div className="flex min-h-screen w-full bg-background">
            <RoleBasedSidebar user={user} activeRole="restaurateur" />
            <SidebarInset className="flex-1">
              <AppHeader />
              <main className="flex-1 overflow-auto">{children}</main>
            </SidebarInset>
          </div>
        </SidebarProvider>
      </WorkspaceAccessCheck>
    </WorkspaceProvider>
  );

  // If user has platform access (admin/restaurateur/organizer), render directly
  if (hasPlatformAccess) {
    return dashboardContent;
  }

  // If user needs staff check, wrap with StaffAccessGate
  if (needsStaffCheck) {
    return (
      <StaffAccessGate onAccessDenied={handleAccessDenied}>
        {dashboardContent}
      </StaffAccessGate>
    );
  }

  // Fallback - should not reach here, but show loading just in case
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
    </div>
  );
}

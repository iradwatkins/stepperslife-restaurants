"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import {
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Building2,
  MapPin,
  Calendar,
  FileText,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

const statusConfig = {
  APPROVED: {
    icon: CheckCircle,
    color: "text-green-600",
    bgColor: "bg-green-50 dark:bg-green-950/30",
    borderColor: "border-green-200 dark:border-green-800",
    badgeVariant: "default" as const,
    title: "Approved",
    description: "Your restaurant is live and ready for customers!",
  },
  PENDING: {
    icon: Clock,
    color: "text-amber-600",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
    borderColor: "border-amber-200 dark:border-amber-800",
    badgeVariant: "secondary" as const,
    title: "Under Review",
    description: "Our team is reviewing your application. This typically takes 1-2 business days.",
  },
  REJECTED: {
    icon: XCircle,
    color: "text-red-600",
    bgColor: "bg-red-50 dark:bg-red-950/30",
    borderColor: "border-red-200 dark:border-red-800",
    badgeVariant: "destructive" as const,
    title: "Not Approved",
    description: "Unfortunately, your application was not approved at this time.",
  },
  SUSPENDED: {
    icon: AlertTriangle,
    color: "text-orange-600",
    bgColor: "bg-orange-50 dark:bg-orange-950/30",
    borderColor: "border-orange-200 dark:border-orange-800",
    badgeVariant: "outline" as const,
    title: "Suspended",
    description: "Your restaurant has been temporarily suspended. Please contact support.",
  },
};

function StatusSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl mx-auto py-12 px-4">
        <Skeleton className="h-8 w-48 mb-8" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-32" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function RestaurateurStatusPage() {
  const statusData = useQuery(api.restaurants.getMyRestaurantStatus);

  if (statusData === undefined) {
    return <StatusSkeleton />;
  }

  // No restaurant found - show apply CTA
  if (!statusData.hasRestaurant) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-2xl mx-auto py-12 px-4">
          <h1 className="text-3xl font-bold mb-8">Restaurant Partner Status</h1>

          <Card className="border-dashed">
            <CardHeader className="text-center">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <CardTitle>No Application Found</CardTitle>
              <CardDescription>
                You haven't applied to become a restaurant partner yet.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Link href="/restaurateur/apply">
                <Button size="lg">
                  Apply Now
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const status = statusData.status as keyof typeof statusConfig;
  const config = statusConfig[status] || statusConfig.PENDING;
  const StatusIcon = config.icon;
  const restaurant = statusData.restaurant;

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold mb-8">Restaurant Partner Status</h1>

        {/* Status Card */}
        <Card className={`${config.bgColor} ${config.borderColor} border-2 mb-6`}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <StatusIcon className={`h-8 w-8 ${config.color}`} />
              <div>
                <CardTitle className="text-xl">{config.title}</CardTitle>
                <CardDescription className="text-base mt-1">
                  {config.description}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {status === "REJECTED" && restaurant?.applicationNotes && (
              <div className="bg-white/50 dark:bg-black/20 rounded-lg p-4 mb-4">
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Reason:
                </p>
                <p className="text-foreground">{restaurant.applicationNotes}</p>
              </div>
            )}

            {status === "APPROVED" && (
              <Link href="/restaurateur/dashboard">
                <Button size="lg" className="w-full sm:w-auto">
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            )}

            {status === "PENDING" && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Checking for updates...</span>
              </div>
            )}

            {(status === "REJECTED" || status === "SUSPENDED") && (
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/restaurateur/apply">
                  <Button variant="outline">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reapply
                  </Button>
                </Link>
                <Link href="/support">
                  <Button variant="ghost">Contact Support</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Restaurant Details Card */}
        {restaurant && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Application Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">{restaurant.name}</p>
                  <p className="text-sm text-muted-foreground">Restaurant Name</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">
                    {restaurant.city}, {restaurant.state}
                  </p>
                  <p className="text-sm text-muted-foreground">Location</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">{formatDate(restaurant.createdAt)}</p>
                  <p className="text-sm text-muted-foreground">Submitted On</p>
                </div>
              </div>

              {restaurant.subscriptionTier && (
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{restaurant.subscriptionTier}</p>
                      <Badge variant="outline" className="text-xs">
                        {restaurant.subscriptionStatus}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Plan</p>
                  </div>
                </div>
              )}

              {restaurant.applicationReviewedAt && (
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">
                      {formatDate(restaurant.applicationReviewedAt)}
                    </p>
                    <p className="text-sm text-muted-foreground">Reviewed On</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Help Section */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            Questions about your application?{" "}
            <Link href="/support" className="text-primary hover:underline">
              Contact our support team
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

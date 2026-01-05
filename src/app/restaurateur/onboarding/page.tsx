"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronRight,
  Store,
  Clock,
  UtensilsCrossed,
  Users,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: typeof Store;
  href: string;
  isComplete: boolean;
}

export default function RestaurantOnboardingPage() {
  const router = useRouter();
  const myRestaurants = useQuery(api.restaurants.getMyRestaurants);
  const [selectedRestaurant, setSelectedRestaurant] = useState<string | null>(null);

  // Auto-select first restaurant or newly approved one
  useEffect(() => {
    if (myRestaurants && myRestaurants.length > 0) {
      // Find a restaurant that needs onboarding (active but missing setup)
      const needsOnboarding = myRestaurants.find(
        (r) => r.isActive && (!r.operatingHours || !r.description)
      );
      if (needsOnboarding) {
        setSelectedRestaurant(needsOnboarding._id);
      } else {
        setSelectedRestaurant(myRestaurants[0]._id);
      }
    }
  }, [myRestaurants]);

  const restaurant = myRestaurants?.find((r) => r._id === selectedRestaurant);

  // Determine completion status of each step
  const getOnboardingSteps = (): OnboardingStep[] => {
    if (!restaurant) return [];

    return [
      {
        id: "details",
        title: "Restaurant Details",
        description: "Add your restaurant name, description, and contact info",
        icon: Store,
        href: `/restaurateur/dashboard/settings`,
        isComplete: !!(restaurant.description && restaurant.phone && restaurant.address),
      },
      {
        id: "hours",
        title: "Operating Hours",
        description: "Set your daily operating hours",
        icon: Clock,
        href: `/restaurateur/dashboard/hours`,
        isComplete: !!restaurant.operatingHours,
      },
      {
        id: "menu",
        title: "Menu Items",
        description: "Add your menu categories and items",
        icon: UtensilsCrossed,
        href: `/restaurateur/dashboard/menu`,
        isComplete: false, // We'd need to check menu items count
      },
      {
        id: "staff",
        title: "Invite Staff (Optional)",
        description: "Add team members to help manage orders",
        icon: Users,
        href: `/restaurateur/dashboard/staff`,
        isComplete: true, // Optional step, always considered complete
      },
    ];
  };

  const steps = getOnboardingSteps();
  const completedSteps = steps.filter((s) => s.isComplete).length;
  const progress = steps.length > 0 ? (completedSteps / steps.length) * 100 : 0;
  const isComplete = completedSteps >= 3; // At least 3 required steps done

  if (!myRestaurants) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (myRestaurants.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <Store className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">No Restaurant Found</h1>
          <p className="text-muted-foreground mb-6">
            You haven&apos;t set up a restaurant yet. Apply to become a restaurant partner.
          </p>
          <Link
            href="/restaurateur/apply"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Apply Now
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-sky-500 to-primary text-white">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <h1 className="text-3xl font-bold mb-2">
            Welcome to SteppersLife Restaurants!
          </h1>
          <p className="text-primary-foreground">
            Complete these steps to get your restaurant ready to accept orders.
          </p>

          {/* Progress Bar */}
          <div className="mt-8">
            <div className="flex items-center justify-between text-sm mb-2">
              <span>{completedSteps} of {steps.length} steps completed</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-primary/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Restaurant Selector (if multiple) */}
        {myRestaurants.length > 1 && (
          <div className="mb-8">
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Setting up:
            </label>
            <select
              value={selectedRestaurant || ""}
              onChange={(e) => setSelectedRestaurant(e.target.value)}
              className="px-4 py-2 border border-input rounded-lg bg-background"
            >
              {myRestaurants.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Steps */}
        <div className="space-y-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isFirst = index === 0;
            const canStart = isFirst || steps[index - 1]?.isComplete;

            return (
              <div
                key={step.id}
                className={`bg-card rounded-xl border border-border overflow-hidden transition-all ${
                  step.isComplete ? "opacity-75" : ""
                }`}
              >
                <div className="flex items-center gap-4 p-4">
                  {/* Step Number/Status */}
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      step.isComplete
                        ? "bg-success/20 dark:bg-success/20"
                        : canStart
                          ? "bg-primary/10 dark:bg-primary/20"
                          : "bg-muted"
                    }`}
                  >
                    {step.isComplete ? (
                      <CheckCircle2 className="w-6 h-6 text-success" />
                    ) : (
                      <Icon
                        className={`w-6 h-6 ${
                          canStart ? "text-primary" : "text-muted-foreground"
                        }`}
                      />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>

                  {/* Action */}
                  {step.isComplete ? (
                    <span className="flex items-center gap-1 text-sm text-success">
                      <Check className="w-4 h-4" />
                      Complete
                    </span>
                  ) : canStart ? (
                    <Link
                      href={step.href}
                      className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                    >
                      {step.id === "staff" ? "Skip or Add" : "Set Up"}
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      Complete previous step
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Completion Message */}
        {isComplete && (
          <div className="mt-8 bg-success/10 dark:bg-success/15 border border-success/30 dark:border-success/30 rounded-xl p-6 text-center">
            <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              You&apos;re All Set!
            </h3>
            <p className="text-muted-foreground mb-6">
              Your restaurant is ready to start accepting orders. Head to your dashboard to manage everything.
            </p>
            <Link
              href="/restaurateur/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 bg-success text-white rounded-lg hover:bg-success/80 transition-colors"
            >
              Go to Dashboard
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        )}

        {/* Skip Link */}
        {!isComplete && (
          <div className="mt-8 text-center">
            <Link
              href="/restaurateur/dashboard"
              className="text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
              Skip for now and go to dashboard
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

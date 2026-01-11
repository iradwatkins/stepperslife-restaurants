"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { RestaurantsSubNav } from "@/components/layout/RestaurantsSubNav";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeft,
  Clock,
  Save,
  Loader2,
  LogIn,
  AlertCircle,
  Moon,
} from "lucide-react";
import Link from "next/link";

type DayHours = {
  open: string;
  close: string;
  closed: boolean;
};

type OperatingHours = {
  monday?: DayHours;
  tuesday?: DayHours;
  wednesday?: DayHours;
  thursday?: DayHours;
  friday?: DayHours;
  saturday?: DayHours;
  sunday?: DayHours;
};

const DAYS = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
] as const;

const DEFAULT_HOURS: DayHours = { open: "09:00", close: "21:00", closed: false };

// Helper function to check if a closing time is after midnight (late night)
// Returns true if closing time is between 00:00 and 06:00
function isLateNightClosingTime(closeTime: string): boolean {
  if (!closeTime) return false;
  const [hours] = closeTime.split(":").map(Number);
  // Late night = closes after midnight (00:00) but before 6:00 AM
  return hours >= 0 && hours < 6;
}

export default function HoursManagementClient() {
  const currentUser = useQuery(api.users.queries.getCurrentUser);
  const restaurant = useQuery(
    api.menuItems.getRestaurantByOwner,
    currentUser?._id ? { ownerId: currentUser._id } : "skip"
  );

  const updateHours = useMutation(api.restaurantHours.updateHours);
  const updateLateNightStatus = useMutation(api.restaurants.updateLateNightStatus);
  const toggleAccepting = useMutation(api.restaurantHours.toggleAcceptingOrders);

  const [hours, setHours] = useState<OperatingHours>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Late-night state
  const [isOpenLateNight, setIsOpenLateNight] = useState(false);
  const [lateNightDays, setLateNightDays] = useState<string[]>([]);

  // Initialize hours from restaurant data
  useEffect(() => {
    if (restaurant?.operatingHours) {
      setHours(restaurant.operatingHours as OperatingHours);
    } else {
      // Set defaults
      const defaults: OperatingHours = {};
      DAYS.forEach((day) => {
        defaults[day.key] = { ...DEFAULT_HOURS };
      });
      setHours(defaults);
    }
  }, [restaurant]);

  // Initialize late-night state from restaurant data
  useEffect(() => {
    if (restaurant) {
      setIsOpenLateNight(restaurant.isOpenLateNight ?? false);
      setLateNightDays((restaurant.lateNightDays as string[]) ?? []);
    }
  }, [restaurant]);

  // Auto-detect days with late-night closing times
  const suggestedLateNightDays = useMemo(() => {
    const suggested: string[] = [];
    DAYS.forEach((day) => {
      const dayHours = hours[day.key];
      if (dayHours && !dayHours.closed && isLateNightClosingTime(dayHours.close)) {
        suggested.push(day.label);
      }
    });
    return suggested;
  }, [hours]);

  // Handle late-night day toggle
  const handleLateNightDayToggle = (dayLabel: string, checked: boolean) => {
    if (checked) {
      setLateNightDays((prev) => [...prev, dayLabel]);
    } else {
      setLateNightDays((prev) => prev.filter((d) => d !== dayLabel));
    }
    setSaved(false);
  };

  // Apply suggested late-night days
  const applySuggestedDays = () => {
    setLateNightDays(suggestedLateNightDays);
    if (suggestedLateNightDays.length > 0) {
      setIsOpenLateNight(true);
    }
    setSaved(false);
  };

  // Loading state
  if (currentUser === undefined) {
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

  // Not logged in
  if (!currentUser) {
    return (
      <>
        <PublicHeader />
        <RestaurantsSubNav />
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-16">
            <div className="max-w-md mx-auto bg-card rounded-2xl shadow-lg p-8 text-center border border-border">
              <LogIn className="w-12 h-12 text-primary mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-4">Sign In Required</h1>
              <Button asChild className="w-full bg-primary hover:bg-primary/90">
                <Link href="/login">Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
        <PublicFooter />
      </>
    );
  }

  // No restaurant
  if (restaurant === null) {
    return (
      <>
        <PublicHeader />
        <RestaurantsSubNav />
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-16">
            <div className="max-w-md mx-auto bg-card rounded-2xl shadow-lg p-8 text-center border border-border">
              <AlertCircle className="w-12 h-12 text-warning mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-4">No Restaurant Found</h1>
              <Button asChild className="w-full bg-primary hover:bg-primary/90">
                <Link href="/restaurateur/apply">Apply Now</Link>
              </Button>
            </div>
          </div>
        </div>
        <PublicFooter />
      </>
    );
  }

  if (restaurant === undefined) {
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

  const handleDayChange = (dayKey: string, field: keyof DayHours, value: string | boolean) => {
    setHours((prev) => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey as keyof OperatingHours],
        [field]: value,
      },
    }));
    setSaved(false);
  };

  const handleSave = async () => {
    if (!restaurant) return;

    setIsSaving(true);
    try {
      // Save operating hours
      await updateHours({
        restaurantId: restaurant._id,
        operatingHours: hours,
      });

      // Save late-night status
      await updateLateNightStatus({
        restaurantId: restaurant._id,
        isOpenLateNight,
        lateNightDays,
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Failed to save hours:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleAccepting = async () => {
    if (!restaurant) return;
    try {
      await toggleAccepting({ restaurantId: restaurant._id });
    } catch (err) {
      console.error("Failed to toggle:", err);
    }
  };

  const copyToAll = (sourceDay: keyof OperatingHours) => {
    const source = hours[sourceDay];
    if (!source) return;

    const newHours: OperatingHours = {};
    DAYS.forEach((day) => {
      newHours[day.key] = { ...source };
    });
    setHours(newHours);
    setSaved(false);
  };

  return (
    <>
      <PublicHeader />
      <RestaurantsSubNav />
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-gradient-to-br from-sky-600 to-primary py-6">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-4">
              <Link
                href="/restaurateur/dashboard"
                className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Operating Hours</h1>
                  <p className="text-white/80 text-sm">{restaurant.name}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 max-w-2xl">
          {/* Quick Toggle */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Accepting Orders</h3>
                  <p className="text-sm text-muted-foreground">
                    {restaurant.acceptingOrders
                      ? "Your restaurant is currently accepting orders"
                      : "Your restaurant is not accepting orders"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleToggleAccepting}
                  className={`relative w-14 h-7 rounded-full transition-colors ${
                    restaurant.acceptingOrders ? "bg-success" : "bg-muted dark:bg-accent"
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                      restaurant.acceptingOrders ? "translate-x-7" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Late-Night Configuration */}
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <Moon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Late-Night Hours</CardTitle>
                  <CardDescription>
                    Configure if your restaurant stays open past 2 AM
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Main Toggle */}
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex-1">
                  <label htmlFor="late-night-toggle" className="font-medium cursor-pointer">
                    Open Late (After 2 AM)
                  </label>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Enable this if your restaurant serves customers past 2 AM on any day
                  </p>
                </div>
                <Switch
                  id="late-night-toggle"
                  checked={isOpenLateNight}
                  onCheckedChange={(checked) => {
                    setIsOpenLateNight(checked);
                    if (!checked) {
                      setLateNightDays([]);
                    }
                    setSaved(false);
                  }}
                />
              </div>

              {/* Late-Night Days Selection */}
              {isOpenLateNight && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">
                      Select days open late:
                    </label>
                    {suggestedLateNightDays.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={applySuggestedDays}
                        className="text-xs text-primary hover:text-primary/90"
                      >
                        Auto-detect from hours ({suggestedLateNightDays.length} days)
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {DAYS.map((day) => {
                      const isChecked = lateNightDays.includes(day.label);
                      const isSuggested = suggestedLateNightDays.includes(day.label);
                      return (
                        <label
                          key={day.key}
                          className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                            isChecked
                              ? "bg-primary/10 border-primary"
                              : isSuggested
                                ? "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800"
                                : "bg-background border-border hover:bg-muted/50"
                          }`}
                        >
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={(checked) =>
                              handleLateNightDayToggle(day.label, checked as boolean)
                            }
                          />
                          <span className="text-sm font-medium">{day.label.slice(0, 3)}</span>
                          {isSuggested && !isChecked && (
                            <span className="text-xs text-amber-600 dark:text-amber-400">*</span>
                          )}
                        </label>
                      );
                    })}
                  </div>

                  {suggestedLateNightDays.length > 0 && lateNightDays.length === 0 && (
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      * Days marked with an asterisk have closing times after midnight based on your schedule
                    </p>
                  )}

                  <p className="text-xs text-muted-foreground">
                    This helps customers find your restaurant when filtering for late-night dining options.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Hours Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Weekly Schedule</span>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-primary hover:bg-primary/90"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {saved ? "Saved!" : "Save Changes"}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {DAYS.map((day, index) => {
                  const dayHours = hours[day.key] || DEFAULT_HOURS;
                  return (
                    <div
                      key={day.key}
                      className={`flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-lg ${
                        dayHours.closed
                          ? "bg-muted dark:bg-card"
                          : "bg-white dark:bg-background border"
                      }`}
                    >
                      <div className="w-24 font-medium">{day.label}</div>

                      <div className="flex items-center gap-2 flex-1">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={dayHours.closed}
                            onChange={(e) => handleDayChange(day.key, "closed", e.target.checked)}
                            className="w-4 h-4 rounded border"
                          />
                          <span className="text-sm text-muted-foreground">Closed</span>
                        </label>
                      </div>

                      {!dayHours.closed && (
                        <div className="flex items-center gap-2">
                          <Input
                            type="time"
                            value={dayHours.open}
                            onChange={(e) => handleDayChange(day.key, "open", e.target.value)}
                            className="w-32"
                          />
                          <span className="text-muted-foreground">to</span>
                          <Input
                            type="time"
                            value={dayHours.close}
                            onChange={(e) => handleDayChange(day.key, "close", e.target.value)}
                            className="w-32"
                          />
                        </div>
                      )}

                      {index === 0 && !dayHours.closed && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToAll(day.key)}
                          className="text-xs"
                        >
                          Copy to all
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>

              <p className="text-sm text-muted-foreground mt-6">
                Note: These hours are displayed to customers on your restaurant page.
                Make sure to keep them updated for accurate availability.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      <PublicFooter />
    </>
  );
}

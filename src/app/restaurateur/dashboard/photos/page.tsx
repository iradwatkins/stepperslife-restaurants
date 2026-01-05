"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { RestaurantsSubNav } from "@/components/layout/RestaurantsSubNav";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { RestaurantImage } from "@/components/restaurants/RestaurantImage";
import {
  ArrowLeft,
  Image as ImageIcon,
  Loader2,
  LogIn,
  AlertCircle,
  Camera,
  CheckCircle,
  Save,
  Store,
  Utensils,
  Info,
} from "lucide-react";
import Link from "next/link";

export default function PhotosManagementPage() {
  const currentUser = useQuery(api.users.queries.getCurrentUser);
  const restaurant = useQuery(
    api.menuItems.getRestaurantByOwner,
    currentUser?._id ? { ownerId: currentUser._id } : "skip"
  );

  const updateRestaurant = useMutation(api.restaurants.update);

  const [logoUrl, setLogoUrl] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Initialize from restaurant data
  useEffect(() => {
    if (restaurant) {
      setLogoUrl(restaurant.logoUrl || "");
      setCoverImageUrl(restaurant.coverImageUrl || "");
    }
  }, [restaurant]);

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

  const handleSave = async () => {
    if (!restaurant) return;

    setIsSaving(true);
    try {
      await updateRestaurant({
        id: restaurant._id,
        logoUrl: logoUrl || undefined,
        coverImageUrl: coverImageUrl || undefined,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Failed to save photos:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const hasLogo = Boolean(logoUrl);
  const hasCover = Boolean(coverImageUrl);
  const hasAllPhotos = hasLogo && hasCover;

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
                  <Camera className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Photos</h1>
                  <p className="text-white/80 text-sm">{restaurant.name}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Progress Banner */}
          {!hasAllPhotos && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-amber-800 dark:text-amber-300">
                    Complete Your Restaurant Photos
                  </h3>
                  <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                    Restaurants with photos get 3x more views and orders. Upload your logo and cover image to stand out!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Logo Section */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="w-5 h-5" />
                Restaurant Logo
                {hasLogo && <CheckCircle className="w-4 h-4 text-success ml-2" />}
              </CardTitle>
              <CardDescription>
                Your logo appears on restaurant cards and listings. Recommended size: 400x400 pixels.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Preview */}
                <div>
                  <p className="text-sm font-medium mb-2">Current Preview</p>
                  <div className="w-32 h-32 rounded-xl overflow-hidden border border-border">
                    <RestaurantImage
                      src={logoUrl}
                      alt={`${restaurant.name} logo`}
                      className="w-full h-full object-cover"
                      variant="logo"
                      fallbackIcon="store"
                    />
                  </div>
                </div>
                {/* Upload */}
                <div>
                  <p className="text-sm font-medium mb-2">Upload New Logo</p>
                  <ImageUpload
                    currentImageUrl={logoUrl}
                    onImageUploaded={(url) => {
                      setLogoUrl(url);
                      setSaved(false);
                    }}
                    onImageRemoved={() => {
                      setLogoUrl("");
                      setSaved(false);
                    }}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Square image works best. Max 5MB.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cover Image Section */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Cover Image
                {hasCover && <CheckCircle className="w-4 h-4 text-success ml-2" />}
              </CardTitle>
              <CardDescription>
                The cover image is the large banner shown on your restaurant page. Recommended size: 1200x600 pixels.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Preview */}
                <div>
                  <p className="text-sm font-medium mb-2">Current Preview</p>
                  <div className="w-full h-48 rounded-xl overflow-hidden border border-border">
                    <RestaurantImage
                      src={coverImageUrl}
                      alt={`${restaurant.name} cover`}
                      className="w-full h-full object-cover"
                      variant="cover"
                    />
                  </div>
                </div>
                {/* Upload */}
                <div>
                  <p className="text-sm font-medium mb-2">Upload New Cover Image</p>
                  <ImageUpload
                    currentImageUrl={coverImageUrl}
                    onImageUploaded={(url) => {
                      setCoverImageUrl(url);
                      setSaved(false);
                    }}
                    onImageRemoved={() => {
                      setCoverImageUrl("");
                      setSaved(false);
                    }}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Landscape image works best (16:9 or similar). Max 5MB.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Food Photos Info */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Utensils className="w-5 h-5" />
                Food Photos
              </CardTitle>
              <CardDescription>
                Add photos to your menu items to showcase your dishes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                You can add photos to individual menu items when editing your menu.
                Each menu item can have its own image to help customers see what they're ordering.
              </p>
              <Link
                href="/restaurateur/dashboard/menu"
                className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
              >
                Go to Menu Management
                <ArrowLeft className="w-4 h-4 rotate-180" />
              </Link>
            </CardContent>
          </Card>

          {/* Photo Tips */}
          <Card className="mb-6 bg-muted/50">
            <CardHeader>
              <CardTitle className="text-base">Photo Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                  Use natural lighting when possible
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                  Keep the background clean and uncluttered
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                  Show your restaurant's personality and vibe
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                  For food photos, make them look appetizing and fresh
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                  High resolution images look better on all devices
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-primary hover:bg-primary/90 min-w-[150px]"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : saved ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Saved!
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
      <PublicFooter />
    </>
  );
}

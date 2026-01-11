"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { RestaurantsSubNav } from "@/components/layout/RestaurantsSubNav";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Settings,
  Save,
  Loader2,
  LogIn,
  AlertCircle,
  Store,
  Phone,
  MapPin,
  Clock,
  Image as ImageIcon,
  Utensils,
  Bell,
  CheckCircle,
  Shirt,
  Sparkles,
  Users,
  Music,
} from "lucide-react";
import Link from "next/link";

export default function RestaurantSettingsClient() {
  const currentUser = useQuery(api.users.queries.getCurrentUser);
  const restaurant = useQuery(
    api.menuItems.getRestaurantByOwner,
    currentUser?._id ? { ownerId: currentUser._id } : "skip"
  );

  const updateRestaurant = useMutation(api.restaurants.update);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    cuisine: [] as string[],
    estimatedPickupTime: 15,
    logoUrl: "",
    coverImageUrl: "",
    // Stepper-specific fields
    dressCode: "" as "" | "casual" | "smart-casual" | "upscale" | "stepping-attire",
    vibeTags: [] as string[],
    groupInfo: {
      maxPartySize: 10,
      groupDiscounts: false,
      privateRoomAvailable: false,
      minimumForGroup: 0,
    },
    entertainment: {
      hasLiveMusic: false,
      hasDJ: false,
      musicGenres: [] as string[],
      entertainmentNights: [] as string[],
    },
  });

  const [cuisineInput, setCuisineInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Initialize form data from restaurant
  useEffect(() => {
    if (restaurant) {
      setFormData({
        name: restaurant.name || "",
        description: restaurant.description || "",
        phone: restaurant.phone || "",
        address: restaurant.address || "",
        city: restaurant.city || "",
        state: restaurant.state || "",
        zipCode: restaurant.zipCode || "",
        cuisine: restaurant.cuisine || [],
        estimatedPickupTime: restaurant.estimatedPickupTime || 15,
        logoUrl: restaurant.logoUrl || "",
        coverImageUrl: restaurant.coverImageUrl || "",
        // Stepper-specific fields
        dressCode: restaurant.dressCode || "",
        vibeTags: restaurant.vibeTags || [],
        groupInfo: {
          maxPartySize: restaurant.groupInfo?.maxPartySize || 10,
          groupDiscounts: restaurant.groupInfo?.groupDiscounts || false,
          privateRoomAvailable: restaurant.groupInfo?.privateRoomAvailable || false,
          minimumForGroup: restaurant.groupInfo?.minimumForGroup || 0,
        },
        entertainment: {
          hasLiveMusic: restaurant.entertainment?.hasLiveMusic || false,
          hasDJ: restaurant.entertainment?.hasDJ || false,
          musicGenres: restaurant.entertainment?.musicGenres || [],
          entertainmentNights: restaurant.entertainment?.entertainmentNights || [],
        },
      });
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

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleAddCuisine = () => {
    if (cuisineInput.trim() && !formData.cuisine.includes(cuisineInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        cuisine: [...prev.cuisine, cuisineInput.trim()],
      }));
      setCuisineInput("");
      setSaved(false);
    }
  };

  const handleRemoveCuisine = (cuisine: string) => {
    setFormData((prev) => ({
      ...prev,
      cuisine: prev.cuisine.filter((c) => c !== cuisine),
    }));
    setSaved(false);
  };

  const handleSave = async () => {
    if (!restaurant) return;

    setIsSaving(true);
    try {
      await updateRestaurant({
        id: restaurant._id,
        name: formData.name,
        description: formData.description,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        cuisine: formData.cuisine,
        estimatedPickupTime: formData.estimatedPickupTime,
        logoUrl: formData.logoUrl,
        coverImageUrl: formData.coverImageUrl,
        // Stepper-specific fields
        dressCode: formData.dressCode || undefined,
        vibeTags: formData.vibeTags.length > 0 ? formData.vibeTags : undefined,
        groupInfo: {
          maxPartySize: formData.groupInfo.maxPartySize,
          groupDiscounts: formData.groupInfo.groupDiscounts,
          privateRoomAvailable: formData.groupInfo.privateRoomAvailable,
          minimumForGroup: formData.groupInfo.minimumForGroup || undefined,
        },
        entertainment: {
          hasLiveMusic: formData.entertainment.hasLiveMusic,
          hasDJ: formData.entertainment.hasDJ,
          musicGenres: formData.entertainment.musicGenres.length > 0 ? formData.entertainment.musicGenres : undefined,
          entertainmentNights: formData.entertainment.entertainmentNights.length > 0 ? formData.entertainment.entertainmentNights : undefined,
        },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Failed to save settings:", err);
    } finally {
      setIsSaving(false);
    }
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
                  <Settings className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Restaurant Settings</h1>
                  <p className="text-white/80 text-sm">{restaurant.name}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 max-w-3xl">
          {/* Basic Info */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="w-5 h-5" />
                Basic Information
              </CardTitle>
              <CardDescription>
                Update your restaurant's name and description
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Restaurant Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Your Restaurant Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Tell customers about your restaurant..."
                  className="w-full px-3 py-2 rounded-md border border-input bg-background min-h-[100px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact & Location */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Contact & Location
              </CardTitle>
              <CardDescription>
                Where customers can find and reach you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Phone Number</label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Street Address</label>
                <Input
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  placeholder="123 Main Street"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">City</label>
                  <Input
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    placeholder="City"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">State</label>
                  <Input
                    value={formData.state}
                    onChange={(e) => handleInputChange("state", e.target.value)}
                    placeholder="State"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">ZIP Code</label>
                  <Input
                    value={formData.zipCode}
                    onChange={(e) => handleInputChange("zipCode", e.target.value)}
                    placeholder="12345"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cuisine Types */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Utensils className="w-5 h-5" />
                Cuisine Types
              </CardTitle>
              <CardDescription>
                Help customers find your restaurant by cuisine
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Input
                  value={cuisineInput}
                  onChange={(e) => setCuisineInput(e.target.value)}
                  placeholder="Add cuisine type (e.g., Italian, Soul Food)"
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddCuisine())}
                />
                <Button type="button" onClick={handleAddCuisine} variant="outline">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.cuisine.map((cuisine) => (
                  <span
                    key={cuisine}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary rounded-full text-sm"
                  >
                    {cuisine}
                    <button
                      type="button"
                      onClick={() => handleRemoveCuisine(cuisine)}
                      className="ml-1 hover:text-destructive"
                    >
                      ×
                    </button>
                  </span>
                ))}
                {formData.cuisine.length === 0 && (
                  <p className="text-sm text-muted-foreground">No cuisine types added yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pickup Settings */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Pickup Settings
              </CardTitle>
              <CardDescription>
                Set your estimated pickup time for orders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Estimated Pickup Time (minutes)
                </label>
                <Input
                  type="number"
                  min="5"
                  max="120"
                  value={formData.estimatedPickupTime}
                  onChange={(e) => handleInputChange("estimatedPickupTime", parseInt(e.target.value) || 15)}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  This is shown to customers when they place an order
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Images */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Restaurant Images
              </CardTitle>
              <CardDescription>
                Upload your logo and cover image
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Logo</label>
                <ImageUpload
                  currentImageUrl={formData.logoUrl}
                  onImageUploaded={(url) => handleInputChange("logoUrl", url)}
                  onImageRemoved={() => handleInputChange("logoUrl", "")}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Cover Image</label>
                <ImageUpload
                  currentImageUrl={formData.coverImageUrl}
                  onImageUploaded={(url) => handleInputChange("coverImageUrl", url)}
                  onImageRemoved={() => handleInputChange("coverImageUrl", "")}
                />
              </div>
            </CardContent>
          </Card>

          {/* Dress Code */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shirt className="w-5 h-5" />
                Dress Code
              </CardTitle>
              <CardDescription>
                Set the dress code for your establishment to help steppers dress appropriately
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <label className="block text-sm font-medium mb-2">Dress Code</label>
                <Select
                  value={formData.dressCode}
                  onValueChange={(value) => {
                    setFormData((prev) => ({ ...prev, dressCode: value as typeof formData.dressCode }));
                    setSaved(false);
                  }}
                >
                  <SelectTrigger className="w-full max-w-xs">
                    <SelectValue placeholder="Select dress code" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="smart-casual">Smart Casual</SelectItem>
                    <SelectItem value="upscale">Upscale</SelectItem>
                    <SelectItem value="stepping-attire">Stepping Attire</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground mt-2">
                  Stepping Attire is the recommended dress code for venues hosting stepping events
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Vibe Tags */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Vibe Tags
              </CardTitle>
              <CardDescription>
                Select tags that describe your restaurant's atmosphere and appeal to steppers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: "energetic", label: "Energetic" },
                  { value: "intimate", label: "Intimate" },
                  { value: "lounge", label: "Lounge" },
                  { value: "romantic", label: "Romantic" },
                  { value: "upscale", label: "Upscale" },
                  { value: "casual", label: "Casual" },
                  { value: "lively", label: "Lively" },
                  { value: "family-friendly", label: "Family Friendly" },
                  { value: "late-night", label: "Late Night" },
                  { value: "dance-floor", label: "Dance Floor" },
                ].map((tag) => {
                  const isSelected = formData.vibeTags.includes(tag.value);
                  return (
                    <button
                      key={tag.value}
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          vibeTags: isSelected
                            ? prev.vibeTags.filter((t) => t !== tag.value)
                            : [...prev.vibeTags, tag.value],
                        }));
                        setSaved(false);
                      }}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted hover:bg-muted/80 text-muted-foreground"
                      }`}
                    >
                      {tag.label}
                    </button>
                  );
                })}
              </div>
              {formData.vibeTags.length > 0 && (
                <p className="text-sm text-muted-foreground mt-3">
                  Selected: {formData.vibeTags.length} tag{formData.vibeTags.length !== 1 ? "s" : ""}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Group Info */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Group Accommodations
              </CardTitle>
              <CardDescription>
                Configure settings for group reservations and stepping parties
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Maximum Party Size</label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.groupInfo.maxPartySize}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 10;
                      setFormData((prev) => ({
                        ...prev,
                        groupInfo: { ...prev.groupInfo, maxPartySize: Math.min(100, Math.max(1, value)) },
                      }));
                      setSaved(false);
                    }}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Maximum guests per reservation
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Minimum for Group (optional)</label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.groupInfo.minimumForGroup || ""}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      setFormData((prev) => ({
                        ...prev,
                        groupInfo: { ...prev.groupInfo, minimumForGroup: value },
                      }));
                      setSaved(false);
                    }}
                    placeholder="0"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Minimum order amount for groups ($)
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Group Discounts Available</label>
                    <p className="text-sm text-muted-foreground">
                      Offer special pricing for large stepping groups
                    </p>
                  </div>
                  <Switch
                    checked={formData.groupInfo.groupDiscounts}
                    onCheckedChange={(checked) => {
                      setFormData((prev) => ({
                        ...prev,
                        groupInfo: { ...prev.groupInfo, groupDiscounts: checked },
                      }));
                      setSaved(false);
                    }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Private Room Available</label>
                    <p className="text-sm text-muted-foreground">
                      Offer a private space for stepping events
                    </p>
                  </div>
                  <Switch
                    checked={formData.groupInfo.privateRoomAvailable}
                    onCheckedChange={(checked) => {
                      setFormData((prev) => ({
                        ...prev,
                        groupInfo: { ...prev.groupInfo, privateRoomAvailable: checked },
                      }));
                      setSaved(false);
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Entertainment */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Music className="w-5 h-5" />
                Entertainment
              </CardTitle>
              <CardDescription>
                Describe the entertainment options at your venue for steppers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Live Music</label>
                    <p className="text-sm text-muted-foreground">
                      Do you feature live bands or performers?
                    </p>
                  </div>
                  <Switch
                    checked={formData.entertainment.hasLiveMusic}
                    onCheckedChange={(checked) => {
                      setFormData((prev) => ({
                        ...prev,
                        entertainment: { ...prev.entertainment, hasLiveMusic: checked },
                      }));
                      setSaved(false);
                    }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">DJ</label>
                    <p className="text-sm text-muted-foreground">
                      Do you have a DJ for stepping music?
                    </p>
                  </div>
                  <Switch
                    checked={formData.entertainment.hasDJ}
                    onCheckedChange={(checked) => {
                      setFormData((prev) => ({
                        ...prev,
                        entertainment: { ...prev.entertainment, hasDJ: checked },
                      }));
                      setSaved(false);
                    }}
                  />
                </div>
              </div>

              {/* Music Genres */}
              <div>
                <label className="block text-sm font-medium mb-2">Music Genres</label>
                <p className="text-sm text-muted-foreground mb-3">
                  Select the music genres played at your venue
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: "r&b", label: "R&B" },
                    { value: "soul", label: "Soul" },
                    { value: "jazz", label: "Jazz" },
                    { value: "hip-hop", label: "Hip-Hop" },
                    { value: "house", label: "House" },
                    { value: "steppin", label: "Steppin'" },
                    { value: "neo-soul", label: "Neo-Soul" },
                    { value: "old-school-r&b", label: "Old School R&B" },
                    { value: "blues", label: "Blues" },
                    { value: "gospel", label: "Gospel" },
                  ].map((genre) => {
                    const isSelected = formData.entertainment.musicGenres.includes(genre.value);
                    return (
                      <button
                        key={genre.value}
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            entertainment: {
                              ...prev.entertainment,
                              musicGenres: isSelected
                                ? prev.entertainment.musicGenres.filter((g) => g !== genre.value)
                                : [...prev.entertainment.musicGenres, genre.value],
                            },
                          }));
                          setSaved(false);
                        }}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted hover:bg-muted/80 text-muted-foreground"
                        }`}
                      >
                        {genre.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Entertainment Nights */}
              <div>
                <label className="block text-sm font-medium mb-2">Entertainment Nights</label>
                <p className="text-sm text-muted-foreground mb-3">
                  Select the nights when you have entertainment
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: "monday", label: "Monday" },
                    { value: "tuesday", label: "Tuesday" },
                    { value: "wednesday", label: "Wednesday" },
                    { value: "thursday", label: "Thursday" },
                    { value: "friday", label: "Friday" },
                    { value: "saturday", label: "Saturday" },
                    { value: "sunday", label: "Sunday" },
                  ].map((day) => {
                    const isSelected = formData.entertainment.entertainmentNights.includes(day.value);
                    return (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            entertainment: {
                              ...prev.entertainment,
                              entertainmentNights: isSelected
                                ? prev.entertainment.entertainmentNights.filter((d) => d !== day.value)
                                : [...prev.entertainment.entertainmentNights, day.value],
                            },
                          }));
                          setSaved(false);
                        }}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted hover:bg-muted/80 text-muted-foreground"
                        }`}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notifications
              </CardTitle>
              <CardDescription>
                Manage how you receive order notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                You can enable browser notifications on the Orders page to receive alerts when new orders come in.
              </p>
              <Link
                href="/restaurateur/dashboard/orders"
                className="inline-flex items-center gap-2 text-primary hover:text-primary font-medium"
              >
                Go to Orders Page →
              </Link>
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

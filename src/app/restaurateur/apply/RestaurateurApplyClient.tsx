"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { RestaurantsSubNav } from "@/components/layout/RestaurantsSubNav";
import { PublicFooter } from "@/components/layout/PublicFooter";
import {
  ChefHat,
  MapPin,
  Phone,
  Clock,
  Utensils,
  Building2,
  Mail,
  User,
  FileText,
  CheckCircle,
  Loader2,
  LogIn,
  CreditCard,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";

// Plan details for display
const PLAN_DETAILS: Record<string, { name: string; price: string; features: string[] }> = {
  starter: {
    name: "Starter",
    price: "Free",
    features: ["10 menu items", "3 categories", "10% transaction fee"],
  },
  growth: {
    name: "Growth",
    price: "$19/month",
    features: ["100 menu items", "20 categories", "6% transaction fee"],
  },
  professional: {
    name: "Professional",
    price: "$49/month",
    features: ["Unlimited menu items", "Unlimited categories", "4% transaction fee"],
  },
};

interface FormData {
  // Contact Info
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  // Restaurant Info
  restaurantName: string;
  description: string;
  cuisineTypes: string[];
  // Location
  address: string;
  city: string;
  state: string;
  zipCode: string;
  // Operations
  hoursOfOperation: string;
  estimatedPickupTime: string;
  // Additional
  website: string;
  additionalNotes: string;
}

const CUISINE_OPTIONS = [
  "Soul Food",
  "Southern",
  "BBQ",
  "Seafood",
  "Caribbean",
  "African",
  "American",
  "Mexican",
  "Chinese",
  "Italian",
  "Pizza",
  "Burgers",
  "Sandwiches",
  "Vegetarian",
  "Vegan",
  "Desserts",
  "Catering",
  "Other",
];

export default function RestaurateurApplyClient() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const applyMutation = useMutation(api.restaurants.apply);

  // Check if user already has a restaurant (franchise model: one restaurant per owner)
  const myRestaurants = useQuery(api.restaurants.getMyRestaurants);
  const hasExistingRestaurant = myRestaurants && myRestaurants.length > 0;

  // Redirect to dashboard if user already has a restaurant
  useEffect(() => {
    if (hasExistingRestaurant) {
      toast.info(`You already own "${myRestaurants[0].name}". Redirecting to your dashboard...`);
      router.push("/restaurateur/dashboard");
    }
  }, [hasExistingRestaurant, myRestaurants, router]);

  // Get selected plan from URL (default to starter)
  const selectedPlanKey = searchParams.get("plan") || "starter";
  const selectedPlan = PLAN_DETAILS[selectedPlanKey] || PLAN_DETAILS.starter;

  const [formData, setFormData] = useState<FormData>({
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    restaurantName: "",
    description: "",
    cuisineTypes: [],
    address: "",
    city: "",
    state: "IL",
    zipCode: "",
    hoursOfOperation: "",
    estimatedPickupTime: "15-20 minutes",
    website: "",
    additionalNotes: "",
  });

  // Pre-fill user info when authenticated
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        contactName: user.name || prev.contactName,
        contactEmail: user.email || prev.contactEmail,
      }));
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCuisineToggle = (cuisine: string) => {
    setFormData(prev => ({
      ...prev,
      cuisineTypes: prev.cuisineTypes.includes(cuisine)
        ? prev.cuisineTypes.filter(c => c !== cuisine)
        : [...prev.cuisineTypes, cuisine],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    const required = ["contactName", "contactEmail", "contactPhone", "restaurantName", "address", "city", "state", "zipCode"];
    const missing = required.filter(field => !formData[field as keyof FormData]);

    if (missing.length > 0) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (formData.cuisineTypes.length === 0) {
      toast.error("Please select at least one cuisine type");
      return;
    }

    if (!user?._id) {
      toast.error("You must be signed in to submit an application");
      return;
    }

    setIsSubmitting(true);

    try {
      // Parse estimated pickup time to number (extract first number from string like "15-20 minutes")
      const pickupMatch = formData.estimatedPickupTime.match(/\d+/);
      const estimatedPickupTime = pickupMatch ? parseInt(pickupMatch[0], 10) : 30;

      await applyMutation({
        name: formData.restaurantName,
        description: formData.description || undefined,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        phone: formData.contactPhone,
        cuisine: formData.cuisineTypes,
        contactName: formData.contactName,
        contactEmail: formData.contactEmail,
        website: formData.website || undefined,
        hoursOfOperation: formData.hoursOfOperation || undefined,
        estimatedPickupTime,
        additionalNotes: formData.additionalNotes || undefined,
        selectedPlan: selectedPlanKey as "starter" | "growth" | "professional",
      });

      setSubmitted(true);
      toast.success("Restaurant added successfully!");
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("Failed to add restaurant. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <>
        <PublicHeader />
        <RestaurantsSubNav />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </>
    );
  }

  // Not signed in - show sign in prompt
  if (!isAuthenticated) {
    return (
      <>
        <PublicHeader />
        <RestaurantsSubNav />
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-16">
            <div className="max-w-md mx-auto bg-card rounded-2xl shadow-lg p-8 text-center border border-border">
              <div className="w-16 h-16 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <LogIn className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-4">
                Sign In to Add Your Restaurant
              </h1>
              <p className="text-muted-foreground mb-8">
                Create an account or sign in to add your restaurant to the SteppersLife network. Basic listing is free!
              </p>
              <Link
                href={`/login?redirect=${encodeURIComponent("/restaurateur/apply")}`}
                className="block w-full px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              >
                Sign In to Continue
              </Link>
              <p className="text-sm text-muted-foreground mt-4">
                Don't have an account? You can create one when you sign in.
              </p>
            </div>
          </div>
        </div>
        <PublicFooter />
      </>
    );
  }

  // Restaurant created successfully
  if (submitted) {
    return (
      <>
        <PublicHeader />
        <RestaurantsSubNav />
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-16">
            <div className="max-w-md mx-auto bg-card rounded-2xl shadow-lg p-8 text-center border border-border">
              <div className="w-16 h-16 bg-success/20 dark:bg-success/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-4">
                Restaurant Added!
              </h1>
              <p className="text-muted-foreground mb-6">
                Your restaurant is now listed on SteppersLife.
                Head to your dashboard to add your menu and start receiving orders.
              </p>
              <div className="bg-muted/50 rounded-lg p-4 mb-6">
                <p className="text-sm text-foreground">
                  <strong>Get Started</strong>
                </p>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1 text-left">
                  <li>• Add your menu items (paid feature)</li>
                  <li>• Set your operating hours</li>
                  <li>• Upload photos of your food</li>
                  <li>• Start receiving orders!</li>
                </ul>
              </div>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => router.push("/restaurateur/dashboard")}
                  className="w-full px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                >
                  Go to Dashboard
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/restaurants")}
                  className="w-full px-6 py-3 bg-muted text-foreground rounded-lg font-semibold hover:bg-muted/80 transition-colors"
                >
                  View Restaurant Listings
                </button>
              </div>
            </div>
          </div>
        </div>
        <PublicFooter />
      </>
    );
  }

  // Application form
  return (
    <>
      <PublicHeader />
      <RestaurantsSubNav />
      <div className="min-h-screen bg-background">
        {/* Hero */}
        <div className="bg-gradient-to-br from-primary to-sky-700 py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-medium mb-4">
                <ChefHat className="h-4 w-4" />
                Free Restaurant Listing
              </span>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Add Your Restaurant
              </h1>
              <p className="text-white/90">
                List your restaurant for free and reach thousands of customers in the stepping community.
              </p>
            </div>
          </div>
        </div>

        {/* Application Form */}
        <div className="container mx-auto px-4 py-12">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-8">

            {/* Selected Plan Display */}
            <div className="bg-gradient-to-r from-primary/10 to-sky-500/10 dark:from-primary/20 dark:to-sky-500/20 rounded-2xl shadow-md border border-primary/20 p-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Selected Plan</p>
                    <h2 className="text-xl font-bold text-foreground">{selectedPlan.name} Plan</h2>
                    <p className="text-lg font-semibold text-primary">{selectedPlan.price}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedPlan.features.map((feature, idx) => (
                    <span key={idx} className="px-3 py-1 bg-white/50 dark:bg-black/20 rounded-full text-sm text-foreground">
                      {feature}
                    </span>
                  ))}
                </div>
                <Link
                  href="/restaurants/pricing"
                  className="text-sm text-primary hover:underline font-medium"
                >
                  Change Plan
                </Link>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-card rounded-2xl shadow-md border border-border p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Contact Information</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    name="contactName"
                    value={formData.contactName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="contactEmail"
                    value={formData.contactEmail}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
                    placeholder="john@restaurant.com"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="contactPhone"
                    value={formData.contactPhone}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
                    placeholder="(312) 555-0123"
                  />
                </div>
              </div>
            </div>

            {/* Restaurant Information */}
            <div className="bg-card rounded-2xl shadow-md border border-border p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Restaurant Information</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Restaurant Name *
                  </label>
                  <input
                    type="text"
                    name="restaurantName"
                    value={formData.restaurantName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
                    placeholder="Soul Kitchen"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background resize-none"
                    placeholder="Tell us about your restaurant, your specialties, and what makes you unique..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Cuisine Types * (select all that apply)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {CUISINE_OPTIONS.map(cuisine => (
                      <button
                        key={cuisine}
                        type="button"
                        onClick={() => handleCuisineToggle(cuisine)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                          formData.cuisineTypes.includes(cuisine)
                            ? "bg-primary text-white"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        {cuisine}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Website (optional)
                  </label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
                    placeholder="https://www.yourrestaurant.com"
                  />
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="bg-card rounded-2xl shadow-md border border-border p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Location</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
                    placeholder="123 Main Street"
                  />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
                      placeholder="Chicago"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      State *
                    </label>
                    <select
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
                    >
                      <option value="IL">IL</option>
                      <option value="IN">IN</option>
                      <option value="WI">WI</option>
                      <option value="MI">MI</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      ZIP Code *
                    </label>
                    <input
                      type="text"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
                      placeholder="60601"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Operations */}
            <div className="bg-card rounded-2xl shadow-md border border-border p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Operations</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Hours of Operation
                  </label>
                  <textarea
                    name="hoursOfOperation"
                    value={formData.hoursOfOperation}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background resize-none"
                    placeholder="Mon-Fri: 11am-9pm&#10;Sat-Sun: 12pm-10pm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Estimated Pickup Time
                  </label>
                  <select
                    name="estimatedPickupTime"
                    value={formData.estimatedPickupTime}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
                  >
                    <option value="10-15 minutes">10-15 minutes</option>
                    <option value="15-20 minutes">15-20 minutes</option>
                    <option value="20-30 minutes">20-30 minutes</option>
                    <option value="30-45 minutes">30-45 minutes</option>
                    <option value="45-60 minutes">45-60 minutes</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Additional Notes */}
            <div className="bg-card rounded-2xl shadow-md border border-border p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Additional Notes</h2>
              </div>

              <textarea
                name="additionalNotes"
                value={formData.additionalNotes}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background resize-none"
                placeholder="Anything else you'd like us to know about your restaurant..."
              />
            </div>

            {/* Submit */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-4 bg-primary text-white rounded-lg font-semibold text-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Adding Restaurant...
                  </>
                ) : (
                  <>
                    <ChefHat className="w-5 h-5" />
                    Add Restaurant
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
      <PublicFooter />
    </>
  );
}

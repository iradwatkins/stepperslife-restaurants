"use client";

import Link from "next/link";
import { Utensils, Search, X, Coffee, ChefHat, Flame, Clock, MapPin, Star, ChevronDown, Moon, Shirt, DollarSign, Users, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { RestaurantsSubNav } from "@/components/layout/RestaurantsSubNav";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useMemo } from "react";
import { RestaurantCard } from "@/components/restaurants/RestaurantCard";
import { motion } from "framer-motion";
import { ViewToggle, ViewMode } from "@/components/ui/ViewToggle";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import Image from "next/image";

// All available cuisine types
const ALL_CUISINES = [
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
];

type SortOption = "name" | "pickup_time" | "newest";

// Props for server-side initial data (hybrid SSR + CSR pattern)
interface RestaurantsListClientProps {
  initialRestaurants?: any[];
}

export default function RestaurantsListClient({
  initialRestaurants,
}: RestaurantsListClientProps = {}) {
  // Query restaurants - use initial data as fallback for SSR hydration
  const restaurantsQuery = useQuery(api.public.queries.getActiveRestaurants);
  const restaurants = restaurantsQuery ?? initialRestaurants ?? [];

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortOption>("name");
  const [viewMode, setViewMode] = useState<ViewMode>("masonry");
  const [lateNightOnly, setLateNightOnly] = useState(false);

  // Stepper-specific filters (Phase 2)
  const [selectedPriceRange, setSelectedPriceRange] = useState<string[]>([]);
  const [selectedDressCode, setSelectedDressCode] = useState<string[]>([]);
  const [groupFriendlyOnly, setGroupFriendlyOnly] = useState(false);
  const [hasEntertainmentOnly, setHasEntertainmentOnly] = useState(false);

  // Get unique cities from restaurants
  const cities = useMemo(() => {
    if (!restaurants) return [];
    const citySet = new Set(restaurants.map(r => r.city).filter(Boolean));
    return Array.from(citySet).sort();
  }, [restaurants]);

  // Get cuisines that are actually used by restaurants
  const availableCuisines = useMemo(() => {
    if (!restaurants) return [];
    const cuisineSet = new Set<string>();
    restaurants.forEach(r => {
      r.cuisine?.forEach((c: string) => cuisineSet.add(c));
    });
    return ALL_CUISINES.filter((c: string) => cuisineSet.has(c));
  }, [restaurants]);

  // Filter and sort restaurants
  const filteredRestaurants = useMemo(() => {
    if (!restaurants) return [];

    let filtered = [...restaurants];

    // Search by name or cuisine
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        r.name.toLowerCase().includes(query) ||
        r.cuisine?.some((c: string) => c.toLowerCase().includes(query))
      );
    }

    // Filter by cuisines
    if (selectedCuisines.length > 0) {
      filtered = filtered.filter(r =>
        selectedCuisines.some(cuisine => r.cuisine?.includes(cuisine))
      );
    }

    // Filter by city
    if (selectedCity) {
      filtered = filtered.filter(r => r.city === selectedCity);
    }

    // Filter for late-night restaurants (open after 2am)
    if (lateNightOnly) {
      filtered = filtered.filter(r => (r as any).isOpenLateNight === true);
    }

    // Filter by price range (Phase 2)
    if (selectedPriceRange.length > 0) {
      filtered = filtered.filter(r =>
        (r as any).priceRange && selectedPriceRange.includes((r as any).priceRange)
      );
    }

    // Filter by dress code (Phase 2)
    if (selectedDressCode.length > 0) {
      filtered = filtered.filter(r =>
        (r as any).dressCode && selectedDressCode.includes((r as any).dressCode)
      );
    }

    // Filter for group-friendly restaurants (max party size >= 8)
    if (groupFriendlyOnly) {
      filtered = filtered.filter(r =>
        (r as any).groupInfo?.maxPartySize && (r as any).groupInfo.maxPartySize >= 8
      );
    }

    // Filter for restaurants with entertainment
    if (hasEntertainmentOnly) {
      filtered = filtered.filter(r =>
        (r as any).entertainment?.hasLiveMusic || (r as any).entertainment?.hasDJ
      );
    }

    // Sort
    switch (sortBy) {
      case "name":
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "pickup_time":
        filtered.sort((a, b) => (a.estimatedPickupTime || 30) - (b.estimatedPickupTime || 30));
        break;
      case "newest":
        filtered.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        break;
    }

    return filtered;
  }, [restaurants, searchQuery, selectedCuisines, selectedCity, sortBy, lateNightOnly, selectedPriceRange, selectedDressCode, groupFriendlyOnly, hasEntertainmentOnly]);

  // Toggle cuisine filter
  const toggleCuisine = (cuisine: string) => {
    setSelectedCuisines(prev =>
      prev.includes(cuisine)
        ? prev.filter(c => c !== cuisine)
        : [...prev, cuisine]
    );
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCuisines([]);
    setSelectedCity("");
    setSortBy("name");
    setLateNightOnly(false);
    // Clear stepper-specific filters
    setSelectedPriceRange([]);
    setSelectedDressCode([]);
    setGroupFriendlyOnly(false);
    setHasEntertainmentOnly(false);
  };

  const hasActiveFilters = searchQuery || selectedCuisines.length > 0 || selectedCity || lateNightOnly || selectedPriceRange.length > 0 || selectedDressCode.length > 0 || groupFriendlyOnly || hasEntertainmentOnly;

  // Check if we have no data at all (neither from query nor initial props)
  // With hybrid SSR+CSR pattern, we should only show loading if both sources are empty
  const hasNoDataAtAll = restaurantsQuery === undefined && (!initialRestaurants || initialRestaurants.length === 0);

  // Loading state - only show if we have NO data from either source
  if (hasNoDataAtAll) {
    return (
      <>
        <PublicHeader />
        <RestaurantsSubNav />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <motion.div
              className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <motion.p
              className="text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Loading restaurants...
            </motion.p>
          </div>
        </div>
        <PublicFooter />
      </>
    );
  }

  return (
    <>
      <PublicHeader />
      <RestaurantsSubNav />
      <div className="min-h-screen bg-background">
        {/* EPIC Hero Section */}
        <section className="relative min-h-[500px] md:min-h-[600px] w-full overflow-hidden">
          {/* Animated Gradient Background */}
          <motion.div
            className="absolute inset-0"
            animate={{
              background: [
                "linear-gradient(135deg, #0284c7 0%, #1e9df1 50%, #38bdf8 100%)",
                "linear-gradient(135deg, #1e9df1 0%, #38bdf8 50%, #0284c7 100%)",
                "linear-gradient(135deg, #38bdf8 0%, #0284c7 50%, #1e9df1 100%)",
                "linear-gradient(135deg, #0284c7 0%, #1e9df1 50%, #38bdf8 100%)",
              ],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          />

          {/* Background Food Image */}
          <motion.div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1920&q=80')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.5 }}
          />

          {/* Gradient Overlay for depth */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-black/50" />

          {/* Floating Food Icons */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Utensils Icon */}
            <motion.div
              className="absolute top-[15%] left-[10%] text-white/20"
              animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            >
              <Utensils className="h-16 w-16 md:h-24 md:w-24" />
            </motion.div>

            {/* Coffee Icon */}
            <motion.div
              className="absolute top-[25%] right-[15%] text-white/15"
              animate={{ y: [0, 15, 0], rotate: [0, -8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            >
              <Coffee className="h-14 w-14 md:h-20 md:w-20" />
            </motion.div>

            {/* ChefHat Icon */}
            <motion.div
              className="absolute bottom-[30%] left-[8%] text-white/15"
              animate={{ y: [0, -15, 0], scale: [1, 1.05, 1] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            >
              <ChefHat className="h-12 w-12 md:h-16 md:w-16" />
            </motion.div>

            {/* Flame Icon */}
            <motion.div
              className="absolute top-[40%] right-[8%] text-white/20"
              animate={{ y: [0, -25, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
            >
              <Flame className="h-10 w-10 md:h-14 md:w-14" />
            </motion.div>

            {/* Steam/Smoke Particles */}
            {[...Array(15)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: Math.random() * 8 + 4 + "px",
                  height: Math.random() * 8 + 4 + "px",
                  left: `${5 + Math.random() * 90}%`,
                  bottom: `${Math.random() * 40}%`,
                  background: `rgba(255, 255, 255, ${0.1 + Math.random() * 0.2})`,
                }}
                animate={{
                  y: [0, -100 - Math.random() * 100],
                  opacity: [0, 0.6, 0],
                  scale: [0.5, 1.5, 2],
                }}
                transition={{
                  duration: 4 + Math.random() * 3,
                  repeat: Infinity,
                  delay: Math.random() * 3,
                  ease: "easeOut",
                }}
              />
            ))}
          </div>

          {/* Main Content */}
          <div className="relative z-10 container mx-auto px-4 py-16 md:py-20 flex flex-col items-center justify-center min-h-[500px] md:min-h-[600px]">
            {/* Restaurant Count Badge */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-6"
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm font-medium">
                <motion.span
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Utensils className="h-4 w-4" />
                </motion.span>
                {restaurants.length} {restaurants.length === 1 ? "Restaurant" : "Restaurants"} Available
              </span>
            </motion.div>

            {/* Main Title with Gradient Animation */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-center mb-6"
            >
              <span className="text-white drop-shadow-lg">Taste the</span>
              <br />
              <motion.span
                className="bg-gradient-to-r from-cyan-200 via-white to-cyan-300 bg-clip-text text-transparent bg-[length:200%_auto]"
                animate={{ backgroundPosition: ["0% center", "200% center"] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              >
                Community Flavors
              </motion.span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg md:text-xl text-white/90 text-center max-w-2xl mb-8"
            >
              Order from the best local restaurants in the stepping community.
              Fresh food, fast pickup, no delivery fees.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 mb-12"
            >
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Button
                  size="lg"
                  onClick={() => document.getElementById("restaurants")?.scrollIntoView({ behavior: "smooth" })}
                  className="bg-white !text-primary hover:bg-sky-50 font-semibold px-8 py-6 text-lg rounded-full shadow-lg"
                >
                  <Utensils className="mr-2 h-5 w-5 text-primary" />
                  Browse Restaurants
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="border-2 border-white/50 !text-white bg-white/10 backdrop-blur-sm hover:bg-white/20 font-semibold px-8 py-6 text-lg rounded-full"
                >
                  <Link href="/restaurateur/apply">
                    <ChefHat className="mr-2 h-5 w-5 text-white" />
                    Partner With Us
                  </Link>
                </Button>
              </motion.div>
            </motion.div>

            {/* Stats/Features Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="grid grid-cols-3 gap-4 md:gap-8"
            >
              <div className="text-center">
                <motion.div
                  className="flex items-center justify-center mb-2"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Clock className="h-6 w-6 md:h-8 md:w-8 text-cyan-200" />
                </motion.div>
                <p className="text-white font-bold text-lg md:text-2xl">15-30</p>
                <p className="text-white/70 text-xs md:text-sm">Min Pickup</p>
              </div>
              <div className="text-center">
                <motion.div
                  className="flex items-center justify-center mb-2"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                >
                  <Star className="h-6 w-6 md:h-8 md:w-8 text-cyan-200" />
                </motion.div>
                <p className="text-white font-bold text-lg md:text-2xl">500+</p>
                <p className="text-white/70 text-xs md:text-sm">Happy Customers</p>
              </div>
              <div className="text-center">
                <motion.div
                  className="flex items-center justify-center mb-2"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                >
                  <MapPin className="h-6 w-6 md:h-8 md:w-8 text-cyan-200" />
                </motion.div>
                <p className="text-white font-bold text-lg md:text-2xl">20+</p>
                <p className="text-white/70 text-xs md:text-sm">Cities</p>
              </div>
            </motion.div>
          </div>

          {/* Bottom Gradient Fade */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
        </section>

        {/* Restaurants Section */}
        <div id="restaurants" className="container mx-auto px-4 py-12">
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
              {restaurants.length > 0 ? "Order from Our Restaurants" : "Restaurants Coming Soon"}
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              {restaurants.length > 0
                ? "Browse our selection of amazing restaurants and place your order for pickup"
                : "We're building our restaurant network. Check back soon or apply to join!"
              }
            </p>
          </motion.div>

          {/* Compact Filter Bar */}
          {restaurants.length > 0 && (
            <div className="bg-card border border-border rounded-lg mb-8">
              <div className="px-4 py-3">
                <div className="flex flex-wrap items-center gap-2 md:gap-3">
                  {/* Search - flexible width */}
                  <div className="relative flex-1 min-w-[200px] max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <label htmlFor="restaurant-search" className="sr-only">Search restaurants</label>
                    <input
                      id="restaurant-search"
                      type="text"
                      placeholder="Search restaurants..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground placeholder-muted-foreground"
                    />
                  </div>

                  {/* Cuisine Filter - Inline Pills (Desktop) */}
                  <div className="flex items-center gap-2">
                    <div className="hidden md:flex items-center gap-1.5">
                      <Utensils className="w-3.5 h-3.5 text-muted-foreground" />
                      {availableCuisines.slice(0, 6).map((cuisine) => (
                        <button
                          key={cuisine}
                          type="button"
                          onClick={() => toggleCuisine(cuisine)}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                            selectedCuisines.includes(cuisine)
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                          }`}
                        >
                          {cuisine}
                        </button>
                      ))}
                      {availableCuisines.length > 6 && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="h-7 gap-1 px-2">
                              <span className="text-xs">+{availableCuisines.length - 6}</span>
                              <ChevronDown className="w-3 h-3 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-2" align="start">
                            <div className="flex flex-wrap gap-1.5 max-w-[300px]">
                              {availableCuisines.slice(6).map((cuisine) => (
                                <button
                                  key={cuisine}
                                  type="button"
                                  onClick={() => toggleCuisine(cuisine)}
                                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                                    selectedCuisines.includes(cuisine)
                                      ? "bg-primary text-primary-foreground"
                                      : "bg-muted text-muted-foreground hover:bg-accent"
                                  }`}
                                >
                                  {cuisine}
                                </button>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      )}
                    </div>

                    {/* Cuisine Filter - Mobile Dropdown */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className={`h-9 gap-1 md:hidden ${selectedCuisines.length > 0 ? "border-primary text-primary" : ""}`}
                        >
                          <Utensils className="w-3.5 h-3.5" />
                          {selectedCuisines.length > 0 && (
                            <span className="rounded-full bg-primary text-primary-foreground px-1.5 py-0.5 text-xs font-medium">
                              {selectedCuisines.length}
                            </span>
                          )}
                          <ChevronDown className="w-3.5 h-3.5 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-2" align="start">
                        <div className="flex flex-wrap gap-1.5 max-w-[280px]">
                          {availableCuisines.map((cuisine) => (
                            <button
                              key={cuisine}
                              type="button"
                              onClick={() => toggleCuisine(cuisine)}
                              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                                selectedCuisines.includes(cuisine)
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground hover:bg-accent"
                              }`}
                            >
                              {cuisine}
                            </button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>

                    {/* Divider */}
                    <div className="hidden sm:block w-px h-6 bg-border" />

                    {/* City Filter Dropdown */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className={`h-9 gap-1 ${selectedCity ? "border-primary text-primary" : ""}`}
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline text-xs">{selectedCity || "City"}</span>
                          <ChevronDown className="w-3.5 h-3.5 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-2" align="start">
                        <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                          <button
                            type="button"
                            onClick={() => setSelectedCity("")}
                            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                              !selectedCity
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:bg-accent"
                            }`}
                          >
                            All Cities
                          </button>
                          {cities.map(city => (
                            <button
                              key={city}
                              type="button"
                              onClick={() => setSelectedCity(city)}
                              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                                selectedCity === city
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground hover:bg-accent"
                              }`}
                            >
                              {city}
                            </button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>

                    {/* Sort Dropdown */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="h-9 gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline text-xs">
                            {sortBy === "name" ? "Name" : sortBy === "pickup_time" ? "Fast" : "New"}
                          </span>
                          <ChevronDown className="w-3.5 h-3.5 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-2" align="start">
                        <div className="flex flex-col gap-1">
                          {[
                            { value: "name", label: "Sort by Name" },
                            { value: "pickup_time", label: "Fastest Pickup" },
                            { value: "newest", label: "Newest First" },
                          ].map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => setSortBy(option.value as SortOption)}
                              className={`px-3 py-1.5 rounded-md text-xs font-medium text-left transition-colors ${
                                sortBy === option.value
                                  ? "bg-primary text-primary-foreground"
                                  : "hover:bg-accent"
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>

                    {/* Late Night Filter Toggle */}
                    <Button
                      variant={lateNightOnly ? "default" : "outline"}
                      size="sm"
                      className="h-9 gap-1"
                      onClick={() => setLateNightOnly(!lateNightOnly)}
                      title="Show restaurants open after 2am"
                    >
                      <Moon className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline text-xs">Open Late</span>
                    </Button>

                    {/* Price Range Filter */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className={`h-9 gap-1 ${selectedPriceRange.length > 0 ? "border-primary text-primary" : ""}`}
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                          {selectedPriceRange.length > 0 && (
                            <span className="rounded-full bg-primary text-primary-foreground px-1.5 py-0.5 text-xs font-medium">
                              {selectedPriceRange.length}
                            </span>
                          )}
                          <ChevronDown className="w-3.5 h-3.5 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-2" align="start">
                        <div className="flex flex-wrap gap-1.5">
                          {["$", "$$", "$$$", "$$$$"].map((price) => (
                            <button
                              key={price}
                              type="button"
                              onClick={() => setSelectedPriceRange(prev =>
                                prev.includes(price)
                                  ? prev.filter(p => p !== price)
                                  : [...prev, price]
                              )}
                              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                                selectedPriceRange.includes(price)
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground hover:bg-accent"
                              }`}
                            >
                              {price}
                            </button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>

                    {/* Dress Code Filter */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className={`h-9 gap-1 ${selectedDressCode.length > 0 ? "border-primary text-primary" : ""}`}
                        >
                          <Shirt className="w-3.5 h-3.5" />
                          {selectedDressCode.length > 0 && (
                            <span className="rounded-full bg-primary text-primary-foreground px-1.5 py-0.5 text-xs font-medium">
                              {selectedDressCode.length}
                            </span>
                          )}
                          <ChevronDown className="w-3.5 h-3.5 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-2" align="start">
                        <div className="flex flex-col gap-1">
                          {[
                            { value: "casual", label: "Casual" },
                            { value: "smart-casual", label: "Smart Casual" },
                            { value: "upscale", label: "Upscale" },
                            { value: "stepping-attire", label: "Stepping Attire" },
                          ].map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => setSelectedDressCode(prev =>
                                prev.includes(option.value)
                                  ? prev.filter(d => d !== option.value)
                                  : [...prev, option.value]
                              )}
                              className={`px-3 py-1.5 rounded-md text-xs font-medium text-left transition-colors ${
                                selectedDressCode.includes(option.value)
                                  ? "bg-primary text-primary-foreground"
                                  : "hover:bg-accent"
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>

                    {/* Group Friendly Toggle */}
                    <Button
                      variant={groupFriendlyOnly ? "default" : "outline"}
                      size="sm"
                      className="h-9 gap-1"
                      onClick={() => setGroupFriendlyOnly(!groupFriendlyOnly)}
                      title="Show restaurants good for large groups (8+)"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline text-xs">Groups</span>
                    </Button>

                    {/* Entertainment Toggle */}
                    <Button
                      variant={hasEntertainmentOnly ? "default" : "outline"}
                      size="sm"
                      className="h-9 gap-1"
                      onClick={() => setHasEntertainmentOnly(!hasEntertainmentOnly)}
                      title="Show restaurants with live music or DJ"
                    >
                      <Music className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline text-xs">Music</span>
                    </Button>

                    {/* Divider */}
                    <div className="hidden sm:block w-px h-6 bg-border" />

                    {/* View Toggle */}
                    <ViewToggle view={viewMode} onViewChange={setViewMode} />

                    {/* Clear Filters */}
                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={clearFilters}
                        className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <X className="w-3 h-3" />
                        <span className="hidden sm:inline">Clear</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {filteredRestaurants.length > 0 ? (
            viewMode === "masonry" ? (
              /* Masonry View - 4-column stacked grid with portrait cards */
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                {[0, 1, 2, 3].map((columnIndex) => (
                  <div key={columnIndex} className="grid gap-3 sm:gap-4">
                    {filteredRestaurants
                      .filter((_, index) => index % 4 === columnIndex)
                      .map((restaurant) => (
                        <motion.div
                          key={restaurant._id}
                          whileHover={{ y: -4 }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        >
                          <Link href={`/restaurants/${restaurant.slug}`} className="group block cursor-pointer">
                            <div className="relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all duration-300">
                              {/* Portrait Image */}
                              <div className="relative w-full aspect-[3/4] overflow-hidden rounded-lg">
                                {restaurant.coverImageUrl ? (
                                  <Image
                                    src={restaurant.coverImageUrl}
                                    alt={restaurant.name}
                                    fill
                                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                                    loading="lazy"
                                    placeholder="blur"
                                    blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2UzZTNlMyIvPjwvc3ZnPg=="
                                  />
                                ) : (
                                  <div className="absolute inset-0 bg-gradient-to-br from-primary to-sky-600 flex items-center justify-center">
                                    <Utensils className="h-12 w-12 text-primary-foreground opacity-50" />
                                  </div>
                                )}
                              </div>

                              {/* Gradient overlay for badge visibility */}
                              <div className="absolute inset-0 bg-black/20 pointer-events-none rounded-lg" />

                              {/* Cuisine Badge - Top Left */}
                              {restaurant.cuisine && restaurant.cuisine.length > 0 && (
                                <div className="absolute top-3 left-3">
                                  <span className="px-3 py-1 text-xs font-semibold bg-white/90 backdrop-blur-sm rounded-full shadow-sm text-foreground">
                                    {restaurant.cuisine[0]}
                                  </span>
                                </div>
                              )}

                              {/* Status Badge - Top Right */}
                              <div className="absolute top-3 right-3">
                                {restaurant.acceptingOrders ? (
                                  <div className="flex items-center gap-1 px-2 py-1 bg-success text-white text-xs font-semibold rounded-full shadow-sm">
                                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                    <span>Open</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1 px-2 py-1 bg-muted text-muted-foreground text-xs font-semibold rounded-full shadow-sm">
                                    <span>Closed</span>
                                  </div>
                                )}
                              </div>

                              {/* Pickup Time Badge - Bottom Left */}
                              <div className="absolute bottom-12 left-3">
                                <div className="flex items-center gap-2 px-3 py-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm">
                                  <Clock className="w-4 h-4 text-foreground" />
                                  <span className="text-sm font-semibold text-foreground">
                                    ~{restaurant.estimatedPickupTime || 30} min
                                  </span>
                                </div>
                              </div>

                              {/* Restaurant Name - Bottom */}
                              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                                <h3 className="text-white font-bold text-sm truncate">
                                  {restaurant.name}
                                </h3>
                              </div>
                            </div>
                          </Link>
                        </motion.div>
                      ))}
                  </div>
                ))}
              </div>
            ) : viewMode === "list" ? (
              /* List View - Horizontal cards */
              <div className="space-y-4">
                {filteredRestaurants.map((restaurant) => (
                  <motion.div
                    key={restaurant._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -2 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <Link href={`/restaurants/${restaurant.slug}`} className="group block">
                      <div className="flex gap-4 bg-card rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 p-3">
                        {/* Left: Image */}
                        <div className="relative w-32 h-32 sm:w-40 sm:h-40 flex-shrink-0 rounded-lg overflow-hidden">
                          {restaurant.coverImageUrl ? (
                            <Image
                              src={restaurant.coverImageUrl}
                              alt={restaurant.name}
                              fill
                              sizes="160px"
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary to-sky-600 flex items-center justify-center">
                              <Utensils className="h-8 w-8 text-primary-foreground opacity-50" />
                            </div>
                          )}
                          {/* Status overlay on image */}
                          <div className="absolute top-2 left-2">
                            {restaurant.acceptingOrders ? (
                              <span className="px-2 py-0.5 text-xs font-semibold bg-success text-white rounded-full">
                                Open
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 text-xs font-semibold bg-muted text-muted-foreground rounded-full">
                                Closed
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Right: Content */}
                        <div className="flex-1 flex flex-col justify-center min-w-0">
                          <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1">
                            {restaurant.name}
                          </h3>

                          {restaurant.cuisine && restaurant.cuisine.length > 0 && (
                            <p className="text-sm text-primary mt-1">
                              {restaurant.cuisine.slice(0, 3).join(" • ")}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4 flex-shrink-0" />
                              <span className="truncate">{restaurant.city}, {restaurant.state}</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4 flex-shrink-0" />
                              <span>~{restaurant.estimatedPickupTime || 30} min</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            ) : (
              /* Grid View - 2x3 columns with card details */
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
                {filteredRestaurants.map((restaurant) => (
                  <motion.div
                    key={restaurant._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -8 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <RestaurantCard restaurant={restaurant} />
                  </motion.div>
                ))}
              </div>
            )
          ) : (
            <motion.div
              className="text-center py-16"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-block p-8 bg-accent rounded-3xl">
                {hasActiveFilters ? (
                  <>
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <Search className="h-16 w-16 mx-auto text-primary mb-4" />
                    </motion.div>
                    <h3 className="text-xl font-bold text-foreground mb-2">
                      No Restaurants Found
                    </h3>
                    <p className="text-muted-foreground mb-4 max-w-md">
                      No restaurants match your current filters. Try adjusting your search or filters.
                    </p>
                    <motion.button
                      type="button"
                      onClick={clearFilters}
                      className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-full font-semibold hover:bg-primary/90 transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Clear Filters
                    </motion.button>
                  </>
                ) : (
                  <>
                    <motion.div
                      animate={{ rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <Utensils className="h-16 w-16 mx-auto text-primary mb-4" />
                    </motion.div>
                    <h3 className="text-xl font-bold text-foreground mb-2">
                      No Restaurants Yet
                    </h3>
                    <p className="text-muted-foreground mb-4 max-w-md">
                      We're actively onboarding restaurants. Be the first to join our platform!
                    </p>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Link
                        href="/restaurateur/apply"
                        className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-full font-semibold hover:bg-primary/90 transition-colors"
                      >
                        Apply Now
                      </Link>
                    </motion.div>
                  </>
                )}
              </div>
            </motion.div>
          )}

          {/* CTA Section */}
          <motion.div
            className="mt-16 text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <motion.div
              className="inline-block p-8 bg-accent border border-border rounded-3xl"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Utensils className="h-12 w-12 mx-auto text-primary mb-4" />
              </motion.div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                Own a Restaurant?
              </h3>
              <p className="text-muted-foreground mb-4 max-w-md">
                Join the SteppersLife restaurant network and reach thousands of customers in the stepping community.
              </p>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="/restaurateur/apply"
                  className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-full font-semibold hover:bg-primary/90 transition-colors"
                >
                  Apply to Join
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>
      <PublicFooter />
    </>
  );
}

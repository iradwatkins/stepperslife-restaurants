"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { MapPin, Phone, Clock, Utensils, Plus, Minus, ShoppingCart, CircleDot, Leaf, Wheat, Flame, AlertTriangle, X } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { RestaurantsSubNav } from "@/components/layout/RestaurantsSubNav";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { RestaurantReviews } from "@/components/restaurants/RestaurantReviews";
import { RestaurantImage } from "@/components/restaurants/RestaurantImage";
import { StarRating } from "@/components/restaurants/StarRating";
import { FavoriteButton } from "@/components/restaurants/FavoriteButton";
import { ShareButton } from "@/components/restaurants/ShareButton";
import { useFoodCart } from "@/contexts/FoodCartContext";

export default function RestaurantDetailClient({ slug }: { slug: string }) {
  const router = useRouter();
  const { cart, addToCart: addToFoodCart, removeFromCart, getItemCount, getSubtotal, isCartOpen, setIsCartOpen, pendingCartSwitch, confirmCartSwitch, cancelCartSwitch } = useFoodCart();
  const [showCart, setShowCart] = useState(false);

  // Dietary filter states
  const [showVegetarian, setShowVegetarian] = useState(false);
  const [showVegan, setShowVegan] = useState(false);
  const [showGlutenFree, setShowGlutenFree] = useState(false);

  // Fetch restaurant data
  const restaurant = useQuery(api.restaurants.getBySlug, { slug });

  // Fetch menu data only when we have a valid restaurant
  const menuItems = useQuery(
    api.menuItems.getByRestaurant,
    restaurant ? { restaurantId: restaurant._id } : "skip"
  );
  const categories = useQuery(
    api.menuItems.getCategories,
    restaurant ? { restaurantId: restaurant._id } : "skip"
  );

  // Fetch user and review data
  const currentUser = useQuery(api.users.queries.getCurrentUser);
  const reviewStats = useQuery(
    api.restaurantReviews.getRestaurantStats,
    restaurant ? { restaurantId: restaurant._id } : "skip"
  );
  // Real-time open/closed status based on operating hours
  const isOpen = useQuery(
    api.restaurantHours.isCurrentlyOpen,
    restaurant ? { restaurantId: restaurant._id } : "skip"
  );

  // Loading state
  if (restaurant === undefined) {
    return (
      <>
        <PublicHeader />
        <RestaurantsSubNav />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-64 bg-muted dark:bg-card rounded-lg mb-6" />
            <div className="h-8 w-48 bg-muted dark:bg-card rounded mb-4" />
            <div className="h-4 w-96 bg-muted dark:bg-card rounded" />
          </div>
        </div>
        <PublicFooter />
      </>
    );
  }

  // Not found state
  if (restaurant === null) {
    return (
      <>
        <PublicHeader />
        <RestaurantsSubNav />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold">Restaurant not found</h1>
          <Link href="/restaurants" className="text-primary hover:underline mt-4 inline-block">
            Back to restaurants
          </Link>
        </div>
        <PublicFooter />
      </>
    );
  }

  // Cart helper functions using FoodCartContext
  const addToCart = (item: { _id: string; name: string; price: number }) => {
    if (!restaurant) return;
    addToFoodCart(restaurant._id, slug, restaurant.name, {
      menuItemId: item._id,
      name: item.name,
      price: item.price,
    });
  };

  // Use cart from context, but only show items for this restaurant
  const isThisRestaurant = cart.restaurantId === restaurant?._id;
  const cartItems = isThisRestaurant ? cart.items : [];
  const cartTotal = isThisRestaurant ? getSubtotal() : 0;
  const cartCount = isThisRestaurant ? getItemCount() : 0;

  const handleCheckout = () => {
    // Cart is now stored in context/sessionStorage, no need for URL params
    router.push(`/restaurants/${slug}/checkout`);
  };

  // Filter menu items by dietary preferences
  const hasDietaryFilters = showVegetarian || showVegan || showGlutenFree;
  const filteredMenuItems = menuItems?.filter(item => {
    if (!hasDietaryFilters) return true;
    if (showVegetarian && !item.isVegetarian) return false;
    if (showVegan && !item.isVegan) return false;
    if (showGlutenFree && !item.isGlutenFree) return false;
    return true;
  });

  // Group menu items by category
  const itemsByCategory = filteredMenuItems?.reduce((acc, item) => {
    const catId = (item.categoryId as string) || "uncategorized";
    if (!acc[catId]) acc[catId] = [];
    acc[catId].push(item);
    return acc;
  }, {} as Record<string, typeof filteredMenuItems>);

  // Check if any menu items have dietary tags
  const hasDietaryOptions = menuItems?.some(item => item.isVegetarian || item.isVegan || item.isGlutenFree);

  return (
    <>
      <PublicHeader />
      <RestaurantsSubNav />

      {/* Breadcrumbs */}
      <div className="container mx-auto px-4 pt-4">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Restaurants", href: "/restaurants" },
            { label: restaurant.name },
          ]}
        />
      </div>

      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="relative">
            <RestaurantImage
              src={restaurant.coverImageUrl}
              alt={restaurant.name}
              className="w-full h-64 object-cover rounded-lg"
              iconClassName="h-24 w-24"
            />
          </div>

          <div className="mt-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold">{restaurant.name}</h1>
                  <FavoriteButton
                    restaurantId={restaurant._id}
                    userId={currentUser?._id || null}
                    size="lg"
                  />
                  <ShareButton
                    title={restaurant.name}
                    text={`Check out ${restaurant.name} on SteppersLife! ${restaurant.cuisine?.join(", ") || "Great food"} - Order for pickup today.`}
                    variant="icon"
                    size="lg"
                  />
                </div>
                {/* Rating Display */}
                {reviewStats && reviewStats.totalReviews > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    <StarRating rating={reviewStats.averageRating} size="md" showValue />
                    <span className="text-sm text-muted-foreground dark:text-muted-foreground">
                      ({reviewStats.totalReviews} {reviewStats.totalReviews === 1 ? "review" : "reviews"})
                    </span>
                  </div>
                )}
                {restaurant.cuisine && restaurant.cuisine.length > 0 && (
                  <p className="text-muted-foreground dark:text-muted-foreground mt-1">
                    {restaurant.cuisine.join(" • ")}
                  </p>
                )}
              </div>
              {/* Real-time open/closed status */}
              {isOpen === undefined ? (
                <span className="px-3 py-1 text-sm font-medium bg-muted/50 text-muted-foreground rounded-full animate-pulse">
                  ...
                </span>
              ) : isOpen ? (
                <span className="px-3 py-1 text-sm font-medium bg-success/20 text-success dark:bg-success/20 dark:text-success rounded-full flex items-center gap-1.5">
                  <CircleDot className="h-3.5 w-3.5 animate-pulse" />
                  Open Now
                </span>
              ) : (
                <span className="px-3 py-1 text-sm font-medium bg-destructive/20 text-destructive dark:bg-destructive/20 dark:text-destructive rounded-full">
                  Closed
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground dark:text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {restaurant.address}, {restaurant.city}, {restaurant.state} {restaurant.zipCode}
              </span>
              <span className="flex items-center gap-1">
                <Phone className="h-4 w-4" />
                {restaurant.phone}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                ~{restaurant.estimatedPickupTime} min pickup
              </span>
            </div>

            {restaurant.description && (
              <p className="mt-4 text-foreground dark:text-muted-foreground">{restaurant.description}</p>
            )}

            {/* Stepper Info Section */}
            {(restaurant.vibeTags?.length || restaurant.dressCode || restaurant.priceRange || restaurant.groupInfo || restaurant.entertainment) && (
              <div className="mt-6 p-4 bg-card dark:bg-card rounded-lg">
                <h3 className="font-semibold mb-4 text-foreground">Stepper Info</h3>

                {/* Vibe Tags */}
                {restaurant.vibeTags && restaurant.vibeTags.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground mb-2">Vibe</p>
                    <div className="flex flex-wrap gap-2">
                      {restaurant.vibeTags.map((tag: string) => (
                        <span key={tag} className="px-3 py-1 text-sm bg-primary/10 text-primary rounded-full capitalize">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Info Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Price Range */}
                  {restaurant.priceRange && (
                    <div>
                      <p className="text-sm text-muted-foreground">Price</p>
                      <p className="font-medium text-green-600 dark:text-green-400">{restaurant.priceRange}</p>
                    </div>
                  )}

                  {/* Dress Code */}
                  {restaurant.dressCode && (
                    <div>
                      <p className="text-sm text-muted-foreground">Dress Code</p>
                      <p className="font-medium capitalize">{restaurant.dressCode.replace("-", " ")}</p>
                    </div>
                  )}

                  {/* Group Size */}
                  {restaurant.groupInfo?.maxPartySize && (
                    <div>
                      <p className="text-sm text-muted-foreground">Max Party Size</p>
                      <p className="font-medium">{restaurant.groupInfo.maxPartySize} guests</p>
                    </div>
                  )}

                  {/* Private Room */}
                  {restaurant.groupInfo?.privateRoomAvailable && (
                    <div>
                      <p className="text-sm text-muted-foreground">Private Room</p>
                      <p className="font-medium text-teal-600 dark:text-teal-400">Available</p>
                    </div>
                  )}
                </div>

                {/* Entertainment */}
                {restaurant.entertainment && (restaurant.entertainment.hasLiveMusic || restaurant.entertainment.hasDJ) && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground mb-2">Entertainment</p>
                    <div className="flex flex-wrap gap-2">
                      {restaurant.entertainment.hasLiveMusic && (
                        <span className="px-3 py-1 text-sm bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300 rounded-full">
                          🎵 Live Music
                        </span>
                      )}
                      {restaurant.entertainment.hasDJ && (
                        <span className="px-3 py-1 text-sm bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 rounded-full">
                          🎧 DJ
                        </span>
                      )}
                      {restaurant.entertainment.musicGenres?.map((genre: string) => (
                        <span key={genre} className="px-3 py-1 text-sm bg-muted text-muted-foreground rounded-full capitalize">
                          {genre}
                        </span>
                      ))}
                    </div>
                    {restaurant.entertainment.entertainmentNights && restaurant.entertainment.entertainmentNights.length > 0 && (
                      <p className="text-sm text-muted-foreground mt-2">
                        On {restaurant.entertainment.entertainmentNights.map((night: string) => night.charAt(0).toUpperCase() + night.slice(1)).join(", ")}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Operating Hours */}
            {restaurant.operatingHours && (
              <div className="mt-6 p-4 bg-card dark:bg-card rounded-lg">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Operating Hours
                </h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((day) => {
                    const hours = (restaurant.operatingHours as Record<string, { open: string; close: string; closed: boolean }>)?.[day];
                    const isToday = new Date().toLocaleDateString("en-US", { weekday: "long" }).toLowerCase() === day;
                    return (
                      <div key={day} className={`flex justify-between ${isToday ? "font-semibold text-primary" : ""}`}>
                        <span className="capitalize">{day}</span>
                        <span>
                          {hours?.closed ? "Closed" : hours ? `${hours.open} - ${hours.close}` : "Not set"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Menu */}
          <div className="mt-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <h2 className="text-2xl font-bold">Menu</h2>

              {/* Dietary Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground mr-1">Filter:</span>
                <button
                  type="button"
                  onClick={() => setShowVegetarian(!showVegetarian)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    showVegetarian
                      ? "bg-green-600 text-white"
                      : "bg-muted text-muted-foreground hover:bg-accent"
                  }`}
                >
                  <Leaf className="w-3.5 h-3.5" />
                  Vegetarian
                </button>
                <button
                  type="button"
                  onClick={() => setShowVegan(!showVegan)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    showVegan
                      ? "bg-emerald-600 text-white"
                      : "bg-muted text-muted-foreground hover:bg-accent"
                  }`}
                >
                  <Leaf className="w-3.5 h-3.5" />
                  Vegan
                </button>
                <button
                  type="button"
                  onClick={() => setShowGlutenFree(!showGlutenFree)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    showGlutenFree
                      ? "bg-amber-600 text-white"
                      : "bg-muted text-muted-foreground hover:bg-accent"
                  }`}
                >
                  <Wheat className="w-3.5 h-3.5" />
                  Gluten-Free
                </button>
                {hasDietaryFilters && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowVegetarian(false);
                      setShowVegan(false);
                      setShowGlutenFree(false);
                    }}
                    className="text-sm text-muted-foreground hover:text-foreground underline ml-1"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {menuItems === undefined ? (
              <div className="animate-pulse space-y-4">
                <div className="h-20 bg-muted dark:bg-card rounded-lg" />
                <div className="h-20 bg-muted dark:bg-card rounded-lg" />
                <div className="h-20 bg-muted dark:bg-card rounded-lg" />
              </div>
            ) : !menuItems || menuItems.length === 0 ? (
              <div className="text-center py-12 bg-card dark:bg-card rounded-lg">
                <p className="text-muted-foreground">No menu items available yet</p>
              </div>
            ) : hasDietaryFilters && (!filteredMenuItems || filteredMenuItems.length === 0) ? (
              <div className="text-center py-12 bg-card dark:bg-card rounded-lg">
                <Leaf className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No items match your dietary filters</p>
                <button
                  type="button"
                  onClick={() => {
                    setShowVegetarian(false);
                    setShowVegan(false);
                    setShowGlutenFree(false);
                  }}
                  className="mt-3 text-primary hover:underline text-sm"
                >
                  Clear filters to see all items
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                {categories?.map((category) => (
                  <div key={category._id}>
                    <h3 className="text-xl font-semibold mb-4">{category.name}</h3>
                    <div className="grid gap-4">
                      {itemsByCategory?.[category._id]?.filter(item => item.isAvailable).map((item) => (
                        <div
                          key={item._id}
                          className="flex items-center gap-4 p-4 bg-white dark:bg-card rounded-lg shadow"
                        >
                          {/* Menu Item Image */}
                          {item.imageUrl ? (
                            <div className="relative w-24 h-24 flex-shrink-0">
                              <Image
                                src={item.imageUrl}
                                alt={item.name}
                                fill
                                sizes="96px"
                                className="object-cover rounded-lg"
                              />
                            </div>
                          ) : (
                            <div className="w-24 h-24 bg-muted dark:bg-card rounded-lg flex-shrink-0 flex items-center justify-center">
                              <Utensils className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium">{item.name}</h4>
                            {item.description && (
                              <p className="text-sm text-muted-foreground dark:text-muted-foreground mt-1 line-clamp-2">
                                {item.description}
                              </p>
                            )}
                            <p className="text-primary font-semibold mt-2">
                              ${(item.price / 100).toFixed(2)}
                            </p>
                            {/* Dietary badges */}
                            {(item.isVegetarian || item.isVegan || item.isGlutenFree || item.isSpicy) && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {item.isVegan && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs rounded-full">
                                    <Leaf className="h-3 w-3" />
                                    Vegan
                                  </span>
                                )}
                                {item.isVegetarian && !item.isVegan && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">
                                    <Leaf className="h-3 w-3" />
                                    Vegetarian
                                  </span>
                                )}
                                {item.isGlutenFree && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs rounded-full">
                                    <Wheat className="h-3 w-3" />
                                    GF
                                  </span>
                                )}
                                {item.isSpicy && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs rounded-full">
                                    <Flame className="h-3 w-3" />
                                    Spicy
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          {restaurant.acceptingOrders && (
                            <button
                              type="button"
                              onClick={() => addToCart(item)}
                              className="p-3 min-w-[44px] min-h-[44px] bg-primary text-white rounded-full hover:bg-primary/90 flex items-center justify-center flex-shrink-0"
                              aria-label={`Add ${item.name} to cart`}
                            >
                              <Plus className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Uncategorized items */}
                {(itemsByCategory?.["uncategorized"]?.length ?? 0) > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Other Items</h3>
                    <div className="grid gap-4">
                      {itemsByCategory?.["uncategorized"]?.filter(item => item.isAvailable).map((item) => (
                        <div
                          key={item._id}
                          className="flex items-center gap-4 p-4 bg-white dark:bg-card rounded-lg shadow"
                        >
                          {/* Menu Item Image */}
                          {item.imageUrl ? (
                            <div className="relative w-24 h-24 flex-shrink-0">
                              <Image
                                src={item.imageUrl}
                                alt={item.name}
                                fill
                                sizes="96px"
                                className="object-cover rounded-lg"
                              />
                            </div>
                          ) : (
                            <div className="w-24 h-24 bg-muted dark:bg-card rounded-lg flex-shrink-0 flex items-center justify-center">
                              <Utensils className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium">{item.name}</h4>
                            {item.description && (
                              <p className="text-sm text-muted-foreground dark:text-muted-foreground mt-1 line-clamp-2">
                                {item.description}
                              </p>
                            )}
                            <p className="text-primary font-semibold mt-2">
                              ${(item.price / 100).toFixed(2)}
                            </p>
                            {/* Dietary badges */}
                            {(item.isVegetarian || item.isVegan || item.isGlutenFree || item.isSpicy) && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {item.isVegan && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs rounded-full">
                                    <Leaf className="h-3 w-3" />
                                    Vegan
                                  </span>
                                )}
                                {item.isVegetarian && !item.isVegan && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">
                                    <Leaf className="h-3 w-3" />
                                    Vegetarian
                                  </span>
                                )}
                                {item.isGlutenFree && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs rounded-full">
                                    <Wheat className="h-3 w-3" />
                                    GF
                                  </span>
                                )}
                                {item.isSpicy && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs rounded-full">
                                    <Flame className="h-3 w-3" />
                                    Spicy
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          {restaurant.acceptingOrders && (
                            <button
                              type="button"
                              onClick={() => addToCart(item)}
                              className="p-3 min-w-[44px] min-h-[44px] bg-primary text-white rounded-full hover:bg-primary/90 flex items-center justify-center flex-shrink-0"
                              aria-label={`Add ${item.name} to cart`}
                            >
                              <Plus className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Reviews Section */}
          <div className="mt-12 pt-8 border-t border-border">
            <h2 className="text-2xl font-bold mb-6">Reviews & Ratings</h2>
            <RestaurantReviews
              restaurantId={restaurant._id}
              userId={currentUser?._id || null}
            />
          </div>
        </div>

        {/* Floating Cart Button */}
        {cartCount > 0 && (
          <button
            type="button"
            onClick={() => setShowCart(true)}
            className="fixed bottom-6 right-6 flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-full shadow-lg hover:bg-primary/90 transition-colors"
          >
            <ShoppingCart className="h-5 w-5" />
            <span className="font-medium">View Cart ({cartCount})</span>
            <span className="font-bold">${(cartTotal / 100).toFixed(2)}</span>
          </button>
        )}

        {/* Cart Sidebar */}
        {showCart && (
          <div
            className="fixed inset-0 z-50 flex justify-end"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-title"
          >
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setShowCart(false)}
              aria-label="Close cart"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setShowCart(false)}
            />
            <div className="relative w-full max-w-md bg-white dark:bg-background h-full overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 id="cart-title" className="text-xl font-bold">Your Order</h2>
                  <button
                    type="button"
                    onClick={() => setShowCart(false)}
                    className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground dark:hover:text-muted-foreground rounded-lg hover:bg-muted dark:hover:bg-accent"
                    aria-label="Close cart"
                  >
                    <span className="text-xl">✕</span>
                  </button>
                </div>

                {cartItems.length === 0 ? (
                  <p className="text-muted-foreground">Your cart is empty</p>
                ) : (
                  <>
                    <div className="space-y-4">
                      {cartItems.map((item) => (
                        <div key={item.menuItemId} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-muted-foreground">
                              ${(item.price / 100).toFixed(2)} each
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => removeFromCart(item.menuItemId)}
                              className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center bg-muted dark:bg-card rounded-lg hover:bg-muted dark:hover:bg-muted"
                              aria-label={`Remove one ${item.name} from cart`}
                            >
                              <Minus className="h-5 w-5" />
                            </button>
                            <span className="w-8 text-center" aria-label={`${item.quantity} ${item.name} in cart`}>{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => addToCart({ _id: item.menuItemId, name: item.name, price: item.price })}
                              className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center bg-muted dark:bg-card rounded-lg hover:bg-muted dark:hover:bg-muted"
                              aria-label={`Add one more ${item.name} to cart`}
                            >
                              <Plus className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t mt-6 pt-6">
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total</span>
                        <span>${(cartTotal / 100).toFixed(2)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleCheckout}
                        className="w-full mt-4 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 min-h-[44px]"
                      >
                        Proceed to Checkout
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Cart Replacement Confirmation Dialog */}
        {pendingCartSwitch && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-background rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">Start a new order?</h3>
                  <p className="text-muted-foreground text-sm">
                    You have items from <strong>{cart.restaurantName}</strong> in your cart.
                    Adding items from <strong>{pendingCartSwitch.restaurantName}</strong> will replace your current cart.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={cancelCartSwitch}
                  className="flex-shrink-0 p-1 rounded-full hover:bg-muted"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={cancelCartSwitch}
                  className="flex-1 py-2.5 px-4 rounded-lg border border-border hover:bg-muted transition-colors font-medium"
                >
                  Keep Current Cart
                </button>
                <button
                  type="button"
                  onClick={confirmCartSwitch}
                  className="flex-1 py-2.5 px-4 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors font-medium"
                >
                  Start New Order
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <PublicFooter />
    </>
  );
}

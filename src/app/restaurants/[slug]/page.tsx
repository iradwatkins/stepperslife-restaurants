import { Metadata } from "next";
import { notFound } from "next/navigation";
import RestaurantDetailClient from "./RestaurantDetailClient";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Fetch restaurant data directly from Convex HTTP API for metadata
async function getRestaurantData(slug: string) {
  try {
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      throw new Error("NEXT_PUBLIC_CONVEX_URL is not defined");
    }

    const response = await fetch(`${convexUrl}/api/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        path: "restaurants:getBySlug",
        args: { slug },
        format: "json",
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.value;
  } catch (error) {
    console.error("Error fetching restaurant data:", error);
    return null;
  }
}

// Generate JSON-LD structured data for Restaurant schema
function generateRestaurantJsonLd(restaurant: {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  cuisine?: string[];
  city: string;
  state: string;
  address?: string;
  phone?: string;
  coverImageUrl?: string;
  estimatedPickupTime?: number;
  acceptingOrders: boolean;
  isOpenLateNight?: boolean;
}) {
  const baseUrl = "https://stepperslife.com";
  const restaurantUrl = `${baseUrl}/restaurants/${restaurant.slug}`;

  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: restaurant.name,
    description: restaurant.description,
    url: restaurantUrl,
    image: restaurant.coverImageUrl,
    address: {
      "@type": "PostalAddress",
      streetAddress: restaurant.address,
      addressLocality: restaurant.city,
      addressRegion: restaurant.state,
      addressCountry: "US",
    },
    telephone: restaurant.phone,
    servesCuisine: restaurant.cuisine,
    acceptsReservations: false,
    hasMenu: restaurantUrl,
    potentialAction: {
      "@type": "OrderAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: restaurantUrl,
        actionPlatform: [
          "http://schema.org/DesktopWebPlatform",
          "http://schema.org/MobileWebPlatform",
        ],
      },
      deliveryMethod: ["http://purl.org/goodrelations/v1#DeliveryModePickUp"],
    },
  };
}

// Generate BreadcrumbList JSON-LD for navigation structure
function generateBreadcrumbJsonLd(restaurant: { name: string; slug: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://stepperslife.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Restaurants",
        item: "https://stepperslife.com/restaurants",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: restaurant.name,
        item: `https://stepperslife.com/restaurants/${restaurant.slug}`,
      },
    ],
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  if (!slug) {
    return {
      title: "Restaurant | SteppersLife Restaurants",
      description: "Order food for pickup from local restaurants on SteppersLife.",
    };
  }

  const restaurant = await getRestaurantData(slug);

  if (!restaurant) {
    return {
      title: "Restaurant Not Found | SteppersLife Restaurants",
      description: "This restaurant doesn't exist or is no longer available.",
    };
  }

  // Build description from available data
  const cuisineText = restaurant.cuisine?.length > 0
    ? restaurant.cuisine.slice(0, 3).join(", ")
    : "Food";
  const description = `Order ${cuisineText} from ${restaurant.name} in ${restaurant.city}, ${restaurant.state}. Order online for pickup on SteppersLife.`;

  const restaurantUrl = `https://stepperslife.com/restaurants/${restaurant.slug}`;
  const imageUrl = restaurant.coverImageUrl || "https://stepperslife.com/og-default.png";

  return {
    title: `${restaurant.name} | SteppersLife Restaurants`,
    description: description,

    // Open Graph metadata for Facebook, LinkedIn, etc.
    openGraph: {
      type: "website",
      url: restaurantUrl,
      title: `${restaurant.name} - Order Food for Pickup`,
      description: description,
      siteName: "SteppersLife Restaurants",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: restaurant.name,
        },
      ],
      locale: "en_US",
    },

    // Twitter Card metadata
    twitter: {
      card: "summary_large_image",
      title: `${restaurant.name} | SteppersLife Restaurants`,
      description: description,
      images: [imageUrl],
      creator: "@SteppersLife",
      site: "@SteppersLife",
    },

    // Keywords for SEO
    keywords: [
      restaurant.name,
      ...(restaurant.cuisine || []),
      restaurant.city,
      restaurant.state,
      "food pickup",
      "order online",
      "steppers",
    ],

    // Canonical URL
    alternates: {
      canonical: restaurantUrl,
    },
  };
}

export default async function RestaurantPage({ params }: PageProps) {
  const { slug } = await params;

  // Check if restaurant exists - if not, return 404
  const restaurant = await getRestaurantData(slug);
  if (!restaurant) {
    notFound();
  }

  // Generate JSON-LD structured data for SEO
  const restaurantJsonLd = generateRestaurantJsonLd(restaurant);
  const breadcrumbJsonLd = generateBreadcrumbJsonLd(restaurant);

  return (
    <>
      {/* JSON-LD structured data for search engine rich snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(restaurantJsonLd) }}
      />
      {/* Breadcrumb JSON-LD for navigation structure */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <RestaurantDetailClient slug={slug} />
    </>
  );
}

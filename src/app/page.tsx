import { Suspense } from "react";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { RestaurantsShowcase } from "@/components/home/RestaurantsShowcase";
import { UtensilsCrossed, MapPin, ArrowRight } from "lucide-react";
import Link from "next/link";

// Force dynamic rendering - always fetch fresh data
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Server Component - Restaurants Homepage
export default async function HomePage() {
  return (
    <>
      <PublicHeader />
      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-primary/10 via-background to-orange-500/10 py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
                <UtensilsCrossed className="w-5 h-5" />
                <span className="font-medium">SteppersLife Restaurants</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                Order from Local Restaurants
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Discover amazing local restaurants and order delicious food for pickup. Support Chicago's best dining spots.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/restaurants"
                  className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                >
                  <UtensilsCrossed className="w-5 h-5" />
                  Browse Restaurants
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/restaurants?cuisine=all"
                  className="inline-flex items-center justify-center gap-2 bg-secondary text-secondary-foreground px-8 py-4 rounded-lg font-semibold hover:bg-secondary/90 transition-colors"
                >
                  <MapPin className="w-5 h-5" />
                  Near Me
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Restaurants */}
        <Suspense fallback={<SectionSkeleton title="Featured Restaurants" />}>
          <RestaurantsShowcase />
        </Suspense>

        {/* CTA Section */}
        <section className="bg-muted/50 py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Own a Restaurant?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Partner with SteppersLife to reach more customers. Easy online ordering, pickup management, and a community that loves local food.
            </p>
            <Link
              href="/restaurateur/apply"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              Become a Partner
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}

// Loading skeleton for sections
function SectionSkeleton({ title }: { title: string }) {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <div className="h-8 w-48 bg-muted rounded animate-pulse mb-2"></div>
          <div className="h-4 w-64 bg-muted rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-72 bg-muted rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";
import { ChefHat, Users, TrendingUp, CreditCard, Clock, CheckCircle, Plus } from "lucide-react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { RestaurantsSubNav } from "@/components/layout/RestaurantsSubNav";
import { PublicFooter } from "@/components/layout/PublicFooter";

export default function RestaurateurClient() {
  const benefits = [
    {
      icon: Users,
      title: "Reach New Customers",
      description: "Connect with thousands of active members in the stepping community who love great food.",
    },
    {
      icon: TrendingUp,
      title: "Grow Your Business",
      description: "Increase your revenue with online orders and pickup scheduling.",
    },
    {
      icon: CreditCard,
      title: "Easy Payments",
      description: "Secure payment processing with fast payouts to your account.",
    },
    {
      icon: Clock,
      title: "Save Time",
      description: "Streamlined order management lets you focus on cooking great food.",
    },
  ];

  const steps = [
    { step: 1, title: "Apply Online", description: "Fill out our simple application form" },
    { step: 2, title: "Get Approved", description: "We review your application within 48 hours" },
    { step: 3, title: "Set Up Menu", description: "Add your menu items and set your hours" },
    { step: 4, title: "Start Earning", description: "Begin receiving orders from hungry customers" },
  ];

  return (
    <>
      <PublicHeader />
      <RestaurantsSubNav />
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-sky-600 to-primary">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1600&q=80')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }} />
          </div>
          <div className="relative container mx-auto px-4 py-20 md:py-28">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-medium mb-6">
                <ChefHat className="h-4 w-4" />
                Restaurant Partner Program
              </span>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Grow Your Restaurant with SteppersLife
              </h1>
              <p className="text-xl text-white/90 mb-8">
                Join our restaurant network and reach thousands of customers in the stepping community.
                No monthly fees, just a small commission on orders.
              </p>
              <Link
                href="/restaurateur/apply"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary rounded-full font-semibold text-lg hover:bg-primary/5 transition-colors shadow-lg"
              >
                <Plus className="h-5 w-5" />
                Add Your Restaurant
              </Link>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Why Partner With Us?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We make it easy for restaurants to connect with the stepping community
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <div
                  key={index}
                  className="text-center p-6 bg-card rounded-2xl shadow-lg border border-border"
                >
                  <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 dark:bg-primary/20 rounded-full mb-4">
                    <Icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{benefit.title}</h3>
                  <p className="text-muted-foreground text-sm">{benefit.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-muted/50 py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">How It Works</h2>
              <p className="text-muted-foreground">Get started in four simple steps</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {steps.map((item) => (
                <div key={item.step} className="relative">
                  <div className="bg-card p-6 rounded-2xl shadow-md border border-border h-full">
                    <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold mb-4">
                      {item.step}
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                    <p className="text-muted-foreground text-sm">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="container mx-auto px-4 py-16">
          <div className="bg-gradient-to-br from-sky-600 to-primary rounded-3xl p-8 md:p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Grow Your Business?
            </h2>
            <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
              Join our restaurant network today and start reaching thousands of new customers
              in the stepping community.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/restaurateur/apply"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-primary rounded-full font-semibold hover:bg-primary/5 transition-colors"
              >
                <Plus className="h-5 w-5" />
                Add Your Restaurant
              </Link>
              <Link
                href="/restaurants"
                className="inline-flex items-center justify-center px-8 py-4 bg-white/10 text-white border border-white/30 rounded-full font-semibold hover:bg-white/20 transition-colors"
              >
                Browse Restaurants
              </Link>
            </div>
          </div>
        </div>
      </div>
      <PublicFooter />
    </>
  );
}

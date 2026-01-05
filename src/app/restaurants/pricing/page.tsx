"use client";

import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { RestaurantsSubNav } from "@/components/layout/RestaurantsSubNav";
import { Check, Utensils, TrendingUp, Headphones, Zap, ToggleLeft, ToggleRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

// Option A: Low Flat Percentage Model
const optionATiers = [
  {
    name: "Starter",
    price: 0,
    period: "forever",
    description: "Perfect for getting started with online ordering",
    transactionFee: "10%",
    customerFee: null,
    features: [
      "Up to 10 menu listings",
      "Basic order management",
      "Basic analytics dashboard",
      "Email order notifications",
      "Standard customer support",
      "Mobile-friendly menu page",
    ],
    cta: "Get Started Free",
  },
  {
    name: "Growth",
    price: 19,
    period: "month",
    description: "For growing restaurants ready to scale",
    transactionFee: "6%",
    customerFee: null,
    features: [
      "Up to 100 menu listings",
      "Advanced analytics & reports",
      "Customer reviews & ratings",
      "Menu categories & organization",
      "Custom pickup time slots",
      "Priority email support",
      "Order history & insights",
      "Promotional tools",
    ],
    highlighted: true,
    cta: "Start 14-Day Trial",
  },
  {
    name: "Professional",
    price: 49,
    period: "month",
    description: "For established restaurants with high volume",
    transactionFee: "4%",
    customerFee: null,
    features: [
      "Unlimited menu listings",
      "Real-time analytics dashboard",
      "Priority customer support",
      "Custom branding options",
      "Advanced promotional tools",
      "Multi-location support",
      "API access",
      "Dedicated account manager",
      "Custom integrations",
      "Early access to new features",
    ],
    cta: "Contact Sales",
  },
];

// Option B: Subscription Plans with Menu Limits
const optionBTiers = [
  {
    name: "Starter",
    price: 0,
    period: "forever",
    description: "Perfect for getting started with online ordering",
    transactionFee: "10%",
    customerFee: "$0.99",
    features: [
      "Up to 10 menu listings",
      "Up to 3 menu categories",
      "Basic order management",
      "Basic analytics dashboard",
      "Email order notifications",
      "Mobile-friendly menu page",
      "Standard customer support",
    ],
    cta: "Get Started Free",
  },
  {
    name: "Growth",
    price: 19,
    period: "month",
    description: "For growing restaurants ready to scale",
    transactionFee: "6%",
    customerFee: "$0.99",
    features: [
      "Up to 100 menu listings",
      "Up to 20 menu categories",
      "Advanced analytics & reports",
      "Customer reviews & ratings",
      "Custom pickup time slots",
      "Priority email support",
      "Promotional tools",
      "Order history & insights",
    ],
    highlighted: true,
    cta: "Start Growing",
  },
  {
    name: "Professional",
    price: 49,
    period: "month",
    description: "For established restaurants with high volume",
    transactionFee: "4%",
    customerFee: "$0.99",
    features: [
      "Unlimited menu listings",
      "Unlimited menu categories",
      "Real-time analytics dashboard",
      "Priority customer support",
      "Custom branding options",
      "Advanced promotional tools",
      "Multi-location support",
      "API access",
      "Dedicated account manager",
    ],
    cta: "Go Professional",
  },
];

export default function RestaurantPricingPage() {
  const [pricingModel, setPricingModel] = useState<"A" | "B">("B");
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("monthly");
  const annualDiscount = 0.2; // 20% discount for annual

  const tiers = pricingModel === "A" ? optionATiers : optionBTiers;

  const getPrice = (tier: typeof optionATiers[0] | typeof optionBTiers[0]) => {
    if (tier.price === 0) return 0;
    if (billingPeriod === "annual") {
      return Math.round(tier.price * (1 - annualDiscount));
    }
    return tier.price;
  };

  return (
    <>
      <PublicHeader />
      <RestaurantsSubNav />
      <div className="min-h-screen bg-gradient-to-b from-sky-50 to-background dark:from-sky-950/20 dark:to-background">
        {/* Hero Section */}
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 dark:bg-primary/20 rounded-full text-primary dark:text-primary text-sm font-medium mb-6">
            <Utensils className="w-4 h-4" />
            Restaurant Partner Pricing
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Choose the pricing model that works best for your restaurant.
            No hidden fees, cancel anytime.
          </p>

          {/* Pricing Model Toggle */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-card rounded-2xl p-6 border border-border shadow-lg">
              <p className="text-sm font-medium text-muted-foreground mb-4">Choose your pricing model:</p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setPricingModel("A")}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    pricingModel === "A"
                      ? "border-primary bg-primary/5 dark:bg-primary/20"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {pricingModel === "A" ? (
                      <ToggleRight className="w-5 h-5 text-primary" />
                    ) : (
                      <ToggleLeft className="w-5 h-5 text-muted-foreground" />
                    )}
                    <span className="font-semibold text-foreground">Option A</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Tiered monthly plans with decreasing transaction fees
                  </p>
                  <p className="text-xs text-primary dark:text-primary mt-2 font-medium">
                    Best for: Restaurants wanting predictable costs
                  </p>
                </button>

                <button
                  onClick={() => setPricingModel("B")}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    pricingModel === "B"
                      ? "border-primary bg-primary/5 dark:bg-primary/20"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {pricingModel === "B" ? (
                      <ToggleRight className="w-5 h-5 text-primary" />
                    ) : (
                      <ToggleLeft className="w-5 h-5 text-muted-foreground" />
                    )}
                    <span className="font-semibold text-foreground">Option B</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Low fees + small customer service charge per order
                  </p>
                  <p className="text-xs text-primary dark:text-primary mt-2 font-medium">
                    Best for: High-volume restaurants
                  </p>
                </button>
              </div>
            </div>
          </div>

          {/* Billing Toggle (for paid plans) */}
          {pricingModel === "A" && (
            <div className="inline-flex items-center gap-4 p-1 bg-muted rounded-full mb-12">
              <button
                onClick={() => setBillingPeriod("monthly")}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                  billingPeriod === "monthly"
                    ? "bg-white dark:bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingPeriod("annual")}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                  billingPeriod === "annual"
                    ? "bg-white dark:bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Annual
                <span className="text-xs bg-success/20 dark:bg-success/30 text-success dark:text-success px-2 py-0.5 rounded-full">
                  Save 20%
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="container mx-auto px-4 pb-16">
          <div className={`grid gap-8 max-w-6xl mx-auto ${
            pricingModel === "A" ? "md:grid-cols-3" : "md:grid-cols-2 max-w-4xl"
          }`}>
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`relative bg-card rounded-2xl shadow-lg overflow-hidden transition-transform hover:scale-105 ${
                  tier.highlighted
                    ? "ring-2 ring-primary dark:ring-primary"
                    : "border border-border"
                }`}
              >
                {tier.highlighted && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-primary to-sky-500 text-white text-center text-sm font-medium py-2">
                    {pricingModel === "A" ? "Most Popular" : "Best Value"}
                  </div>
                )}

                <div className={`p-8 ${tier.highlighted ? "pt-14" : ""}`}>
                  {/* Tier Name */}
                  <h3 className="text-2xl font-bold text-foreground mb-2">{tier.name}</h3>
                  <p className="text-muted-foreground text-sm mb-6">{tier.description}</p>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-foreground">
                        ${getPrice(tier)}
                      </span>
                      {tier.price > 0 && (
                        <span className="text-muted-foreground">
                          /{pricingModel === "A" && billingPeriod === "annual" ? "mo" : tier.period}
                        </span>
                      )}
                    </div>
                    {tier.price > 0 && pricingModel === "A" && billingPeriod === "annual" && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Billed annually (${getPrice(tier) * 12}/year)
                      </p>
                    )}
                    {tier.price === 0 && (
                      <p className="text-sm text-success dark:text-success mt-1">
                        {pricingModel === "B" ? "No monthly fee" : "Free forever"}
                      </p>
                    )}
                  </div>

                  {/* Fee Badges */}
                  <div className="space-y-2 mb-6">
                    <div className="inline-flex items-center gap-2 px-3 py-2 bg-primary/5 dark:bg-primary/20 rounded-lg w-full">
                      <TrendingUp className="w-4 h-4 text-primary dark:text-primary" />
                      <span className="text-sm font-medium text-primary dark:text-primary">
                        {tier.transactionFee} transaction fee
                      </span>
                    </div>
                    {tier.customerFee && (
                      <div className="inline-flex items-center gap-2 px-3 py-2 bg-info/10 dark:bg-primary/20 rounded-lg w-full">
                        <Utensils className="w-4 h-4 text-primary dark:text-primary" />
                        <span className="text-sm font-medium text-info dark:text-primary">
                          {tier.customerFee} customer service fee per order
                        </span>
                      </div>
                    )}
                  </div>

                  {/* CTA Button */}
                  <Link
                    href={tier.cta === "Contact Sales" ? "/contact" : `/restaurateur/apply?plan=${tier.name.toLowerCase()}`}
                    className={`block w-full py-3 px-6 rounded-lg font-semibold text-center transition-colors mb-8 ${
                      tier.highlighted
                        ? "bg-gradient-to-r from-primary to-sky-500 text-white hover:from-primary/90 hover:to-sky-600"
                        : "bg-muted text-foreground hover:bg-muted/80"
                    }`}
                  >
                    {tier.cta}
                  </Link>

                  {/* Features */}
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-foreground">What's included:</p>
                    {tier.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Transaction Fee Comparison */}
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto bg-card rounded-2xl shadow-lg p-8 border border-border">
            <h2 className="text-2xl font-bold text-foreground mb-6 text-center">
              Cost Comparison Calculator
            </h2>
            <p className="text-muted-foreground text-center mb-8">
              See your total costs based on monthly order volume
            </p>

            {pricingModel === "A" ? (
              <>
                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                  {[
                    { orders: "$1,000", starter: "$100", growth: "$79", pro: "$89" },
                    { orders: "$3,000", starter: "$300", growth: "$199", pro: "$169" },
                    { orders: "$5,000", starter: "$500", growth: "$319", pro: "$249" },
                    { orders: "$10,000", starter: "$1,000", growth: "$619", pro: "$449" },
                  ].map((row, idx) => (
                    <div key={idx} className="border border-border rounded-lg p-4">
                      <p className="font-semibold text-foreground text-center mb-3">
                        Monthly Orders: {row.orders}
                      </p>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center py-2 border-b border-border/50">
                          <span className="text-sm text-muted-foreground">Starter (10%)</span>
                          <span className="text-sm text-foreground">{row.starter}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-border/50 bg-primary/5 dark:bg-primary/10 -mx-4 px-4">
                          <span className="text-sm font-medium text-primary">Growth (6%)</span>
                          <span className="text-sm font-medium text-primary">{row.growth}</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span className="text-sm text-muted-foreground">Pro (4%)</span>
                          <span className="text-sm text-foreground">{row.pro}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-4 px-4 font-semibold text-foreground">
                          Monthly Orders
                        </th>
                        <th className="text-center py-4 px-4 font-semibold text-foreground">
                          Starter (10%)
                        </th>
                        <th className="text-center py-4 px-4 font-semibold text-primary">
                          Growth (6% + $19)
                        </th>
                        <th className="text-center py-4 px-4 font-semibold text-foreground">
                          Pro (4% + $49)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { orders: "$1,000", starter: "$100", growth: "$79", pro: "$89" },
                        { orders: "$3,000", starter: "$300", growth: "$199", pro: "$169" },
                        { orders: "$5,000", starter: "$500", growth: "$319", pro: "$249" },
                        { orders: "$10,000", starter: "$1,000", growth: "$619", pro: "$449" },
                      ].map((row, idx) => (
                        <tr key={idx} className="border-b border-border/50">
                          <td className="py-4 px-4 font-medium text-foreground">{row.orders}</td>
                          <td className="py-4 px-4 text-center text-muted-foreground">{row.starter}</td>
                          <td className="py-4 px-4 text-center text-primary font-medium bg-primary/5 dark:bg-primary/10">
                            {row.growth}
                          </td>
                          <td className="py-4 px-4 text-center text-muted-foreground">{row.pro}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <>
                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                  {[
                    { orders: "$1,000", starter: "$100 + $50*", growth: "$79 + $50*", pro: "$89 + $50*" },
                    { orders: "$3,000", starter: "$300 + $150*", growth: "$199 + $150*", pro: "$169 + $150*" },
                    { orders: "$5,000", starter: "$500 + $250*", growth: "$319 + $250*", pro: "$249 + $250*" },
                    { orders: "$10,000", starter: "$1,000 + $500*", growth: "$619 + $500*", pro: "$449 + $500*" },
                  ].map((row, idx) => (
                    <div key={idx} className="border border-border rounded-lg p-4">
                      <p className="font-semibold text-foreground text-center mb-3">
                        Monthly Orders: {row.orders}
                      </p>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center py-2 border-b border-border/50">
                          <span className="text-sm text-muted-foreground">Starter (10%)</span>
                          <span className="text-sm text-foreground">{row.starter}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-border/50 bg-primary/5 dark:bg-primary/10 -mx-4 px-4">
                          <span className="text-sm font-medium text-primary">Growth (6%)</span>
                          <span className="text-sm font-medium text-primary">{row.growth}</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span className="text-sm text-muted-foreground">Pro (4%)</span>
                          <span className="text-sm text-foreground">{row.pro}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground text-center">
                    * Customer service fee ($0.99/order) is paid by the customer
                  </p>
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-4 px-4 font-semibold text-foreground">
                          Monthly Orders
                        </th>
                        <th className="text-center py-4 px-4 font-semibold text-foreground">
                          Starter (10%)
                        </th>
                        <th className="text-center py-4 px-4 font-semibold text-primary">
                          Growth (6% + $19)
                        </th>
                        <th className="text-center py-4 px-4 font-semibold text-foreground">
                          Pro (4% + $49)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { orders: "$1,000", starter: "$100 + $50*", growth: "$79 + $50*", pro: "$89 + $50*" },
                        { orders: "$3,000", starter: "$300 + $150*", growth: "$199 + $150*", pro: "$169 + $150*" },
                        { orders: "$5,000", starter: "$500 + $250*", growth: "$319 + $250*", pro: "$249 + $250*" },
                        { orders: "$10,000", starter: "$1,000 + $500*", growth: "$619 + $500*", pro: "$449 + $500*" },
                      ].map((row, idx) => (
                        <tr key={idx} className="border-b border-border/50">
                          <td className="py-4 px-4 font-medium text-foreground">{row.orders}</td>
                          <td className="py-4 px-4 text-center text-muted-foreground">{row.starter}</td>
                          <td className="py-4 px-4 text-center text-primary font-medium bg-primary/5 dark:bg-primary/10">
                            {row.growth}
                          </td>
                          <td className="py-4 px-4 text-center text-muted-foreground">{row.pro}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="text-xs text-muted-foreground text-center mt-4">
                    * Customer service fee ($0.99/order) is paid by the customer, not the restaurant
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="container mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-foreground text-center mb-12">
            Frequently Asked Questions
          </h2>

          <div className="max-w-3xl mx-auto space-y-6">
            {[
              {
                q: "What's the difference between Option A and Option B?",
                a: "Option A offers tiered monthly plans where you pay a fixed monthly fee for lower transaction rates. Option B has no or low monthly fees but includes a small customer service fee per order that the customer pays.",
              },
              {
                q: "Who pays the customer service fee in Option B?",
                a: "The customer pays the $0.99 service fee per order. This is added to their checkout total, so it doesn't come out of your revenue.",
              },
              {
                q: "Can I switch between Option A and Option B?",
                a: "Yes! You can switch pricing models at any time. Changes take effect at the start of your next billing period.",
              },
              {
                q: "What payment methods do you support?",
                a: "Currently, customers pay at pickup. We're integrating online payments with Stripe and PayPal for seamless transactions.",
              },
              {
                q: "Is there a contract or commitment?",
                a: "No long-term contracts. All plans can be cancelled anytime. Annual plans (Option A) are billed upfront but offer 20% savings.",
              },
              {
                q: "How do I know which option is best for me?",
                a: "Option A is better if you want predictable monthly costs and your customers are price-sensitive. Option B is better for high-volume restaurants where the lower transaction fee adds up to significant savings.",
              },
            ].map((faq, idx) => (
              <div
                key={idx}
                className="bg-card rounded-xl p-6 border border-border"
              >
                <h3 className="text-lg font-semibold text-foreground mb-2">{faq.q}</h3>
                <p className="text-muted-foreground">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto bg-gradient-to-r from-primary to-sky-500 rounded-2xl p-8 md:p-12 text-center text-white">
            <Zap className="w-12 h-12 mx-auto mb-6 opacity-80" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to grow your restaurant?
            </h2>
            <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
              Join hundreds of restaurants already using SteppersLife to reach more customers
              and streamline their ordering process.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/restaurateur/apply"
                className="px-8 py-4 bg-white text-primary rounded-lg font-semibold hover:bg-white/90 transition-colors"
              >
                Apply Now - It's Free
              </Link>
              <Link
                href="/restaurants"
                className="px-8 py-4 bg-sky-600 text-white border-2 border-white rounded-lg font-semibold hover:bg-sky-700 transition-colors"
              >
                Browse Restaurants
              </Link>
            </div>
          </div>
        </div>

        {/* Support Section */}
        <div className="container mx-auto px-4 py-12 text-center">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Headphones className="w-5 h-5" />
            <span>Questions? Contact us at </span>
            <a
              href="mailto:restaurants@stepperslife.com"
              className="text-primary hover:underline font-medium"
            >
              restaurants@stepperslife.com
            </a>
          </div>
        </div>
      </div>
      <PublicFooter />
    </>
  );
}

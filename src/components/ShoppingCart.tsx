"use client";

import { useFoodCart } from "@/contexts/FoodCartContext";
import { X, Trash2, Plus, Minus, ShoppingBag, Utensils, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";

export function ShoppingCart() {
  const {
    cart,
    removeFromCart,
    updateQuantity,
    getItemCount,
    getSubtotal,
    isCartOpen,
    setIsCartOpen,
  } = useFoodCart();

  const router = useRouter();
  const currentUser = useQuery(api.users.queries.getCurrentUser);

  const handleCheckout = () => {
    if (!currentUser) {
      toast("Sign in required", {
        description: "Please sign in to complete your order",
        action: {
          label: "Sign In",
          onClick: () => {
            setIsCartOpen(false);
            router.push(`/login?redirect=/restaurants/${cart.restaurantSlug}/checkout`);
          },
        },
        icon: <LogIn className="w-4 h-4" />,
      });
      return;
    }
    setIsCartOpen(false);
    router.push(`/restaurants/${cart.restaurantSlug}/checkout`);
  };

  if (!isCartOpen) return null;

  const itemCount = getItemCount();

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-foreground/50 z-40 transition-opacity"
        onClick={() => setIsCartOpen(false)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsCartOpen(false);
          }
        }}
        aria-label="Close cart"
      />

      {/* Cart Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-card shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">Your Order</h2>
          </div>
          <button
            type="button"
            onClick={() => setIsCartOpen(false)}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="Close cart"
          >
            <X className="w-6 h-6 text-muted-foreground" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6">
          {cart.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Utensils className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Your cart is empty</h3>
              <p className="text-muted-foreground mb-6">Add items from a restaurant to get started</p>
              <button
                onClick={() => setIsCartOpen(false)}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Browse Restaurants
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Restaurant Name */}
              {cart.restaurantName && (
                <div className="pb-3 border-b border-border">
                  <h3 className="font-semibold text-foreground">{cart.restaurantName}</h3>
                </div>
              )}

              {/* Items */}
              <div className="space-y-3">
                {cart.items.map((item) => (
                  <div key={item.menuItemId} className="flex gap-4 p-4 bg-muted rounded-lg">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-foreground">{item.name}</h4>
                      {item.notes && (
                        <p className="text-sm text-muted-foreground line-clamp-1">{item.notes}</p>
                      )}
                      <p className="text-sm text-muted-foreground mt-1">
                        ${(item.price / 100).toFixed(2)} each
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center border border-input rounded-lg">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                            className="p-1 hover:bg-muted rounded-l-lg"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="px-3 py-1 font-semibold min-w-[2rem] text-center">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                            className="p-1 hover:bg-muted rounded-r-lg"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            // Remove by setting quantity to 0
                            updateQuantity(item.menuItemId, 0);
                          }}
                          className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-foreground">
                        ${((item.price * item.quantity) / 100).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.items.length > 0 && (
          <div className="border-t border-border p-6 space-y-4">
            <div className="flex items-center justify-between text-lg">
              <span className="text-muted-foreground">Subtotal ({itemCount} items)</span>
              <span className="font-bold text-foreground">${(getSubtotal() / 100).toFixed(2)}</span>
            </div>

            <p className="text-sm text-muted-foreground">Taxes and fees calculated at checkout</p>

            <button
              type="button"
              onClick={handleCheckout}
              className="w-full px-6 py-4 bg-primary text-primary-foreground text-lg font-semibold rounded-lg hover:bg-primary/90 transition-colors"
            >
              Proceed to Checkout
            </button>
          </div>
        )}
      </div>
    </>
  );
}

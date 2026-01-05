"use client";

import { useFoodCart } from "@/contexts/FoodCartContext";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

export function CartSwitchConfirmation() {
  const { cart, pendingCartSwitch, confirmCartSwitch, cancelCartSwitch } = useFoodCart();

  if (!pendingCartSwitch) return null;

  return (
    <AlertDialog open={!!pendingCartSwitch} onOpenChange={(open) => !open && cancelCartSwitch()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Start a new order?</AlertDialogTitle>
          <AlertDialogDescription>
            You already have items from <strong>{cart.restaurantName}</strong> in your cart.
            Adding items from <strong>{pendingCartSwitch.restaurantName}</strong> will clear your current cart.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={cancelCartSwitch}>
            Keep current cart
          </AlertDialogCancel>
          <AlertDialogAction onClick={confirmCartSwitch}>
            Start new order
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

"use client";

import { useState, useEffect } from "react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Lock, ArrowLeft, Loader2 } from "lucide-react";

interface FoodOrderPayPalCheckoutProps {
  total: number; // in cents
  orderId: string;
  orderNumber: string;
  restaurantId: string;
  restaurantName: string;
  customerName: string;
  customerEmail: string;
  onPaymentSuccess: (result: { paypalOrderId: string }) => void;
  onPaymentError: (error: string) => void;
  onBack: () => void;
}

export function FoodOrderPayPalCheckout({
  total,
  orderId,
  orderNumber,
  restaurantId,
  restaurantName,
  customerName,
  customerEmail,
  onPaymentSuccess,
  onPaymentError,
  onBack,
}: FoodOrderPayPalCheckoutProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  useEffect(() => {
    // Check if PayPal is configured
    if (!paypalClientId) {
      setError("PayPal is not configured. Please contact support.");
      setIsLoading(false);
      return;
    }
    setIsLoading(false);
  }, [paypalClientId]);

  // Create PayPal order
  const createOrder = async (): Promise<string> => {
    try {
      console.log("[FoodOrderPayPalCheckout] Creating PayPal order...", {
        total,
        orderId,
      });

      const response = await fetch("/api/paypal/create-food-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: total, // in cents
          orderId,
          orderNumber,
          restaurantId,
          restaurantName,
          customerName,
          customerEmail,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        console.error("[FoodOrderPayPalCheckout] Create order failed:", data);
        throw new Error(data.error || "Failed to create PayPal order");
      }

      console.log("[FoodOrderPayPalCheckout] PayPal order created:", data.paypalOrderId);
      return data.paypalOrderId;
    } catch (err: any) {
      console.error("[FoodOrderPayPalCheckout] Create order error:", err);
      const errorMessage = err.message || "Failed to create PayPal order";
      setError(errorMessage);
      onPaymentError(errorMessage);
      throw err;
    }
  };

  // Capture PayPal payment after approval
  const onApprove = async (data: { orderID: string }) => {
    setIsProcessing(true);
    setError(null);

    try {
      console.log("[FoodOrderPayPalCheckout] Capturing payment for order:", data.orderID);

      const response = await fetch("/api/paypal/capture-food-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paypalOrderId: data.orderID,
          steppersLifeOrderId: orderId,
        }),
      });

      const captureData = await response.json();

      if (!response.ok || captureData.status !== "COMPLETED") {
        console.error("[FoodOrderPayPalCheckout] Capture failed:", captureData);
        throw new Error(captureData.error || "Payment capture failed");
      }

      console.log("[FoodOrderPayPalCheckout] Payment captured successfully:", captureData);
      onPaymentSuccess({ paypalOrderId: data.orderID });
    } catch (err: any) {
      console.error("[FoodOrderPayPalCheckout] Capture error:", err);
      const errorMessage = err.message || "Payment capture failed";
      setError(errorMessage);
      onPaymentError(errorMessage);
      setIsProcessing(false);
    }
  };

  // Handle PayPal errors
  const onError = (err: any) => {
    console.error("[FoodOrderPayPalCheckout] PayPal error:", err);
    const errorMessage = "PayPal encountered an error. Please try again.";
    setError(errorMessage);
    onPaymentError(errorMessage);
  };

  // Handle user cancellation
  const onCancel = () => {
    console.log("[FoodOrderPayPalCheckout] Payment cancelled by user");
    setError("Payment was cancelled. You can try again when ready.");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Initializing PayPal...</p>
        </div>
      </div>
    );
  }

  if (!paypalClientId) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>PayPal is not configured. Please contact support.</AlertDescription>
        </Alert>
        <Button variant="outline" onClick={onBack} className="w-full">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <PayPalScriptProvider
      options={{
        clientId: paypalClientId,
        currency: "USD",
        intent: "capture",
      }}
    >
      <div className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isProcessing ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Processing payment...</p>
            </div>
          </div>
        ) : (
          <div className="bg-card rounded-lg border border-border p-4">
            <PayPalButtons
              style={{
                layout: "vertical",
                color: "blue",
                shape: "rect",
                label: "paypal",
                height: 45,
              }}
              createOrder={createOrder}
              onApprove={onApprove}
              onError={onError}
              onCancel={onCancel}
              disabled={isProcessing}
            />
          </div>
        )}

        <div className="bg-accent border border-border rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-foreground">Secure Payment</p>
              <p className="text-xs text-muted-foreground mt-1">
                Your payment is processed securely through PayPal. You can pay with your PayPal
                balance, bank account, or credit/debit card.
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={isProcessing}
            className="flex-1"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex-1 text-center py-2">
            <p className="text-sm text-muted-foreground">
              Total: <span className="font-semibold text-foreground">${(total / 100).toFixed(2)}</span>
            </p>
          </div>
        </div>
      </div>
    </PayPalScriptProvider>
  );
}

import { type NextRequest, NextResponse } from "next/server";

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_API_BASE =
  process.env.PAYPAL_ENVIRONMENT === "sandbox"
    ? "https://api-m.sandbox.paypal.com"
    : "https://api-m.paypal.com";

// Timeout for PayPal API calls (30 seconds)
const PAYPAL_TIMEOUT_MS = 30000;

// Max retry attempts
const MAX_RETRIES = 3;

if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
  console.error("[PayPal Food Order] CRITICAL: PayPal credentials not configured!");
}

/**
 * Fetch with timeout and retry logic
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = MAX_RETRIES,
  baseDelay = 1000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PAYPAL_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    // Retry on 5xx errors or rate limiting
    if ((response.status >= 500 || response.status === 429) && retries > 0) {
      const delay = baseDelay * Math.pow(2, MAX_RETRIES - retries);
      console.log(`[PayPal] Retrying request after ${delay}ms (${retries} retries left)`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, baseDelay);
    }

    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error.name === "AbortError") {
      if (retries > 0) {
        const delay = baseDelay * Math.pow(2, MAX_RETRIES - retries);
        console.log(
          `[PayPal] Request timeout, retrying after ${delay}ms (${retries} retries left)`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        return fetchWithRetry(url, options, retries - 1, baseDelay);
      }
      throw new Error("PayPal API request timed out after multiple attempts");
    }

    if (retries > 0) {
      const delay = baseDelay * Math.pow(2, MAX_RETRIES - retries);
      console.log(
        `[PayPal] Request failed, retrying after ${delay}ms (${retries} retries left): ${error.message}`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, baseDelay);
    }

    throw error;
  }
}

/**
 * Get PayPal access token with retry logic
 */
async function getPayPalAccessToken(): Promise<string> {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    throw new Error("PayPal credentials not configured");
  }

  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString("base64");

  const response = await fetchWithRetry(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[PayPal] Failed to get access token:", response.status, errorText);
    throw new Error(`Failed to get PayPal access token: ${response.status}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Create PayPal Order for Food Orders
 * POST /api/paypal/create-food-order
 *
 * Direct Payment Flow for restaurant food orders:
 * - 100% goes to SteppersLife platform
 * - No split payments for food orders
 */
export async function POST(request: NextRequest) {
  try {
    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      return NextResponse.json({ success: false, error: "PayPal is not configured" }, { status: 500 });
    }

    const body = await request.json();
    const {
      amount, // Total amount in cents
      orderId, // Convex food order ID
      orderNumber, // Human-readable order number
      restaurantId,
      restaurantName,
      customerName,
      customerEmail,
    } = body;

    if (!amount || amount < 50) {
      return NextResponse.json(
        { success: false, error: "Amount must be at least $0.50" },
        { status: 400 }
      );
    }

    if (!orderId) {
      return NextResponse.json({ success: false, error: "Order ID is required" }, { status: 400 });
    }

    const accessToken = await getPayPalAccessToken();

    // Convert cents to dollars for PayPal
    const amountInDollars = (amount / 100).toFixed(2);

    // Build purchase unit for food order
    const purchaseUnit: any = {
      reference_id: orderId,
      description: `${restaurantName || "SteppersLife"} - Food Order ${orderNumber || ""}`.trim(),
      amount: {
        currency_code: "USD",
        value: amountInDollars,
      },
      custom_id: JSON.stringify({
        orderId,
        orderNumber,
        restaurantId,
        restaurantName,
        customerName,
        customerEmail,
        chargeType: "FOOD_ORDER",
      }),
    };

    // Create PayPal order with retry logic
    const orderResponse = await fetchWithRetry(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "PayPal-Partner-Attribution-Id": "SteppersLife_SP",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [purchaseUnit],
        application_context: {
          brand_name: restaurantName || "SteppersLife Restaurants",
          landing_page: "NO_PREFERENCE",
          user_action: "PAY_NOW",
          shipping_preference: "NO_SHIPPING",
        },
      }),
    });

    if (!orderResponse.ok) {
      const errorData = await orderResponse.json();
      console.error("[PayPal Food Order] Create order failed:", errorData);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to create PayPal order",
          details: errorData,
          code: "PAYPAL_ORDER_CREATION_FAILED",
        },
        { status: 500 }
      );
    }

    const orderData = await orderResponse.json();

    console.log("[PayPal Food Order] Order created:", orderData.id);

    return NextResponse.json({
      success: true,
      paypalOrderId: orderData.id,
      status: orderData.status,
    });
  } catch (error: any) {
    console.error("[PayPal Food Order] Create order error:", error.message);

    // Generate unique request ID for debugging
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Determine error type and message
    let errorCode = "INTERNAL_ERROR";
    let errorMessage = "Failed to create PayPal order";

    if (error.message?.includes("credentials")) {
      errorCode = "PAYPAL_NOT_CONFIGURED";
      errorMessage = "PayPal payment is temporarily unavailable";
    } else if (error.message?.includes("timeout")) {
      errorCode = "PAYPAL_TIMEOUT";
      errorMessage = "PayPal service timed out. Please try again.";
    } else if (error.message?.includes("access token")) {
      errorCode = "PAYPAL_AUTH_FAILED";
      errorMessage = "Unable to authenticate with PayPal";
    }

    // In development, include more details
    const isDev = process.env.NODE_ENV === "development";
    const debugInfo = isDev
      ? {
          message: error.message,
          env: PAYPAL_API_BASE,
          hasClientId: !!PAYPAL_CLIENT_ID,
          hasSecretKey: !!PAYPAL_CLIENT_SECRET,
        }
      : undefined;

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: {
          code: errorCode,
          requestId,
          ...(debugInfo && { debug: debugInfo }),
        },
      },
      { status: 500 }
    );
  }
}

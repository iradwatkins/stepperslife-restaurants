/**
 * Context exports for SteppersLife Restaurants
 *
 * Usage:
 * ```tsx
 * import { useFoodCart, FoodCartProvider } from "@/contexts";
 * ```
 */

// Food cart (restaurant orders)
export {
  FoodCartProvider,
  useFoodCart,
  type FoodCartItem,
  type FoodCart,
} from "./FoodCartContext";

// Workspace context
export { WorkspaceProvider, useWorkspace } from "./WorkspaceContext";

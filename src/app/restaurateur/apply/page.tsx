import { Metadata } from "next";
import RestaurateurApplyClient from "./RestaurateurApplyClient";

export const metadata: Metadata = {
  title: "Add Your Restaurant | SteppersLife Restaurants",
  description: "List your restaurant for free on SteppersLife. Reach thousands of customers in the stepping community.",
};

export default function RestaurateurApplyPage() {
  return <RestaurateurApplyClient />;
}

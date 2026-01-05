import { Metadata } from "next";
import RestaurateurClient from "./RestaurateurClient";

export const metadata: Metadata = {
  title: "For Restaurant Owners | SteppersLife Restaurants",
  description: "Partner with SteppersLife to reach thousands of customers in the stepping community. Apply to join our restaurant network.",
};

export default function RestaurateurPage() {
  return <RestaurateurClient />;
}

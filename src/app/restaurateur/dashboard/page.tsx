import { Metadata } from "next";
import RestaurateurDashboardClient from "./RestaurateurDashboardClient";

export const metadata: Metadata = {
  title: "Restaurant Dashboard | SteppersLife",
  description: "Manage your restaurant, menu, and orders on SteppersLife.",
};

export default function RestaurateurDashboardPage() {
  return <RestaurateurDashboardClient />;
}

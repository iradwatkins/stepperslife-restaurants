import { Metadata } from "next";
import RestaurantManagementClient from "./RestaurantManagementClient";

export const metadata: Metadata = {
  title: "Restaurant Management | SteppersLife Admin",
  description: "Manage restaurant details, menu, and settings.",
};

interface PageProps {
  params: Promise<{
    restaurantId: string;
  }>;
}

export default async function RestaurantManagementPage({ params }: PageProps) {
  const { restaurantId } = await params;
  return <RestaurantManagementClient restaurantId={restaurantId} />;
}

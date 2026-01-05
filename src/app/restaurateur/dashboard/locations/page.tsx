"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";
import { useState } from "react";
import {
  MapPin,
  Plus,
  Phone,
  Mail,
  Clock,
  MoreVertical,
  Edit,
  Trash2,
  Check,
  X,
  Building2,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

function LocationsSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Skeleton className="h-12 w-12 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function LocationsPage() {
  const myRestaurants = useQuery(api.restaurants.getMyRestaurants);
  const restaurant = myRestaurants?.[0];
  const locations = useQuery(
    api.restaurantLocations.getByRestaurant,
    restaurant?._id ? { restaurantId: restaurant._id } : "skip"
  );

  const removeLocation = useMutation(api.restaurantLocations.remove);
  const updateLocation = useMutation(api.restaurantLocations.update);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState<Id<"restaurantLocations"> | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Loading state
  if (myRestaurants === undefined || (restaurant && locations === undefined)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <LocationsSkeleton />
      </div>
    );
  }

  // No restaurant
  if (!restaurant) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto text-center">
          <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">No Restaurant Found</h1>
          <p className="text-muted-foreground mb-6">
            You need to create a restaurant before you can manage locations.
          </p>
          <Link href="/restaurateur/apply">
            <Button>Apply to Partner</Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleDeleteClick = (locationId: Id<"restaurantLocations">) => {
    setLocationToDelete(locationId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!locationToDelete) return;

    // Prevent deleting the last location
    if (locations && locations.length <= 1) {
      toast.error("Cannot delete the last location. Every restaurant must have at least one location.");
      setDeleteDialogOpen(false);
      setLocationToDelete(null);
      return;
    }

    setIsDeleting(true);
    try {
      await removeLocation({ id: locationToDelete });
      toast.success("Location deleted successfully");
    } catch (error) {
      toast.error("Failed to delete location");
      console.error(error);
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setLocationToDelete(null);
    }
  };

  const handleToggleActive = async (locationId: Id<"restaurantLocations">, currentActive: boolean) => {
    try {
      await updateLocation({
        id: locationId,
        isActive: !currentActive,
      });
      toast.success(currentActive ? "Location deactivated" : "Location activated");
    } catch (error) {
      toast.error("Failed to update location");
      console.error(error);
    }
  };

  const handleToggleOrders = async (locationId: Id<"restaurantLocations">, currentAccepting: boolean) => {
    try {
      await updateLocation({
        id: locationId,
        acceptingOrders: !currentAccepting,
      });
      toast.success(currentAccepting ? "Orders paused" : "Now accepting orders");
    } catch (error) {
      toast.error("Failed to update order status");
      console.error(error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Locations</h1>
          <p className="text-muted-foreground">
            Manage your restaurant locations for {restaurant.name}
          </p>
        </div>
        <Link href="/restaurateur/dashboard/locations/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Location
          </Button>
        </Link>
      </div>

      {/* Locations Grid */}
      {locations && locations.length > 0 ? (
        <div className="grid gap-4">
          {locations.map((location) => (
            <Card
              key={location._id}
              className={`transition-opacity ${!location.isActive ? "opacity-60" : ""}`}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground truncate">
                        {location.name}
                      </h3>
                      {location.isPrimary && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          Primary
                        </Badge>
                      )}
                      {!location.isActive && (
                        <Badge variant="outline" className="text-muted-foreground">
                          Inactive
                        </Badge>
                      )}
                      {location.isActive && location.acceptingOrders && (
                        <Badge variant="default" className="bg-green-600">
                          Accepting Orders
                        </Badge>
                      )}
                      {location.isActive && !location.acceptingOrders && (
                        <Badge variant="outline" className="text-amber-600 border-amber-600">
                          Orders Paused
                        </Badge>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground mb-2">
                      {location.address}, {location.city}, {location.state} {location.zipCode}
                    </p>

                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      {location.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {location.phone}
                        </span>
                      )}
                      {location.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {location.email}
                        </span>
                      )}
                      {location.estimatedPickupTime && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {location.estimatedPickupTime} min pickup
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/restaurateur/dashboard/locations/${location._id}`}
                          className="flex items-center gap-2"
                        >
                          <Edit className="h-4 w-4" />
                          Edit Location
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleToggleOrders(location._id, location.acceptingOrders)}
                      >
                        {location.acceptingOrders ? (
                          <>
                            <X className="h-4 w-4 mr-2" />
                            Pause Orders
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Accept Orders
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleToggleActive(location._id, location.isActive)}
                      >
                        {location.isActive ? (
                          <>
                            <X className="h-4 w-4 mr-2" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Activate
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDeleteClick(location._id)}
                        className="text-destructive focus:text-destructive"
                        disabled={locations.length <= 1}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Locations Yet</h3>
            <p className="text-muted-foreground mb-6">
              Add your first location to start receiving orders.
            </p>
            <Link href="/restaurateur/dashboard/locations/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Location
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Location?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this location
              and remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete Location"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

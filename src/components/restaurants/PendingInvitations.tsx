"use client";

import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { UtensilsCrossed, Check, X, Clock, Shield, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

interface PendingInvitationsProps {
  variant?: "full" | "compact";
  onAccept?: () => void;
}

export function PendingInvitations({ variant = "full", onAccept }: PendingInvitationsProps) {
  const invitations = useQuery(api.restaurantStaff.getMyPendingInvitations);
  // Use action to accept invitation and notify owner
  const acceptInvitationWithNotification = useAction(api.restaurantStaff.acceptInvitationWithNotification);
  const declineInvitation = useMutation(api.restaurantStaff.declineInvitation);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleAccept = async (staffId: string, restaurantName: string) => {
    setProcessingId(staffId);
    try {
      await acceptInvitationWithNotification({ staffId: staffId as Id<"restaurantStaff"> });
      toast.success(`You've joined ${restaurantName}!`);
      onAccept?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to accept invitation");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (staffId: string) => {
    setProcessingId(staffId);
    try {
      await declineInvitation({ staffId: staffId as Id<"restaurantStaff"> });
      toast.success("Invitation declined");
    } catch (error: any) {
      toast.error(error.message || "Failed to decline invitation");
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (invitations === undefined) {
    return (
      <div className="p-4 flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (invitations.length === 0) {
    if (variant === "compact") return null;
    return (
      <div className="bg-card rounded-xl border border-border p-6 text-center">
        <p className="text-muted-foreground">No pending invitations</p>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className="bg-primary/5 dark:bg-primary/20 border border-primary/30 dark:border-primary/40 rounded-xl p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center">
            <UtensilsCrossed className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h4 className="font-medium text-foreground">Restaurant Invitations</h4>
            <p className="text-xs text-muted-foreground">{invitations.length} pending</p>
          </div>
        </div>
        <div className="space-y-2">
          {invitations.slice(0, 2).map((invitation) => (
            <div
              key={invitation._id}
              className="flex items-center justify-between bg-white dark:bg-card rounded-lg p-3"
            >
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm text-foreground">
                  {invitation.restaurant?.name || "Restaurant"}
                </span>
                <span className="text-xs text-muted-foreground">
                  as {invitation.role === "RESTAURANT_MANAGER" ? "Manager" : "Staff"}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleAccept(invitation._id, invitation.restaurant?.name || "Restaurant")}
                  disabled={processingId === invitation._id}
                  className="p-1.5 bg-success/20 text-success rounded hover:bg-success/30 transition-colors disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDecline(invitation._id)}
                  disabled={processingId === invitation._id}
                  className="p-1.5 bg-destructive/20 text-destructive rounded hover:bg-destructive/30 transition-colors disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {invitations.length > 2 && (
            <p className="text-xs text-center text-muted-foreground">
              +{invitations.length - 2} more invitations
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">Restaurant Invitations</h3>
      <div className="grid gap-4">
        {invitations.map((invitation) => (
          <div
            key={invitation._id}
            className="bg-card rounded-xl border border-border p-4"
          >
            <div className="flex items-start gap-4">
              {/* Restaurant Logo/Icon */}
              <div className="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <UtensilsCrossed className="w-6 h-6 text-primary" />
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-foreground">
                  {invitation.restaurant?.name || "Restaurant"}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  {invitation.role === "RESTAURANT_MANAGER" ? (
                    <ShieldCheck className="w-4 h-4 text-primary" />
                  ) : (
                    <Shield className="w-4 h-4 text-primary" />
                  )}
                  <span
                    className={`text-sm ${
                      invitation.role === "RESTAURANT_MANAGER"
                        ? "text-primary"
                        : "text-primary"
                    }`}
                  >
                    {invitation.role === "RESTAURANT_MANAGER" ? "Manager" : "Staff"}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Invited by {invitation.invitedByName} on {formatDate(invitation.invitedAt)}</span>
                </div>

                {/* Permissions Preview (for staff) */}
                {invitation.role === "RESTAURANT_STAFF" && invitation.permissions && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {invitation.permissions.canManageOrders && (
                      <span className="px-2 py-0.5 bg-muted rounded text-xs text-muted-foreground">
                        Orders
                      </span>
                    )}
                    {invitation.permissions.canManageMenu && (
                      <span className="px-2 py-0.5 bg-muted rounded text-xs text-muted-foreground">
                        Menu
                      </span>
                    )}
                    {invitation.permissions.canManageHours && (
                      <span className="px-2 py-0.5 bg-muted rounded text-xs text-muted-foreground">
                        Hours
                      </span>
                    )}
                    {invitation.permissions.canViewAnalytics && (
                      <span className="px-2 py-0.5 bg-muted rounded text-xs text-muted-foreground">
                        Analytics
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleDecline(invitation._id)}
                  disabled={processingId === invitation._id}
                  className="px-3 py-1.5 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
                >
                  Decline
                </button>
                <button
                  onClick={() => handleAccept(invitation._id, invitation.restaurant?.name || "Restaurant")}
                  disabled={processingId === invitation._id}
                  className="px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {processingId === invitation._id ? "..." : "Accept"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PendingInvitations;

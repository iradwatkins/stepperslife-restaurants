"use client";

import { useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Users,
  UserPlus,
  Mail,
  Phone,
  Shield,
  ShieldCheck,
  MoreVertical,
  Check,
  X,
  Clock,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";

type StaffRole = "RESTAURANT_MANAGER" | "RESTAURANT_STAFF";
type StaffStatus = "PENDING" | "ACTIVE" | "INACTIVE";

const ROLE_CONFIG: Record<StaffRole, { label: string; description: string; color: string }> = {
  RESTAURANT_MANAGER: {
    label: "Manager",
    description: "Full access to menu, orders, hours, analytics, and staff",
    color: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300",
  },
  RESTAURANT_STAFF: {
    label: "Staff",
    description: "Can view and update order status only",
    color: "bg-info/20 text-foreground dark:bg-primary/20 dark:text-primary",
  },
};

const STATUS_CONFIG: Record<StaffStatus, { label: string; color: string }> = {
  PENDING: { label: "Pending", color: "bg-warning/20 text-warning-foreground dark:bg-warning/20 dark:text-warning" },
  ACTIVE: { label: "Active", color: "bg-success/20 text-success dark:bg-success/20 dark:text-success" },
  INACTIVE: { label: "Inactive", color: "bg-muted text-foreground dark:bg-background/30 dark:text-muted-foreground" },
};

export default function StaffManagementPage() {
  const [activeTab, setActiveTab] = useState<"team" | "pending">("team");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);
  const [actionModal, setActionModal] = useState<{
    type: "deactivate" | "reactivate" | "remove" | "edit";
    staffId: string;
    staffName: string;
    currentRole?: StaffRole;
  } | null>(null);

  // Get user's accessible restaurants
  const myRestaurants = useQuery(api.restaurantStaff.getMyAccessibleRestaurants);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);

  // Auto-select first restaurant
  const restaurantId = selectedRestaurantId || myRestaurants?.[0]?.restaurant._id;

  // Get staff for selected restaurant
  const staff = useQuery(
    api.restaurantStaff.getByRestaurant,
    restaurantId ? { restaurantId: restaurantId as Id<"restaurants"> } : "skip"
  );

  // Mutations
  const inviteStaff = useMutation(api.restaurantStaff.inviteStaff);
  const deactivateStaff = useMutation(api.restaurantStaff.deactivateStaff);
  const reactivateStaff = useMutation(api.restaurantStaff.reactivateStaff);
  const removeStaff = useMutation(api.restaurantStaff.removeStaff);
  const updateStaff = useMutation(api.restaurantStaff.updateStaff);

  // Filter staff by tab
  const activeStaff = staff?.filter((s) => s.status === "ACTIVE") || [];
  const pendingStaff = staff?.filter((s) => s.status === "PENDING") || [];
  const inactiveStaff = staff?.filter((s) => s.status === "INACTIVE") || [];

  const displayStaff = activeTab === "team" ? [...activeStaff, ...inactiveStaff] : pendingStaff;

  const handleAction = async () => {
    if (!actionModal) return;

    try {
      switch (actionModal.type) {
        case "deactivate":
          await deactivateStaff({ staffId: actionModal.staffId as Id<"restaurantStaff"> });
          toast.success(`${actionModal.staffName} has been deactivated`);
          break;
        case "reactivate":
          await reactivateStaff({ staffId: actionModal.staffId as Id<"restaurantStaff"> });
          toast.success(`${actionModal.staffName} has been reactivated`);
          break;
        case "remove":
          await removeStaff({ staffId: actionModal.staffId as Id<"restaurantStaff"> });
          toast.success(`${actionModal.staffName} has been removed`);
          break;
      }
      setActionModal(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to perform action");
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (!myRestaurants) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (myRestaurants.length === 0) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Restaurants Found</h2>
          <p className="text-muted-foreground">You don&apos;t have access to any restaurants yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Staff Management</h1>
          <p className="text-muted-foreground">Manage your restaurant team and permissions</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Restaurant Selector (if multiple) */}
          {myRestaurants.length > 1 && (
            <select
              value={restaurantId || ""}
              onChange={(e) => setSelectedRestaurantId(e.target.value)}
              className="px-4 py-2 border border-input rounded-lg bg-background"
            >
              {myRestaurants.map((r) => (
                <option key={r.restaurant._id} value={r.restaurant._id}>
                  {r.restaurant.name}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <UserPlus className="w-5 h-5" />
            Invite Staff
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-success/20 dark:bg-success/20 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{activeStaff.length}</p>
              <p className="text-sm text-muted-foreground">Active Staff</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-warning/20 dark:bg-warning/20 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{pendingStaff.length}</p>
              <p className="text-sm text-muted-foreground">Pending Invites</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-muted dark:bg-background/30 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{inactiveStaff.length}</p>
              <p className="text-sm text-muted-foreground">Inactive</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-border">
        <button
          onClick={() => setActiveTab("team")}
          className={`pb-3 px-1 text-sm font-medium transition-colors ${
            activeTab === "team"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Team Members ({activeStaff.length + inactiveStaff.length})
        </button>
        <button
          onClick={() => setActiveTab("pending")}
          className={`pb-3 px-1 text-sm font-medium transition-colors ${
            activeTab === "pending"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Pending Invitations ({pendingStaff.length})
        </button>
      </div>

      {/* Staff List */}
      {staff === undefined ? (
        <div className="bg-card rounded-xl border border-border p-8 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : displayStaff.length > 0 ? (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-border">
            {displayStaff.map((member) => {
              const roleConfig = ROLE_CONFIG[member.role as StaffRole];
              const statusConfig = STATUS_CONFIG[member.status as StaffStatus];

              return (
                <div key={member._id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-primary font-medium">
                          {member.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{member.name}</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${roleConfig.color}`}>
                            {roleConfig.label}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
                            {statusConfig.label}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="relative">
                      <button
                        onClick={() => setSelectedStaff(selectedStaff === member._id ? null : member._id)}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                      >
                        <MoreVertical className="w-4 h-4 text-muted-foreground" />
                      </button>
                      {selectedStaff === member._id && (
                        <div className="absolute right-0 bottom-full mb-2 w-48 bg-card border border-border rounded-lg shadow-lg z-10">
                          {member.status === "ACTIVE" && (
                            <button
                              onClick={() => {
                                setActionModal({
                                  type: "deactivate",
                                  staffId: member._id,
                                  staffName: member.name,
                                });
                                setSelectedStaff(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-warning hover:bg-muted transition-colors"
                            >
                              Deactivate
                            </button>
                          )}
                          {member.status === "INACTIVE" && (
                            <button
                              onClick={() => {
                                setActionModal({
                                  type: "reactivate",
                                  staffId: member._id,
                                  staffName: member.name,
                                });
                                setSelectedStaff(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-success hover:bg-muted transition-colors"
                            >
                              Reactivate
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setActionModal({
                                type: "remove",
                                staffId: member._id,
                                staffName: member.name,
                              });
                              setSelectedStaff(null);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-destructive hover:bg-muted transition-colors"
                          >
                            Remove Permanently
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="pl-13 space-y-1 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{member.email}</span>
                    </div>
                    {member.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="w-3 h-3 flex-shrink-0" />
                        <span>{member.phone}</span>
                      </div>
                    )}
                    <p className="text-muted-foreground text-xs mt-2">
                      {activeTab === "pending" ? "Invited" : "Joined"}: {formatDate(member.status === "PENDING" ? member.invitedAt : (member.acceptedAt || member.createdAt))}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Staff Member</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Role</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                    {activeTab === "pending" ? "Invited" : "Joined"}
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayStaff.map((member) => {
                  const roleConfig = ROLE_CONFIG[member.role as StaffRole];
                  const statusConfig = STATUS_CONFIG[member.status as StaffStatus];

                  return (
                    <tr key={member._id} className="border-b border-border last:border-0">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-primary font-medium">
                              {member.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{member.name}</p>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {member.email}
                              </span>
                              {member.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {member.phone}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {member.role === "RESTAURANT_MANAGER" ? (
                            <ShieldCheck className="w-4 h-4 text-primary" />
                          ) : (
                            <Shield className="w-4 h-4 text-primary" />
                          )}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleConfig.color}`}>
                            {roleConfig.label}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {formatDate(member.status === "PENDING" ? member.invitedAt : (member.acceptedAt || member.createdAt))}
                      </td>
                      <td className="p-4">
                        <div className="relative">
                          <button
                            onClick={() => setSelectedStaff(selectedStaff === member._id ? null : member._id)}
                            className="p-2 hover:bg-muted rounded-lg transition-colors"
                          >
                            <MoreVertical className="w-4 h-4 text-muted-foreground" />
                          </button>
                          {selectedStaff === member._id && (
                            <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg z-10">
                              {member.status === "ACTIVE" && (
                                <button
                                  onClick={() => {
                                    setActionModal({
                                      type: "deactivate",
                                      staffId: member._id,
                                      staffName: member.name,
                                    });
                                    setSelectedStaff(null);
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-warning hover:bg-muted transition-colors"
                                >
                                  Deactivate
                                </button>
                              )}
                              {member.status === "INACTIVE" && (
                                <button
                                  onClick={() => {
                                    setActionModal({
                                      type: "reactivate",
                                      staffId: member._id,
                                      staffName: member.name,
                                    });
                                    setSelectedStaff(null);
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-success hover:bg-muted transition-colors"
                                >
                                  Reactivate
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setActionModal({
                                    type: "remove",
                                    staffId: member._id,
                                    staffName: member.name,
                                  });
                                  setSelectedStaff(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-destructive hover:bg-muted transition-colors"
                              >
                                Remove Permanently
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">
            {activeTab === "pending" ? "No Pending Invitations" : "No Team Members Yet"}
          </h3>
          <p className="text-muted-foreground max-w-sm mx-auto mb-6">
            {activeTab === "pending"
              ? "All invitations have been accepted or there are no pending invites"
              : "Invite staff members to help manage your restaurant"}
          </p>
          {activeTab === "team" && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              <UserPlus className="w-5 h-5" />
              Invite Staff
            </button>
          )}
        </div>
      )}

      {/* Invite Staff Modal */}
      {showInviteModal && restaurantId && (
        <InviteStaffModal
          restaurantId={restaurantId as Id<"restaurants">}
          onClose={() => setShowInviteModal(false)}
          onSuccess={() => {
            setShowInviteModal(false);
            toast.success("Staff invitation sent!");
          }}
        />
      )}

      {/* Action Confirmation Modal */}
      {actionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-xl border border-border p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-foreground mb-2">
              {actionModal.type === "deactivate" && "Deactivate Staff"}
              {actionModal.type === "reactivate" && "Reactivate Staff"}
              {actionModal.type === "remove" && "Remove Staff"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {actionModal.type === "deactivate" &&
                `Are you sure you want to deactivate "${actionModal.staffName}"? They will lose access to the restaurant dashboard.`}
              {actionModal.type === "reactivate" &&
                `Are you sure you want to reactivate "${actionModal.staffName}"? They will regain access to the restaurant dashboard.`}
              {actionModal.type === "remove" &&
                `Are you sure you want to permanently remove "${actionModal.staffName}"? This action cannot be undone.`}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setActionModal(null)}
                className="px-4 py-2 border border-border rounded-lg font-medium hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAction}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  actionModal.type === "reactivate"
                    ? "bg-success text-white hover:bg-success/80"
                    : "bg-destructive text-white hover:bg-destructive/80"
                }`}
              >
                {actionModal.type === "deactivate" && "Deactivate"}
                {actionModal.type === "reactivate" && "Reactivate"}
                {actionModal.type === "remove" && "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Invite Staff Modal Component
function InviteStaffModal({
  restaurantId,
  onClose,
  onSuccess,
}: {
  restaurantId: Id<"restaurants">;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    phone: "",
    role: "RESTAURANT_STAFF" as StaffRole,
  });
  const [permissions, setPermissions] = useState({
    canManageMenu: false,
    canManageHours: false,
    canManageOrders: true,
    canViewAnalytics: false,
    canManageSettings: false,
  });
  const [loading, setLoading] = useState(false);

  // Use action to send invitation with email
  const inviteStaffWithEmail = useAction(api.restaurantStaff.inviteStaffWithEmail);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await inviteStaffWithEmail({
        restaurantId,
        email: formData.email,
        name: formData.name,
        phone: formData.phone || undefined,
        role: formData.role,
        permissions: formData.role === "RESTAURANT_STAFF" ? permissions : undefined,
      });

      if (result.emailSent) {
        toast.success("Invitation sent! An email has been sent to the invitee.");
      } else {
        toast.success("Invitation created! (Email notification may be delayed)");
      }
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Failed to send invitation");
    } finally {
      setLoading(false);
    }
  };

  // Update permissions when role changes
  const handleRoleChange = (role: StaffRole) => {
    setFormData({ ...formData, role });
    if (role === "RESTAURANT_MANAGER") {
      // Managers get all permissions
      setPermissions({
        canManageMenu: true,
        canManageHours: true,
        canManageOrders: true,
        canViewAnalytics: true,
        canManageSettings: true,
      });
    } else {
      // Staff gets minimal permissions
      setPermissions({
        canManageMenu: false,
        canManageHours: false,
        canManageOrders: true,
        canViewAnalytics: false,
        canManageSettings: false,
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card rounded-xl border border-border p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-foreground">Invite Staff Member</h3>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-4 py-2 border border-input rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="John Doe"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="w-full px-4 py-2 border border-input rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="john@example.com"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Phone (Optional)</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2 border border-input rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="(555) 123-4567"
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Role *</label>
            <div className="space-y-2">
              {(Object.keys(ROLE_CONFIG) as StaffRole[]).map((role) => (
                <label
                  key={role}
                  className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    formData.role === role
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={role}
                    checked={formData.role === role}
                    onChange={() => handleRoleChange(role)}
                    className="mt-1"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      {role === "RESTAURANT_MANAGER" ? (
                        <ShieldCheck className="w-4 h-4 text-primary" />
                      ) : (
                        <Shield className="w-4 h-4 text-primary" />
                      )}
                      <span className="font-medium text-foreground">{ROLE_CONFIG[role].label}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{ROLE_CONFIG[role].description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Custom Permissions (for Staff only) */}
          {formData.role === "RESTAURANT_STAFF" && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Custom Permissions
              </label>
              <div className="space-y-2 bg-muted/50 rounded-lg p-3">
                {[
                  { key: "canManageOrders", label: "Manage Orders", description: "View and update order status" },
                  { key: "canManageMenu", label: "Manage Menu", description: "Add, edit, and remove menu items" },
                  { key: "canManageHours", label: "Manage Hours", description: "Update operating hours" },
                  { key: "canViewAnalytics", label: "View Analytics", description: "Access sales reports" },
                ].map(({ key, label, description }) => (
                  <label key={key} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions[key as keyof typeof permissions]}
                      onChange={(e) =>
                        setPermissions({ ...permissions, [key]: e.target.checked })
                      }
                      className="rounded border-input"
                    />
                    <div>
                      <span className="text-sm font-medium text-foreground">{label}</span>
                      <p className="text-xs text-muted-foreground">{description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-border rounded-lg font-medium hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send Invitation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

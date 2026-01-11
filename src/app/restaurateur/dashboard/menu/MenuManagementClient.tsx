"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { RestaurantsSubNav } from "@/components/layout/RestaurantsSubNav";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  Pencil,
  Trash2,
  ChefHat,
  Utensils,
  ArrowLeft,
  GripVertical,
  Eye,
  EyeOff,
  Loader2,
  LogIn,
  AlertCircle,
  X,
  Copy,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface CategoryFormData {
  name: string;
  description: string;
}

interface ItemFormData {
  name: string;
  description: string;
  price: string;
  categoryId: string;
  imageUrl: string;
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  isSpicy: boolean;
}

// Define a type for menu item from the query
type MenuItem = {
  _id: Id<"menuItems">;
  _creationTime: number;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  isAvailable: boolean;
  sortOrder: number;
  categoryId?: Id<"menuCategories">;
  restaurantId: Id<"restaurants">;
  createdAt: number;
  updatedAt: number;
  // Dietary tags
  isVegetarian?: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  isSpicy?: boolean;
};

// Sortable menu item component
function SortableMenuItem({
  item,
  onToggleAvailability,
  onEdit,
  onDuplicate,
  onDelete,
  duplicatingId,
}: {
  item: MenuItem;
  onToggleAvailability: (id: Id<"menuItems">) => void;
  onEdit: (item: MenuItem) => void;
  onDuplicate: (id: Id<"menuItems">) => void;
  onDelete: (id: Id<"menuItems">) => void;
  duplicatingId: Id<"menuItems"> | null;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between p-3 rounded-lg border ${
        item.isAvailable
          ? "bg-white dark:bg-card"
          : "bg-muted dark:bg-background opacity-60"
      } ${isDragging ? "shadow-lg z-50" : ""}`}
    >
      <div className="flex items-center gap-3">
        <button
          className="cursor-grab active:cursor-grabbing touch-none"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </button>
        {item.imageUrl && (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-12 h-12 rounded-lg object-cover"
          />
        )}
        <div>
          <div className="flex items-center gap-1.5">
            <p className="font-medium">{item.name}</p>
            {/* Dietary badges */}
            {item.isVegetarian && (
              <span className="inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" title="Vegetarian">
                V
              </span>
            )}
            {item.isVegan && (
              <span className="inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" title="Vegan">
                VG
              </span>
            )}
            {item.isGlutenFree && (
              <span className="inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold rounded bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" title="Gluten-Free">
                GF
              </span>
            )}
            {item.isSpicy && (
              <span className="inline-flex items-center justify-center w-5 h-5 text-[10px] rounded bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" title="Spicy">
                🌶️
              </span>
            )}
          </div>
          {item.description && (
            <p className="text-sm text-muted-foreground line-clamp-1">
              {item.description}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-semibold text-primary">
          ${(item.price / 100).toFixed(2)}
        </span>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onToggleAvailability(item._id)}
          title={item.isAvailable ? "Hide item" : "Show item"}
        >
          {item.isAvailable ? (
            <Eye className="w-4 h-4 text-success" />
          ) : (
            <EyeOff className="w-4 h-4 text-destructive" />
          )}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onEdit(item)}
        >
          <Pencil className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onDuplicate(item._id)}
          disabled={duplicatingId === item._id}
          title="Duplicate item"
        >
          {duplicatingId === item._id ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-destructive hover:text-destructive"
          onClick={() => onDelete(item._id)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// Menu item overlay for drag preview
function MenuItemOverlay({ item }: { item: MenuItem }) {
  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg border shadow-lg ${
        item.isAvailable
          ? "bg-white dark:bg-card"
          : "bg-muted dark:bg-background opacity-60"
      }`}
    >
      <div className="flex items-center gap-3">
        <GripVertical className="w-4 h-4 text-muted-foreground" />
        {item.imageUrl && (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-12 h-12 rounded-lg object-cover"
          />
        )}
        <div>
          <div className="flex items-center gap-1.5">
            <p className="font-medium">{item.name}</p>
            {/* Dietary badges */}
            {item.isVegetarian && (
              <span className="inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" title="Vegetarian">
                V
              </span>
            )}
            {item.isVegan && (
              <span className="inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" title="Vegan">
                VG
              </span>
            )}
            {item.isGlutenFree && (
              <span className="inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold rounded bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" title="Gluten-Free">
                GF
              </span>
            )}
            {item.isSpicy && (
              <span className="inline-flex items-center justify-center w-5 h-5 text-[10px] rounded bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" title="Spicy">
                🌶️
              </span>
            )}
          </div>
          {item.description && (
            <p className="text-sm text-muted-foreground line-clamp-1">
              {item.description}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-semibold text-primary">
          ${(item.price / 100).toFixed(2)}
        </span>
      </div>
    </div>
  );
}

export default function MenuManagementClient() {
  const currentUser = useQuery(api.users.queries.getCurrentUser);
  const restaurant = useQuery(
    api.menuItems.getRestaurantByOwner,
    currentUser?._id ? { ownerId: currentUser._id } : "skip"
  );
  const categories = useQuery(
    api.menuItems.getCategories,
    restaurant?._id ? { restaurantId: restaurant._id } : "skip"
  );
  const menuItems = useQuery(
    api.menuItems.getByRestaurant,
    restaurant?._id ? { restaurantId: restaurant._id } : "skip"
  );

  // Mutations
  const createCategory = useMutation(api.menuItems.createCategory);
  const updateCategory = useMutation(api.menuItems.updateCategory);
  const removeCategory = useMutation(api.menuItems.removeCategory);
  const createItem = useMutation(api.menuItems.create);
  const updateItem = useMutation(api.menuItems.update);
  const removeItem = useMutation(api.menuItems.remove);
  const toggleAvailability = useMutation(api.menuItems.toggleAvailability);
  const duplicateItem = useMutation(api.menuItems.duplicate);
  const reorderItems = useMutation(api.menuItems.reorderMenuItems);
  const reorderCategories = useMutation(api.menuItems.reorderMenuCategories);

  // DnD sensors for both mouse and touch support
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required before drag starts
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200, // 200ms press delay for touch
        tolerance: 5,
      },
    })
  );

  // UI State
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Id<"menuCategories"> | null>(null);
  const [editingItem, setEditingItem] = useState<Id<"menuItems"> | null>(null);
  const [categoryForm, setCategoryForm] = useState<CategoryFormData>({ name: "", description: "" });
  const [itemForm, setItemForm] = useState<ItemFormData>({ name: "", description: "", price: "", categoryId: "", imageUrl: "", isVegetarian: false, isVegan: false, isGlutenFree: false, isSpicy: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [duplicatingId, setDuplicatingId] = useState<Id<"menuItems"> | null>(null);
  const [activeItemId, setActiveItemId] = useState<Id<"menuItems"> | null>(null);
  const [activeCategoryId, setActiveCategoryId] = useState<Id<"menuCategories"> | null>(null);

  // Loading state
  if (currentUser === undefined) {
    return (
      <>
        <PublicHeader />
        <RestaurantsSubNav />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <PublicFooter />
      </>
    );
  }

  // Not logged in
  if (!currentUser) {
    return (
      <>
        <PublicHeader />
        <RestaurantsSubNav />
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-16">
            <div className="max-w-md mx-auto bg-card rounded-2xl shadow-lg p-8 text-center border border-border">
              <LogIn className="w-12 h-12 text-primary mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-4">Sign In Required</h1>
              <p className="text-muted-foreground mb-6">
                Please sign in to manage your restaurant menu.
              </p>
              <Button asChild className="w-full bg-primary hover:bg-primary/90">
                <Link href="/login">Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
        <PublicFooter />
      </>
    );
  }

  // No restaurant
  if (restaurant === null) {
    return (
      <>
        <PublicHeader />
        <RestaurantsSubNav />
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-16">
            <div className="max-w-md mx-auto bg-card rounded-2xl shadow-lg p-8 text-center border border-border">
              <AlertCircle className="w-12 h-12 text-warning mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-4">No Restaurant Found</h1>
              <p className="text-muted-foreground mb-6">
                You don't have a restaurant registered yet. Apply to become a restaurant partner.
              </p>
              <Button asChild className="w-full bg-primary hover:bg-primary/90">
                <Link href="/restaurateur/apply">Apply Now</Link>
              </Button>
            </div>
          </div>
        </div>
        <PublicFooter />
      </>
    );
  }

  // Loading restaurant data
  if (restaurant === undefined || categories === undefined || menuItems === undefined) {
    return (
      <>
        <PublicHeader />
        <RestaurantsSubNav />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <PublicFooter />
      </>
    );
  }

  // Group items by category
  const itemsByCategory = menuItems.reduce((acc, item) => {
    const catId = item.categoryId || "uncategorized";
    if (!acc[catId]) acc[catId] = [];
    acc[catId].push(item);
    return acc;
  }, {} as Record<string, typeof menuItems>);

  // Sort categories by sortOrder
  const sortedCategories = [...categories].sort((a, b) => a.sortOrder - b.sortOrder);

  // Handlers
  const handleAddCategory = () => {
    setCategoryForm({ name: "", description: "" });
    setEditingCategory(null);
    setShowCategoryForm(true);
    setError("");
  };

  const handleEditCategory = (cat: typeof categories[0]) => {
    setCategoryForm({ name: cat.name, description: cat.description || "" });
    setEditingCategory(cat._id);
    setShowCategoryForm(true);
    setError("");
  };

  const handleSubmitCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) {
      setError("Category name is required");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      if (editingCategory) {
        await updateCategory({
          id: editingCategory,
          name: categoryForm.name.trim(),
          description: categoryForm.description.trim() || undefined,
        });
      } else {
        await createCategory({
          restaurantId: restaurant._id,
          name: categoryForm.name.trim(),
          description: categoryForm.description.trim() || undefined,
          sortOrder: categories.length,
        });
      }
      setShowCategoryForm(false);
      setCategoryForm({ name: "", description: "" });
      setEditingCategory(null);
    } catch (err: any) {
      setError(err.message || "Failed to save category");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async (catId: Id<"menuCategories">) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;

    try {
      await removeCategory({ id: catId });
    } catch (err: any) {
      toast.error(err.message || "Failed to delete category");
    }
  };

  const handleAddItem = (categoryId?: Id<"menuCategories">) => {
    setItemForm({ name: "", description: "", price: "", categoryId: categoryId || "", imageUrl: "", isVegetarian: false, isVegan: false, isGlutenFree: false, isSpicy: false });
    setEditingItem(null);
    setShowItemForm(true);
    setError("");
  };

  const handleEditItem = (item: typeof menuItems[0]) => {
    setItemForm({
      name: item.name,
      description: item.description || "",
      price: (item.price / 100).toFixed(2),
      categoryId: item.categoryId || "",
      imageUrl: item.imageUrl || "",
      isVegetarian: item.isVegetarian ?? false,
      isVegan: item.isVegan ?? false,
      isGlutenFree: item.isGlutenFree ?? false,
      isSpicy: item.isSpicy ?? false,
    });
    setEditingItem(item._id);
    setShowItemForm(true);
    setError("");
  };

  const handleSubmitItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemForm.name.trim()) {
      setError("Item name is required");
      return;
    }
    if (!itemForm.price || isNaN(parseFloat(itemForm.price))) {
      setError("Valid price is required");
      return;
    }

    setIsSubmitting(true);
    setError("");

    const priceInCents = Math.round(parseFloat(itemForm.price) * 100);

    try {
      if (editingItem) {
        await updateItem({
          id: editingItem,
          name: itemForm.name.trim(),
          description: itemForm.description.trim() || undefined,
          price: priceInCents,
          categoryId: itemForm.categoryId ? (itemForm.categoryId as Id<"menuCategories">) : undefined,
          imageUrl: itemForm.imageUrl || undefined,
          isVegetarian: itemForm.isVegetarian,
          isVegan: itemForm.isVegan,
          isGlutenFree: itemForm.isGlutenFree,
          isSpicy: itemForm.isSpicy,
        });
      } else {
        const categoryItems = itemForm.categoryId
          ? itemsByCategory[itemForm.categoryId]?.length || 0
          : itemsByCategory["uncategorized"]?.length || 0;

        await createItem({
          restaurantId: restaurant._id,
          name: itemForm.name.trim(),
          description: itemForm.description.trim() || undefined,
          price: priceInCents,
          categoryId: itemForm.categoryId ? (itemForm.categoryId as Id<"menuCategories">) : undefined,
          sortOrder: categoryItems,
          imageUrl: itemForm.imageUrl || undefined,
          isVegetarian: itemForm.isVegetarian,
          isVegan: itemForm.isVegan,
          isGlutenFree: itemForm.isGlutenFree,
          isSpicy: itemForm.isSpicy,
        });
      }
      setShowItemForm(false);
      setItemForm({ name: "", description: "", price: "", categoryId: "", imageUrl: "", isVegetarian: false, isVegan: false, isGlutenFree: false, isSpicy: false });
      setEditingItem(null);
    } catch (err: any) {
      setError(err.message || "Failed to save item");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = async (itemId: Id<"menuItems">) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;

    try {
      await removeItem({ id: itemId });
    } catch (err: any) {
      toast.error(err.message || "Failed to delete item");
    }
  };

  const handleToggleAvailability = async (itemId: Id<"menuItems">) => {
    try {
      await toggleAvailability({ id: itemId });
    } catch (err: any) {
      toast.error(err.message || "Failed to toggle availability");
    }
  };

  const handleDuplicateItem = async (itemId: Id<"menuItems">) => {
    setDuplicatingId(itemId);
    try {
      await duplicateItem({ id: itemId });
    } catch (err: any) {
      toast.error(err.message || "Failed to duplicate item");
    } finally {
      setDuplicatingId(null);
    }
  };

  // Drag and drop handlers for menu items
  const handleItemDragStart = (event: DragStartEvent) => {
    setActiveItemId(event.active.id as Id<"menuItems">);
  };

  const handleItemDragEnd = async (event: DragEndEvent, categoryId: string) => {
    const { active, over } = event;
    setActiveItemId(null);

    if (!over || active.id === over.id) return;

    const items = itemsByCategory[categoryId] || [];
    const oldIndex = items.findIndex((item) => item._id === active.id);
    const newIndex = items.findIndex((item) => item._id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Reorder the array locally
    const reorderedItems = arrayMove(items, oldIndex, newIndex);

    // Create the update payload with new sort orders
    const updates = reorderedItems.map((item, index) => ({
      id: item._id,
      sortOrder: index,
    }));

    try {
      await reorderItems({ items: updates });
    } catch (err: any) {
      console.error("Failed to reorder items:", err);
    }
  };

  // Drag and drop handlers for categories
  const handleCategoryDragStart = (event: DragStartEvent) => {
    setActiveCategoryId(event.active.id as Id<"menuCategories">);
  };

  const handleCategoryDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCategoryId(null);

    if (!over || active.id === over.id) return;

    const oldIndex = sortedCategories.findIndex((cat) => cat._id === active.id);
    const newIndex = sortedCategories.findIndex((cat) => cat._id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Reorder the array locally
    const reorderedCategories = arrayMove(sortedCategories, oldIndex, newIndex);

    // Create the update payload with new sort orders
    const updates = reorderedCategories.map((cat, index) => ({
      id: cat._id,
      sortOrder: index,
    }));

    try {
      await reorderCategories({ categories: updates });
    } catch (err: any) {
      console.error("Failed to reorder categories:", err);
    }
  };

  // Get active dragging item for overlay
  const activeItem = activeItemId ? menuItems?.find((item) => item._id === activeItemId) : null;
  const activeCategory = activeCategoryId ? categories?.find((cat) => cat._id === activeCategoryId) : null;

  return (
    <>
      <PublicHeader />
      <RestaurantsSubNav />
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-gradient-to-br from-sky-600 to-primary py-6">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-4">
              <Link
                href="/restaurateur/dashboard"
                className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Utensils className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Menu Management</h1>
                  <p className="text-white/80 text-sm">{restaurant.name}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Actions Bar */}
          <div className="flex flex-wrap gap-3 mb-8">
            <Button onClick={handleAddCategory} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
            <Button onClick={() => handleAddItem()} className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Add Menu Item
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{categories.length}</p>
                <p className="text-sm text-muted-foreground">Categories</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{menuItems.length}</p>
                <p className="text-sm text-muted-foreground">Menu Items</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-success">
                  {menuItems.filter((i) => i.isAvailable).length}
                </p>
                <p className="text-sm text-muted-foreground">Available</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-destructive">
                  {menuItems.filter((i) => !i.isAvailable).length}
                </p>
                <p className="text-sm text-muted-foreground">Hidden</p>
              </CardContent>
            </Card>
          </div>

          {/* Categories and Items */}
          <div className="space-y-6">
            {sortedCategories.map((category) => (
              <Card key={category._id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <GripVertical className="w-4 h-4 text-muted-foreground" />
                      {category.name}
                      {category.description && (
                        <span className="text-sm font-normal text-muted-foreground">
                          - {category.description}
                        </span>
                      )}
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleAddItem(category._id)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditCategory(category)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteCategory(category._id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {itemsByCategory[category._id]?.length > 0 ? (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragStart={handleItemDragStart}
                      onDragEnd={(event) => handleItemDragEnd(event, category._id)}
                    >
                      <SortableContext
                        items={itemsByCategory[category._id]
                          .sort((a, b) => a.sortOrder - b.sortOrder)
                          .map((item) => item._id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-2">
                          {itemsByCategory[category._id]
                            .sort((a, b) => a.sortOrder - b.sortOrder)
                            .map((item) => (
                              <SortableMenuItem
                                key={item._id}
                                item={item as MenuItem}
                                onToggleAvailability={handleToggleAvailability}
                                onEdit={handleEditItem}
                                onDuplicate={handleDuplicateItem}
                                onDelete={handleDeleteItem}
                                duplicatingId={duplicatingId}
                              />
                            ))}
                        </div>
                      </SortableContext>
                      <DragOverlay>
                        {activeItem && <MenuItemOverlay item={activeItem as MenuItem} />}
                      </DragOverlay>
                    </DndContext>
                  ) : (
                    <p className="text-center text-muted-foreground py-4">
                      No items in this category yet
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}

            {/* Uncategorized Items */}
            {itemsByCategory["uncategorized"]?.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-muted-foreground">Uncategorized Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleItemDragStart}
                    onDragEnd={(event) => handleItemDragEnd(event, "uncategorized")}
                  >
                    <SortableContext
                      items={itemsByCategory["uncategorized"]
                        .sort((a, b) => a.sortOrder - b.sortOrder)
                        .map((item) => item._id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2">
                        {itemsByCategory["uncategorized"]
                          .sort((a, b) => a.sortOrder - b.sortOrder)
                          .map((item) => (
                            <SortableMenuItem
                              key={item._id}
                              item={item as MenuItem}
                              onToggleAvailability={handleToggleAvailability}
                              onEdit={handleEditItem}
                              onDuplicate={handleDuplicateItem}
                              onDelete={handleDeleteItem}
                              duplicatingId={duplicatingId}
                            />
                          ))}
                      </div>
                    </SortableContext>
                    <DragOverlay>
                      {activeItem && <MenuItemOverlay item={activeItem as MenuItem} />}
                    </DragOverlay>
                  </DndContext>
                </CardContent>
              </Card>
            )}

            {/* Empty State */}
            {categories.length === 0 && menuItems.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <ChefHat className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Start Building Your Menu</h3>
                  <p className="text-muted-foreground mb-6">
                    Add categories and menu items to create your restaurant's menu.
                  </p>
                  <div className="flex justify-center gap-3">
                    <Button onClick={handleAddCategory} variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Category
                    </Button>
                    <Button onClick={() => handleAddItem()} className="bg-primary hover:bg-primary/90">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Item
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Category Form Modal */}
        {showCategoryForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-card rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">
                  {editingCategory ? "Edit Category" : "Add Category"}
                </h2>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowCategoryForm(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <form onSubmit={handleSubmitCategory} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name *</label>
                  <Input
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                    placeholder="e.g., Appetizers, Main Courses, Desserts"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <Input
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                    placeholder="Optional description"
                  />
                </div>

                {error && (
                  <p className="text-destructive text-sm">{error}</p>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowCategoryForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-primary hover:bg-primary/90"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Saving..." : "Save"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Item Form Modal */}
        {showItemForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-card rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">
                  {editingItem ? "Edit Menu Item" : "Add Menu Item"}
                </h2>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowItemForm(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <form onSubmit={handleSubmitItem} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name *</label>
                  <Input
                    value={itemForm.name}
                    onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                    placeholder="e.g., Grilled Chicken"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={itemForm.description}
                    onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                    placeholder="Describe the item..."
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm resize-none h-20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Price *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={itemForm.price}
                      onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
                      placeholder="0.00"
                      className="pl-7"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select
                    value={itemForm.categoryId}
                    onChange={(e) => setItemForm({ ...itemForm, categoryId: e.target.value })}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
                  >
                    <option value="">Uncategorized</option>
                    {sortedCategories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Image</label>
                  <ImageUpload
                    currentImageUrl={itemForm.imageUrl}
                    onImageUploaded={(url) => setItemForm({ ...itemForm, imageUrl: url })}
                    onImageRemoved={() => setItemForm({ ...itemForm, imageUrl: "" })}
                  />
                </div>

                {/* Dietary Tags */}
                <div>
                  <label className="block text-sm font-medium mb-2">Dietary Tags</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center justify-between p-2 rounded-lg border bg-background">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🥬</span>
                        <span className="text-sm">Vegetarian</span>
                      </div>
                      <Switch
                        checked={itemForm.isVegetarian}
                        onCheckedChange={(checked) => setItemForm({ ...itemForm, isVegetarian: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg border bg-background">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🌱</span>
                        <span className="text-sm">Vegan</span>
                      </div>
                      <Switch
                        checked={itemForm.isVegan}
                        onCheckedChange={(checked) => setItemForm({ ...itemForm, isVegan: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg border bg-background">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🌾</span>
                        <span className="text-sm">Gluten-Free</span>
                      </div>
                      <Switch
                        checked={itemForm.isGlutenFree}
                        onCheckedChange={(checked) => setItemForm({ ...itemForm, isGlutenFree: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg border bg-background">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🌶️</span>
                        <span className="text-sm">Spicy</span>
                      </div>
                      <Switch
                        checked={itemForm.isSpicy}
                        onCheckedChange={(checked) => setItemForm({ ...itemForm, isSpicy: checked })}
                      />
                    </div>
                  </div>
                </div>

                {error && (
                  <p className="text-destructive text-sm">{error}</p>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowItemForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-primary hover:bg-primary/90"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Saving..." : "Save"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
      <PublicFooter />
    </>
  );
}

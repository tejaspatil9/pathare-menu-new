"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { RESTAURANT_ID } from "@/lib/constants";

import DishForm from "@/components/admin/DishForm";
import DishList from "@/components/admin/DishList";
import CategoryManager from "@/components/admin/CategoryManager";

export default function AdminPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [dishes, setDishes] = useState<any[]>([]);
  const [editingDish, setEditingDish] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);

    /* ================= FETCH CATEGORIES ================= */

    const { data: categoryData, error: categoryError } = await supabase
      .from("categories")
      .select("*")
      .eq("restaurant_id", RESTAURANT_ID)
      .order("display_order", { ascending: true });

    if (categoryError) {
      console.error("Category fetch error:", categoryError);
      alert(categoryError.message);
    }

    /* ================= FETCH DISHES ================= */

    const { data: dishData, error: dishError } = await supabase
      .from("dishes")
      .select(`
        *,
        dish_prices (
          id,
          label_en,
          label_mr,
          price
        )
      `)
      .eq("restaurant_id", RESTAURANT_ID)
      .order("display_order", { ascending: true });

    if (dishError) {
      console.error("Dish fetch error:", dishError);
      alert(dishError.message);
    }

    if (categoryData) setCategories(categoryData);
    if (dishData) setDishes(dishData);

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="p-8 space-y-8 max-w-4xl">

      {loading && (
        <p className="text-sm text-gray-500">Loading...</p>
      )}

      {/* Dish Form */}
      <DishForm
        categories={categories}
        editingDish={editingDish}
        onSuccess={() => {
          setEditingDish(null);
          fetchData();
        }}
      />

      {/* Category Manager */}
      <CategoryManager
        categories={categories}
        onRefresh={fetchData}
      />

      {/* Dish List */}
      <DishList
        dishes={dishes}
        onRefresh={fetchData}
        onEdit={(dish) => setEditingDish(dish)}
      />

    </div>
  );
}
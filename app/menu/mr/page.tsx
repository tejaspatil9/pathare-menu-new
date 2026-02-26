"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { RESTAURANT_ID } from "@/lib/constants";
import CategoryBar from "@/components/menu/CategoryBar";
import SearchBar from "@/components/menu/SearchBar";
import DishCard from "@/components/menu/DishCard";

interface Category {
  id: string;
  name_mr: string;
}

interface Dish {
  id: string;
  name_mr: string;
  image_url: string | null;
  is_veg: boolean | null;
  is_chef_special: boolean | null;
  is_pathare_special: boolean | null;
  is_bestseller: boolean | null;
  category_id: string;
  dish_prices: {
    label_mr: string;
    price: number;
  }[];
}

export default function MarathiMenuPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<string>("");
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  /* ================= LOAD CATEGORIES ================= */

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from("categories")
        .select("id, name_mr")
        .eq("restaurant_id", RESTAURANT_ID)
        .order("display_order", { ascending: true });

      if (data && data.length > 0) {
        setCategories(data);
        setActiveCategoryId(data[0].id);
      }
    };

    fetchCategories();
  }, []);

  /* ================= LOAD DISHES PER CATEGORY ================= */

  useEffect(() => {
    if (!activeCategoryId) return;

    const fetchDishes = async () => {
      setLoading(true);

      const { data } = await supabase
        .from("dishes")
        .select(`
          id,
          name_mr,
          image_url,
          is_veg,
          is_chef_special,
          is_pathare_special,
          is_bestseller,
          category_id,
          dish_prices(label_mr, price)
        `)
        .eq("restaurant_id", RESTAURANT_ID)
        .eq("category_id", activeCategoryId)
        .eq("is_visible", true)
        .order("display_order", { ascending: true });

      setDishes(data || []);
      setLoading(false);
    };

    fetchDishes();
  }, [activeCategoryId]);

  /* ================= SEARCH FILTER ================= */

  const filteredDishes = dishes.filter((dish) =>
    dish.name_mr?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f3e6d3] px-4 pb-10">
      <div className="sticky top-0 z-40 bg-[#f3e6d3] pt-6 pb-4">
        <h1 className="text-2xl font-semibold text-[#5a1f1f] mb-4 font-[var(--font-marathi)]">
          खाद्य मेनू
        </h1>

        {categories.length > 0 && (
          <CategoryBar
            categories={categories.map((c) => c.name_mr)}
            activeCategory={
              categories.find((c) => c.id === activeCategoryId)?.name_mr || ""
            }
            setActiveCategory={(name) => {
              const found = categories.find((c) => c.name_mr === name);
              if (found) setActiveCategoryId(found.id);
            }}
          />
        )}

        <SearchBar value={search} onChange={setSearch} />
      </div>

      <div className="mt-6 flex flex-col gap-6">
        {loading && (
          <>
            <div className="h-28 bg-gray-200 animate-pulse rounded" />
            <div className="h-28 bg-gray-200 animate-pulse rounded" />
          </>
        )}

        {!loading && filteredDishes.length === 0 && (
          <p className="text-center text-[#5a1f1f]/70 font-[var(--font-marathi)]">
            कोणतेही पदार्थ उपलब्ध नाहीत
          </p>
        )}

        {!loading &&
          filteredDishes.map((dish) => (
            <DishCard
              key={dish.id}
              dish={{
                id: dish.id,
                name: dish.name_mr,
                description: "",
                image: dish.image_url || "",
                isVeg: Boolean(dish.is_veg),
                isChefSpecial: Boolean(dish.is_chef_special),
                isPathareSpecial: Boolean(dish.is_pathare_special),
                isBestseller: Boolean(dish.is_bestseller),
                prices:
                  dish.dish_prices?.map((p) => ({
                    label: p.label_mr,
                    price: p.price,
                  })) || [],
              }}
            />
          ))}
      </div>
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { RESTAURANT_ID } from "@/lib/constants";
import CategoryBar from "@/components/menu/CategoryBar";
import SearchBar from "@/components/menu/SearchBar";
import DishCard from "@/components/menu/DishCard";

interface Category {
  id: string;
  name_en: string;
  display_order: number;
}

interface Dish {
  id: string;
  name_en: string;
  description_en: string | null;
  image_url: string | null;
  is_veg: boolean;
  is_chef_special: boolean;
  is_pathare_special: boolean;
  is_bestseller: boolean;
  category_id: string;
  display_order: number;
  dish_prices: {
    label_en: string;
    price: number;
  }[];
}

export default function FoodMenuPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);

      const { data: categoryData } = await supabase
        .from("categories")
        .select("id, name_en, display_order")
        .eq("restaurant_id", RESTAURANT_ID)
        .order("display_order", { ascending: true });

      const { data: dishData } = await supabase
        .from("dishes")
        .select(`
          id,
          name_en,
          description_en,
          image_url,
          is_veg,
          is_chef_special,
          is_pathare_special,
          is_bestseller,
          category_id,
          display_order,
          dish_prices (
            label_en,
            price
          )
        `)
        .eq("restaurant_id", RESTAURANT_ID)
        .eq("is_visible", true)
        .order("display_order", { ascending: true });

      if (categoryData) {
        setCategories(categoryData);
        setActiveCategory(categoryData[0]?.name_en || "");
      }

      if (dishData) {
        setDishes(dishData);
      }

      setLoading(false);
    };

    fetchAll();
  }, []);

  const filtered = dishes.filter((dish) => {
    const matchesSearch = dish.name_en
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesCategory =
      !activeCategory ||
      categories.find((c) => c.id === dish.category_id)?.name_en ===
        activeCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-[#f3e6d3] px-4 pb-10">
      <div className="sticky top-0 z-40 bg-[#f3e6d3] pt-6 pb-4">
        <h1 className="text-2xl font-semibold text-[#5a1f1f] mb-4">
          Food Menu
        </h1>

        {categories.length > 0 && (
          <CategoryBar
            categories={categories.map((c) => c.name_en)}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
          />
        )}

        <SearchBar value={search} onChange={setSearch} />
      </div>

      <div className="mt-6 flex flex-col gap-6">
        {loading && (
          <>
            <div className="h-28 bg-gray-200 animate-pulse rounded" />
            <div className="h-28 bg-gray-200 animate-pulse rounded" />
            <div className="h-28 bg-gray-200 animate-pulse rounded" />
          </>
        )}

        {!loading && filtered.length === 0 && (
          <p className="text-center text-[#5a1f1f]/70">
            No dishes found
          </p>
        )}

        {!loading &&
          filtered.map((dish) => (
            <DishCard
              key={dish.id}
              dish={{
                id: dish.id,
                name: dish.name_en,
                description: dish.description_en || "",
                image: dish.image_url || "",
                isVeg: dish.is_veg,
                isChefSpecial: dish.is_chef_special,
                isPathareSpecial: dish.is_pathare_special,
                isBestseller: dish.is_bestseller,
                prices: dish.dish_prices.map((p) => ({
                  label: p.label_en,
                  price: p.price,
                })),
              }}
            />
          ))}
      </div>
    </div>
  );
}
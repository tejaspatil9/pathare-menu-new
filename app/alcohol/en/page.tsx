"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { RESTAURANT_ID } from "@/lib/constants";
import CategoryBar from "@/components/menu/CategoryBar";
import SearchBar from "@/components/menu/SearchBar";
import AlcoholCard from "@/components/alcohol/AlcoholCard";

interface AlcoholPrice {
  label: string;
  price: number;
}

interface Alcohol {
  id: string;
  name: string;
  image_url: string | null;
  is_bestseller: boolean | null;
  is_image_visible: boolean | null;
  category_id: string;
  alcohol_prices: AlcoholPrice[] | null;
}

interface AlcoholCategory {
  id: string;
  name_en: string;
}

export default function AlcoholMenuPage() {
  const [categories, setCategories] = useState<AlcoholCategory[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<string>("");
  const [drinks, setDrinks] = useState<Alcohol[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  /* ================= LOAD CATEGORIES ================= */

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from("alcohol_categories")
        .select("id, name_en")
        .eq("restaurant_id", RESTAURANT_ID)
        .order("display_order", { ascending: true });

      if (data && data.length > 0) {
        setCategories(data);
        setActiveCategoryId(data[0].id);
      }
    };

    fetchCategories();
  }, []);

  /* ================= LOAD DRINKS PER CATEGORY ================= */

  useEffect(() => {
    if (!activeCategoryId) return;

    const fetchAlcohol = async () => {
      setLoading(true);

      const { data } = await supabase
        .from("alcohol")
        .select(`
          id,
          name,
          image_url,
          is_bestseller,
          is_image_visible,
          category_id,
          alcohol_prices(label, price)
        `)
        .eq("restaurant_id", RESTAURANT_ID)
        .eq("category_id", activeCategoryId)
        .eq("is_visible", true);

      setDrinks(data || []);
      setLoading(false);
    };

    fetchAlcohol();
  }, [activeCategoryId]);

  /* ================= SEARCH FILTER ================= */

  const filteredDrinks = drinks.filter((drink) =>
    drink.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f3e6d3] px-4 pb-10">

      <div className="sticky top-0 z-40 bg-[#f3e6d3] pt-6 pb-4">
        <h1 className="text-2xl font-semibold text-[#5a1f1f] mb-4">
          Alcohol Menu
        </h1>

        {categories.length > 0 && (
          <CategoryBar
            categories={categories.map((c) => c.name_en)}
            activeCategory={
              categories.find((c) => c.id === activeCategoryId)?.name_en || ""
            }
            setActiveCategory={(name) => {
              const found = categories.find((c) => c.name_en === name);
              if (found) setActiveCategoryId(found.id);
            }}
          />
        )}

        <SearchBar value={search} onChange={setSearch} />
      </div>

      <div className="mt-6 flex flex-col gap-6">

        {loading && (
          <p className="text-center text-[#5a1f1f]/70">
            Loading drinks...
          </p>
        )}

        {!loading && filteredDrinks.length === 0 && (
          <p className="text-center text-[#5a1f1f]/70">
            No drinks available
          </p>
        )}

        {!loading &&
          filteredDrinks.map((drink) => (
            <AlcoholCard
              key={drink.id}
              drink={{
                id: drink.id,
                name: drink.name,
                description: "",
                image: drink.is_image_visible
                  ? drink.image_url || ""
                  : "",
                isBestseller: Boolean(drink.is_bestseller),
                prices:
                  drink.alcohol_prices?.map((p) => ({
                    label: p.label,
                    price: p.price,
                  })) || [],
              }}
            />
          ))}

      </div>
    </div>
  );
}
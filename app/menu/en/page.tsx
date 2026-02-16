"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { RESTAURANT_ID } from "@/lib/constants";
import CategoryBar from "@/components/menu/CategoryBar";
import SearchBar from "@/components/menu/SearchBar";
import AlcoholCard from "@/components/alcohol/AlcoholCard";

interface Alcohol {
  id: string;
  name: string;
  image_url: string | null;
  is_bestseller: boolean;
  is_visible: boolean;
  is_image_visible: boolean;
  category_id: string;
  alcohol_categories: {
    name_en: string;
  };
  alcohol_prices: {
    id: string;
    label: string;
    price: number;
  }[];
}

export default function AlcoholMenuPage() {

  const [drinks, setDrinks] = useState<Alcohol[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    fetchAlcohol();
  }, []);

  const fetchAlcohol = async () => {
    const { data } = await supabase
      .from("alcohol")
      .select(`
        id,
        name,
        image_url,
        is_bestseller,
        is_visible,
        is_image_visible,
        category_id,
        alcohol_categories (
          name_en
        ),
        alcohol_prices (
          id,
          label,
          price
        )
      `)
      .eq("restaurant_id", RESTAURANT_ID)
      .eq("is_visible", true)
      .order("created_at", { ascending: false });

    if (data) {
      setDrinks(data);

      const uniqueCategories = [
        "All",
        ...Array.from(
          new Set(data.map((d) => d.alcohol_categories?.name_en))
        ).filter(Boolean) as string[],
      ];

      setCategories(uniqueCategories);
    }
  };

  const filtered = drinks.filter((drink) => {
    const matchesSearch = drink.name
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesCategory =
      activeCategory === "All" ||
      drink.alcohol_categories?.name_en === activeCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-[#f3e6d3] px-4 pb-10">

      <div className="sticky top-0 z-40 bg-[#f3e6d3] pt-6 pb-4">

        <h1 className="text-2xl font-semibold text-[#5a1f1f] mb-4">
          Alcohol Menu
        </h1>

        <CategoryBar
          categories={categories}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
        />

        <SearchBar value={search} onChange={setSearch} />

      </div>

      <div className="mt-6 flex flex-col gap-6">

        {filtered.length === 0 && (
          <p className="text-center text-[#5a1f1f]/70">
            No drinks available
          </p>
        )}

        {filtered.map((drink) => (
          <AlcoholCard key={drink.id} drink={drink} />
        ))}

      </div>
    </div>
  );
}

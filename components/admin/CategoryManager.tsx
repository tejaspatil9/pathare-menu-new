"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { RESTAURANT_ID } from "@/lib/constants";

interface Category {
  id: string;
  name_en: string;
  name_mr: string;
  display_order: number;
}

export default function CategoryManager({
  categories,
  onRefresh,
}: {
  categories: Category[];
  onRefresh: () => void;
}) {

  const [nameEn, setNameEn] = useState("");
  const [nameMr, setNameMr] = useState("");

  // Always work with ordered list
  const sortedCategories = [...categories].sort(
    (a, b) => a.display_order - b.display_order
  );

  const handleAdd = async () => {
    if (!nameEn.trim()) return;

    const maxOrder =
      sortedCategories.length > 0
        ? Math.max(...sortedCategories.map(c => c.display_order))
        : 0;

    await supabase.from("categories").insert([
      {
        restaurant_id: RESTAURANT_ID,
        name_en: nameEn,
        name_mr: nameMr,
        display_order: maxOrder + 1,
      },
    ]);

    setNameEn("");
    setNameMr("");
    onRefresh();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("categories").delete().eq("id", id);
    onRefresh();
  };

  const moveCategory = async (
    category: Category,
    direction: "up" | "down"
  ) => {

    const index = sortedCategories.findIndex(
      (c) => c.id === category.id
    );

    const swapWith =
      direction === "up"
        ? sortedCategories[index - 1]
        : sortedCategories[index + 1];

    if (!swapWith) return;

    // Swap order values
    await supabase
      .from("categories")
      .update({ display_order: swapWith.display_order })
      .eq("id", category.id);

    await supabase
      .from("categories")
      .update({ display_order: category.display_order })
      .eq("id", swapWith.id);

    onRefresh();
  };

  return (
    <div className="border p-6 rounded-md space-y-4">

      <h2 className="font-semibold">Manage Categories</h2>

      <div className="flex gap-2">
        <input
          placeholder="Category EN"
          value={nameEn}
          onChange={(e) => setNameEn(e.target.value)}
          className="border p-2 flex-1"
        />

        <input
          placeholder="Category MR"
          value={nameMr}
          onChange={(e) => setNameMr(e.target.value)}
          className="border p-2 flex-1"
        />

        <button
          onClick={handleAdd}
          className="border px-3"
        >
          Add
        </button>
      </div>

      {sortedCategories.map((cat, index) => (
        <div
          key={cat.id}
          className="flex justify-between items-center border p-2"
        >
          <span>
            {cat.name_en} / {cat.name_mr}
          </span>

          <div className="flex gap-2 items-center">

            <button
              disabled={index === 0}
              onClick={() => moveCategory(cat, "up")}
              className="border px-2 text-xs"
            >
              ↑
            </button>

            <button
              disabled={index === sortedCategories.length - 1}
              onClick={() => moveCategory(cat, "down")}
              className="border px-2 text-xs"
            >
              ↓
            </button>

            <button
              onClick={() => handleDelete(cat.id)}
              className="border px-2 text-red-600 text-xs"
            >
              Delete
            </button>

          </div>
        </div>
      ))}

    </div>
  );
}
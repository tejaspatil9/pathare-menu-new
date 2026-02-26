"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { RESTAURANT_ID } from "@/lib/constants";

export default function AlcoholCategoryManager({ categories, onRefresh }: any) {
  const [name, setName] = useState("");

  /* ================= NORMALIZE (FAST - RPC) ================= */

  const normalizeOrder = async () => {
    await supabase.rpc("normalize_alcohol_category_order", {
      rid: RESTAURANT_ID,
    });

    onRefresh();
  };

  /* ================= ADD CATEGORY ================= */

  const addCategory = async () => {
    if (!name.trim()) return;

    const maxOrder =
      Math.max(...categories.map((c: any) => c.display_order || 0), 0) + 1;

    await supabase.from("alcohol_categories").insert([
      {
        restaurant_id: RESTAURANT_ID,
        name_en: name,
        display_order: maxOrder,
      },
    ]);

    setName("");
    await normalizeOrder();
  };

  /* ================= DELETE CATEGORY ================= */

  const deleteCategory = async (id: string) => {
    await supabase.from("alcohol_categories").delete().eq("id", id);
    await normalizeOrder();
  };

  /* ================= UPDATE ORDER ================= */

  const updateOrder = async (id: string, value: number) => {
    if (isNaN(value)) return;

    await supabase
      .from("alcohol_categories")
      .update({ display_order: value })
      .eq("id", id);

    await normalizeOrder();
  };

  return (
    <div className="border p-4 rounded space-y-3">
      <h2 className="font-semibold">Alcohol Categories</h2>

      <div className="flex gap-2">
        <input
          placeholder="Category Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border p-2 flex-1"
        />
        <button onClick={addCategory} className="border px-3">
          Add
        </button>
      </div>

      <div className="space-y-2">
        {categories.map((c: any) => (
          <div
            key={c.id}
            className="border px-3 py-2 text-sm flex justify-between items-center"
          >
            <div className="flex items-center gap-3">
              <span>{c.name_en}</span>

              {/* FIXED INPUT (Uncontrolled to avoid React warning) */}
              <input
                type="number"
                defaultValue={c.display_order || 0}
                onBlur={(e) =>
                  updateOrder(c.id, Number(e.target.value))
                }
                className="border w-16 p-1 text-xs"
              />
            </div>

            <button
              onClick={() => deleteCategory(c.id)}
              className="text-red-500 text-xs"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
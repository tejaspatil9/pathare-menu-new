"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { RESTAURANT_ID } from "@/lib/constants";

interface Category {
  id: string;
  name_en: string;
}

interface Price {
  label_en: string;
  label_mr: string;
  price: number;
}

export default function DishForm({
  categories,
  editingDish,
  onSuccess,
}: {
  categories: Category[];
  editingDish?: any;
  onSuccess: () => void;
}) {
  const [nameEn, setNameEn] = useState("");
  const [nameMr, setNameMr] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [descriptionMr, setDescriptionMr] = useState("");
  const [category, setCategory] = useState("");

  const [file, setFile] = useState<File | null>(null);
  const [existingImage, setExistingImage] = useState<string | null>(null);

  const [isVeg, setIsVeg] = useState(true);
  const [isChefSpecial, setIsChefSpecial] = useState(false);
  const [isPathareSpecial, setIsPathareSpecial] = useState(false);
  const [isBestseller, setIsBestseller] = useState(false);

  const [prices, setPrices] = useState<Price[]>([
    { label_en: "", label_mr: "", price: 0 },
  ]);

  /* ================= PREFILL WHEN EDITING ================= */

  useEffect(() => {
    if (editingDish) {
      setNameEn(editingDish.name_en || "");
      setNameMr(editingDish.name_mr || "");
      setDescriptionEn(editingDish.description_en || "");
      setDescriptionMr(editingDish.description_mr || "");
      setCategory(editingDish.category_id || "");

      setIsVeg(Boolean(editingDish.is_veg));
      setIsChefSpecial(Boolean(editingDish.is_chef_special));
      setIsPathareSpecial(Boolean(editingDish.is_pathare_special));
      setIsBestseller(Boolean(editingDish.is_bestseller));

      setExistingImage(editingDish.image_url || null);

      setPrices(
        editingDish.dish_prices?.length
          ? editingDish.dish_prices
          : [{ label_en: "", label_mr: "", price: 0 }]
      );
    }
  }, [editingDish]);

  /* ================= RESET FORM ================= */

  const resetForm = () => {
    setNameEn("");
    setNameMr("");
    setDescriptionEn("");
    setDescriptionMr("");
    setCategory("");
    setFile(null);
    setExistingImage(null);

    setIsVeg(true);
    setIsChefSpecial(false);
    setIsPathareSpecial(false);
    setIsBestseller(false);

    setPrices([{ label_en: "", label_mr: "", price: 0 }]);
  };

  /* ================= SUBMIT ================= */

  const handleSubmit = async () => {
    if (!nameEn || !category) return;

    let imageUrl = existingImage;

    if (file) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "dishes");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      imageUrl = data.url;
    }

    let dishId = editingDish?.id;

    if (editingDish) {
      await supabase
        .from("dishes")
        .update({
          name_en: nameEn,
          name_mr: nameMr,
          description_en: descriptionEn,
          description_mr: descriptionMr,
          category_id: category,
          image_url: imageUrl,
          is_veg: isVeg,
          is_chef_special: isChefSpecial,
          is_pathare_special: isPathareSpecial,
          is_bestseller: isBestseller,
        })
        .eq("id", dishId);
    } else {
      const { data } = await supabase
        .from("dishes")
        .insert([
          {
            restaurant_id: RESTAURANT_ID,
            name_en: nameEn,
            name_mr: nameMr,
            description_en: descriptionEn,
            description_mr: descriptionMr,
            category_id: category,
            image_url: imageUrl,
            is_veg: isVeg,
            is_chef_special: isChefSpecial,
            is_pathare_special: isPathareSpecial,
            is_bestseller: isBestseller,
            is_visible: true,
          },
        ])
        .select()
        .single();

      dishId = data?.id;
    }

    /* ================= SAVE PRICES ================= */

    if (dishId) {
      await supabase.from("dish_prices").delete().eq("dish_id", dishId);

      const validPrices = prices.filter((p) => p.price > 0);

      if (validPrices.length) {
        await supabase.from("dish_prices").insert(
          validPrices.map((p) => ({
            dish_id: dishId,
            label_en: p.label_en || null,
            label_mr: p.label_mr || null,
            price: p.price,
          }))
        );
      }
    }

    resetForm();
    onSuccess();
  };

  /* ================= UI ================= */

  return (
    <div className="border p-6 rounded-md space-y-4">
      <h2 className="font-semibold">
        {editingDish ? "Edit Dish" : "Add Dish"}
      </h2>

      <input
        placeholder="Name EN"
        value={nameEn}
        onChange={(e) => setNameEn(e.target.value)}
        className="border p-2 w-full"
      />

      <input
        placeholder="Name MR"
        value={nameMr}
        onChange={(e) => setNameMr(e.target.value)}
        className="border p-2 w-full"
      />

      <textarea
        placeholder="Description EN"
        value={descriptionEn}
        onChange={(e) => setDescriptionEn(e.target.value)}
        className="border p-2 w-full"
      />

      <textarea
        placeholder="Description MR"
        value={descriptionMr}
        onChange={(e) => setDescriptionMr(e.target.value)}
        className="border p-2 w-full"
      />

      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="border p-2 w-full"
      >
        <option value="">Select Category</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name_en}
          </option>
        ))}
      </select>

      {/* IMAGE */}
      {existingImage && (
        <img
          src={existingImage}
          alt="Preview"
          className="w-24 h-24 object-cover rounded border"
        />
      )}

      <input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />

      {/* TAG CHECKBOXES */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <label><input type="checkbox" checked={isVeg} onChange={(e)=>setIsVeg(e.target.checked)} /> Veg</label>
        <label><input type="checkbox" checked={isChefSpecial} onChange={(e)=>setIsChefSpecial(e.target.checked)} /> Chef Special</label>
        <label><input type="checkbox" checked={isPathareSpecial} onChange={(e)=>setIsPathareSpecial(e.target.checked)} /> Pathare Special</label>
        <label><input type="checkbox" checked={isBestseller} onChange={(e)=>setIsBestseller(e.target.checked)} /> Bestseller</label>
      </div>

      {/* PRICES */}
      <div className="border p-3 rounded-md space-y-2">
        <h3 className="text-sm font-medium">Prices</h3>

        {prices.map((p, i) => (
          <div key={i} className="flex gap-2 items-center">
            <input
              placeholder="Label EN (optional)"
              value={p.label_en}
              onChange={(e)=>{
                const updated=[...prices];
                updated[i].label_en=e.target.value;
                setPrices(updated);
              }}
              className="border p-2 flex-1"
            />

            <input
              type="number"
              value={p.price}
              onChange={(e)=>{
                const updated=[...prices];
                updated[i].price=Number(e.target.value);
                setPrices(updated);
              }}
              className="border p-2 w-24"
            />

            {prices.length > 1 && (
              <button
                type="button"
                onClick={()=>setPrices(prices.filter((_,idx)=>idx!==i))}
                className="text-red-500"
              >
                ✕
              </button>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={()=>setPrices([...prices,{label_en:"",label_mr:"",price:0}])}
          className="text-blue-600 text-sm"
        >
          + Add Price
        </button>
      </div>

      <button onClick={handleSubmit} className="border p-2 w-full">
        {editingDish ? "Update Dish" : "Add Dish"}
      </button>
    </div>
  );
}

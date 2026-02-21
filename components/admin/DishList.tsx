"use client";

import { supabase } from "@/lib/supabase";

interface Dish {
  id: string;
  name_en: string;
  name_mr: string;
  is_visible: boolean;
  display_order: number;
  category_id: string;
  dish_prices: {
    id: string;
    label_en: string;
    label_mr: string;
    price: number;
  }[];
}

export default function DishList({
  dishes,
  onRefresh,
  onEdit,
}: {
  dishes: Dish[];
  onRefresh: () => void;
  onEdit: (dish: Dish) => void;
}) {

  // Always work on ordered list
  const sortedDishes = [...dishes].sort(
    (a, b) => a.display_order - b.display_order
  );

  const toggleVisibility = async (dish: Dish) => {
    await supabase
      .from("dishes")
      .update({ is_visible: !dish.is_visible })
      .eq("id", dish.id);

    onRefresh();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("dish_prices").delete().eq("dish_id", id);
    await supabase.from("dishes").delete().eq("id", id);
    onRefresh();
  };

  const moveDish = async (
    dish: Dish,
    direction: "up" | "down"
  ) => {

    const index = sortedDishes.findIndex(
      (d) => d.id === dish.id
    );

    const swapWith =
      direction === "up"
        ? sortedDishes[index - 1]
        : sortedDishes[index + 1];

    if (!swapWith) return;

    // Swap order values safely
    await supabase
      .from("dishes")
      .update({ display_order: swapWith.display_order })
      .eq("id", dish.id);

    await supabase
      .from("dishes")
      .update({ display_order: dish.display_order })
      .eq("id", swapWith.id);

    onRefresh();
  };

  return (
    <div className="border p-6 rounded-md space-y-4">

      <h2 className="font-semibold">Dish List</h2>

      {sortedDishes.map((dish, index) => (
        <div
          key={dish.id}
          className="border p-3 flex justify-between items-center"
        >
          <div>

            <div className="font-medium">
              {dish.name_en} / {dish.name_mr}
              {!dish.is_visible && (
                <span className="text-red-500 text-xs ml-2">
                  (Hidden)
                </span>
              )}
            </div>

            <div className="flex gap-2 mt-1 flex-wrap">
              {dish.dish_prices.map((p) => (
                <span
                  key={p.id}
                  className="text-xs bg-gray-200 px-2 py-1 rounded"
                >
                  {p.label_en} / {p.label_mr} ₹{p.price}
                </span>
              ))}
            </div>

          </div>

          <div className="flex gap-2 text-xs items-center">

            <button
              disabled={index === 0}
              onClick={() => moveDish(dish, "up")}
              className="border px-2"
            >
              ↑
            </button>

            <button
              disabled={index === sortedDishes.length - 1}
              onClick={() => moveDish(dish, "down")}
              className="border px-2"
            >
              ↓
            </button>

            <button
              onClick={() => onEdit(dish)}
              className="border px-2"
            >
              Edit
            </button>

            <button
              onClick={() => toggleVisibility(dish)}
              className="border px-2"
            >
              {dish.is_visible ? "Hide" : "Unhide"}
            </button>

            <button
              onClick={() => handleDelete(dish.id)}
              className="border px-2 text-red-600"
            >
              Delete
            </button>

          </div>
        </div>
      ))}

    </div>
  );
}
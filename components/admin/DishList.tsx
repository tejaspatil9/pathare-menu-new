"use client";

import { useEffect, useState } from "react";
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { supabase } from "@/lib/supabase";
import { RESTAURANT_ID } from "@/lib/constants";

interface Dish {
  id: string;
  name_en: string;
  name_mr: string;
  is_visible: boolean;
  display_order: number | null;
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
  const [items, setItems] = useState<Dish[]>([]);

  useEffect(() => {
    setItems(
      [...dishes].sort(
        (a, b) => (a.display_order ?? 9999) - (b.display_order ?? 9999)
      )
    );
  }, [dishes]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex);

    setItems(reordered);

    const categoryId = reordered[0]?.category_id;

    await Promise.all(
      reordered.map((item, index) =>
        supabase
          .from("dishes")
          .update({ display_order: index + 1 })
          .eq("id", item.id)
          .eq("restaurant_id", RESTAURANT_ID)
          .eq("category_id", categoryId)
      )
    );

    onRefresh();
  };

  const toggleVisibility = async (dish: Dish) => {
    setItems(
      items.map((i) =>
        i.id === dish.id ? { ...i, is_visible: !i.is_visible } : i
      )
    );

    await supabase
      .from("dishes")
      .update({ is_visible: !dish.is_visible })
      .eq("id", dish.id)
      .eq("restaurant_id", RESTAURANT_ID);

    onRefresh();
  };

  const handleDelete = async (id: string) => {
    setItems(items.filter((i) => i.id !== id));

    await supabase.from("dish_prices").delete().eq("dish_id", id);
    await supabase
      .from("dishes")
      .delete()
      .eq("id", id)
      .eq("restaurant_id", RESTAURANT_ID);

    onRefresh();
  };

  return (
    <div className="border rounded-md p-6 space-y-4">
      <h2 className="font-semibold">Dish List</h2>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map((i) => i.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {items.map((dish) => (
              <SortableRow
                key={dish.id}
                dish={dish}
                onEdit={onEdit}
                onToggle={toggleVisibility}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

/* ================= SORTABLE ROW ================= */

function SortableRow({
  dish,
  onEdit,
  onToggle,
  onDelete,
}: {
  dish: Dish;
  onEdit: (dish: Dish) => void;
  onToggle: (dish: Dish) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: dish.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="border rounded p-3 flex justify-between items-start bg-background"
    >
      <div className="flex gap-3 flex-1">
        <span {...attributes} {...listeners} className="cursor-grab select-none">
          ☰
        </span>

        <div>
          <div className="text-sm font-medium">
            {dish.name_en} / {dish.name_mr}
            {!dish.is_visible && (
              <span className="text-red-500 text-xs ml-2">
                (Hidden)
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mt-1">
            {dish.dish_prices.map((p) => (
              <span
                key={p.id}
                className="text-xs border px-2 py-1 rounded"
              >
                {p.label_en} / {p.label_mr} ₹{p.price}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-2 text-xs ml-4">
        <button onClick={() => onEdit(dish)} className="border px-2 rounded">
          Edit
        </button>

        <button
          onClick={() => onToggle(dish)}
          className="border px-2 rounded"
        >
          {dish.is_visible ? "Hide" : "Unhide"}
        </button>

        <button
          onClick={() => onDelete(dish.id)}
          className="border px-2 rounded text-red-500"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
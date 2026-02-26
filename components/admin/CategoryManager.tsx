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

interface Category {
  id: string;
  name_en: string;
  name_mr: string;
  display_order: number | null;
}

export default function CategoryManager({
  categories,
  onRefresh,
}: {
  categories: Category[];
  onRefresh: () => void;
}) {
  const [items, setItems] = useState<Category[]>([]);
  const [nameEn, setNameEn] = useState("");
  const [nameMr, setNameMr] = useState("");

  useEffect(() => {
    setItems(
      [...categories].sort(
        (a, b) => (a.display_order ?? 9999) - (b.display_order ?? 9999)
      )
    );
  }, [categories]);

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

    await Promise.all(
      reordered.map((item, index) =>
        supabase
          .from("categories")
          .update({ display_order: index + 1 })
          .eq("id", item.id)
          .eq("restaurant_id", RESTAURANT_ID)
      )
    );

    onRefresh();
  };

  const handleAdd = async () => {
    if (!nameEn.trim() || !nameMr.trim()) return;

    const { data } = await supabase
      .from("categories")
      .insert([
        {
          restaurant_id: RESTAURANT_ID,
          name_en: nameEn.trim(),
          name_mr: nameMr.trim(),
          display_order: items.length + 1,
        },
      ])
      .select()
      .single();

    if (data) setItems([...items, data]);

    setNameEn("");
    setNameMr("");
  };

  const handleDelete = async (id: string) => {
    setItems(items.filter((i) => i.id !== id));

    await supabase
      .from("categories")
      .delete()
      .eq("id", id)
      .eq("restaurant_id", RESTAURANT_ID);

    onRefresh();
  };

  const handleUpdate = async (
    id: string,
    nameEn: string,
    nameMr: string
  ) => {
    setItems(
      items.map((i) =>
        i.id === id ? { ...i, name_en: nameEn, name_mr: nameMr } : i
      )
    );

    await supabase
      .from("categories")
      .update({ name_en: nameEn, name_mr: nameMr })
      .eq("id", id)
      .eq("restaurant_id", RESTAURANT_ID);
  };

  return (
    <div className="border rounded-md p-6 space-y-4">
      <h2 className="font-semibold">Manage Categories</h2>

      <div className="flex gap-2">
        <input
          placeholder="Category EN"
          value={nameEn}
          onChange={(e) => setNameEn(e.target.value)}
          className="border p-2 flex-1 rounded"
        />
        <input
          placeholder="Category MR"
          value={nameMr}
          onChange={(e) => setNameMr(e.target.value)}
          className="border p-2 flex-1 rounded"
        />
        <button onClick={handleAdd} className="border px-3 rounded">
          Add
        </button>
      </div>

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
            {items.map((cat) => (
              <SortableRow
                key={cat.id}
                category={cat}
                onDelete={handleDelete}
                onUpdate={handleUpdate}
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
  category,
  onDelete,
  onUpdate,
}: {
  category: Category;
  onDelete: (id: string) => void;
  onUpdate: (id: string, nameEn: string, nameMr: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const [editing, setEditing] = useState(false);
  const [nameEn, setNameEn] = useState(category.name_en);
  const [nameMr, setNameMr] = useState(category.name_mr);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="border rounded p-3 flex justify-between items-center bg-background"
    >
      <div className="flex items-center gap-3 flex-1">
        <span
          {...attributes}
          {...listeners}
          className="cursor-grab select-none"
        >
          ☰
        </span>

        {editing ? (
          <div className="flex gap-2 flex-1">
            <input
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              className="border p-1 flex-1 rounded text-sm"
            />
            <input
              value={nameMr}
              onChange={(e) => setNameMr(e.target.value)}
              className="border p-1 flex-1 rounded text-sm"
            />
          </div>
        ) : (
          <span className="text-sm">
            {category.name_en} / {category.name_mr}
          </span>
        )}
      </div>

      <div className="flex gap-3 text-xs ml-3">
        {editing ? (
          <button
            onClick={() => {
              if (!nameEn.trim() || !nameMr.trim()) return;
              onUpdate(category.id, nameEn.trim(), nameMr.trim());
              setEditing(false);
            }}
          >
            Save
          </button>
        ) : (
          <button onClick={() => setEditing(true)}>Edit</button>
        )}

        <button onClick={() => onDelete(category.id)} className="text-red-500">
          Delete
        </button>
      </div>
    </div>
  );
}
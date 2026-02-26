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

interface AlcoholCategory {
  id: string;
  name_en: string;
  display_order: number;
}

interface Props {
  categories: AlcoholCategory[];
  onRefresh: () => void;
}

/* ================= SORTABLE ROW ================= */

function SortableItem({
  category,
  onDelete,
  onUpdateName,
}: {
  category: AlcoholCategory;
  onDelete: (id: string) => void;
  onUpdateName: (id: string, name: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState(category.name_en);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-[#111] border border-gray-700 px-4 py-3 rounded-lg flex justify-between items-center text-white"
    >
      <div className="flex items-center gap-3 flex-1">
        {/* Drag Handle Only */}
        <span
          {...attributes}
          {...listeners}
          className="cursor-grab text-gray-400 text-lg select-none"
        >
          ☰
        </span>

        {editing ? (
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="bg-black border border-gray-600 px-2 py-1 rounded text-sm flex-1"
          />
        ) : (
          <span className="text-sm font-medium">
            {category.name_en}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3 ml-4">
        {editing ? (
          <button
            onClick={() => {
              if (!newName.trim()) return;
              onUpdateName(category.id, newName.trim());
              setEditing(false);
            }}
            className="text-green-400 text-xs"
          >
            Save
          </button>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="text-blue-400 text-xs"
          >
            Edit
          </button>
        )}

        <button
          onClick={() => onDelete(category.id)}
          className="text-red-400 text-xs"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

/* ================= MAIN COMPONENT ================= */

export default function AlcoholCategoryManager({
  categories,
  onRefresh,
}: Props) {
  const [items, setItems] = useState<AlcoholCategory[]>([]);
  const [name, setName] = useState("");

  useEffect(() => {
    const sorted = [...categories].sort(
      (a, b) => a.display_order - b.display_order
    );
    setItems(sorted);
  }, [categories]);

  /* ===== Prevent accidental mobile drag ===== */
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  /* ================= DRAG END ================= */

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);

    const reordered = arrayMove(items, oldIndex, newIndex);

    // optimistic UI
    setItems(reordered);

    // safe scoped batch update
    await Promise.all(
      reordered.map((item, index) =>
        supabase
          .from("alcohol_categories")
          .update({ display_order: index + 1 })
          .eq("id", item.id)
          .eq("restaurant_id", RESTAURANT_ID)
      )
    );

    onRefresh();
  };

  /* ================= ADD CATEGORY ================= */

  const addCategory = async () => {
    if (!name.trim()) return;

    const { data } = await supabase
      .from("alcohol_categories")
      .insert([
        {
          restaurant_id: RESTAURANT_ID,
          name_en: name.trim(),
          display_order: items.length + 1,
        },
      ])
      .select()
      .single();

    if (data) {
      setItems([...items, data]); // optimistic add
    }

    setName("");
  };

  /* ================= DELETE ================= */

  const deleteCategory = async (id: string) => {
    setItems(items.filter((i) => i.id !== id));

    await supabase
      .from("alcohol_categories")
      .delete()
      .eq("id", id)
      .eq("restaurant_id", RESTAURANT_ID);
  };

  /* ================= UPDATE NAME ================= */

  const updateName = async (id: string, newName: string) => {
    setItems(
      items.map((i) =>
        i.id === id ? { ...i, name_en: newName } : i
      )
    );

    await supabase
      .from("alcohol_categories")
      .update({ name_en: newName })
      .eq("id", id)
      .eq("restaurant_id", RESTAURANT_ID);
  };

  return (
    <div className="bg-[#0d0d0d] border border-gray-800 p-6 rounded-xl space-y-6">
      <h2 className="text-white font-semibold text-lg">
        Alcohol Categories
      </h2>

      <div className="flex gap-3">
        <input
          placeholder="Category Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-[#1a1a1a] border border-gray-700 text-white placeholder-gray-500 px-3 py-2 rounded-md flex-1"
        />
        <button
          onClick={addCategory}
          className="bg-white text-black px-4 py-2 rounded-md text-sm"
        >
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
          <div className="space-y-3">
            {items.map((category) => (
              <SortableItem
                key={category.id}
                category={category}
                onDelete={deleteCategory}
                onUpdateName={updateName}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEffect, useState } from "react";

import { reorderSitesAction } from "@/app/admin/actions";
import type { Category, Site } from "@/db/schema";

import { AdminSiteForm } from "@/components/admin-site-form";

type AdminSortableSiteListProps = {
  categories: Category[];
  categoryId: number;
  sites: Site[];
};

type SortableSiteProps = {
  categories: Category[];
  index: number;
  site: Site;
};

function SortableSite({ categories, index, site }: SortableSiteProps) {
  const {
    attributes,
    isDragging,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: site.id });

  return (
    <AdminSiteForm
      categories={categories}
      dragHandleProps={{
        ...attributes,
        ...listeners,
        ref: setActivatorNodeRef,
      }}
      index={index}
      isDragging={isDragging}
      setNodeRef={setNodeRef}
      site={site}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    />
  );
}

export function AdminSortableSiteList({
  categories,
  categoryId,
  sites,
}: AdminSortableSiteListProps) {
  const [orderedSites, setOrderedSites] = useState(sites);
  const [message, setMessage] = useState("");
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    setOrderedSites(sites);
  }, [sites]);

  async function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;

    const oldIndex = orderedSites.findIndex((site) => site.id === active.id);
    const newIndex = orderedSites.findIndex((site) => site.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const previousSites = orderedSites;
    const nextSites = arrayMove(orderedSites, oldIndex, newIndex);
    setOrderedSites(nextSites);
    setMessage("Saving order…");

    try {
      const result = await reorderSitesAction(categoryId, nextSites.map((site) => site.id));
      if (result.ok) {
        setMessage("Order saved");
        return;
      }

      setOrderedSites(previousSites);
      setMessage(result.error);
    } catch {
      setOrderedSites(previousSites);
      setMessage("Could not save the new order. Try again.");
    }
  }

  return (
    <>
      <DndContext
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        sensors={sensors}
      >
        <SortableContext
          items={orderedSites.map((site) => site.id)}
          strategy={verticalListSortingStrategy}
        >
          <ul className="admin-site-list">
            {orderedSites.map((site, index) => (
              <SortableSite categories={categories} index={index} key={site.id} site={site} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
      <p aria-live="polite" className="reorder-status">{message}</p>
    </>
  );
}

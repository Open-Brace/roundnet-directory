"use server";

import { and, asc, eq, max } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getDb } from "@/db";
import { categories, sites, type Site } from "@/db/schema";
import { clearAdminSession, isAdmin } from "@/lib/admin-auth";
import { normalizeSiteUrl } from "@/lib/site-url";

async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}

function adminRedirect(type: "error" | "notice", message: string): never {
  redirect(`/admin?${type}=${encodeURIComponent(message)}`);
}

function parseStatus(value: FormDataEntryValue | null): Site["status"] {
  if (value === "approved" || value === "rejected" || value === "pending") return value;
  return "pending";
}

async function requireCategory(value: FormDataEntryValue | null) {
  const categoryId = Number(value);
  if (!Number.isInteger(categoryId) || categoryId < 1) {
    adminRedirect("error", "Choose a category.");
  }

  const [category] = await getDb()
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.id, categoryId))
    .limit(1);

  if (!category) adminRedirect("error", "Choose a valid category.");
  return category.id;
}

async function getNextPosition(categoryId: number) {
  const [result] = await getDb()
    .select({ position: max(sites.position) })
    .from(sites)
    .where(
      and(
        eq(sites.status, "approved"),
        eq(sites.categoryId, categoryId),
      ),
    );

  return (result?.position ?? -1) + 1;
}

export async function logoutAction() {
  await clearAdminSession();
  redirect("/admin/login");
}

export async function addSiteAction(formData: FormData) {
  await requireAdmin();

  const title = String(formData.get("title") ?? "").trim().slice(0, 120);
  const status = parseStatus(formData.get("statusOverride") ?? formData.get("status"));
  const categoryId = await requireCategory(formData.get("categoryId"));
  if (!title) adminRedirect("error", "A title is required.");

  let url: string;
  try {
    url = normalizeSiteUrl(String(formData.get("url") ?? ""));
  } catch (error) {
    adminRedirect("error", error instanceof Error ? error.message : "Enter a valid URL.");
  }

  try {
    await getDb()
      .insert(sites)
      .values({
        title,
        url,
        categoryId,
        status,
        position: status === "approved" ? await getNextPosition(categoryId) : 0,
      });
  } catch {
    adminRedirect("error", "That URL already exists.");
  }

  revalidatePath("/");
  revalidatePath("/admin");
  adminRedirect("notice", "Site added.");
}

export async function updateSiteAction(id: number, formData: FormData) {
  await requireAdmin();

  const [existing] = await getDb().select().from(sites).where(eq(sites.id, id)).limit(1);
  if (!existing) adminRedirect("error", "Site not found.");

  const title = String(formData.get("title") ?? "").trim().slice(0, 120);
  const status = parseStatus(formData.get("statusOverride") ?? formData.get("status"));
  const categoryId = await requireCategory(formData.get("categoryId"));
  if (!title) adminRedirect("error", "A title is required.");

  let url: string;
  try {
    url = normalizeSiteUrl(String(formData.get("url") ?? ""));
  } catch (error) {
    adminRedirect("error", error instanceof Error ? error.message : "Enter a valid URL.");
  }

  try {
    await getDb()
      .update(sites)
      .set({
        title,
        url,
        categoryId,
        status,
        position:
          status === "approved" &&
          (existing.status !== "approved" || existing.categoryId !== categoryId)
            ? await getNextPosition(categoryId)
            : existing.position,
        updatedAt: new Date(),
      })
      .where(eq(sites.id, id));
  } catch {
    adminRedirect("error", "That URL already exists.");
  }

  revalidatePath("/");
  revalidatePath("/admin");
  adminRedirect("notice", "Changes saved.");
}

export async function deleteSiteAction(id: number, _formData: FormData) {
  await requireAdmin();

  if (!Number.isInteger(id) || id < 1) adminRedirect("error", "Invalid site.");

  const [existing] = await getDb()
    .select()
    .from(sites)
    .where(eq(sites.id, id))
    .limit(1);

  if (!existing) adminRedirect("error", "Site not found.");

  const remainingSites = existing.status === "approved" && existing.categoryId
    ? await getDb()
        .select({ id: sites.id })
        .from(sites)
        .where(
          and(
            eq(sites.status, "approved"),
            eq(sites.categoryId, existing.categoryId),
          ),
        )
        .orderBy(asc(sites.position), asc(sites.createdAt))
    : [];

  const updatedAt = new Date();
  const reorderQueries = remainingSites
    .filter((site) => site.id !== id)
    .map((site, position) =>
      getDb()
        .update(sites)
        .set({ position, updatedAt })
        .where(eq(sites.id, site.id)),
    );
  const deleteQuery = getDb().delete(sites).where(eq(sites.id, id));

  try {
    await getDb().batch([deleteQuery, ...reorderQueries]);
  } catch {
    adminRedirect("error", "Could not delete that site. Try again.");
  }

  revalidatePath("/");
  revalidatePath("/admin");
  adminRedirect("notice", `Deleted ${existing.title}.`);
}

export async function reorderSitesAction(categoryId: number, orderedSiteIds: number[]) {
  await requireAdmin();

  if (
    !Number.isInteger(categoryId) ||
    orderedSiteIds.length === 0 ||
    orderedSiteIds.some((id) => !Number.isInteger(id)) ||
    new Set(orderedSiteIds).size !== orderedSiteIds.length
  ) {
    return { ok: false as const, error: "Invalid site order." };
  }

  const currentSites = await getDb()
    .select({ id: sites.id })
    .from(sites)
    .where(
      and(
        eq(sites.status, "approved"),
        eq(sites.categoryId, categoryId),
      ),
    );

  const currentIds = new Set(currentSites.map((site) => site.id));
  if (
    currentIds.size !== orderedSiteIds.length ||
    orderedSiteIds.some((id) => !currentIds.has(id))
  ) {
    return { ok: false as const, error: "The site list changed. Refresh and try again." };
  }

  const updatedAt = new Date();
  const updates = orderedSiteIds.map((id, position) =>
    getDb()
      .update(sites)
      .set({ position, updatedAt })
      .where(
        and(
          eq(sites.id, id),
          eq(sites.categoryId, categoryId),
          eq(sites.status, "approved"),
        ),
      ),
  );

  try {
    await getDb().batch([updates[0]!, ...updates.slice(1)]);
  } catch {
    return { ok: false as const, error: "Could not save the new order. Try again." };
  }

  revalidatePath("/");
  revalidatePath("/admin");
  return { ok: true as const };
}

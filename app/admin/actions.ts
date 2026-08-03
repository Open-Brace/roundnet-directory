"use server";

import { and, asc, desc, eq, inArray, max, sql } from "drizzle-orm";
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

export async function moveSiteAction(id: number, direction: "up" | "down") {
  await requireAdmin();

  const [current] = await getDb()
    .select()
    .from(sites)
    .where(and(eq(sites.id, id), eq(sites.status, "approved")))
    .limit(1);

  if (!current) adminRedirect("error", "Approved site not found.");
  if (!current.categoryId) adminRedirect("error", "Site category not found.");

  const candidates = await getDb()
    .select()
    .from(sites)
    .where(
      and(
        eq(sites.status, "approved"),
        eq(sites.categoryId, current.categoryId),
      ),
    )
    .orderBy(direction === "up" ? desc(sites.position) : asc(sites.position));

  const adjacent = candidates.find((candidate) =>
    direction === "up"
      ? candidate.position < current.position
      : candidate.position > current.position,
  );

  if (adjacent) {
    await getDb()
      .update(sites)
      .set({
        position: sql<number>`CASE WHEN ${sites.id} = ${current.id} THEN ${adjacent.position} ELSE ${current.position} END`,
        updatedAt: new Date(),
      })
      .where(inArray(sites.id, [current.id, adjacent.id]));
  }

  revalidatePath("/");
  revalidatePath("/admin");
  redirect("/admin");
}

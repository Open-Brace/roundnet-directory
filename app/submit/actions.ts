"use server";

import { revalidatePath } from "next/cache";

import { getDb } from "@/db";
import { categories, sites } from "@/db/schema";
import { eq } from "drizzle-orm";
import { normalizeSiteUrl } from "@/lib/site-url";

export type SubmissionState = {
  status: "idle" | "error" | "success";
  message: string;
};

export async function submitSite(
  _previousState: SubmissionState,
  formData: FormData,
): Promise<SubmissionState> {
  if (String(formData.get("company") ?? "").trim()) {
    return { status: "success", message: "Thanks — your suggestion is in review." };
  }

  const rawUrl = String(formData.get("url") ?? "");
  const title = String(formData.get("title") ?? "").trim().slice(0, 120);
  const categoryId = Number(formData.get("categoryId"));

  if (!title) {
    return { status: "error", message: "Add a proposed site name." };
  }

  if (!Number.isInteger(categoryId) || categoryId < 1) {
    return { status: "error", message: "Choose a category." };
  }

  const [category] = await getDb()
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.id, categoryId))
    .limit(1);

  if (!category) {
    return { status: "error", message: "Choose a valid category." };
  }

  let url: string;
  try {
    url = normalizeSiteUrl(rawUrl);
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Enter a valid website address.",
    };
  }

  const inserted = await getDb()
    .insert(sites)
    .values({ categoryId, title, url, status: "pending", position: 0 })
    .onConflictDoNothing({ target: sites.url })
    .returning({ id: sites.id });

  if (inserted.length === 0) {
    return { status: "error", message: "That website is already listed or awaiting review." };
  }

  revalidatePath("/admin");
  return { status: "success", message: "Thanks — your suggestion is in review." };
}

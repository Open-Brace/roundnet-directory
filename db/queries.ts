import { asc, eq } from "drizzle-orm";

import { getDb } from "@/db";
import { categories, sites } from "@/db/schema";

export async function getApprovedSites() {
  return getDb()
    .select({ category: categories, site: sites })
    .from(sites)
    .innerJoin(categories, eq(sites.categoryId, categories.id))
    .where(eq(sites.status, "approved"))
    .orderBy(
      asc(categories.position),
      asc(sites.position),
      asc(sites.createdAt),
    );
}

export async function getAllSites() {
  return getDb()
    .select()
    .from(sites)
    .orderBy(asc(sites.categoryId), asc(sites.position), asc(sites.createdAt));
}

export async function getCategories() {
  return getDb()
    .select()
    .from(categories)
    .orderBy(asc(categories.position), asc(categories.createdAt));
}

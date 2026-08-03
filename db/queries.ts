import { asc, eq } from "drizzle-orm";

import { getDb } from "@/db";
import { sites } from "@/db/schema";

export async function getApprovedSites() {
  return getDb()
    .select()
    .from(sites)
    .where(eq(sites.status, "approved"))
    .orderBy(asc(sites.position), asc(sites.createdAt));
}

export async function getAllSites() {
  return getDb().select().from(sites).orderBy(asc(sites.position), asc(sites.createdAt));
}

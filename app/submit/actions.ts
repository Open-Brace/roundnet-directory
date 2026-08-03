"use server";

import { revalidatePath } from "next/cache";

import { getDb } from "@/db";
import { sites } from "@/db/schema";
import { normalizeSiteUrl } from "@/lib/site-url";

export type SubmissionState = {
  status: "idle" | "error" | "success";
  message: string;
};

export const initialSubmissionState: SubmissionState = {
  status: "idle",
  message: "",
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

  if (!title) {
    return { status: "error", message: "Add a proposed site name." };
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
    .values({ title, url, status: "pending", position: 0 })
    .onConflictDoNothing({ target: sites.url })
    .returning({ id: sites.id });

  if (inserted.length === 0) {
    return { status: "error", message: "That website is already listed or awaiting review." };
  }

  revalidatePath("/admin");
  return { status: "success", message: "Thanks — your suggestion is in review." };
}

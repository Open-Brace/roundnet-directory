"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  createAdminSession,
  isValidAdminPassword,
} from "@/lib/admin-auth";

export type LoginState = { error: string };

export async function loginAction(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const password = String(formData.get("password") ?? "");

  if (!process.env.ADMIN_PASSWORD || !process.env.ADMIN_SESSION_SECRET) {
    return { error: "Admin login has not been configured yet." };
  }

  if (!isValidAdminPassword(password)) {
    return { error: "Incorrect password." };
  }

  const session = createAdminSession();
  (await cookies()).set(session.name, session.value, session.options);
  redirect("/admin");
}

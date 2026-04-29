import "server-only";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "adapta_admin";

export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  const value = store.get(ADMIN_COOKIE)?.value;
  return typeof value === "string" && value.length > 0;
}

export async function getAdminUsername(): Promise<string | null> {
  const store = await cookies();
  const value = store.get(ADMIN_COOKIE)?.value;
  return value && value.length > 0 ? value : null;
}

export async function setAdminCookie(username: string): Promise<void> {
  const store = await cookies();
  store.set(ADMIN_COOKIE, username, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 7 dias
  });
}

export async function clearAdminCookie(): Promise<void> {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
}

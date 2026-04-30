import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE } from "@/lib/admin-auth";

const PHONE_COOKIE = "adapta_phone";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Admin routes ──────────────────────────────────────────────────────────
  const adminCookie = request.cookies.get(ADMIN_COOKIE)?.value;
  const isAdminLoggedIn = typeof adminCookie === "string" && adminCookie.length > 0;

  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    if (!isAdminLoggedIn) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("from", pathname);
      return NextResponse.redirect(url);
    }
  }

  if (pathname === "/admin/login" && isAdminLoggedIn) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/dashboard";
    return NextResponse.redirect(url);
  }

  // ── Customer reservations ─────────────────────────────────────────────────
  const phoneCookie = request.cookies.get(PHONE_COOKIE)?.value;
  const isPhoneLoggedIn = typeof phoneCookie === "string" && phoneCookie.length > 0;

  const protectedCustomer = pathname === "/" || pathname === "/reservas";
  if (protectedCustomer && !isPhoneLoggedIn) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("returnUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (pathname === "/login" && isPhoneLoggedIn) {
    const returnUrl = request.nextUrl.searchParams.get("returnUrl") ?? "/";
    const url = request.nextUrl.clone();
    url.pathname = returnUrl;
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/", "/reservas", "/login"],
};

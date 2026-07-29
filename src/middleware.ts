import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE } from "@/lib/admin-auth";

const USER_COOKIE = "adapta_user";

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
  const userCookie = request.cookies.get(USER_COOKIE)?.value;
  const isUserLoggedIn = typeof userCookie === "string" && userCookie.length > 0;

  const protectedCustomer = pathname === "/" || pathname === "/reservas";
  if (protectedCustomer && !isUserLoggedIn) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("returnUrl", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/", "/reservas", "/login"],
};

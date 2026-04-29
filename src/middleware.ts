import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE } from "@/lib/admin-auth";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const cookieValue = request.cookies.get(ADMIN_COOKIE)?.value;
  const isLoggedIn = typeof cookieValue === "string" && cookieValue.length > 0;

  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    if (!isLoggedIn) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("from", pathname);
      return NextResponse.redirect(url);
    }
  }

  if (pathname === "/admin/login" && isLoggedIn) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};

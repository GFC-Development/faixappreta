import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const BASE_DOMAIN = "faixappreta.com.br";

function getSubdomainSlug(req: NextRequest): string | null {
  const hostname = req.headers.get("host")?.split(":")[0] ?? "";

  // In production: extract slug from {slug}.faixappreta.com.br
  if (hostname.endsWith(`.${BASE_DOMAIN}`)) {
    const slug = hostname.replace(`.${BASE_DOMAIN}`, "");
    if (slug && slug !== "www") return slug;
  }

  // In local dev: use ?tenant= param directly (no subdomain extraction)
  return null;
}

function isSiteRequest(req: NextRequest): boolean {
  const hostname = req.headers.get("host")?.split(":")[0] ?? "";
  if (hostname === BASE_DOMAIN || hostname === `www.${BASE_DOMAIN}`) return true;
  if (hostname === "localhost") {
    if (req.nextUrl.searchParams.has("site")) return true;
    if (req.cookies.get("site_mode")?.value === "1") return true;
  }
  return false;
}

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Subdomain tenant routing: {slug}.faixappreta.com.br → inject ?tenant={slug}
  const tenantSlug = getSubdomainSlug(req);
  if (tenantSlug) {
    // Static assets and API calls pass through
    if (
      pathname.startsWith("/_next") ||
      pathname.startsWith("/api") ||
      pathname.startsWith("/favicon")
    ) {
      return NextResponse.next();
    }

    // For login, register, and root, redirect adding ?tenant={slug}
    if (pathname === "/" || pathname === "/login" || pathname === "/register") {
      const target = pathname === "/" ? "/login" : pathname;
      // Skip redirect if tenant param already present
      if (!req.nextUrl.searchParams.has("tenant")) {
        const url = req.nextUrl.clone();
        url.pathname = target;
        url.searchParams.set("tenant", tenantSlug);
        return NextResponse.redirect(url);
      }
    }

    // Dashboard, super-admin, and other paths continue normally
  }

  // Super admin routes protection
  if (pathname.startsWith("/super-admin") && !pathname.startsWith("/super-admin/login")) {
    const token = req.cookies.get("super-admin-token")?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/super-admin/login", req.url));
    }
    try {
      const secret = new TextEncoder().encode(
        process.env.SUPER_ADMIN_JWT_SECRET || process.env.NEXTAUTH_SECRET || "super-admin-secret-dev"
      );
      await jwtVerify(token, secret);
    } catch {
      return NextResponse.redirect(new URL("/super-admin/login", req.url));
    }
  }

  // Site institucional: rewrite to /site/...
  if (isSiteRequest(req)) {
    if (
      pathname.startsWith("/_next") ||
      pathname.startsWith("/api") ||
      pathname.startsWith("/favicon") ||
      pathname.startsWith("/site/") ||
      pathname.startsWith("/super-admin") ||
      pathname.startsWith("/login") ||
      pathname.startsWith("/register") ||
      pathname.startsWith("/admin") ||
      pathname.startsWith("/student") ||
      pathname === "/logo.png"
    ) {
      return NextResponse.next();
    }
    const url = req.nextUrl.clone();
    url.pathname = `/site${pathname === "/" ? "" : pathname}`;
    const response = NextResponse.rewrite(url);
    if (req.headers.get("host")?.startsWith("localhost")) {
      response.cookies.set("site_mode", "1", { path: "/", maxAge: 60 * 60 });
    }
    return response;
  }

  // Dashboard auth: only protect /admin and /student
  if (pathname.startsWith("/admin") || pathname.startsWith("/student")) {
    const token = await getToken({ req });

    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    if (pathname.startsWith("/admin") && token.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/student", req.url));
    }

    if (pathname.startsWith("/student") && token.role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo.png|uploads).*)",
  ],
};

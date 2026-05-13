import { NextRequest, NextResponse } from "next/server";
import { createMiddlewareClient } from "@repo/supabase/middleware";

const DEPARTMENT_ROUTES = [
  "drilling",
  "production",
  "access-control",
  "engineering",
  "control-room",
  "safety",
  "training",
];

const VALID_ROLES = ["admin", "supervisor", "operator", "viewer"] as const;
type Role = (typeof VALID_ROLES)[number];

const RESTRICTED_ROUTES: Record<string, Role[]> = {
  "control-room": ["control_room_operator", "admin"],
  tools: ["admin", "supervisor"],
};

function normalizeRole(role: unknown): Role {
  if (typeof role === "string" && VALID_ROLES.includes(role as Role)) {
    return role as Role;
  }
  return "operator";
}

export async function middleware(request: NextRequest) {
  const { supabase, response } = await createMiddlewareClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Allow login page through
  if (pathname.startsWith("/login")) {
    if (user) return NextResponse.redirect(new URL("/", request.url));
    return response;
  }

  // Not authenticated -> login
  if (!user) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Normalize role before any authorization checks
  const userRole = normalizeRole(user.user_metadata?.role);
  const userDept = user.user_metadata?.department_id;
  const accessible = user.user_metadata?.accessible_departments || [];

  const pathSegments = pathname.split("/").filter(Boolean);
  const topSegment = pathSegments[0];
  const secondSegment = pathSegments[1];

  // Check restricted top-level routes
  for (const [route, allowedRoles] of Object.entries(RESTRICTED_ROUTES)) {
    if (pathname.startsWith(`/${route}`) && !allowedRoles.includes(userRole)) {
      const redirectUrl = new URL("/", request.url);
      redirectUrl.searchParams.set("error", "unauthorized_department");
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Also check /{dept}/tools restriction
  if (
    secondSegment === "tools" &&
    !RESTRICTED_ROUTES.tools.includes(userRole)
  ) {
    const redirectUrl = new URL("/", request.url);
    redirectUrl.searchParams.set("error", "unauthorized_department");
    return NextResponse.redirect(redirectUrl);
  }

  // Check department isolation
  if (topSegment && DEPARTMENT_ROUTES.includes(topSegment)) {
    const isAdmin = userRole === "admin";

    // Resolve department slug to UUID for proper comparison
    const { data: deptData } = await supabase
      .from("departments")
      .select("id")
      .eq("name", topSegment)
      .single();

    const deptUuid = deptData?.id;
    if (!deptUuid) {
      const redirectUrl = new URL("/", request.url);
      redirectUrl.searchParams.set("error", "unknown_department");
      return NextResponse.redirect(redirectUrl);
    }

    const hasAccess =
      isAdmin || userDept === deptUuid || accessible.includes(deptUuid);
    if (!hasAccess) {
      const redirectUrl = new URL("/", request.url);
      redirectUrl.searchParams.set("error", "unauthorized_department");
      return NextResponse.redirect(redirectUrl);
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*))"],
};

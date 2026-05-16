import { NextRequest, NextResponse } from "next/server";
import { createMiddlewareClient } from "@repo/supabase/middleware";
import { cacheGet, cacheSet } from "@repo/redis/cache";

const DEPARTMENT_ROUTES = [
  "drilling",
  "production",
  "access-control",
  "engineering",
  "control-room",
  "safety",
  "training",
  "satellite-monitoring",
];

const RESTRICTED_ROUTES: Record<string, string[]> = {
  "control-room": ["control_room_operator", "admin"],
  tools: ["admin", "supervisor"],
  admin: ["admin"],
};

export function normalizeRole(role: unknown): string {
  return typeof role === "string" && role.length > 0 ? role : "operator";
}

function redirectWithError(request: NextRequest, error: string) {
  const url = new URL("/", request.url);
  url.searchParams.set("error", error);
  return NextResponse.redirect(url);
}

async function resolveDeptUuid(
  supabase: Awaited<ReturnType<typeof createMiddlewareClient>>["supabase"],
  slug: string,
): Promise<string | null> {
  const cacheKey = `dept:uuid:${slug}`;
  const cached = await cacheGet<string>(cacheKey);
  if (cached) return cached;

  const { data } = await supabase
    .from("departments")
    .select("id")
    .eq("name", slug)
    .single();
  if (data?.id) {
    await cacheSet(cacheKey, data.id, 3600); // 1 hour
  }
  return data?.id || null;
}

export async function middleware(request: NextRequest) {
  const { supabase, response } = await createMiddlewareClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Skip public files (images, fonts, etc. in /public folder)
  const PUBLIC_FILE_EXTENSIONS =
    /\.(jpg|jpeg|png|gif|svg|ico|woff|woff2|ttf|otf|eot|mp4|webm|mp3|wav)$/i;
  if (PUBLIC_FILE_EXTENSIONS.test(pathname)) {
    return response;
  }

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

  // Fetch authoritative role/department from employees table
  const { data: employee } = await supabase
    .from("employees")
    .select("role, department_id, accessible_departments")
    .eq("auth_id", user.id)
    .single();

  const userRole = normalizeRole(employee?.role);
  const userDept = employee?.department_id ?? null;
  const accessible = employee?.accessible_departments ?? [];

  const pathSegments = pathname.split("/").filter(Boolean);
  const topSegment = pathSegments[0];
  const secondSegment = pathSegments[1];

  // Check restricted top-level routes
  for (const [route, allowedRoles] of Object.entries(RESTRICTED_ROUTES)) {
    if (pathname.startsWith(`/${route}`) && !allowedRoles.includes(userRole)) {
      return redirectWithError(request, "unauthorized_department");
    }
  }

  // Also check /{dept}/tools restriction
  if (
    secondSegment === "tools" &&
    RESTRICTED_ROUTES.tools &&
    !RESTRICTED_ROUTES.tools.includes(userRole)
  ) {
    return redirectWithError(request, "unauthorized_department");
  }

  // Check department isolation
  if (topSegment && DEPARTMENT_ROUTES.includes(topSegment)) {
    const isAdmin = userRole === "admin";

    const deptUuid = await resolveDeptUuid(supabase, topSegment);
    if (!deptUuid) {
      return redirectWithError(request, "unknown_department");
    }

    const hasAccess =
      isAdmin || userDept === deptUuid || accessible.includes(deptUuid);
    if (!hasAccess) {
      return redirectWithError(request, "unauthorized_department");
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

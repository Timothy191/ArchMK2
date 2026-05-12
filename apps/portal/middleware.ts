import { NextRequest, NextResponse } from 'next/server';
import { createMiddlewareClient } from '@repo/supabase/middleware';

const DEPARTMENT_ROUTES = [
  'drilling', 'production', 'access-control',
  'engineering', 'control-room', 'safety', 'training'
];

const RESTRICTED_ROUTES: Record<string, string[]> = {
  'control-room': ['control_room_operator', 'admin'],
  'tools': ['admin', 'supervisor'],
};

export async function middleware(request: NextRequest) {
  const { supabase, response } = await createMiddlewareClient(request);
  const { data: { user } } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Allow login page through
  if (pathname.startsWith('/login')) {
    if (user) return NextResponse.redirect(new URL('/', request.url));
    return response;
  }

  // Not authenticated -> login
  if (!user) {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Check restricted routes
  const userRole = user.user_metadata?.role || 'operator';
  const userDept = user.user_metadata?.department_id;
  const accessible = user.user_metadata?.accessible_departments || [];

  for (const [route, allowedRoles] of Object.entries(RESTRICTED_ROUTES)) {
    if (pathname.startsWith(`/${route}`) && !allowedRoles.includes(userRole)) {
      const redirectUrl = new URL('/', request.url);
      redirectUrl.searchParams.set('error', 'unauthorized_department');
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Check department isolation
  const deptSegment = pathname.split('/')[1];
  if (deptSegment && DEPARTMENT_ROUTES.includes(deptSegment)) {
    const isAdmin = userRole === 'admin';
    const hasAccess = isAdmin || userDept === deptSegment || accessible.includes(deptSegment);
    if (!hasAccess) {
      const redirectUrl = new URL('/', request.url);
      redirectUrl.searchParams.set('error', 'unauthorized_department');
      return NextResponse.redirect(redirectUrl);
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

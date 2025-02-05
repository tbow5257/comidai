
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAuthUser } from "./app/lib/auth";

export async function middleware(request: NextRequest) {
  // Don't protect auth-related routes
  if (request.nextUrl.pathname.startsWith('/auth') || 
      request.nextUrl.pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  const user = await getAuthUser();
  
  if (!user) {
    // Redirect to auth page if no valid session
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}

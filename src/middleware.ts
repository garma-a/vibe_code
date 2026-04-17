import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  // A simplistic mock middleware for quick testing
  const mockRole = request.cookies.get("mock-role")?.value;
  const isLoginPage = request.nextUrl.pathname.startsWith('/login');
  
  if (!mockRole && !isLoginPage) {
    if (request.nextUrl.pathname !== '/') {
        return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Redirect to correct dashboard based on role
  if (mockRole && isLoginPage) {
    if (mockRole === 'admin') return NextResponse.redirect(new URL('/admin', request.url));
    if (mockRole === 'branch_manager') return NextResponse.redirect(new URL('/manager', request.url));
    if (mockRole === 'secretary') return NextResponse.redirect(new URL('/secretary', request.url));
    return NextResponse.redirect(new URL('/employee', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};

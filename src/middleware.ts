import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isOnDashboard =
    req.nextUrl.pathname.startsWith('/dashboard') ||
    req.nextUrl.pathname.startsWith('/clients') ||
    req.nextUrl.pathname.startsWith('/products') ||
    req.nextUrl.pathname.startsWith('/orders') ||
    req.nextUrl.pathname.startsWith('/reports') ||
    req.nextUrl.pathname.startsWith('/settings') ||
    req.nextUrl.pathname.startsWith('/offers')

  if (isOnDashboard && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', req.nextUrl))
  }

  if (req.nextUrl.pathname === '/' && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl))
  }

  if (req.nextUrl.pathname === '/' && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', req.nextUrl))
  }

  if (req.nextUrl.pathname === '/login' && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}

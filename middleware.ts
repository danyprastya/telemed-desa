import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_ROUTES = ['/login']

/**
 * Maps route prefixes to the role required to access them.
 * Paths not in this map are accessible to any authenticated user.
 */
const ROLE_ROUTES: Record<string, string> = {
  '/admin':  'admin',
  '/nurse':  'nurse',
  '/doctor': 'doctor',
}

/**
 * In-memory rate limiter for the login endpoint.
 * Tracks failed attempts per IP. Resets after 15 minutes.
 * NOTE: This is a per-instance map. In a multi-instance deployment
 * (which Vercel serverless is), this is not globally shared.
 * For production use, replace with a Redis/Upstash-based rate limiter.
 */
const loginAttempts = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const windowMs = 15 * 60 * 1000 // 15 minutes
  const maxAttempts = 10

  const record = loginAttempts.get(ip)
  if (!record || now > record.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (record.count >= maxAttempts) return false
  record.count++
  return true
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  // Rate limit the login API endpoint
  if (pathname === '/api/auth/login' && request.method === 'POST') {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    if (!checkRateLimit(ip)) {
      return new NextResponse(
        JSON.stringify({ data: null, error: 'Terlalu banyak percobaan login. Coba lagi dalam 15 menit.' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }

  // Redirect root to login
  if (pathname === '/') {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    const role = profile?.role ?? 'nurse'
    return NextResponse.redirect(new URL(`/${role}`, request.url))
  }

  // Redirect unauthenticated users to login
  if (!user && !PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirect authenticated users away from login page to their dashboard
  if (user && pathname === '/login') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    const role = profile?.role ?? 'nurse'
    return NextResponse.redirect(new URL(`/${role}`, request.url))
  }

  // Role-based route protection for authenticated users
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .single()

    // Deactivated users are forcibly logged out
    if (profile && !profile.is_active) {
      await supabase.auth.signOut()
      return NextResponse.redirect(new URL('/login', request.url))
    }

    for (const [route, requiredRole] of Object.entries(ROLE_ROUTES)) {
      if (pathname.startsWith(route) && profile?.role !== requiredRole) {
        return NextResponse.redirect(new URL(`/${profile?.role ?? 'login'}`, request.url))
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js).*)'],
}

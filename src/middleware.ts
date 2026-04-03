import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Only the web dashboard requires a full session (redirects to sign-in)
// API routes handle their own 401 responses so mobile clients get JSON, not redirects
const isProtectedRoute = createRouteMatcher(['/web(.*)', '/onboarding(.*)'])

export default clerkMiddleware(async (auth, request) => {
  if (isProtectedRoute(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and static assets
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$).*)',
  ],
}

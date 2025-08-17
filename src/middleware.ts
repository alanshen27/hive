import { auth } from "@/lib/auth"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const { pathname } = req.nextUrl

  // Protect these routes
  const protectedRoutes = [
    "/dashboard",
    "/group",
    "/my-groups", 
    "/create-group",
    "/onboarding"
  ]

  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  )

  if (isProtectedRoute && !isLoggedIn) {
    return Response.redirect(new URL("/auth", req.nextUrl))
  }

  return null
})

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/group/:path*", 
    "/my-groups/:path*",
    "/create-group/:path*",
    "/onboarding/:path*"
  ]
}

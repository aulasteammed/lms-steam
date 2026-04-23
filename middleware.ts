import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/about',
  '/search',
  '/feed',
  '/blog',
  '/blog/:path*',
  '/sign-in(.*)',
  '/sign-up(.*)',      
  '/api/event',
  '/api/uploadthing',
  '/api/blog/articles/:path*/views',
  '/certificate/verify/:path*',
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}

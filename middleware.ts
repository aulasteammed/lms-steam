import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextRequest, type NextFetchEvent } from 'next/server'

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


const CRAWLER_UA =
  /googlebot|google-inspectiontool|googleother|storebot-google|bingbot|duckduckbot|yandex|baiduspider|slurp|applebot|facebookexternalhit|twitterbot|linkedinbot|whatsapp|telegrambot|discordbot|slackbot/i

const clerkHandler = clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect()
  }
})

export default function middleware(request: NextRequest, event: NextFetchEvent) {
  const userAgent = request.headers.get('user-agent') ?? ''

  if (CRAWLER_UA.test(userAgent) && isPublicRoute(request)) {
    const headers = new Headers(request.headers)
    headers.set('accept', '*/*')
    headers.delete('sec-fetch-dest')
    return clerkHandler(new NextRequest(request.url, { method: request.method, headers }), event)
  }

  return clerkHandler(request, event)
}

export const config = {
  matcher: [
    '/((?!_next|robots\\.txt|sitemap\\.xml|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}

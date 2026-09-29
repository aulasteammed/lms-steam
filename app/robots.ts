import type { MetadataRoute } from "next";

const SITE_URL = "https://lms-aula-steam.vercel.app";

/**
 * Generates /robots.txt: public pages are crawlable, private areas
 * (teacher panel, user courses, auth, API) are not.
 * Certificates are not blocked here on purpose: Google must be able to
 * read their "noindex" tag, which is what keeps them out of results.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/teacher/",
        "/mycourses",
        "/courses/",
        "/api/",
        "/sign-in",
        "/sign-up",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

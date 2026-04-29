export { SocialIcon, type SocialPlatform } from "../../teacher/blog/[articleId]/_components/types";

import type { SocialPlatform } from "../../teacher/blog/[articleId]/_components/types";

const SOCIAL_PLATFORMS: SocialPlatform[] = [
    "instagram",
    "facebook",
    "linkedin",
    "x",
    "github",
    "website",
];

export function normalizeSocialPlatform(platform?: string | null): SocialPlatform | null {
    const normalized = platform?.toLowerCase().trim();
    if (!normalized) return null;
    if (normalized === "twitter") return "x";
    return SOCIAL_PLATFORMS.includes(normalized as SocialPlatform)
        ? (normalized as SocialPlatform)
        : null;
}

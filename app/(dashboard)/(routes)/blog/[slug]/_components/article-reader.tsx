"use client";
// Orquestador — delega al lector correcto según la plantilla del artículo

import { ReaderCoverPerson }   from "./readers/reader-cover-person";
import { ReaderFullArticle }   from "./readers/reader-full-article";
import { ReaderProfileSimple } from "./readers/reader-profile-simple";
import { ReaderNewsShort }     from "./readers/reader-news-short";
import type { ReaderProps }    from "./readers/shared";

export function ArticleReader(props: ReaderProps) {
    switch (props.article.template) {
        case "cover_person":   return <ReaderCoverPerson   {...props} />;
        case "full_article":   return <ReaderFullArticle   {...props} />;
        case "profile_simple": return <ReaderProfileSimple {...props} />;
        case "news_short":     return <ReaderNewsShort     {...props} />;
        default:               return <ReaderFullArticle   {...props} />;
    }
}
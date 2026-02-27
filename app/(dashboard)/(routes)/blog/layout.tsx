import { Playfair_Display, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";

const playfair = Playfair_Display({
    subsets:  ["latin"],
    variable: "--font-serif",
    weight:   ["400", "700", "900"],
    style:    ["normal", "italic"],
    display:  "swap",
});

const ibmSans = IBM_Plex_Sans({
    subsets:  ["latin"],
    variable: "--font-sans",
    weight:   ["300", "400", "500", "600"],
    display:  "swap",
});

const ibmMono = IBM_Plex_Mono({
    subsets:  ["latin"],
    variable: "--font-mono",
    weight:   ["400", "500"],
    display:  "swap",
});

export default function BlogLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className={`${playfair.variable} ${ibmSans.variable} ${ibmMono.variable}`}
            style={{ fontFamily: "var(--font-sans, sans-serif)" }}>
            {children}
        </div>
    );
}
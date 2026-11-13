import { IBM_Plex_Sans, Playfair_Display } from "next/font/google";

/**
 * Voz editorial de Trayectoria, la misma del blog: Playfair Display en los
 * títulos (clase `font-editorial`) e IBM Plex Sans en el texto. Trayectoria es
 * la parte de la plataforma que cuenta lo que se ha hecho, como el blog; los
 * cursos y el panel conservan la tipografía de aplicación.
 *
 * Misma configuración que `blog/layout.tsx`: next/font genera los mismos
 * archivos y el navegador los reutiliza al pasar de una sección a la otra.
 */
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["400", "700", "900"],
  style: ["normal", "italic"],
  display: "swap",
});

const ibmSans = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

export default function TrayectoriaLayout({ children }: { children: React.ReactNode }) {
  return (
    // `h-full`: el mapa ocupa todo el alto disponible y depende de esta cadena de alturas.
    // `text-pretty` se hereda: los párrafos no terminan en una palabra sola. Los
    // títulos lo cambian por `text-balance`.
    <div
      className={`h-full text-pretty ${playfair.variable} ${ibmSans.variable}`}
      style={{ fontFamily: "var(--font-sans, sans-serif)" }}
    >
      {children}
    </div>
  );
}

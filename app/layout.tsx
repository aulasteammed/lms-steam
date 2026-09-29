import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import {esES} from "@clerk/localizations";

import "./globals.css";
import { ToasterProvider } from "@/components/providers/toaster-provider";
import React from 'react';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://lms-aula-steam.vercel.app"),
  title: {
    default: "Aula STEAM Sonny Jiménez | UNALMED",
    template: "%s | Aula STEAM",
  },
  description: "Cursos, blog y mapa de proyectos, alianzas y participaciones del Aula STEAM Sonny Jiménez, Facultad de Minas, Universidad Nacional de Colombia sede Medellín.",
  keywords: [
    "Aula STEAM",
    "Sonny Jiménez",
    "STEAM",
    "UNAL",
    "Universidad Nacional de Colombia",
    "Medellín",
    "Facultad de Minas",
    "cursos",
    "ciencia",
    "tecnología",
    "ingeniería",
    "artes",
    "matemáticas",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider localization={esES}>
      <html lang="es-CO">
        <body className={inter.className}>
          <ToasterProvider />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
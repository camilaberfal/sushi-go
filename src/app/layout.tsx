import type { Metadata } from "next";
import { Fredoka, Outfit } from "next/font/google";
import "./globals.css";

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sushi Go!",
  description: "Partidas multijugador de Sushi Go en tiempo real",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${fredoka.variable} ${outfit.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-body bg-background text-foreground">{children}</body>
    </html>
  );
}

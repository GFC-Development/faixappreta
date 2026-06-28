import type { Metadata } from "next";
import { Archivo, Hanken_Grotesk, Spline_Sans_Mono, Teko } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth-provider";

const teko = Teko({ subsets: ["latin"], variable: "--font-teko" });
const archivo = Archivo({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-archivo",
});
const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-hanken",
});
const spline = Spline_Sans_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-spline",
});

export const metadata: Metadata = {
  title: "faixappreta - Centro de Treinamento",
  description: "Sistema de gestao para centros de treinamento de Jiu-Jitsu",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={`${archivo.variable} ${hanken.variable} ${spline.variable} ${teko.variable} font-hanken antialiased`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

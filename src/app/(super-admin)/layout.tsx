import { Archivo, Hanken_Grotesk, Spline_Sans_Mono } from "next/font/google";
import "../globals.css";

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

export const metadata = {
  title: "faixappreta - Super Admin",
};

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={`${archivo.variable} ${hanken.variable} ${spline.variable} font-hanken antialiased bg-[#15161a] text-[#e4e4e7]`}>
        {children}
      </body>
    </html>
  );
}

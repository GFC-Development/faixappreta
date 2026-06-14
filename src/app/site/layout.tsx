import type { Metadata } from "next";
import { Teko, Inter } from "next/font/google";
import { MessageCircle } from "lucide-react";

const teko = Teko({ subsets: ["latin"], variable: "--font-teko" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

const WHATSAPP_LINK = "https://wa.me/5551997736652?text=Ol%C3%A1%2C%20quero%20conhecer%20o%20faixappreta";

export const metadata: Metadata = {
  title: "faixappreta - Sistema de Gestão para Centros de Treinamento",
  description:
    "Organize seu CT, controle alunos, graduações e agendamentos. O sistema feito por quem entende o tatame.",
};

function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-red-600 rounded-lg flex items-center justify-center font-teko text-xl sm:text-2xl font-bold text-white">
            FP
          </div>
          <span className="font-teko text-2xl sm:text-3xl font-bold uppercase tracking-tight text-white">
            faix<span className="text-red-600">app</span>reta
          </span>
        </a>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium uppercase tracking-wider">
          <a
            href="#funcionalidades"
            className="text-zinc-400 hover:text-white transition-colors"
          >
            Funcionalidades
          </a>
          <a
            href="#planos"
            className="text-zinc-400 hover:text-white transition-colors"
          >
            Planos
          </a>
        </nav>
        <a
          href={WHATSAPP_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 sm:px-6 py-2 rounded-full text-sm font-semibold transition-all uppercase tracking-wider shadow-lg shadow-red-600/20"
        >
          <MessageCircle className="w-4 h-4" />
          <span className="hidden sm:inline">Falar conosco</span>
          <span className="sm:hidden">Contato</span>
        </a>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/5 bg-black py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <a href="/" className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-red-600 rounded-lg flex items-center justify-center font-teko text-xl font-bold text-white">
                FP
              </div>
              <span className="font-teko text-2xl font-bold uppercase tracking-tight text-white">
                faix<span className="text-red-600">app</span>reta
              </span>
            </a>
            <p className="text-zinc-500 text-sm leading-relaxed">
              Sistema de gestão para centros de treinamento.
              <br />
              Feito por quem entende o tatame.
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold uppercase tracking-widest text-sm mb-4">
              Navegação
            </h4>
            <ul className="space-y-3 text-zinc-500 text-sm">
              <li>
                <a
                  href="#funcionalidades"
                  className="hover:text-white transition-colors"
                >
                  Funcionalidades
                </a>
              </li>
              <li>
                <a
                  href="#planos"
                  className="hover:text-white transition-colors"
                >
                  Planos
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold uppercase tracking-widest text-sm mb-4">
              Contato
            </h4>
            <ul className="space-y-3 text-zinc-500 text-sm">
              <li>
                <a
                  href={WHATSAPP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  WhatsApp
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-zinc-600 text-sm">
            &copy; {new Date().getFullYear()} faixappreta. Todos os direitos
            reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${teko.variable} ${inter.variable} font-inter min-h-screen flex flex-col bg-[#050505] text-zinc-300`}
    >
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

import Image from "next/image";
import { 
  Users, 
  Calendar, 
  Trophy, 
  Smartphone, 
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Zap,
  Timer,
  ClipboardCheck
} from "lucide-react";

const FUNCIONALIDADES = [
  {
    icon: <Users className="w-6 h-6 text-red-600" />,
    titulo: "Controle de Alunos",
    descricao: "Gestão completa de perfis, histórico de treinos e documentos de forma simplificada."
  },
  {
    icon: <Calendar className="w-6 h-6 text-red-600" />,
    titulo: "Agenda & Check-in",
    descricao: "Sistema de reserva de aulas e gestão de horários do seu Centro de Treinamento."
  },
  {
    icon: <ClipboardCheck className="w-6 h-6 text-red-600" />,
    titulo: "Chamada Digital",
    descricao: "Controle de presença automatizado e rápido direto pelo painel do professor."
  },
  {
    icon: <Trophy className="w-6 h-6 text-red-600" />,
    titulo: "Graduações & Faixas",
    descricao: "Acompanhe a evolução de cada aluno e os requisitos para a próxima graduação."
  },
  {
    icon: <Smartphone className="w-6 h-6 text-red-600" />,
    titulo: "App do Aluno",
    descricao: "Seu aluno agenda aulas e vê sua evolução direto no celular. Experiência premium."
  },
  {
    icon: <Timer className="w-6 h-6 text-red-600" />,
    titulo: "Cronômetro Integrado",
    descricao: "Timer profissional para controle de rounds e treinos específicos no tatame."
  }
];

const PLANOS = [
  {
    nome: "Plano Profissional",
    preco: "99,90",
    precoOriginal: "149,90",
    features: [
      "Gestão de Alunos Ilimitada",
      "Agenda de Aulas & Check-in",
      "Chamada Digital Automatizada",
      "Sistema de Ranking & Evolução",
      "App do Aluno Premium",
      "Cronômetro de Tatame",
      "Suporte Prioritário"
    ],
    cta: "Aproveitar Oferta",
    destaque: true
  }
];

export default function InstitutionalPage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center pt-20 overflow-hidden bg-black">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(220,38,38,0.15),transparent_70%)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 grid lg:grid-cols-2 gap-12 items-center text-center lg:text-left">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/10 border border-red-600/20 text-red-500 text-xs font-bold uppercase tracking-widest mb-6">
              <Zap className="w-3 h-3" /> Oferta Especial de Lançamento
            </div>
            <h1 className="font-archivo text-7xl sm:text-8xl md:text-9xl font-bold uppercase leading-[0.8] text-white mb-6">
              DO TATAME PARA O <span className="text-red-600">DIGITAL</span>
            </h1>
            <p className="text-zinc-400 text-xl md:text-2xl max-w-xl mx-auto lg:mx-0 leading-relaxed mb-10">
              O <span className="text-white font-bold italic underline decoration-red-600 decoration-4">faixappreta</span> é o braço direito do professor. Gestão completa, app para alunos e controle total do seu CT.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <button className="bg-red-600 hover:bg-red-700 text-white px-10 py-4 rounded-full font-bold text-lg transition-all shadow-xl shadow-red-600/20 uppercase tracking-wider">
                Assinar Agora
              </button>
              <button className="border border-white/20 hover:bg-white/5 text-white px-10 py-4 rounded-full font-bold text-lg transition-all uppercase tracking-wider">
                Ver Funcionalidades
              </button>
            </div>
          </div>
          <div className="relative hidden lg:block">
            <div className="aspect-[4/3] rounded-2xl border border-white/10 bg-zinc-900/50 backdrop-blur-sm p-4 relative group overflow-hidden">
              <Image 
                src="/site/print-dashboard.png" 
                alt="Dashboard faixappreta" 
                fill 
                className="object-cover object-top"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-red-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </div>
      </section>

      {/* Funcionalidades */}
      <section id="funcionalidades" className="py-32 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="font-archivo text-5xl sm:text-6xl font-bold uppercase text-white mb-4">
              Tudo o que seu CT precisa em <span className="text-red-600">um só lugar</span>
            </h2>
            <p className="text-zinc-500 text-lg max-w-2xl mx-auto">
              Desenvolvido para otimizar o tempo do professor e melhorar a experiência do aluno.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {FUNCIONALIDADES.map((f, i) => (
              <div key={i} className="p-8 rounded-3xl bg-zinc-900/50 border border-white/5 hover:border-red-600/30 transition-all group">
                <div className="w-12 h-12 rounded-2xl bg-red-600/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  {f.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-3 uppercase tracking-wide">{f.titulo}</h3>
                <p className="text-zinc-500 leading-relaxed">{f.descricao}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Screens Showcase */}
      <section className="py-32 bg-[#080808]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="font-archivo text-5xl font-bold uppercase text-white mb-8">
                Interface <span className="text-red-600">Moderna</span> e Intuitiva
              </h2>
              <div className="space-y-6">
                {[
                  "Design focado na experiência do professor e do aluno",
                  "Acesso rápido às informações mais importantes",
                  "Gestão simplificada de turmas e presenças",
                  "Funciona perfeitamente em desktop e mobile"
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="mt-1 bg-red-600/20 p-1 rounded-full">
                      <CheckCircle2 className="w-4 h-4 text-red-600" />
                    </div>
                    <p className="text-zinc-400 font-medium">{item}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="aspect-[3/4] bg-zinc-800 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center group hover:border-red-600/50 transition-all overflow-hidden relative">
                 <Image src="/site/print-aluno.png" alt="App do Aluno" fill className="object-cover object-top" />
                 <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4">
                   <Smartphone className="w-8 h-8 text-red-600 mb-2" />
                   <span className="text-white font-archivo text-xl uppercase">App do Aluno</span>
                 </div>
              </div>
              <div className="aspect-[3/4] bg-zinc-800 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center mt-8 group hover:border-red-600/50 transition-all overflow-hidden relative">
                 <Image src="/site/print-agendamento.png" alt="Agendamento" fill className="object-cover object-top" />
                 <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4">
                   <Calendar className="w-8 h-8 text-red-600 mb-2" />
                   <span className="text-white font-archivo text-xl uppercase">Agendamento</span>
                 </div>
              </div>
              <div className="aspect-[3/4] bg-zinc-800 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center -mt-8 group hover:border-red-600/50 transition-all overflow-hidden relative">
                 <Image src="/site/print-dashboard.png" alt="Gestão de Alunos" fill className="object-cover object-top" />
                 <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4">
                   <Users className="w-8 h-8 text-red-600 mb-2" />
                   <span className="text-white font-archivo text-xl uppercase">Gestão</span>
                 </div>
              </div>
              <div className="aspect-[3/4] bg-zinc-800 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center group hover:border-red-600/50 transition-all overflow-hidden relative">
                 <Image src="/site/print-cronometro.png" alt="Cronômetro" fill className="object-cover" />
                 <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4">
                   <Timer className="w-8 h-8 text-red-600 mb-2" />
                   <span className="text-white font-archivo text-xl uppercase">Cronômetro</span>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Planos */}
      <section id="planos" className="py-32 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="font-archivo text-6xl font-bold uppercase text-white mb-4">Invista no seu CT</h2>
          <p className="text-zinc-500 text-lg mb-16">Aproveite nossa oferta por tempo limitado.</p>
          
          <div className="flex justify-center">
            {PLANOS.map((p, i) => (
              <div key={i} className={`max-w-md w-full p-10 rounded-[2.5rem] border ${p.destaque ? 'border-red-600 bg-red-600/5 relative' : 'border-white/5 bg-zinc-900/50'} flex flex-col`}>
                <div className="mb-8">
                  <h3 className="text-zinc-400 font-bold uppercase tracking-widest text-sm mb-4">{p.nome}</h3>
                  <div className="flex flex-col items-center">
                    <span className="text-zinc-500 text-xl line-through mb-1">R$ {p.precoOriginal}</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-zinc-500 text-2xl font-medium">R$</span>
                      <span className="text-white text-7xl font-archivo font-bold">{p.preco}</span>
                      <span className="text-zinc-500">/mês</span>
                    </div>
                  </div>
                </div>
                <ul className="space-y-4 mb-10 text-left flex-1">
                  {p.features.map((f, fi) => (
                    <li key={fi} className="flex items-center gap-3 text-zinc-400 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-red-600 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <button className={`w-full py-4 rounded-full font-bold uppercase tracking-widest transition-all ${p.destaque ? 'bg-red-600 text-white shadow-lg shadow-red-600/20 hover:bg-red-700' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                  {p.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section id="contato" className="py-32 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-red-600/10 blur-[120px] rounded-full -bottom-1/2 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96" />
        <div className="max-w-4xl mx-auto bg-zinc-900 border border-white/10 rounded-[3rem] p-12 md:p-20 text-center relative z-10">
          <ShieldCheck className="w-16 h-16 text-red-600 mx-auto mb-8" />
          <h2 className="font-archivo text-5xl md:text-7xl font-bold uppercase text-white mb-6">
            Pronto para levar seu CT ao próximo nível?
          </h2>
          <p className="text-zinc-400 text-xl mb-12 leading-relaxed">
            Profissionalize sua gestão com o <span className="text-white font-bold italic">faixappreta</span>.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button className="bg-red-600 hover:bg-red-700 text-white px-12 py-5 rounded-full font-bold text-xl transition-all shadow-2xl shadow-red-600/40 uppercase tracking-widest">
              Começar Agora
            </button>
            <button className="flex items-center justify-center gap-2 text-white font-bold uppercase tracking-widest hover:text-red-500 transition-colors">
              Falar com suporte <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

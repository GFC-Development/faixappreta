import { ZoomableImage } from "./image-zoom";
import {
  Users,
  Calendar,
  Trophy,
  Smartphone,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Timer,
  MessageCircle,
  XCircle,
  ArrowRight,
  Star,
} from "lucide-react";

const WHATSAPP_LINK = "https://wa.me/5551997736652?text=Ol%C3%A1%2C%20quero%20conhecer%20o%20faixappreta";

const DORES = [
  {
    icon: <XCircle className="w-5 h-5 text-red-500" />,
    texto: "Controla alunos por planilha ou caderno",
  },
  {
    icon: <XCircle className="w-5 h-5 text-red-500" />,
    texto: "Não sabe quantos alunos vieram treinar essa semana",
  },
  {
    icon: <XCircle className="w-5 h-5 text-red-500" />,
    texto: "Perde tempo com chamada manual toda aula",
  },
  {
    icon: <XCircle className="w-5 h-5 text-red-500" />,
    texto: "Aluno esquece horário e manda mensagem no WhatsApp",
  },
  {
    icon: <XCircle className="w-5 h-5 text-red-500" />,
    texto: "Não tem controle de quem está pronto para graduar",
  },
  {
    icon: <XCircle className="w-5 h-5 text-red-500" />,
    texto: "Seu CT não tem presença digital profissional",
  },
];

const FUNCIONALIDADES = [
  {
    icon: <Users className="w-6 h-6" />,
    titulo: "Gestão de Alunos",
    descricao:
      "Cadastro completo, histórico de treinos, graduações e dados de cada aluno em um só lugar. Chega de planilha.",
    imagem: "/site/print-dashboard.png",
    mobile: false,
  },
  {
    icon: <Calendar className="w-6 h-6" />,
    titulo: "Agenda do Dia",
    descricao:
      "Veja todas as aulas do dia, quem está agendado e gerencie a turma em tempo real. Controle total da sua grade.",
    imagem: "/site/print-agenda-dia.png",
    mobile: false,
  },
  {
    icon: <ClipboardCheck className="w-6 h-6" />,
    titulo: "Chamada Digital",
    descricao:
      "Registre presença em segundos: presente, cancelado ou ausente. Sem papel, sem perder tempo. Tudo registrado automaticamente.",
    imagem: "/site/print-chamada.png",
    mobile: false,
  },
  {
    icon: <Trophy className="w-6 h-6" />,
    titulo: "Graduações e Faixas",
    descricao:
      "Histórico completo de cada aluno: faixas, graus e datas de promoção. Seu aluno acompanha a própria evolução.",
    imagem: "/site/print-graduacoes.png",
    mobile: false,
  },
  {
    icon: <CheckCircle2 className="w-6 h-6" />,
    titulo: "Requisitos de Graduação",
    descricao:
      "Defina quantas aulas são necessárias para cada faixa e grau. O sistema calcula automaticamente quem está pronto para graduar.",
    imagem: "/site/print-requisitos.png",
    mobile: false,
  },
  {
    icon: <Smartphone className="w-6 h-6" />,
    titulo: "App do Aluno",
    descricao:
      "Seu aluno acessa pelo celular: agenda aulas, vê sua evolução, confere presenças. Experiência profissional para seu CT.",
    imagem: "/site/print-aluno.png",
    mobile: true,
  },
  {
    icon: <Calendar className="w-6 h-6" />,
    titulo: "Agendamento de Aulas",
    descricao:
      "Seu aluno vê os horários disponíveis e reserva a aula sozinho pelo celular. Você sabe exatamente quem vem treinar.",
    imagem: "/site/print-agendamento.png",
    mobile: false,
  },
  {
    icon: <Timer className="w-6 h-6" />,
    titulo: "Cronômetro de Tatame",
    descricao:
      "Timer profissional para rounds, aquecimento e treino específico. Controle o tempo direto no celular ou na TV.",
    imagem: "/site/print-cronometro.png",
    mobile: false,
  },
];

const ANTES_DEPOIS = [
  {
    antes: "Planilha e caderno para controlar alunos",
    depois: "Tudo digital, organizado e acessível de qualquer lugar",
  },
  {
    antes: "Chamada gritando nome por nome",
    depois: "Chamada digital em 10 segundos no celular",
  },
  {
    antes: "Aluno manda WhatsApp perguntando horário",
    depois: "Aluno consulta e reserva sozinho pelo app",
  },
  {
    antes: "Não sabe quem faltou nas últimas semanas",
    depois: "Relatório de frequência automático por aluno",
  },
  {
    antes: "Graduação baseada na memória do professor",
    depois: "Critérios definidos, evolução rastreada por aluno",
  },
];

const FAQ = [
  {
    pergunta: "Preciso entender de tecnologia?",
    resposta:
      "Não. O faixappreta foi feito para ser simples. Se você usa WhatsApp, você consegue usar o sistema. E qualquer dúvida, estamos no WhatsApp para ajudar.",
  },
  {
    pergunta: "Funciona no celular?",
    resposta:
      "Sim. Tanto você quanto seus alunos acessam pelo celular, tablet ou computador. Não precisa instalar nada, funciona direto no navegador.",
  },
  {
    pergunta: "Meus alunos vão conseguir usar?",
    resposta:
      "Com certeza. O app do aluno é super intuitivo. Eles entram, veem os horários, reservam a aula e pronto. Você vai até receber elogios.",
  },
  {
    pergunta: "Posso testar antes de assinar?",
    resposta:
      "Sim. Entre em contato pelo WhatsApp e configuramos seu CT gratuitamente para você testar o sistema completo.",
  },
  {
    pergunta: "E se eu tiver mais de um professor no CT?",
    resposta:
      "O sistema suporta múltiplos professores. Cada um acessa com seu login e gerencia suas turmas.",
  },
  {
    pergunta: "Como funciona o suporte?",
    resposta:
      "Suporte direto pelo WhatsApp, rápido e pessoal. Sem robô, sem fila. Você fala com quem entende do sistema.",
  },
];

function FAQItem({ pergunta, resposta }: { pergunta: string; resposta: string }) {
  return (
    <details className="group border border-white/10 rounded-2xl overflow-hidden">
      <summary className="flex items-center justify-between cursor-pointer p-6 hover:bg-white/5 transition-colors">
        <span className="text-white font-medium text-lg pr-4">{pergunta}</span>
        <ChevronRight className="w-5 h-5 text-zinc-500 group-open:rotate-90 transition-transform shrink-0" />
      </summary>
      <div className="px-6 pb-6 text-zinc-400 leading-relaxed">{resposta}</div>
    </details>
  );
}

export default function SitePage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center pt-20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(220,38,38,0.12),transparent_60%)]" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10 text-center">
          <p className="text-red-500 font-bold uppercase tracking-[0.2em] text-sm mb-6">
            Sistema de gestão para centros de treinamento
          </p>
          <h1 className="font-teko text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold uppercase leading-[0.85] text-white mb-8">
            Seu CT merece mais do que{" "}
            <span className="text-red-600">planilha e caderno</span>
          </h1>
          <p className="text-zinc-400 text-xl md:text-2xl max-w-2xl mx-auto leading-relaxed mb-12">
            O <span className="text-white font-bold">faixappreta</span> é o
            sistema que organiza seu CT, libera seu tempo e dá uma experiência
            profissional para seus alunos.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 bg-red-600 hover:bg-red-700 text-white px-10 py-4 rounded-full font-bold text-lg transition-all shadow-xl shadow-red-600/20 uppercase tracking-wider"
            >
              <MessageCircle className="w-5 h-5" />
              Quero conhecer
            </a>
            <a
              href="#funcionalidades"
              className="inline-flex items-center justify-center gap-2 border border-white/20 hover:bg-white/5 text-white px-10 py-4 rounded-full font-bold text-lg transition-all uppercase tracking-wider"
            >
              Ver como funciona
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </div>
      </section>

      {/* Dores */}
      <section className="py-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-teko text-5xl sm:text-6xl font-bold uppercase text-white mb-4">
              A maioria dos professores passa por isso todos os dias
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {DORES.map((d, i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-5 rounded-2xl bg-red-600/5 border border-red-600/10"
              >
                {d.icon}
                <p className="text-zinc-300">{d.texto}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <h3 className="font-teko text-4xl sm:text-5xl font-bold uppercase text-white mb-4">
              Se identificou com alguma dessas?
            </h3>
            <p className="text-zinc-400 text-lg">
              Se você marcou pelo menos uma,{" "}
              <span className="text-white font-bold">
                o faixappreta foi feito para você.
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* Antes x Depois */}
      <section className="py-24 px-4 sm:px-6 bg-[#080808]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-teko text-5xl sm:text-6xl font-bold uppercase text-white mb-4">
              Antes e depois do{" "}
              <span className="text-red-600">faixappreta</span>
            </h2>
          </div>
          <div className="space-y-4">
            {ANTES_DEPOIS.map((item, i) => (
              <div
                key={i}
                className="grid md:grid-cols-[1fr_auto_1fr] gap-4 items-center"
              >
                <div className="p-5 rounded-2xl bg-zinc-900 border border-white/5 text-zinc-500 line-through decoration-red-600/40">
                  {item.antes}
                </div>
                <div className="hidden md:flex items-center justify-center">
                  <ArrowRight className="w-5 h-5 text-red-600" />
                </div>
                <div className="p-5 rounded-2xl bg-red-600/5 border border-red-600/20 text-white font-medium">
                  {item.depois}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Funcionalidades */}
      <section id="funcionalidades" className="py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="font-teko text-5xl sm:text-6xl font-bold uppercase text-white mb-4">
              Tudo que você precisa,{" "}
              <span className="text-red-600">nada que você não precisa</span>
            </h2>
            <p className="text-zinc-500 text-lg max-w-2xl mx-auto">
              Sem complicação. Cada funcionalidade resolve um problema real do
              dia a dia do professor.
            </p>
          </div>
          <div className="space-y-32">
            {FUNCIONALIDADES.map((f, i) => (
              <div
                key={i}
                className={`grid lg:grid-cols-2 gap-12 items-center ${
                  i % 2 === 1 ? "lg:direction-rtl" : ""
                }`}
              >
                <div className={i % 2 === 1 ? "lg:order-2" : ""}>
                  <div className="w-12 h-12 rounded-2xl bg-red-600/10 flex items-center justify-center mb-6 text-red-600">
                    {f.icon}
                  </div>
                  <h3 className="font-teko text-4xl font-bold text-white uppercase mb-4">
                    {f.titulo}
                  </h3>
                  <p className="text-zinc-400 text-lg leading-relaxed">
                    {f.descricao}
                  </p>
                </div>
                <div className={i % 2 === 1 ? "lg:order-1" : ""}>
                  {f.imagem && f.mobile ? (
                    <div className="flex justify-center">
                      <div className="relative w-[280px] rounded-[2rem] border-[6px] border-zinc-700 bg-zinc-900 overflow-hidden shadow-2xl shadow-black/50">
                        <ZoomableImage
                          src={f.imagem}
                          alt={f.titulo}
                          width={280}
                          height={560}
                          className="w-full h-auto"
                        />
                      </div>
                    </div>
                  ) : f.imagem ? (
                    <div className="relative rounded-2xl border border-white/10 bg-zinc-900/50 overflow-hidden shadow-2xl shadow-black/30">
                      <ZoomableImage
                        src={f.imagem}
                        alt={f.titulo}
                        width={800}
                        height={450}
                        className="w-full h-auto"
                      />
                    </div>
                  ) : (
                    <div className="aspect-[4/3] rounded-2xl border border-white/10 bg-zinc-900/30 flex items-center justify-center">
                      <div className="text-red-600 opacity-20 scale-[3]">
                        {f.icon}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Prova social - oculto até termos depoimentos reais */}
      {false && <section className="py-24 px-4 sm:px-6 bg-[#080808]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-teko text-5xl sm:text-6xl font-bold uppercase text-white mb-16">
            Quem usa, <span className="text-red-600">recomenda</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-8 rounded-3xl bg-zinc-900/50 border border-white/5 text-left">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-4 h-4 text-red-600 fill-red-600"
                  />
                ))}
              </div>
              <p className="text-zinc-300 leading-relaxed mb-6">
                &ldquo;Antes eu perdia uns 20 minutos toda aula só com chamada e
                organização. Agora abro o celular, faço a chamada em 10 segundos
                e foco no que importa: ensinar.&rdquo;
              </p>
              <div>
                <p className="text-white font-bold">Professor Rafael</p>
                <p className="text-zinc-500 text-sm">CT em Curitiba/PR</p>
              </div>
            </div>
            <div className="p-8 rounded-3xl bg-zinc-900/50 border border-white/5 text-left">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-4 h-4 text-red-600 fill-red-600"
                  />
                ))}
              </div>
              <p className="text-zinc-300 leading-relaxed mb-6">
                &ldquo;Meus alunos adoraram poder ver os horários e reservar
                aula pelo celular. O CT ficou com cara profissional. Até aluno
                novo elogiou.&rdquo;
              </p>
              <div>
                <p className="text-white font-bold">Professor Marcos</p>
                <p className="text-zinc-500 text-sm">CT em Florianópolis/SC</p>
              </div>
            </div>
          </div>
        </div>
      </section>}

      {/* Plano */}
      <section id="planos" className="py-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-teko text-5xl sm:text-6xl font-bold uppercase text-white mb-4">
              Quanto custa{" "}
              <span className="text-red-600">profissionalizar</span> seu CT?
            </h2>
            <p className="text-zinc-500 text-lg">
              Menos do que a mensalidade de um aluno.
            </p>
          </div>

          <div className="max-w-lg mx-auto p-10 rounded-[2.5rem] border border-red-600/30 bg-red-600/5 relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-red-600 text-white text-xs font-bold uppercase tracking-widest px-6 py-2 rounded-full">
              Oferta de lançamento
            </div>
            <div className="text-center mb-8">
              <p className="text-zinc-400 font-bold uppercase tracking-widest text-sm mb-4">
                Plano Completo
              </p>
              <div className="flex flex-col items-center">
                <span className="text-zinc-500 text-xl line-through mb-1">
                  R$ 199,90
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-zinc-500 text-2xl font-medium">
                    R$
                  </span>
                  <span className="text-white text-7xl font-teko font-bold">
                    179,90
                  </span>
                  <span className="text-zinc-500">/mês</span>
                </div>
              </div>
            </div>
            <ul className="space-y-4 mb-10">
              {[
                "Alunos ilimitados",
                "Agenda de aulas e reservas",
                "Chamada digital",
                "Controle de graduações e faixas",
                "App do aluno pelo celular",
                "Cronômetro de tatame",
                "Ranking e evolução dos alunos",
                "Múltiplos professores",
                "Suporte direto pelo WhatsApp",
              ].map((f, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 text-zinc-300"
                >
                  <CheckCircle2 className="w-5 h-5 text-red-600 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 w-full py-4 rounded-full bg-red-600 text-white font-bold uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 text-lg"
            >
              <MessageCircle className="w-5 h-5" />
              Assinar pelo WhatsApp
            </a>
            <p className="text-center text-zinc-600 text-sm mt-4">
              Cancele quando quiser. Sem fidelidade.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-4 sm:px-6 bg-[#080808]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-teko text-5xl sm:text-6xl font-bold uppercase text-white mb-4">
              Perguntas frequentes
            </h2>
          </div>
          <div className="space-y-3">
            {FAQ.map((item, i) => (
              <FAQItem key={i} pergunta={item.pergunta} resposta={item.resposta} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-red-600/10 blur-[120px] rounded-full -bottom-1/2 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96" />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="font-teko text-5xl md:text-7xl font-bold uppercase text-white mb-6">
            Seu tempo no tatame é{" "}
            <span className="text-red-600">para ensinar</span>, não para
            preencher planilha
          </h2>
          <p className="text-zinc-400 text-xl mb-12 leading-relaxed">
            Fale com a gente pelo WhatsApp. Configuramos seu CT gratuitamente
            para você testar o sistema completo.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 bg-red-600 hover:bg-red-700 text-white px-12 py-5 rounded-full font-bold text-xl transition-all shadow-2xl shadow-red-600/40 uppercase tracking-widest"
            >
              <MessageCircle className="w-6 h-6" />
              Falar no WhatsApp
            </a>
          </div>
          <div className="flex items-center justify-center gap-8 mt-12 text-zinc-600 text-sm">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Sem fidelidade
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Teste gratuito
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Suporte humano
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}

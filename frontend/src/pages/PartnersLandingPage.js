import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, CheckCircle2, Eye, Users, ShieldCheck, Handshake, Megaphone, Globe,
  Target, Sparkles, Smartphone, RefreshCw, Shield, Briefcase, FileText, ClipboardCheck,
  PenLine, Rocket, Mail, MessageCircle, Star,
} from 'lucide-react';

const CLUB_LOGO = "https://customer-assets.emergentagent.com/job_vacation-club-portal/artifacts/fa7v4ni5_Kuxtal%20Club%20%281%29.png";

// Kuxtal Club palette
// - Crimson: #C8263E (primary accent)
// - Gold/cream: #EDD584 / #F5E6B8
// - Teal deep: #194D5E / #1F5A6E
// - Near-black canvas: #0B1115

function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!ref.current) { setVisible(true); return; }
    if (typeof IntersectionObserver === 'undefined') { setVisible(true); return; }
    const rect = ref.current.getBoundingClientRect();
    // If already in viewport on mount, reveal immediately
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); io.disconnect(); } },
      { threshold: 0.1 }
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  return [ref, visible];
}

function Reveal({ children, delay = 0, className = '' }) {
  const [ref, visible] = useReveal();
  return (
    <div
      ref={ref}
      style={{ transitionDelay: visible ? `${delay}ms` : '0ms' }}
      className={`transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'} ${className}`}
    >
      {children}
    </div>
  );
}

const QUICK_BENEFITS = [
  { icon: Eye, title: 'Más visibilidad', text: 'Tu negocio aparece dentro del ecosistema digital de beneficios de Kuxtal Club.' },
  { icon: Users, title: 'Más clientes', text: 'Tu promoción llega a socios interesados en consumir productos y servicios con valor agregado.' },
  { icon: ShieldCheck, title: 'Más confianza', text: 'La alianza se presenta de forma formal, clara y respaldada por convenio comercial.' },
];

const ALIANZA_CARDS = [
  { icon: Handshake, title: 'Alianza comercial formal', text: 'La incorporación se respalda mediante convenio estratégico donde se define el beneficio y los compromisos de promoción y confidencialidad.' },
  { icon: Megaphone, title: 'Promoción continua', text: 'Tu marca se divulga en campañas informativas, publicaciones en redes sociales y espacios digitales de Kuxtal Club.' },
  { icon: Globe, title: 'Vitrina digital', text: 'La sección de beneficios organiza los comercios afiliados por categorías y facilita que el socio descubra tu empresa.' },
];

const GANANCIAS = [
  { icon: Target, title: 'Captación de nuevos clientes', text: 'Tu oferta atrae consumidores que buscan experiencias, atención preferencial y promociones exclusivas.' },
  { icon: Sparkles, title: 'Posicionamiento de marca', text: 'Tu negocio se integra en una plataforma con imagen premium que mejora percepción y recordación.' },
  { icon: Smartphone, title: 'Contenido para difusión', text: 'Usamos logotipos, fotografías y materiales digitales autorizados para fortalecer la promoción.' },
  { icon: RefreshCw, title: 'Promoción recurrente', text: 'Acciones mensuales de socialización y campañas informativas sobre beneficios para afiliados.' },
  { icon: Shield, title: 'Reglas claras', text: 'Confidencialidad, alcance de uso de imagen y lineamientos definidos entre ambas partes.' },
  { icon: Briefcase, title: 'Flexibilidad comercial', text: 'Define tu beneficio como descuento porcentual, nominal, promoción especial o valor agregado.' },
];

const STEPS = [
  { icon: FileText, title: 'Evaluación comercial', text: 'Revisamos el tipo de empresa, producto o servicio y el beneficio que deseas ofrecer.' },
  { icon: PenLine, title: 'Definición de beneficio', text: 'Acordamos el descuento, promoción o trato preferencial que recibirá el socio Kuxtal.' },
  { icon: ClipboardCheck, title: 'Formalización', text: 'Documentamos el acuerdo y autorizamos el uso de elementos de marca para promoción.' },
  { icon: Rocket, title: 'Publicación', text: 'Tu empresa se integra a la vitrina digital y entra en campañas informativas y promocionales.' },
];

const CATEGORIES = [
  'Restaurantes', 'Mascotas', 'Hospitales', 'Servicios',
  'Belleza', 'Deportes', 'Tecnología', 'Educación',
  'Moda Mujer', 'Moda Hombre', 'Hogar', 'Entretenimiento',
];

export default function PartnersLandingPage() {
  return (
    <div className="min-h-screen bg-[#0B1115] text-white selection:bg-[#EDD584] selection:text-[#0B1115]">
      {/* Decorative noise texture via inline SVG */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.035] z-0"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }}
      />

      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-[#0B1115]/85 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <img src={CLUB_LOGO} alt="Kuxtal Club" className="h-12 sm:h-14 w-auto drop-shadow-[0_4px_12px_rgba(200,38,62,0.35)]" />
          <div className="flex items-center gap-2 sm:gap-3">
            <a href="https://kuxtaltravelgt.com/benefits" className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-white/70 hover:text-[#EDD584] transition-colors">
              Ver comercios <ArrowRight className="w-3.5 h-3.5" />
            </a>
            <a href="#afiliate" className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-gradient-to-br from-[#C8263E] to-[#8B1A2C] text-white text-sm font-bold shadow-lg shadow-[#C8263E]/30 hover:shadow-xl hover:shadow-[#C8263E]/40 border border-[#EDD584]/20 transition-all">
              Afiliar empresa
            </a>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        {/* Dark teal + crimson ambient */}
        <div className="absolute inset-0 -z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0B1115] via-[#11232C] to-[#0B1115]" />
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(200,38,62,0.22) 0, transparent 40%), radial-gradient(circle at 85% 75%, rgba(237,213,132,0.12) 0, transparent 50%), radial-gradient(circle at 50% 100%, rgba(25,77,94,0.5) 0, transparent 60%)' }} />
          {/* Grid texture */}
          <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(rgba(237,213,132,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(237,213,132,0.4) 1px, transparent 1px)', backgroundSize: '64px 64px' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-32 z-10">
          <div className="grid lg:grid-cols-[1.15fr_1fr] gap-12 items-center">
            <div>
              <Reveal>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#EDD584]/25 bg-[#EDD584]/5 text-[#EDD584] text-[11px] font-bold uppercase tracking-[0.2em] backdrop-blur-sm">
                  <Star className="w-3 h-3" /> Programa de alianzas estratégicas
                </div>
              </Reveal>

              <Reveal delay={100}>
                <h1 className="font-heading text-5xl sm:text-6xl lg:text-7xl font-black mt-7 leading-[0.95] tracking-tight">
                  Haz crecer tu empresa con{' '}
                  <span className="relative inline-block">
                    <span className="bg-gradient-to-r from-[#EDD584] via-[#F5E6B8] to-[#D4B85A] bg-clip-text text-transparent">Kuxtal Club</span>
                    <svg className="absolute -bottom-2 left-0 w-full" height="8" viewBox="0 0 200 8" fill="none" preserveAspectRatio="none">
                      <path d="M2 5 Q50 1 100 4 T198 5" stroke="#C8263E" strokeWidth="3" strokeLinecap="round" fill="none" />
                    </svg>
                  </span>
                </h1>
              </Reveal>

              <Reveal delay={200}>
                <p className="mt-8 text-lg sm:text-xl text-white/75 max-w-2xl leading-relaxed">
                  Conectamos marcas, comercios y servicios con una comunidad que valora el
                  ahorro, la confianza y los beneficios exclusivos. Integra tu empresa como
                  comercio aliado y da visibilidad a tus promociones y descuentos.
                </p>
              </Reveal>

              <Reveal delay={300}>
                <div className="mt-10 flex flex-col sm:flex-row gap-3">
                  <a href="#afiliate" className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-gradient-to-br from-[#C8263E] to-[#8B1A2C] text-white font-bold shadow-xl shadow-[#C8263E]/30 border border-[#EDD584]/20 hover:scale-[1.03] transition-transform" data-testid="hero-cta-afiliar">
                    Quiero afiliar mi empresa
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </a>
                  <a href="https://kuxtaltravelgt.com/benefits" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#EDD584]/40 text-white font-semibold backdrop-blur-sm transition-colors" data-testid="hero-cta-benefits">
                    Ver comercios afiliados
                  </a>
                </div>
              </Reveal>

              <Reveal delay={400}>
                <div className="mt-12 flex items-center gap-6 text-xs text-white/50">
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#C8263E]" /> Convenio formal</div>
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#EDD584]" /> Promoción continua</div>
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#1F5A6E]" /> Vitrina digital</div>
                </div>
              </Reveal>
            </div>

            {/* Logo showcase */}
            <Reveal delay={200}>
              <div className="relative hidden lg:flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-radial from-[#C8263E]/20 via-transparent to-transparent blur-2xl" />
                <div className="relative">
                  <div className="absolute -inset-6 rounded-3xl bg-gradient-to-br from-[#C8263E]/30 via-[#EDD584]/20 to-[#1F5A6E]/30 blur-2xl" />
                  <img src={CLUB_LOGO} alt="Kuxtal Club" className="relative w-full max-w-sm drop-shadow-[0_20px_60px_rgba(200,38,62,0.4)] animate-[float_6s_ease-in-out_infinite]" />
                </div>
              </div>
            </Reveal>
          </div>
        </div>

        {/* Top-edge shimmer divider */}
        <div className="relative h-px bg-gradient-to-r from-transparent via-[#EDD584]/40 to-transparent" />
      </section>

      {/* QUICK BENEFITS (3) */}
      <section className="py-16 sm:py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative">
          <div className="grid md:grid-cols-3 gap-5">
            {QUICK_BENEFITS.map((b, i) => (
              <Reveal key={b.title} delay={i * 100}>
                <div className="group relative bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/5 hover:border-[#EDD584]/30 rounded-3xl p-7 h-full overflow-hidden transition-all">
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#C8263E]/10 rounded-full blur-3xl group-hover:bg-[#C8263E]/20 transition-colors" />
                  <div className="relative">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#C8263E] to-[#8B1A2C] text-white flex items-center justify-center mb-5 shadow-lg shadow-[#C8263E]/25 border border-[#EDD584]/20">
                      <b.icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-heading text-xl font-bold mb-2">{b.title}</h3>
                    <p className="text-white/65 text-sm leading-relaxed">{b.text}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ALIANZA MUTUA */}
      <section className="py-20 sm:py-28 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#11232C]/40 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <Reveal>
            <div className="max-w-3xl">
              <span className="text-[#EDD584] text-xs font-bold uppercase tracking-[0.22em]">Beneficio mutuo</span>
              <h2 className="font-heading text-4xl sm:text-5xl font-black leading-[1.05] mt-4">
                Una alianza pensada para <span className="italic text-[#EDD584]">ganar juntos</span>
              </h2>
              <p className="mt-5 text-white/65 text-base sm:text-lg max-w-2xl leading-relaxed">
                Brindamos a los afiliados de Kuxtal un beneficio real, mientras tu empresa gana
                exposición, promoción continua y una relación comercial de largo plazo.
              </p>
            </div>
          </Reveal>
          <div className="mt-14 grid md:grid-cols-3 gap-5">
            {ALIANZA_CARDS.map((c, i) => (
              <Reveal key={c.title} delay={i * 120}>
                <div className="group relative bg-[#11232C]/40 backdrop-blur-sm border border-white/5 hover:border-[#EDD584]/30 rounded-3xl p-8 h-full overflow-hidden transition-all">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-[#EDD584]/5 rounded-full blur-3xl group-hover:bg-[#EDD584]/10 transition-colors" />
                  <div className="relative">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1F5A6E] to-[#0F3543] text-[#EDD584] flex items-center justify-center mb-5 shadow-lg border border-[#EDD584]/20">
                      <c.icon className="w-7 h-7" />
                    </div>
                    <h3 className="font-heading text-xl font-bold mb-3">{c.title}</h3>
                    <p className="text-white/65 leading-relaxed">{c.text}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* GANANCIAS (6 cards) — ribbon-style section */}
      <section className="py-20 sm:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#C8263E]/10 via-[#0B1115] to-[#1F5A6E]/10" />
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 15% 30%, #C8263E 0, transparent 35%), radial-gradient(circle at 85% 70%, #EDD584 0, transparent 35%)' }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <Reveal>
            <div className="text-center max-w-3xl mx-auto">
              <span className="text-[#C8263E] text-xs font-bold uppercase tracking-[0.22em]">Propuesta de valor</span>
              <h2 className="font-heading text-4xl sm:text-5xl font-black mt-4 leading-[1.05]">
                ¿Qué gana tu empresa al unirse?
              </h2>
              <p className="mt-5 text-white/70 text-base sm:text-lg leading-relaxed">
                Kuxtal Club no solo muestra un descuento. Presenta tu negocio dentro de una red
                de marcas con propuesta de valor y lo convierte en una opción atractiva para
                afiliados y sus familias.
              </p>
            </div>
          </Reveal>
          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {GANANCIAS.map((g, i) => (
              <Reveal key={g.title} delay={i * 80}>
                <div className="group bg-[#0B1115]/80 backdrop-blur-sm border border-white/5 hover:border-[#C8263E]/40 rounded-2xl p-6 h-full transition-all hover:translate-y-[-2px]">
                  <div className="flex items-start gap-4">
                    <div className="shrink-0 w-11 h-11 rounded-xl bg-[#C8263E]/15 border border-[#C8263E]/30 text-[#C8263E] flex items-center justify-center group-hover:bg-[#C8263E]/25 transition-colors">
                      <g.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-heading text-lg font-bold mb-1.5">{g.title}</h3>
                      <p className="text-white/60 text-sm leading-relaxed">{g.text}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA (timeline) */}
      <section className="py-20 sm:py-28 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <Reveal>
            <div className="max-w-3xl">
              <span className="text-[#EDD584] text-xs font-bold uppercase tracking-[0.22em]">Proceso</span>
              <h2 className="font-heading text-4xl sm:text-5xl font-black leading-[1.05] mt-4">
                Cómo funciona la afiliación
              </h2>
              <p className="mt-5 text-white/65 text-base sm:text-lg leading-relaxed">
                Un proceso ágil para que tu empresa entre rápido al ecosistema de beneficios
                y comience a ser presentada ante la comunidad Kuxtal.
              </p>
            </div>
          </Reveal>
          <div className="mt-14 grid md:grid-cols-4 gap-5 relative">
            <div className="hidden md:block absolute top-10 left-[12%] right-[12%] h-px bg-gradient-to-r from-[#C8263E]/40 via-[#EDD584]/60 to-[#C8263E]/40" />
            {STEPS.map((s, i) => (
              <Reveal key={s.title} delay={i * 120}>
                <div className="relative bg-[#11232C]/50 backdrop-blur-sm border border-white/5 hover:border-[#EDD584]/25 rounded-3xl p-6 h-full transition-colors">
                  <div className="relative mb-5">
                    <div className="w-16 h-16 rounded-2xl bg-[#0B1115] border-2 border-[#EDD584]/40 text-[#EDD584] flex items-center justify-center shadow-[0_0_32px_rgba(237,213,132,0.15)] relative z-10">
                      <s.icon className="w-7 h-7" />
                    </div>
                    <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-[#C8263E] to-[#8B1A2C] text-[#EDD584] text-sm font-black flex items-center justify-center shadow-lg z-20 border-2 border-[#0B1115]">
                      {i + 1}
                    </span>
                  </div>
                  <h3 className="font-heading text-lg font-bold mb-2">{s.title}</h3>
                  <p className="text-white/60 text-sm leading-relaxed">{s.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIAS */}
      <section className="py-20 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#11232C]/40 to-transparent" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <Reveal>
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="font-heading text-3xl sm:text-4xl font-black leading-tight">
                Categorías donde puede participar tu negocio
              </h2>
              <p className="mt-4 text-white/65">
                La plataforma organiza beneficios por categorías para facilitar que los socios
                descubran fácilmente cada comercio según su giro.
              </p>
            </div>
          </Reveal>
          <Reveal delay={150}>
            <div className="mt-12 flex flex-wrap justify-center gap-3">
              {CATEGORIES.map((c) => (
                <span key={c} className="px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-white/85 text-sm font-medium hover:border-[#EDD584]/60 hover:bg-[#EDD584]/10 hover:text-[#EDD584] transition-all cursor-default">
                  {c}
                </span>
              ))}
            </div>
          </Reveal>
          <Reveal delay={300}>
            <div className="mt-16 max-w-3xl mx-auto relative rounded-2xl p-[1px] bg-gradient-to-br from-[#EDD584]/50 via-[#C8263E]/40 to-[#1F5A6E]/50">
              <div className="relative bg-[#11232C]/90 backdrop-blur-sm rounded-2xl p-7">
                <p className="text-white/85 leading-relaxed">
                  <span className="font-bold text-[#EDD584]">Propuesta de valor:</span> tu empresa
                  aporta un beneficio especial para afiliados de Kuxtal Club, y a cambio recibe
                  presencia comercial, promoción digital y la oportunidad de convertirse en una
                  opción preferente dentro de una comunidad que valora comprar con ventajas.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* CTA FINAL */}
      <section id="afiliate" className="py-24 sm:py-32 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#C8263E]/30 via-[#11232C] to-[#1F5A6E]/30" />
          <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'radial-gradient(circle at 30% 40%, rgba(200,38,62,0.5) 0, transparent 45%), radial-gradient(circle at 80% 70%, rgba(237,213,132,0.3) 0, transparent 45%)' }} />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <Reveal>
            <img src={CLUB_LOGO} alt="Kuxtal Club" className="h-20 sm:h-24 w-auto mx-auto mb-8 drop-shadow-[0_10px_40px_rgba(200,38,62,0.5)]" />
          </Reveal>
          <Reveal delay={100}>
            <h2 className="font-heading text-4xl sm:text-6xl font-black leading-[1.02] tracking-tight">
              Conviértete en{' '}
              <span className="bg-gradient-to-r from-[#EDD584] to-[#D4B85A] bg-clip-text text-transparent">comercio aliado</span>
            </h2>
          </Reveal>
          <Reveal delay={150}>
            <p className="mt-7 text-lg text-white/80 max-w-2xl mx-auto leading-relaxed">
              Si tu empresa desea formar parte de Kuxtal Club, este es el momento de presentar
              tu marca, definir tu beneficio y sumarte a una red de alianzas estratégicas.
            </p>
          </Reveal>
          <Reveal delay={200}>
            <ul className="mt-12 grid sm:grid-cols-3 gap-4 text-left">
              {[
                'Ideal para comercios, clínicas, restaurantes, servicios y marcas con enfoque en fidelización.',
                'Publica promociones y beneficios exclusivos para afiliados.',
                'Presentación clara para compartir por correo, WhatsApp o reuniones comerciales.',
              ].map((t, i) => (
                <li key={i} className="bg-[#0B1115]/70 border border-[#EDD584]/20 backdrop-blur-sm rounded-2xl p-5 flex items-start gap-3 hover:border-[#EDD584]/50 transition-colors">
                  <CheckCircle2 className="w-5 h-5 text-[#EDD584] shrink-0 mt-0.5" />
                  <span className="text-white/85 text-sm leading-relaxed">{t}</span>
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={300}>
            <div className="mt-14 flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/partners/afiliar" className="group inline-flex items-center justify-center gap-2 px-10 py-5 rounded-full bg-gradient-to-br from-[#C8263E] to-[#8B1A2C] text-white font-black text-lg shadow-2xl shadow-[#C8263E]/40 border border-[#EDD584]/30 hover:scale-[1.04] transition-transform" data-testid="final-cta-afiliar">
                Iniciar proceso de afiliación
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <a href="https://kuxtaltravelgt.com/benefits" className="inline-flex items-center justify-center gap-2 px-10 py-5 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 hover:border-[#EDD584]/40 backdrop-blur-sm text-white font-semibold transition-colors">
                Explorar plataforma
              </a>
            </div>
          </Reveal>
          <Reveal delay={400}>
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-white/60">
              <a href="mailto:info@kuxtaltravelgt.com" className="inline-flex items-center gap-2 hover:text-[#EDD584] transition-colors">
                <Mail className="w-4 h-4" /> info@kuxtaltravelgt.com
              </a>
              <a href="https://wa.me/50200000000" className="inline-flex items-center gap-2 hover:text-[#EDD584] transition-colors">
                <MessageCircle className="w-4 h-4" /> WhatsApp directo
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-10 bg-black/60 border-t border-white/5 text-center text-sm relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <img src={CLUB_LOGO} alt="Kuxtal Club" className="h-12 mx-auto mb-3 opacity-90" />
          <p className="text-white/50">© {new Date().getFullYear()} Kuxtal Club · Programa de alianzas estratégicas</p>
          <p className="mt-2">
            <a href="https://kuxtaltravelgt.com" className="text-white/70 hover:text-[#EDD584] transition-colors">kuxtaltravelgt.com</a>
          </p>
        </div>
      </footer>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(-1deg); }
        }
      `}</style>
    </div>
  );
}

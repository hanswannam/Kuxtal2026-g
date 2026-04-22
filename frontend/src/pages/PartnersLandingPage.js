import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, CheckCircle2, Eye, Users, ShieldCheck, Handshake, Megaphone, Globe,
  Target, Sparkles, Smartphone, RefreshCw, Shield, Briefcase, FileText, ClipboardCheck,
  PenLine, Rocket, Mail, MessageCircle,
} from 'lucide-react';

const LOGO_URL = "https://customer-assets.emergentagent.com/job_vacation-club-portal/artifacts/ikgtmopq_logo%20kuxtal.avif";

// Hook: fade-in on scroll
function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); io.disconnect(); } },
      { threshold: 0.15 }
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
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a]">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <img src={LOGO_URL} alt="Kuxtal Travels" className="h-10" />
          <div className="flex items-center gap-2 sm:gap-3">
            <a href="https://kuxtaltravelgt.com/benefits" className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-[#1B325F] transition-colors">
              Ver comercios <ArrowRight className="w-3.5 h-3.5" />
            </a>
            <a href="#afiliate" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#1B325F] text-white text-sm font-semibold hover:bg-[#152950] transition-colors">
              Afiliar empresa
            </a>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-[#1B325F] via-[#1B325F] to-[#0F1F3D]" />
          <div
            className="absolute inset-0 opacity-20"
            style={{ backgroundImage: 'radial-gradient(circle at 25% 30%, #8BC540 0, transparent 45%), radial-gradient(circle at 80% 70%, #2d67b8 0, transparent 50%)' }}
          />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
          <Reveal>
            <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/90 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">
              Programa de alianzas estratégicas
            </span>
          </Reveal>
          <Reveal delay={100}>
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-white mt-6 leading-[1.05] max-w-4xl">
              Haz crecer tu empresa con <span className="text-[#8BC540]">Kuxtal Club</span>
            </h1>
          </Reveal>
          <Reveal delay={200}>
            <p className="mt-6 text-lg sm:text-xl text-white/80 max-w-3xl leading-relaxed">
              Conectamos marcas, comercios y servicios con una comunidad que valora el ahorro,
              la confianza y los beneficios exclusivos. Integra tu empresa como comercio aliado
              y da visibilidad a tus promociones y descuentos.
            </p>
          </Reveal>
          <Reveal delay={300}>
            <div className="mt-10 flex flex-col sm:flex-row gap-3">
              <a href="#afiliate" className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-[#8BC540] hover:bg-[#7bb336] text-[#0f1f3d] font-bold shadow-lg shadow-[#8BC540]/25 transition-all hover:scale-105" data-testid="hero-cta-afiliar">
                Quiero afiliar mi empresa <ArrowRight className="w-4 h-4" />
              </a>
              <a href="https://kuxtaltravelgt.com/benefits" className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 backdrop-blur-sm text-white font-semibold transition-colors" data-testid="hero-cta-benefits">
                Ver comercios afiliados
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* QUICK BENEFITS (3) */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-3 gap-6">
            {QUICK_BENEFITS.map((b, i) => (
              <Reveal key={b.title} delay={i * 100}>
                <div className="bg-[#f8fafc] border border-slate-200 rounded-3xl p-7 h-full hover:border-[#1B325F]/30 hover:shadow-lg transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-[#1B325F] text-white flex items-center justify-center mb-4">
                    <b.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-heading text-xl font-bold mb-2">{b.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{b.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ALIANZA MUTUA */}
      <section className="py-16 sm:py-24 bg-gradient-to-b from-[#f8fafc] to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <Reveal>
            <div className="max-w-3xl">
              <h2 className="font-heading text-3xl sm:text-4xl font-bold leading-tight">
                Una alianza pensada para <span className="text-[#1B325F]">beneficio mutuo</span>
              </h2>
              <p className="mt-4 text-slate-600 text-base sm:text-lg">
                El objetivo es brindar a los afiliados de Kuxtal un beneficio real en
                productos o servicios, mientras tu empresa gana exposición, promoción continua
                y una relación comercial de largo plazo.
              </p>
            </div>
          </Reveal>
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            {ALIANZA_CARDS.map((c, i) => (
              <Reveal key={c.title} delay={i * 120}>
                <div className="group relative bg-white border border-slate-200 rounded-3xl p-8 h-full overflow-hidden hover:border-[#8BC540] transition-all hover:shadow-xl">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#8BC540]/5 rounded-full blur-3xl group-hover:bg-[#8BC540]/10 transition-colors" />
                  <div className="relative">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1B325F] to-[#2d4a85] text-white flex items-center justify-center mb-5 shadow-lg shadow-[#1B325F]/20">
                      <c.icon className="w-7 h-7" />
                    </div>
                    <h3 className="font-heading text-xl font-bold mb-3">{c.title}</h3>
                    <p className="text-slate-600 leading-relaxed">{c.text}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* GANANCIAS (6 cards) */}
      <section className="py-16 sm:py-24 bg-[#0F1F3D] text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #8BC540 0, transparent 40%)' }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative">
          <Reveal>
            <div className="max-w-3xl">
              <span className="text-[#8BC540] text-sm font-semibold uppercase tracking-wider">Propuesta de valor</span>
              <h2 className="font-heading text-3xl sm:text-4xl font-bold mt-3 leading-tight">
                ¿Qué gana tu empresa al unirse?
              </h2>
              <p className="mt-4 text-white/70 text-base sm:text-lg">
                Kuxtal Club no solo muestra un descuento. Presenta tu negocio dentro de una red
                de marcas con propuesta de valor y lo convierte en una opción atractiva para
                afiliados y sus familias.
              </p>
            </div>
          </Reveal>
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {GANANCIAS.map((g, i) => (
              <Reveal key={g.title} delay={i * 80}>
                <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl p-6 h-full hover:bg-white/10 hover:border-[#8BC540]/30 transition-all">
                  <div className="flex items-start gap-4">
                    <div className="shrink-0 w-11 h-11 rounded-xl bg-[#8BC540]/20 border border-[#8BC540]/30 text-[#8BC540] flex items-center justify-center">
                      <g.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-heading text-lg font-bold mb-1.5">{g.title}</h3>
                      <p className="text-white/70 text-sm leading-relaxed">{g.text}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA (timeline) */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <Reveal>
            <div className="max-w-3xl">
              <h2 className="font-heading text-3xl sm:text-4xl font-bold leading-tight">
                Cómo funciona la afiliación
              </h2>
              <p className="mt-4 text-slate-600 text-base sm:text-lg">
                Un proceso ágil para que tu empresa entre rápido al ecosistema de beneficios
                y comience a ser presentada ante la comunidad Kuxtal.
              </p>
            </div>
          </Reveal>
          <div className="mt-12 grid md:grid-cols-4 gap-5 relative">
            <div className="hidden md:block absolute top-8 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-[#1B325F] via-[#8BC540] to-[#1B325F] opacity-20" />
            {STEPS.map((s, i) => (
              <Reveal key={s.title} delay={i * 120}>
                <div className="relative bg-[#f8fafc] border border-slate-200 rounded-3xl p-6 h-full hover:border-[#1B325F]/30 transition-colors">
                  <div className="relative mb-4">
                    <div className="w-16 h-16 rounded-2xl bg-white border-2 border-[#1B325F] text-[#1B325F] flex items-center justify-center shadow-lg relative z-10">
                      <s.icon className="w-7 h-7" />
                    </div>
                    <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-[#8BC540] text-[#0F1F3D] text-xs font-bold flex items-center justify-center shadow-md z-20">
                      {i + 1}
                    </span>
                  </div>
                  <h3 className="font-heading text-lg font-bold mb-2">{s.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{s.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIAS */}
      <section className="py-16 sm:py-20 bg-gradient-to-b from-white to-[#f8fafc]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <Reveal>
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="font-heading text-3xl sm:text-4xl font-bold leading-tight">
                Categorías donde puede participar tu negocio
              </h2>
              <p className="mt-4 text-slate-600">
                La plataforma organiza beneficios por categorías para facilitar que los socios
                descubran fácilmente cada comercio según su giro.
              </p>
            </div>
          </Reveal>
          <Reveal delay={150}>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              {CATEGORIES.map((c) => (
                <span key={c} className="px-5 py-2.5 rounded-full bg-white border border-slate-200 text-slate-700 text-sm font-medium hover:border-[#1B325F] hover:bg-[#1B325F] hover:text-white transition-all cursor-default">
                  {c}
                </span>
              ))}
            </div>
          </Reveal>
          <Reveal delay={300}>
            <div className="mt-14 max-w-3xl mx-auto bg-white border-l-4 border-[#8BC540] rounded-2xl p-6 sm:p-7 shadow-sm">
              <p className="text-slate-700 leading-relaxed">
                <span className="font-bold text-[#1B325F]">Propuesta de valor:</span> tu empresa
                aporta un beneficio especial para afiliados de Kuxtal Club, y a cambio recibe
                presencia comercial, promoción digital y la oportunidad de convertirse en una
                opción preferente dentro de una comunidad que valora comprar con ventajas.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* CTA FINAL */}
      <section id="afiliate" className="py-20 sm:py-28 bg-gradient-to-br from-[#1B325F] via-[#1B325F] to-[#0F1F3D] text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 70% 30%, #8BC540 0, transparent 45%)' }} />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 relative text-center">
          <Reveal>
            <h2 className="font-heading text-3xl sm:text-5xl font-bold leading-tight">
              Conviértete en <span className="text-[#8BC540]">comercio aliado</span>
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <p className="mt-6 text-lg text-white/80 max-w-2xl mx-auto">
              Si tu empresa desea formar parte de Kuxtal Club, este es el momento de presentar
              tu marca, definir tu beneficio y sumarte a una red de alianzas estratégicas.
            </p>
          </Reveal>
          <Reveal delay={200}>
            <ul className="mt-10 grid sm:grid-cols-3 gap-4 text-left">
              {[
                'Ideal para comercios, clínicas, restaurantes, servicios y marcas con enfoque en fidelización.',
                'Publica promociones y beneficios exclusivos para afiliados.',
                'Presentación clara para compartir por correo, WhatsApp o reuniones comerciales.',
              ].map((t, i) => (
                <li key={i} className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl p-5 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#8BC540] shrink-0 mt-0.5" />
                  <span className="text-white/90 text-sm leading-relaxed">{t}</span>
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={300}>
            <div className="mt-12 flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/partners/afiliar" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-[#8BC540] hover:bg-[#7bb336] text-[#0f1f3d] font-bold shadow-xl shadow-[#8BC540]/25 transition-all hover:scale-105" data-testid="final-cta-afiliar">
                Iniciar proceso de afiliación <ArrowRight className="w-5 h-5" />
              </Link>
              <a href="https://kuxtaltravelgt.com/benefits" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 backdrop-blur-sm text-white font-semibold transition-colors">
                Explorar plataforma
              </a>
            </div>
          </Reveal>
          <Reveal delay={400}>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-5 text-sm text-white/60">
              <a href="mailto:info@kuxtaltravelgt.com" className="inline-flex items-center gap-2 hover:text-white transition-colors">
                <Mail className="w-4 h-4" /> info@kuxtaltravelgt.com
              </a>
              <a href="https://wa.me/50200000000" className="inline-flex items-center gap-2 hover:text-white transition-colors">
                <MessageCircle className="w-4 h-4" /> WhatsApp directo
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-10 bg-[#0a1325] text-white/60 text-center text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <img src={LOGO_URL} alt="Kuxtal Travels" className="h-10 mx-auto mb-3 opacity-80" />
          <p>© {new Date().getFullYear()} Kuxtal Travels · Kuxtal Club — Programa de alianzas estratégicas</p>
          <p className="mt-2">
            <a href="https://kuxtaltravelgt.com" className="hover:text-white transition-colors">kuxtaltravelgt.com</a>
          </p>
        </div>
      </footer>
    </div>
  );
}

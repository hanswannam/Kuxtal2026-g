import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Download, Search, Menu, X, BookOpen, ArrowLeft, Sparkles, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { toast } from 'sonner';

const NAVY = '#0D2B45';
const NAVY_DEEP = '#061829';
const GOLD = '#D4AF5A';
const CHAMPAGNE = '#E5C989';
const SERIF = '"Playfair Display", Georgia, serif';

const ROLE_META = {
  admin: { label: 'Administrador', color: NAVY, accent: GOLD, backTo: '/admin', backLabel: 'Volver al panel' },
  member: { label: 'Socio', color: NAVY, accent: GOLD, backTo: '/member', backLabel: 'Volver al portal' },
  commerce: { label: 'Comercio', color: NAVY, accent: GOLD, backTo: '/commerce-portal', backLabel: 'Volver al portal' },
};

// Slugify text into a URL-safe id for headings
const slug = (s) => String(s || '')
  .toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/(^-|-$)/g, '');

export default function ManualPage() {
  const { role } = useParams();
  const { user } = useAuth();
  const [markdown, setMarkdown] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [tocOpen, setTocOpen] = useState(false);
  const [activeSlug, setActiveSlug] = useState('');
  const contentRef = useRef(null);

  useDocumentTitle(`Manual ${ROLE_META[role]?.label || ''}`);

  const meta = ROLE_META[role];

  useEffect(() => {
    if (!meta) return;
    setLoading(true);
    api.get(`/manuals/${role}/markdown`)
      .then(r => {
        setMarkdown(r.data.markdown || '');
        setTitle(r.data.title || `Manual ${meta.label}`);
        setLoading(false);
      })
      .catch(e => {
        setError(e.response?.status === 403 ? 'No tenés acceso a este manual' : 'No se pudo cargar el manual');
        setLoading(false);
      });
  }, [role, meta]);

  // Build TOC from markdown headings (H2 only — primary sections)
  const toc = useMemo(() => {
    if (!markdown) return [];
    const lines = markdown.split('\n');
    const items = [];
    for (const ln of lines) {
      const m = ln.match(/^##\s+(.+)$/);
      if (m) {
        const text = m[1].replace(/[#*`]/g, '').trim();
        items.push({ text, slug: slug(text) });
      }
    }
    return items;
  }, [markdown]);

  // Filter markdown by search query (highlights matches by leaving content but allows TOC filter)
  const filteredToc = useMemo(() => {
    if (!search.trim()) return toc;
    const q = search.toLowerCase();
    return toc.filter(t => t.text.toLowerCase().includes(q));
  }, [toc, search]);

  // Track active section on scroll
  useEffect(() => {
    if (!contentRef.current) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) setActiveSlug(e.target.id);
        });
      },
      { rootMargin: '-100px 0px -60% 0px', threshold: 0 }
    );
    const headings = contentRef.current.querySelectorAll('h2[id]');
    headings.forEach(h => observer.observe(h));
    return () => observer.disconnect();
  }, [markdown]);

  const downloadPdf = async () => {
    try {
      const res = await api.get(`/manuals/${role}/pdf`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `Manual_${meta.label}_Kuxtal.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('PDF descargado');
    } catch (e) {
      toast.error('No se pudo descargar el PDF');
    }
  };

  if (!meta) return <Navigate to="/" replace />;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div
      className="min-h-screen pt-20 relative"
      style={{ background: 'linear-gradient(180deg, #FAF8F3 0%, #F3EEE2 50%, #FAF8F3 100%)' }}
      data-testid={`manual-page-${role}`}
    >
      {/* Marble veins */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{ backgroundImage: `radial-gradient(ellipse at 15% 15%, ${GOLD} 0, transparent 40%), radial-gradient(ellipse at 85% 80%, ${GOLD} 0, transparent 40%)` }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Top bar: back + actions */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <Link
            to={meta.backTo}
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] hover:gap-3 transition-all"
            style={{ color: NAVY }}
            data-testid="manual-back-btn"
          >
            <ArrowLeft className="w-4 h-4" style={{ color: GOLD }} />
            {meta.backLabel}
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTocOpen(true)}
              className="lg:hidden inline-flex items-center gap-2 px-4 h-10 rounded-full text-xs font-bold uppercase tracking-[0.18em]"
              style={{ background: '#FFFFFF', border: `1px solid ${GOLD}66`, color: NAVY }}
              data-testid="manual-toc-toggle"
            >
              <Menu className="w-4 h-4" /> Índice
            </button>
            <Button
              onClick={downloadPdf}
              className="rounded-full h-10 px-5 font-bold text-xs uppercase tracking-[0.18em]"
              style={{
                background: `linear-gradient(135deg, #F5E6B8 0%, ${GOLD} 50%, #B8944A 100%)`,
                color: NAVY_DEEP,
                border: `1px solid ${GOLD}`,
                boxShadow: `0 8px 20px -6px rgba(212,175,90,0.5)`,
              }}
              data-testid="manual-download-pdf"
            >
              <Download className="w-4 h-4 mr-2" /> Descargar PDF
            </Button>
          </div>
        </div>

        {/* Editorial title */}
        <div className="mb-12 sm:mb-16 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="h-px w-10 sm:w-16" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}aa)` }} />
            <Sparkles className="w-3 h-3" style={{ color: GOLD }} />
            <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.3em]" style={{ color: '#8B6F2E' }}>
              Manual oficial
            </p>
            <Sparkles className="w-3 h-3" style={{ color: GOLD }} />
            <div className="h-px w-10 sm:w-16" style={{ background: `linear-gradient(90deg, ${GOLD}aa, transparent)` }} />
          </div>
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-black leading-[0.95]" style={{ color: NAVY }}>
            Portal del{' '}
            <span className="italic font-semibold" style={{ fontFamily: SERIF, background: `linear-gradient(92deg, ${GOLD} 0%, #B8944A 50%, ${GOLD} 100%)`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
              {meta.label}
            </span>
          </h1>
          <p className="mt-4 italic text-base sm:text-lg" style={{ color: `${NAVY}88`, fontFamily: SERIF }}>
            Guía completa de uso · Kuxtal Travels
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 lg:gap-12">
          {/* TOC sidebar — desktop */}
          <aside className="hidden lg:block sticky top-28 self-start max-h-[calc(100vh-8rem)] overflow-y-auto pr-2">
            <ManualToc
              toc={filteredToc}
              search={search}
              setSearch={setSearch}
              activeSlug={activeSlug}
              onClick={() => {}}
            />
          </aside>

          {/* TOC drawer — mobile */}
          {tocOpen && (
            <div
              className="fixed inset-0 z-50 lg:hidden flex"
              data-testid="manual-toc-drawer"
              onClick={() => setTocOpen(false)}
            >
              <div className="absolute inset-0" style={{ background: `${NAVY_DEEP}d0`, backdropFilter: 'blur(6px)' }} />
              <div
                className="relative ml-auto w-[300px] max-w-[85%] h-full overflow-y-auto p-6 animate-slide-in"
                style={{ background: '#FAF8F3', boxShadow: '-20px 0 40px -10px rgba(13,43,69,0.4)' }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setTocOpen(false)}
                  className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ background: '#FFFFFF', border: `1px solid ${GOLD}55` }}
                  data-testid="manual-toc-close"
                >
                  <X className="w-4 h-4" style={{ color: NAVY }} />
                </button>
                <ManualToc
                  toc={filteredToc}
                  search={search}
                  setSearch={setSearch}
                  activeSlug={activeSlug}
                  onClick={() => setTocOpen(false)}
                />
              </div>
            </div>
          )}

          {/* Content */}
          <article
            ref={contentRef}
            className="min-w-0 manual-content"
            data-testid="manual-content"
          >
            {loading && (
              <div className="text-center py-20">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-2 border-transparent" style={{ borderTopColor: GOLD, borderRightColor: GOLD }} />
                <p className="mt-4 italic text-sm" style={{ color: `${NAVY}88`, fontFamily: SERIF }}>Cargando manual…</p>
              </div>
            )}
            {error && !loading && (
              <div className="rounded-2xl p-8 text-center" style={{ background: '#FFFFFF', border: `1px solid ${GOLD}55` }}>
                <p className="font-semibold" style={{ color: NAVY }}>{error}</p>
              </div>
            )}
            {!loading && !error && (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: () => null, // hide first H1 (already shown as hero)
                  h2: ({ children }) => {
                    const text = String(children).replace(/[#*`]/g, '').trim();
                    return (
                      <h2 id={slug(text)} className="font-heading text-2xl sm:text-3xl font-bold mt-12 mb-4 scroll-mt-28" style={{ color: NAVY, paddingLeft: '12px', borderLeft: `3px solid ${GOLD}` }}>
                        {children}
                      </h2>
                    );
                  },
                  h3: ({ children }) => (
                    <h3 className="font-heading text-lg sm:text-xl font-bold mt-8 mb-3 italic" style={{ color: '#8B6F2E', fontFamily: SERIF }}>
                      {children}
                    </h3>
                  ),
                  h4: ({ children }) => (
                    <h4 className="text-xs font-bold uppercase tracking-[0.2em] mt-6 mb-2" style={{ color: NAVY }}>
                      {children}
                    </h4>
                  ),
                  p: ({ children }) => (
                    <p className="mb-4 leading-relaxed text-[15px]" style={{ color: `${NAVY}cc` }}>{children}</p>
                  ),
                  strong: ({ children }) => (
                    <strong style={{ color: NAVY, fontWeight: 700 }}>{children}</strong>
                  ),
                  em: ({ children }) => (
                    <em style={{ color: '#8B6F2E', fontFamily: SERIF }}>{children}</em>
                  ),
                  a: ({ children, href }) => (
                    <a href={href} className="font-semibold border-b transition-colors" style={{ color: GOLD, borderColor: `${GOLD}55` }}>
                      {children}
                    </a>
                  ),
                  ul: ({ children }) => (
                    <ul className="my-4 space-y-1.5 pl-5 marker:text-[#D4AF5A]" style={{ listStyle: 'disc', color: `${NAVY}cc` }}>{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="my-4 space-y-1.5 pl-5 marker:font-bold marker:text-[#8B6F2E]" style={{ listStyle: 'decimal', color: `${NAVY}cc` }}>{children}</ol>
                  ),
                  li: ({ children }) => (
                    <li className="text-[15px] leading-relaxed">{children}</li>
                  ),
                  hr: () => (
                    <hr className="my-12 border-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}aa, transparent)` }} />
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="my-6 px-6 py-4 rounded-r-xl italic text-[15px]" style={{ background: '#FAF6EB', borderLeft: `3px solid ${GOLD}`, color: '#4A3F2A', fontFamily: SERIF }}>
                      {children}
                    </blockquote>
                  ),
                  code: ({ inline, children }) => (
                    inline ? (
                      <code className="px-2 py-0.5 rounded text-[13px] font-mono" style={{ background: NAVY_DEEP, color: CHAMPAGNE }}>
                        {children}
                      </code>
                    ) : (
                      <code className="block">{children}</code>
                    )
                  ),
                  pre: ({ children }) => (
                    <pre className="my-6 p-5 rounded-xl overflow-x-auto text-[13px] font-mono" style={{ background: NAVY_DEEP, color: CHAMPAGNE, border: `1px solid ${GOLD}33`, borderLeft: `3px solid ${GOLD}` }}>
                      {children}
                    </pre>
                  ),
                  table: ({ children }) => (
                    <div className="my-6 overflow-x-auto rounded-xl" style={{ border: `1px solid ${GOLD}55` }}>
                      <table className="w-full text-sm">{children}</table>
                    </div>
                  ),
                  thead: ({ children }) => (
                    <thead style={{ background: NAVY }}>{children}</thead>
                  ),
                  th: ({ children }) => (
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.15em]" style={{ color: CHAMPAGNE }}>
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="px-4 py-3 align-top" style={{ color: `${NAVY}cc`, borderTop: `1px solid ${GOLD}33` }}>
                      {children}
                    </td>
                  ),
                  tr: ({ children }) => (
                    <tr style={{ background: '#FFFFFF' }}>{children}</tr>
                  ),
                }}
              >
                {markdown}
              </ReactMarkdown>
            )}

            {/* End of doc */}
            {!loading && !error && (
              <div className="mt-16 pt-8 text-center" style={{ borderTop: `1px solid ${GOLD}33` }}>
                <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.3em]" style={{ color: '#8B6F2E' }}>
                  Fin del manual
                </p>
                <p className="mt-2 italic text-sm" style={{ color: `${NAVY}88`, fontFamily: SERIF }}>
                  Kuxtal Travels · Versión Feb 2026
                </p>
                <Button
                  onClick={downloadPdf}
                  className="mt-6 rounded-full h-11 px-6 font-bold text-xs uppercase tracking-[0.18em]"
                  style={{
                    background: `linear-gradient(135deg, #F5E6B8 0%, ${GOLD} 50%, #B8944A 100%)`,
                    color: NAVY_DEEP,
                    border: `1px solid ${GOLD}`,
                  }}
                  data-testid="manual-download-pdf-bottom"
                >
                  <Download className="w-4 h-4 mr-2" /> Descargar como PDF
                </Button>
              </div>
            )}
          </article>
        </div>
      </div>
    </div>
  );
}

function ManualToc({ toc, search, setSearch, activeSlug, onClick }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="w-4 h-4" style={{ color: GOLD }} />
        <p className="text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: '#8B6F2E' }}>Contenido</p>
      </div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: GOLD }} />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar sección…"
          className="pl-10 h-10 rounded-full border-0 text-sm"
          style={{ background: '#FFFFFF', color: NAVY, boxShadow: `inset 0 0 0 1px ${GOLD}55`, fontFamily: SERIF, fontStyle: 'italic' }}
          data-testid="manual-search-input"
        />
      </div>
      <nav className="space-y-0.5" data-testid="manual-toc">
        {toc.length === 0 && (
          <p className="text-xs italic px-2 py-3" style={{ color: `${NAVY}77`, fontFamily: SERIF }}>Sin coincidencias</p>
        )}
        {toc.map((t, i) => {
          const active = activeSlug === t.slug;
          return (
            <a
              key={t.slug + i}
              href={`#${t.slug}`}
              onClick={onClick}
              className="group flex items-start gap-2 px-3 py-2 rounded-lg text-[13px] transition-all"
              style={active ? {
                background: `${GOLD}22`,
                color: NAVY,
                fontWeight: 700,
                borderLeft: `2px solid ${GOLD}`,
              } : {
                color: `${NAVY}99`,
                borderLeft: `2px solid transparent`,
              }}
              data-testid={`manual-toc-link-${i}`}
            >
              <ChevronRight className="w-3 h-3 mt-1 shrink-0 transition-transform group-hover:translate-x-0.5" style={{ color: active ? GOLD : `${NAVY}55` }} />
              <span className="leading-snug">{t.text}</span>
            </a>
          );
        })}
      </nav>
    </div>
  );
}

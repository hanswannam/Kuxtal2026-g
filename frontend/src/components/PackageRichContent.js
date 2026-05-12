import React from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Plus, Trash2, Upload, X, MapPin, Hotel as HotelIcon, Image as ImageIcon, Youtube, Calendar } from 'lucide-react';
import api from '../lib/api';
import { toast } from 'sonner';

const GOLD_DEEP = '#B89327';
const NAVY = '#0D2B45';

async function uploadImage(file) {
  if (!file) return null;
  const fd = new FormData();
  fd.append('file', file);
  try {
    const r = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    return r.data.url;
  } catch {
    toast.error('Error al subir imagen');
    return null;
  }
}

function GalleryEditor({ images, onChange, testidPrefix }) {
  const list = Array.isArray(images) ? images : [];
  const addUrl = () => {
    const url = window.prompt('Pega la URL de la imagen');
    if (url && url.trim()) onChange([...list, url.trim()]);
  };
  const handleFile = async (e) => {
    const files = Array.from(e.target.files || []);
    const uploaded = [];
    for (const f of files) {
      const url = await uploadImage(f);
      if (url) uploaded.push(url);
    }
    if (uploaded.length) {
      onChange([...list, ...uploaded]);
      toast.success(`${uploaded.length} imagen(es) agregada(s)`);
    }
    e.target.value = '';
  };
  return (
    <div className="space-y-2" data-testid={`${testidPrefix}-gallery`}>
      <div className="flex items-center gap-2 flex-wrap">
        <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs px-3 h-8 rounded-full text-white font-semibold" style={{ background: NAVY }}>
          <Upload className="w-3.5 h-3.5" />
          Subir imágenes
          <input type="file" accept="image/*" multiple className="hidden" onChange={handleFile} data-testid={`${testidPrefix}-file-input`} />
        </label>
        <button type="button" onClick={addUrl} className="text-xs px-3 h-8 rounded-full border" style={{ borderColor: GOLD_DEEP, color: GOLD_DEEP }} data-testid={`${testidPrefix}-add-url`}>
          + Pegar URL
        </button>
        <span className="text-[11px] text-muted-foreground">{list.length} foto{list.length === 1 ? '' : 's'}</span>
      </div>
      {list.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {list.map((u, i) => (
            <div key={`${u}-${i}`} className="relative aspect-square rounded-lg overflow-hidden group" style={{ border: '1px solid rgba(212,175,55,0.35)' }}>
              <img src={u} alt={`g-${i}`} className="w-full h-full object-cover" onError={e => { e.target.style.opacity = 0.3; }} />
              <button
                type="button"
                onClick={() => onChange(list.filter((_, idx) => idx !== i))}
                className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition"
                data-testid={`${testidPrefix}-remove-${i}`}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PackageRichContent({ form, setForm }) {
  const update = (patch) => setForm({ ...form, ...patch });

  // Itinerary
  const ensureDays = (count) => {
    const n = Math.max(0, Math.min(60, parseInt(count) || 0));
    const cur = Array.isArray(form.itinerary_days) ? form.itinerary_days : [];
    let days;
    if (n > cur.length) {
      days = [...cur];
      for (let i = cur.length; i < n; i++) {
        days.push({ day: i + 1, title: '', description: '', gallery: [] });
      }
    } else {
      days = cur.slice(0, n).map((d, i) => ({ ...d, day: i + 1 }));
    }
    update({ itinerary_days: days });
  };
  const updateDay = (i, patch) => {
    const cur = [...(form.itinerary_days || [])];
    cur[i] = { ...cur[i], ...patch };
    update({ itinerary_days: cur });
  };

  // Hotels
  const ensureHotels = (count) => {
    const n = Math.max(0, Math.min(40, parseInt(count) || 0));
    const cur = Array.isArray(form.hotels) ? form.hotels : [];
    let hotels;
    if (n > cur.length) {
      hotels = [...cur];
      for (let i = cur.length; i < n; i++) {
        hotels.push({ name: '', description: '', gallery: [] });
      }
    } else {
      hotels = cur.slice(0, n);
    }
    update({ hotels });
  };
  const updateHotel = (i, patch) => {
    const cur = [...(form.hotels || [])];
    cur[i] = { ...cur[i], ...patch };
    update({ hotels: cur });
  };

  const sectionStyle = {
    background: 'linear-gradient(135deg, #FDF9EC 0%, #FAF3DD 100%)',
    border: '1px solid rgba(212,175,55,0.35)',
  };

  return (
    <div className="space-y-5 pt-4 border-t-2" style={{ borderColor: 'rgba(212,175,55,0.35)' }}>
      <p className="text-xs font-bold uppercase tracking-[0.22em]" style={{ color: GOLD_DEEP }}>
        Contenido enriquecido
      </p>

      {/* Galería principal del paquete */}
      <div className="rounded-xl p-4" style={sectionStyle} data-testid="rc-main-gallery">
        <div className="flex items-center gap-2 mb-3">
          <ImageIcon className="w-4 h-4" style={{ color: GOLD_DEEP }} />
          <p className="text-sm font-semibold" style={{ color: NAVY }}>Galería del paquete</p>
        </div>
        <GalleryEditor
          images={form.gallery || []}
          onChange={(g) => update({ gallery: g })}
          testidPrefix="rc-main"
        />
      </div>

      {/* YouTube */}
      <div className="rounded-xl p-4" style={sectionStyle}>
        <div className="flex items-center gap-2 mb-2">
          <Youtube className="w-4 h-4" style={{ color: GOLD_DEEP }} />
          <Label className="text-sm font-semibold" style={{ color: NAVY }}>Video de YouTube (opcional)</Label>
        </div>
        <Input
          value={form.youtube_url || ''}
          onChange={(e) => update({ youtube_url: e.target.value })}
          placeholder="https://www.youtube.com/watch?v=... o https://youtu.be/..."
          className="rounded-xl"
          data-testid="rc-youtube"
        />
      </div>

      {/* Itinerario */}
      <div className="rounded-xl p-4" style={sectionStyle}>
        <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" style={{ color: GOLD_DEEP }} />
            <p className="text-sm font-semibold" style={{ color: NAVY }}>Itinerario por día</p>
          </div>
          <label className="inline-flex items-center gap-2 text-xs font-medium cursor-pointer">
            <input
              type="checkbox"
              checked={!!form.has_itinerary}
              onChange={(e) => update({ has_itinerary: e.target.checked, itinerary_days: e.target.checked ? (form.itinerary_days || []) : [] })}
              data-testid="rc-has-itinerary"
            />
            ¿Este paquete tiene itinerario?
          </label>
        </div>
        {form.has_itinerary && (
          <>
            <div className="flex items-center gap-2 mb-3">
              <Label className="text-xs whitespace-nowrap">¿Cuántos días?</Label>
              <Input
                type="number"
                min="1" max="60"
                value={(form.itinerary_days || []).length}
                onChange={(e) => ensureDays(e.target.value)}
                className="rounded-xl w-24"
                data-testid="rc-day-count"
              />
              <Button type="button" size="sm" variant="outline" onClick={() => ensureDays((form.itinerary_days || []).length + 1)} className="rounded-full text-xs" data-testid="rc-add-day">
                <Plus className="w-3 h-3 mr-1" /> Añadir día
              </Button>
            </div>
            {(form.itinerary_days || []).length === 0 && (
              <p className="text-xs text-muted-foreground italic">Define cuántos días tiene el itinerario para empezar.</p>
            )}
            <div className="space-y-3">
              {(form.itinerary_days || []).map((d, i) => (
                <div key={i} className="rounded-lg p-3 bg-white" style={{ border: '1px solid rgba(212,175,55,0.40)' }} data-testid={`rc-day-${i}`}>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ background: NAVY, color: '#F5D27A' }}>
                      <MapPin className="w-3 h-3" /> Día {i + 1}
                    </span>
                    <button type="button" onClick={() => ensureDays((form.itinerary_days || []).length - 1)} className="text-red-700 hover:bg-red-50 rounded p-1" title="Quitar último día" data-testid={`rc-day-remove-${i}`}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <Input
                    value={d.title || ''}
                    onChange={(e) => updateDay(i, { title: e.target.value })}
                    placeholder="Título del día (ej: Llegada a Antigua Guatemala)"
                    className="rounded-xl mb-2"
                    data-testid={`rc-day-title-${i}`}
                  />
                  <Textarea
                    value={d.description || ''}
                    onChange={(e) => updateDay(i, { description: e.target.value })}
                    rows={3}
                    placeholder="Descripción detallada del día..."
                    className="rounded-xl mb-2"
                    data-testid={`rc-day-desc-${i}`}
                  />
                  <GalleryEditor
                    images={d.gallery || []}
                    onChange={(g) => updateDay(i, { gallery: g })}
                    testidPrefix={`rc-day-gallery-${i}`}
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Hoteles Previstos */}
      <div className="rounded-xl p-4" style={sectionStyle}>
        <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
          <div className="flex items-center gap-2">
            <HotelIcon className="w-4 h-4" style={{ color: GOLD_DEEP }} />
            <p className="text-sm font-semibold" style={{ color: NAVY }}>Hoteles previstos</p>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs whitespace-nowrap">¿Cuántos hoteles?</Label>
            <Input
              type="number"
              min="0" max="40"
              value={(form.hotels || []).length}
              onChange={(e) => ensureHotels(e.target.value)}
              className="rounded-xl w-24"
              data-testid="rc-hotel-count"
            />
            <Button type="button" size="sm" variant="outline" onClick={() => ensureHotels((form.hotels || []).length + 1)} className="rounded-full text-xs" data-testid="rc-add-hotel">
              <Plus className="w-3 h-3 mr-1" /> Añadir hotel
            </Button>
          </div>
        </div>
        {(form.hotels || []).length === 0 ? (
          <p className="text-xs text-muted-foreground italic">Aún no has agregado hoteles previstos.</p>
        ) : (
          <div className="space-y-3">
            {(form.hotels || []).map((h, i) => (
              <div key={i} className="rounded-lg p-3 bg-white" style={{ border: '1px solid rgba(212,175,55,0.40)' }} data-testid={`rc-hotel-${i}`}>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ background: NAVY, color: '#F5D27A' }}>
                    <HotelIcon className="w-3 h-3" /> Hotel #{i + 1}
                  </span>
                  <button type="button" onClick={() => ensureHotels((form.hotels || []).length - 1)} className="text-red-700 hover:bg-red-50 rounded p-1" title="Quitar último hotel" data-testid={`rc-hotel-remove-${i}`}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <Input
                  value={h.name || ''}
                  onChange={(e) => updateHotel(i, { name: e.target.value })}
                  placeholder="Nombre del hotel (ej: Casa Santo Domingo)"
                  className="rounded-xl mb-2"
                  data-testid={`rc-hotel-name-${i}`}
                />
                <Textarea
                  value={h.description || ''}
                  onChange={(e) => updateHotel(i, { description: e.target.value })}
                  rows={3}
                  placeholder="Categoría, ubicación, comodidades..."
                  className="rounded-xl mb-2"
                  data-testid={`rc-hotel-desc-${i}`}
                />
                <GalleryEditor
                  images={h.gallery || []}
                  onChange={(g) => updateHotel(i, { gallery: g })}
                  testidPrefix={`rc-hotel-gallery-${i}`}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

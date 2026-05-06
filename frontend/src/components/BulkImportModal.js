import React, { useRef, useState } from 'react';
import { Button } from './ui/button';
import { Download, Upload, X, FileSpreadsheet, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/api';

/**
 * Generic bulk-import modal. Accepts XLSX/CSV, does a dry_run preview first,
 * and only commits once the admin confirms.
 *
 * Props:
 *  - open: boolean
 *  - onClose: fn
 *  - title: e.g. "Importar socios desde Excel"
 *  - entityLabel: "socios" | "paquetes"
 *  - templateEndpoint: e.g. "/admin/members/template"
 *  - importEndpoint:   e.g. "/admin/members/bulk-import"
 *  - templateFilename: "plantilla_socios.xlsx"
 *  - onImported: fn(summary)  // called after a successful real import
 */
export default function BulkImportModal({
  open,
  onClose,
  title,
  entityLabel,
  templateEndpoint,
  importEndpoint,
  templateFilename,
  onImported,
  supportsUpdate = false,  // si true, muestra checkbox "Actualizar existentes"
}) {
  const fileRef = useRef(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [phase, setPhase] = useState('idle'); // idle | preview | committing | done
  const [result, setResult] = useState(null);
  const [updateExisting, setUpdateExisting] = useState(false);

  if (!open) return null;

  const reset = () => {
    setFile(null);
    setPreview(null);
    setPhase('idle');
    setResult(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const close = () => { reset(); onClose && onClose(); };

  const downloadTemplate = async () => {
    try {
      const r = await api.get(templateEndpoint, { responseType: 'blob' });
      const blob = new Blob([r.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = templateFilename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('Plantilla descargada');
    } catch (e) {
      toast.error(e.response?.data?.detail || 'No se pudo descargar la plantilla');
    }
  };

  const pickFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(null);
    setResult(null);
    setPhase('idle');
  };

  const runDryRun = async () => {
    if (!file) { toast.error('Selecciona un archivo primero'); return; }
    setPhase('committing');
    try {
      const form = new FormData();
      form.append('file', file);
      const params = new URLSearchParams({ dry_run: 'true' });
      if (updateExisting) params.set('update_existing', 'true');
      const r = await api.post(`${importEndpoint}?${params.toString()}`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setPreview(r.data);
      setPhase('preview');
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Error al procesar el archivo');
      setPhase('idle');
    }
  };

  const commit = async () => {
    if (!file) return;
    setPhase('committing');
    try {
      const form = new FormData();
      form.append('file', file);
      const params = new URLSearchParams();
      if (updateExisting) params.set('update_existing', 'true');
      const url = params.toString() ? `${importEndpoint}?${params.toString()}` : importEndpoint;
      const r = await api.post(url, form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setResult(r.data);
      setPhase('done');
      const created = r.data.created?.length || 0;
      const updated = r.data.updated?.length || 0;
      const msg = updated > 0
        ? `${created} creados, ${updated} actualizados`
        : `Importados ${created} ${entityLabel}`;
      toast.success(msg);
      onImported && onImported(r.data);
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Error al importar');
      setPhase('preview');
    }
  };

  const previewRows = preview?.preview || [];
  const errorRows = preview?.errors || result?.errors || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" data-testid="bulk-import-modal">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            <h3 className="font-heading text-lg font-semibold">{title}</h3>
          </div>
          <Button variant="ghost" onClick={close}><X className="w-4 h-4" /></Button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {phase !== 'done' && (
            <>
              <div className="rounded-2xl border border-border p-4 flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Download className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">1. Descarga la plantilla</p>
                  <p className="text-xs text-muted-foreground mb-3">Ábrela en Excel/Google Sheets, llénala y guárdala como .xlsx o .csv. Los campos con * son obligatorios.</p>
                  <Button onClick={downloadTemplate} variant="outline" size="sm" className="rounded-full" data-testid="download-template-btn">
                    <Download className="w-3.5 h-3.5 mr-2" /> Descargar plantilla
                  </Button>
                </div>
              </div>

              <div className="rounded-2xl border border-border p-4 flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Upload className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">2. Sube tu archivo lleno</p>
                  <p className="text-xs text-muted-foreground mb-3">Formatos aceptados: .xlsx o .csv</p>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                    onChange={pickFile}
                    className="block w-full text-xs file:mr-3 file:rounded-full file:border-0 file:bg-primary file:text-white file:text-xs file:font-medium file:px-4 file:py-2 hover:file:bg-primary/90"
                    data-testid="bulk-file-input"
                  />
                  {file && <p className="text-xs text-muted-foreground mt-2" data-testid="bulk-file-selected">📎 {file.name} — {Math.round(file.size / 1024)} KB</p>}
                </div>
              </div>

              {supportsUpdate && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 flex items-start gap-3" data-testid="update-existing-block">
                  <input
                    id="bulk-update-existing"
                    type="checkbox"
                    checked={updateExisting}
                    onChange={(e) => { setUpdateExisting(e.target.checked); setPreview(null); }}
                    className="mt-0.5 w-4 h-4 cursor-pointer accent-amber-600"
                    data-testid="bulk-update-existing-checkbox"
                  />
                  <label htmlFor="bulk-update-existing" className="cursor-pointer flex-1">
                    <p className="font-medium text-sm text-amber-900">Actualizar registros existentes</p>
                    <p className="text-xs text-amber-800 mt-0.5">
                      Si activás esta opción, los <span className="font-semibold">{entityLabel}</span> cuyo número de contrato ya exista se actualizarán con los datos del archivo (en vez de marcarse como duplicados).
                    </p>
                  </label>
                </div>
              )}
            </>
          )}

          {preview && phase === 'preview' && (
            <div className="rounded-2xl border border-border overflow-hidden">
              <div className="p-4 border-b border-border bg-secondary/40">
                <p className="font-medium text-sm">3. Vista previa ({preview.valid} de {preview.total_rows} filas válidas)</p>
                <p className="text-xs text-muted-foreground">Nada se ha guardado todavía. Revisa los datos y confirma abajo.</p>
              </div>
              {previewRows.length > 0 && (
                <div className="overflow-x-auto max-h-64">
                  <table className="w-full text-xs">
                    <thead className="bg-secondary/30 sticky top-0">
                      <tr>
                        <th className="text-left p-2 font-medium">#</th>
                        {Object.keys(previewRows[0]).filter(k => k !== 'row').slice(0, 5).map(k => (
                          <th key={k} className="text-left p-2 font-medium">{k}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.slice(0, 20).map((r) => (
                        <tr key={r.row} className="border-t border-border" data-testid={`preview-row-${r.row}`}>
                          <td className="p-2 text-muted-foreground">{r.row}</td>
                          {Object.keys(previewRows[0]).filter(k => k !== 'row').slice(0, 5).map(k => (
                            <td key={k} className="p-2">{String(r[k] ?? '')}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {previewRows.length > 20 && <p className="p-2 text-[11px] text-muted-foreground text-center">+ {previewRows.length - 20} más no mostradas</p>}
                </div>
              )}
            </div>
          )}

          {errorRows.length > 0 && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4" data-testid="bulk-errors">
              <p className="font-medium text-sm text-red-700 flex items-center gap-1 mb-2">
                <AlertTriangle className="w-4 h-4" /> {errorRows.length} filas con errores
              </p>
              <ul className="text-xs text-red-700 space-y-1 max-h-40 overflow-y-auto">
                {errorRows.slice(0, 50).map((e, i) => (
                  <li key={i}>Fila {e.row}: {e.error}</li>
                ))}
              </ul>
            </div>
          )}

          {phase === 'done' && result && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center" data-testid="bulk-done">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
              <p className="font-heading text-lg font-semibold text-emerald-800">
                ¡Importación completada!
              </p>
              <p className="text-sm text-emerald-700 mt-1">
                {result.created?.length || 0} {entityLabel} agregados. {result.errors?.length > 0 ? `${result.errors.length} errores.` : ''}
              </p>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-border flex gap-2 justify-end">
          {phase === 'done' ? (
            <Button onClick={close} className="rounded-full bg-primary hover:bg-primary/90" data-testid="bulk-close-btn">Cerrar</Button>
          ) : (
            <>
              <Button variant="outline" onClick={close} className="rounded-full" data-testid="bulk-cancel-btn">Cancelar</Button>
              {phase === 'preview' ? (
                <Button onClick={commit} disabled={!preview?.valid} className="rounded-full bg-primary hover:bg-primary/90" data-testid="bulk-commit-btn">
                  Confirmar e importar {preview?.valid || 0} {entityLabel}
                </Button>
              ) : (
                <Button onClick={runDryRun} disabled={!file || phase === 'committing'} className="rounded-full bg-primary hover:bg-primary/90" data-testid="bulk-preview-btn">
                  {phase === 'committing' ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analizando...</> : 'Analizar archivo'}
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

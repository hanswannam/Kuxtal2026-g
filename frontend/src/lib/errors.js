/**
 * Convert FastAPI / axios error responses into a human readable string.
 *
 * FastAPI returns 422 errors as: `{ detail: [{type, loc, msg, input, url}, ...] }`.
 * Passing that object/array directly to a React node (e.g. a sonner toast)
 * triggers "Minified React error #31: Objects are not valid as a React child".
 *
 * This helper accepts whatever shape comes back and returns a safe string.
 */
export function formatApiError(err, fallback = 'Ocurrió un error') {
  if (!err) return fallback;
  // axios error
  const data = err.response?.data;
  if (data) {
    const detail = data.detail ?? data.message ?? data.error ?? data;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
      return detail
        .map((d) => {
          if (typeof d === 'string') return d;
          if (d && typeof d === 'object') {
            const loc = Array.isArray(d.loc) ? d.loc.filter((s) => s !== 'body').join(' › ') : '';
            return loc ? `${loc}: ${d.msg || ''}` : (d.msg || JSON.stringify(d));
          }
          return String(d);
        })
        .filter(Boolean)
        .join(' · ') || fallback;
    }
    if (detail && typeof detail === 'object') return detail.msg || JSON.stringify(detail);
  }
  if (typeof err === 'string') return err;
  return err.message || fallback;
}

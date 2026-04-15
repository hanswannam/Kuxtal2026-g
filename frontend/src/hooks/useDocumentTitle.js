import { useEffect } from 'react';

export function useDocumentTitle(title) {
  useEffect(() => {
    const prev = document.title;
    document.title = title ? `${title} | Kuxtal Travel` : 'Kuxtal Travel - Club Vacacional';
    return () => { document.title = prev; };
  }, [title]);
}

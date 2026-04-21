import React, { useState } from 'react';

// White silhouette of the Kuxtal logo, looks great over the navy brand background.
export const KUXTAL_LOGO_FALLBACK = '/icons/logo-white.png';

/**
 * Image that shows the Kuxtal logo whenever:
 *   1. `src` is empty / null / undefined
 *   2. `src` exists but fails to load (onError)
 *
 * The fallback matches the brand (logo centered on navy #1B325F) so no broken-image placeholders ever show.
 */
export default function ImageWithFallback({ src, alt = '', className = '', fallback = KUXTAL_LOGO_FALLBACK, ...rest }) {
  const [current, setCurrent] = useState(src || fallback);
  const isFallback = current === fallback;
  return (
    <img
      {...rest}
      src={current}
      alt={alt || 'Kuxtal Travel'}
      onError={() => { if (!isFallback) setCurrent(fallback); }}
      className={`${className} ${isFallback ? 'object-contain bg-[#1B325F] p-8' : ''}`.trim()}
      loading={rest.loading || 'lazy'}
    />
  );
}

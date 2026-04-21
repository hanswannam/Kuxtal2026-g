import React, { useState } from 'react';

export const KUXTAL_LOGO_FALLBACK = '/icons/logo-white.png';

/**
 * Image that shows the Kuxtal logo as a centered 20% badge over a navy background
 * whenever `src` is empty/null/undefined OR fails to load.
 */
export default function ImageWithFallback({ src, alt = '', className = '', fallback = KUXTAL_LOGO_FALLBACK, ...rest }) {
  const [errored, setErrored] = useState(false);
  const useFallback = !src || errored;

  if (useFallback) {
    // Render the "no-image" state: navy box with logo centered at ~20% of the box width.
    return (
      <div
        className={`${className} bg-[#1B325F] flex items-center justify-center`.trim()}
        role="img"
        aria-label={alt || 'Kuxtal Travels'}
        data-testid={rest['data-testid']}
      >
        <img
          src={fallback}
          alt={alt || 'Kuxtal Travels'}
          className="w-2/5 max-w-[220px] h-auto object-contain opacity-90"
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <img
      {...rest}
      src={src}
      alt={alt}
      onError={() => setErrored(true)}
      className={className}
      loading={rest.loading || 'lazy'}
    />
  );
}

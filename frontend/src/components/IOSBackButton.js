import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

/**
 * Floating back button that appears ONLY when the app is running as an
 * installed iOS PWA in standalone mode (no Safari chrome → no native back gesture).
 *
 * iOS detection: `window.navigator.standalone === true` (Apple-specific property).
 * The button is hidden on the home route ("/") so users at the root see no
 * dead-end "back" action.
 *
 * Styling: navy circle with gold border, bottom-left, large enough for thumb tap,
 * respects safe-area-inset-bottom (notch / home indicator).
 */
export default function IOSBackButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Apple-only standalone property; also handle modern matchMedia for thoroughness.
    const isIOSStandalone =
      // Mobile Safari standalone (legacy + the one that actually works on iOS PWA)
      (typeof window !== 'undefined' && window.navigator && window.navigator.standalone === true) ||
      // Modern matchMedia (some iOS versions report standalone here too)
      (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(display-mode: standalone)').matches &&
       /iPhone|iPad|iPod/.test(navigator.userAgent || ''));
    setShow(isIOSStandalone);
  }, []);

  if (!show) return null;
  // Hide on home so user knows they are at root
  if (location.pathname === '/' || location.pathname === '') return null;

  const handleBack = () => {
    // If there's history depth, go back; else go to home as safe fallback.
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <button
      onClick={handleBack}
      aria-label="Atrás"
      data-testid="ios-back-button"
      style={{
        position: 'fixed',
        left: '16px',
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 18px)',
        zIndex: 9999,
        width: '52px',
        height: '52px',
        borderRadius: '50%',
        background: '#0D2B45',
        color: '#F5D27A',
        border: '2px solid #D4AF37',
        boxShadow: '0 6px 20px rgba(13, 43, 69, 0.45), 0 2px 6px rgba(0,0,0,0.18)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
        transition: 'transform 120ms ease, box-shadow 120ms ease',
      }}
      onTouchStart={(e) => { e.currentTarget.style.transform = 'scale(0.92)'; }}
      onTouchEnd={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
    >
      <ChevronLeft style={{ width: 26, height: 26 }} strokeWidth={2.5} />
    </button>
  );
}

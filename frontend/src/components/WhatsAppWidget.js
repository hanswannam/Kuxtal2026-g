import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { MessageCircle } from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

export default function WhatsAppWidget() {
  const [phone, setPhone] = useState('');

  useEffect(() => {
    axios.get(`${API}/api/config/whatsapp`).then(r => setPhone(r.data.phone)).catch(() => {});
  }, []);

  if (!phone) return null;

  const cleanPhone = phone.replace(/[^0-9+]/g, '');
  const url = `https://wa.me/${cleanPhone}?text=Hola,%20me%20interesa%20información%20sobre%20Kuxtal%20Travel`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="whatsapp-float"
      data-testid="whatsapp-widget"
      aria-label="Chat por WhatsApp"
    >
      <MessageCircle className="w-7 h-7 text-white" fill="white" />
    </a>
  );
}

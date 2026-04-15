import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Trash2, ShieldAlert } from 'lucide-react';

export function DeleteWithCode({ onConfirm, label = 'Eliminar', size = 'sm' }) {
  const [showModal, setShowModal] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    if (code === 'BORRAR YA') {
      onConfirm(code);
      setShowModal(false);
      setCode('');
      setError('');
    } else {
      setError('Clave incorrecta');
    }
  };

  return (
    <>
      <Button size={size} variant="ghost" onClick={() => setShowModal(true)} className="text-destructive" data-testid="delete-trigger">
        <Trash2 className="w-3.5 h-3.5" />
      </Button>
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in" data-testid="delete-modal">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-50 rounded-xl"><ShieldAlert className="w-6 h-6 text-red-500" /></div>
              <div>
                <h3 className="font-heading text-lg font-semibold">Confirmar eliminación</h3>
                <p className="text-xs text-muted-foreground">Esta acción requiere clave secreta</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">Ingresa la clave de eliminación para continuar:</p>
            <Input
              value={code}
              onChange={e => { setCode(e.target.value); setError(''); }}
              placeholder="Clave secreta"
              className="rounded-xl mb-2"
              autoFocus
              data-testid="delete-code-input"
            />
            {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
            <div className="flex gap-3 mt-4">
              <Button variant="outline" onClick={() => { setShowModal(false); setCode(''); setError(''); }} className="flex-1 rounded-xl">Cancelar</Button>
              <Button onClick={handleConfirm} className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 text-white" data-testid="delete-confirm-btn">
                <Trash2 className="w-4 h-4 mr-2" /> Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

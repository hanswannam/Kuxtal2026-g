import React from 'react';
import DOMPurify from 'dompurify';
import { Badge } from '../../components/ui/badge';
import { FileText } from 'lucide-react';

export function MemberQuotations({ quotations }) {
  return (
    <div className="space-y-4 animate-fade-in" data-testid="member-quotations">
      {quotations.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-border text-center">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-heading text-lg font-semibold mb-2">Sin cotizaciones</h3>
          <p className="text-sm text-muted-foreground">Tus cotizaciones apareceran aqui</p>
        </div>
      ) : (
        quotations.map((q, i) => (
          <div key={q._id} className="bg-white rounded-2xl p-5 border border-border" data-testid={`quotation-${i}`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold">Cotizacion #{q._id?.slice(-6)}</h3>
                <p className="text-xs text-muted-foreground">{new Date(q.created_at).toLocaleDateString('es')}</p>
              </div>
              <Badge variant={q.status === 'responded' ? 'default' : 'secondary'} className="rounded-full">
                {q.status === 'pending' ? 'Pendiente' : 'Respondida'}
              </Badge>
            </div>
            {q.message && <p className="text-sm text-muted-foreground mb-2">{q.message}</p>}
            {q.response_html && (
              <div className="mt-3 p-4 bg-accent/50 rounded-xl text-sm" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(q.response_html) }} />
            )}
            {q.response && !q.response_html && (
              <div className="mt-3 p-4 bg-accent/50 rounded-xl text-sm">{q.response}</div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

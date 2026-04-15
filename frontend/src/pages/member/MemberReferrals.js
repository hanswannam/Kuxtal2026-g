import React from 'react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Share2, Copy, Send, MessageCircle, Gift } from 'lucide-react';
import { toast } from 'sonner';

export function MemberReferrals({ referralData }) {
  return (
    <div className="space-y-6 animate-fade-in" data-testid="member-referrals">
      <div className="bg-white rounded-2xl p-6 border border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-accent rounded-xl"><Share2 className="w-5 h-5 text-primary" /></div>
          <div>
            <h2 className="font-heading text-lg font-semibold">Tu Codigo de Referido</h2>
            <p className="text-xs text-muted-foreground">Comparte este enlace con amigos y familiares</p>
          </div>
        </div>
        {referralData?.code ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex-1 p-3 bg-secondary rounded-xl font-mono font-bold text-lg text-center text-primary" data-testid="referral-code">
                {referralData.code}
              </div>
              <Button variant="outline" className="rounded-xl shrink-0" onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/referral/${referralData.code}`);
                toast.success('Enlace copiado');
              }} data-testid="copy-referral">
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Button className="flex-1 rounded-xl bg-[#25D366] hover:bg-[#25D366]/90 text-white" onClick={() => {
                window.open(`https://wa.me/?text=${encodeURIComponent(`Te invito a conocer Kuxtal Travel Club: ${window.location.origin}/referral/${referralData.code}`)}`, '_blank');
              }} data-testid="share-wa-referral">
                <MessageCircle className="w-4 h-4 mr-2" /> Compartir por WhatsApp
              </Button>
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => {
                window.open(`mailto:?subject=${encodeURIComponent('Invitacion a Kuxtal Travel')}&body=${encodeURIComponent(`Te invito a conocer Kuxtal Travel Club: ${window.location.origin}/referral/${referralData.code}`)}`, '_blank');
              }} data-testid="share-email-referral">
                <Send className="w-4 h-4 mr-2" /> Email
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Cargando tu codigo...</p>
        )}
      </div>

      <div className="bg-white rounded-2xl p-6 border border-border">
        <h3 className="font-heading text-lg font-semibold mb-4">Mis Referidos ({referralData?.total || 0})</h3>
        {(!referralData?.referrals || referralData.referrals.length === 0) ? (
          <div className="text-center py-8">
            <Gift className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Aun no tienes referidos. Comparte tu codigo!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {referralData.referrals.map((r, i) => (
              <div key={r._id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl" data-testid={`my-referral-${i}`}>
                <div>
                  <p className="font-medium text-sm">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString('es')}</p>
                </div>
                <Badge variant={r.status === 'converted' ? 'default' : 'secondary'} className="rounded-full text-xs">
                  {r.status === 'pending' ? 'Pendiente' : r.status === 'contacted' ? 'Contactado' : r.status === 'converted' ? 'Convertido' : r.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

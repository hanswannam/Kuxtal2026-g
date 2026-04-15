import React from 'react';
import { Bell } from 'lucide-react';

export function MemberAnnouncements({ announcements }) {
  return (
    <div className="space-y-4 animate-fade-in" data-testid="member-announcements">
      {announcements.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-border text-center">
          <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-heading text-lg font-semibold mb-2">Sin anuncios</h3>
          <p className="text-sm text-muted-foreground">Los nuevos anuncios apareceran aqui</p>
        </div>
      ) : (
        announcements.map((a, i) => (
          <div key={a._id} className="bg-white rounded-2xl p-5 border border-border" data-testid={`announcement-${i}`}>
            <h3 className="font-heading text-lg font-semibold mb-2">{a.title}</h3>
            <p className="text-sm text-muted-foreground mb-2">{a.content}</p>
            {a.link && (
              <a href={a.link} target="_blank" rel="noopener noreferrer" className="text-primary text-sm font-medium hover:underline">
                Ver mas
              </a>
            )}
            <p className="text-xs text-muted-foreground mt-3">{new Date(a.created_at).toLocaleDateString('es')}</p>
          </div>
        ))
      )}
    </div>
  );
}

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Send, MessageSquare, ArrowLeft, X, Plus, Clock } from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/api';

const API = process.env.REACT_APP_BACKEND_URL;
const ax = api;

export default function ChatPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [showNewConv, setShowNewConv] = useState(false);
  const messagesEndRef = useRef(null);
  const pollRef = useRef(null);
  const isAdmin = user?.role === 'super_admin' || user?.role === 'admin';

  const loadConversations = useCallback(async () => {
    try {
      const { data } = await ax.get('/chat/conversations');
      setConversations(data);
    } catch {}
  }, []);

  const loadMessages = useCallback(async (convId) => {
    try {
      const { data } = await ax.get(`/chat/conversations/${convId}/messages`);
      setMessages(data);
    } catch {}
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  useEffect(() => {
    if (activeConv) {
      loadMessages(activeConv._id);
      pollRef.current = setInterval(() => { loadMessages(activeConv._id); loadConversations(); }, 5000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [activeConv, loadMessages, loadConversations]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const startConversation = async () => {
    try {
      const { data } = await ax.post('/chat/conversations', { subject: newSubject || 'Conversación' });
      setActiveConv(data);
      setShowNewConv(false);
      setNewSubject('');
      loadConversations();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error');
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConv) return;
    try {
      await ax.post(`/chat/conversations/${activeConv._id}/messages`, { text: newMessage });
      setNewMessage('');
      loadMessages(activeConv._id);
      loadConversations();
    } catch { toast.error('Error al enviar mensaje'); }
  };

  const closeConversation = async (convId) => {
    await ax.put(`/chat/conversations/${convId}/close`);
    toast.success('Conversación cerrada');
    setActiveConv(null);
    loadConversations();
  };

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);

  return (
    <div className="min-h-screen pt-20 bg-secondary/20" data-testid="chat-page">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight">
              {isAdmin ? 'Centro de Mensajes' : 'Chat con Soporte'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isAdmin ? 'Gestiona las conversaciones con socios' : 'Comunícate directamente con nuestro equipo'}
            </p>
          </div>
          {totalUnread > 0 && <Badge className="rounded-full bg-primary">{totalUnread} sin leer</Badge>}
        </div>

        <div className="bg-white rounded-2xl border border-border overflow-hidden" style={{ height: 'calc(100vh - 200px)', minHeight: '500px' }}>
          <div className="flex h-full">
            {/* Conversations List */}
            <div className={`w-full sm:w-80 border-r border-border flex flex-col ${activeConv ? 'hidden sm:flex' : 'flex'}`} data-testid="conv-list">
              <div className="p-4 border-b border-border">
                {!isAdmin && (
                  <Button onClick={() => setShowNewConv(true)} className="w-full rounded-xl bg-primary hover:bg-primary/90" size="sm" data-testid="new-conv-btn">
                    <Plus className="w-4 h-4 mr-2" /> Nueva Conversación
                  </Button>
                )}
                {isAdmin && <p className="text-sm font-medium">Conversaciones ({conversations.length})</p>}
              </div>
              <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                  <div className="p-6 text-center">
                    <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Sin conversaciones</p>
                  </div>
                ) : (
                  conversations.map((c, i) => (
                    <button
                      key={c._id}
                      onClick={() => setActiveConv(c)}
                      className={`w-full text-left p-4 border-b border-border hover:bg-secondary/50 transition-colors ${activeConv?._id === c._id ? 'bg-accent/50' : ''}`}
                      data-testid={`conv-${i}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm line-clamp-1">{isAdmin ? c.user_name : c.subject}</span>
                        {c.unread_count > 0 && <Badge className="rounded-full bg-primary text-xs h-5 w-5 flex items-center justify-center p-0">{c.unread_count}</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">{c.last_message || c.subject}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{c.status === 'closed' ? 'Cerrada' : 'Abierta'}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Messages Area */}
            <div className={`flex-1 flex flex-col ${!activeConv ? 'hidden sm:flex' : 'flex'}`}>
              {activeConv ? (
                <>
                  <div className="p-4 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button onClick={() => setActiveConv(null)} className="sm:hidden p-1"><ArrowLeft className="w-5 h-5" /></button>
                      <div>
                        <p className="font-medium text-sm">{isAdmin ? activeConv.user_name : activeConv.subject}</p>
                        <p className="text-xs text-muted-foreground">{activeConv.status === 'closed' ? 'Cerrada' : 'Activa'}</p>
                      </div>
                    </div>
                    {isAdmin && activeConv.status === 'open' && (
                      <Button size="sm" variant="outline" onClick={() => closeConversation(activeConv._id)} className="rounded-full text-xs" data-testid="close-conv-btn">
                        <X className="w-3 h-3 mr-1" /> Cerrar
                      </Button>
                    )}
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3" data-testid="messages-area">
                    {messages.map((m, i) => {
                      const isMe = m.sender_id === user?._id || m.sender_id === user?.id;
                      return (
                        <div key={m._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`} data-testid={`msg-${i}`}>
                          <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${isMe ? 'bg-primary text-white rounded-br-md' : 'bg-secondary rounded-bl-md'}`}>
                            <p className={`text-xs font-medium mb-0.5 ${isMe ? 'text-white/70' : 'text-muted-foreground'}`}>{m.sender_name}</p>
                            <p className="text-sm">{m.text}</p>
                            <p className={`text-[10px] mt-1 ${isMe ? 'text-white/50' : 'text-muted-foreground'}`}>
                              {new Date(m.created_at).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                  {activeConv.status === 'open' && (
                    <form onSubmit={sendMessage} className="p-4 border-t border-border flex gap-2" data-testid="send-message-form">
                      <Input
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        placeholder="Escribe un mensaje..."
                        className="rounded-xl"
                        data-testid="message-input"
                      />
                      <Button type="submit" className="rounded-xl bg-primary hover:bg-primary/90 shrink-0" data-testid="send-msg-btn">
                        <Send className="w-4 h-4" />
                      </Button>
                    </form>
                  )}
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-center p-8">
                  <div>
                    <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-heading text-lg font-semibold mb-1">Selecciona una conversación</h3>
                    <p className="text-sm text-muted-foreground">o inicia una nueva</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* New Conversation Modal */}
        {showNewConv && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in" data-testid="new-conv-modal">
            <div className="bg-white rounded-2xl w-full max-w-sm p-6">
              <h3 className="font-heading text-lg font-semibold mb-4">Nueva Conversación</h3>
              <div className="space-y-3">
                <div>
                  <Input value={newSubject} onChange={e => setNewSubject(e.target.value)} placeholder="Asunto (ej: Consulta sobre viaje)" className="rounded-xl" data-testid="conv-subject" />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowNewConv(false)} className="flex-1 rounded-xl">Cancelar</Button>
                  <Button onClick={startConversation} className="flex-1 rounded-xl bg-primary hover:bg-primary/90" data-testid="start-conv-btn">Iniciar</Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

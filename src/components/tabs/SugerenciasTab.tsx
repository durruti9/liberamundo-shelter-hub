import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { MessageSquarePlus, Send, Languages, User, EyeOff, Mail, Phone, Clock, ChevronDown, ChevronUp, Reply } from 'lucide-react';
import { UserRole } from '@/types';
import { api } from '@/lib/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Props {
  role: UserRole;
  albergueId: string;
  userName?: string;
}

interface Sugerencia {
  id: string;
  nombre: string;
  anonimo: boolean;
  email: string;
  telefono: string;
  mensaje: string;
  fecha: string;
  leida: boolean;
  respuesta: string;
  traduccion: string;
}

export default function SugerenciasTab({ role, albergueId, userName }: Props) {
  const isAdmin = role === 'admin';
  const [sugerencias, setSugerencias] = useState<Sugerencia[]>([]);
  const [loading, setLoading] = useState(false);

  // Form state for guests
  const [nombre, setNombre] = useState('');
  const [anonimo, setAnonimo] = useState(false);
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Admin state
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [translatingId, setTranslatingId] = useState<string | null>(null);

  const loadSugerencias = useCallback(async () => {
    if (!isAdmin) return;
    try {
      setLoading(true);
      const data = await api.getSugerencias(albergueId);
      if (Array.isArray(data)) {
        setSugerencias(data);
      } else {
        // API returned non-JSON (e.g. HTML fallback), use localStorage
        const local = JSON.parse(localStorage.getItem(`sugerencias_${albergueId}`) || '[]');
        setSugerencias(local);
      }
    } catch {
      // Fallback to localStorage
      const local = JSON.parse(localStorage.getItem(`sugerencias_${albergueId}`) || '[]');
      setSugerencias(local);
    } finally {
      setLoading(false);
    }
  }, [albergueId, isAdmin]);

  useEffect(() => { loadSugerencias(); }, [loadSugerencias]);

  const handleSubmit = async () => {
    if (!mensaje.trim()) return;
    try {
      await api.addSugerencia(albergueId, {
        nombre: anonimo ? '' : nombre,
        anonimo,
        email,
        telefono,
        mensaje,
      });
      setSubmitted(true);
      setNombre('');
      setEmail('');
      setTelefono('');
      setMensaje('');
      setAnonimo(false);
    } catch (err) {
      console.error('Error submitting suggestion:', err);
    }
  };

  const updateSugerenciaLocal = (id: string, updates: Partial<Sugerencia>) => {
    const key = `sugerencias_${albergueId}`;
    const existing: Sugerencia[] = JSON.parse(localStorage.getItem(key) || '[]');
    const updated = existing.map(s => s.id === id ? { ...s, ...updates } : s);
    localStorage.setItem(key, JSON.stringify(updated));
  };

  const handleTranslate = async (id: string, text: string) => {
    setTranslatingId(id);
    try {
      const sug = sugerencias.find(s => s.id === id);
      if (sug && !sug.traduccion) {
        try {
          await api.updateSugerencia(id, { traduccion: '__pending__' });
        } catch {
          updateSugerenciaLocal(id, { traduccion: '__pending__' });
        }
        await loadSugerencias();
      }
    } finally {
      setTranslatingId(null);
    }
  };

  const handleReply = async (id: string) => {
    if (!replyText.trim()) return;
    try {
      await api.updateSugerencia(id, { respuesta: replyText, leida: true });
    } catch {
      updateSugerenciaLocal(id, { respuesta: replyText, leida: true });
    }
    setReplyText('');
    setExpandedId(null);
    await loadSugerencias();
  };

  const markAsRead = async (id: string) => {
    try {
      await api.updateSugerencia(id, { leida: true });
    } catch {
      updateSugerenciaLocal(id, { leida: true });
    }
    await loadSugerencias();
  };

  // GUEST VIEW - Simple, accessible suggestion form
  if (!isAdmin) {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <div className="text-center space-y-2">
          <MessageSquarePlus className="w-10 h-10 text-primary mx-auto" />
          <h2 className="text-xl font-bold">Buzón de sugerencias</h2>
          <p className="text-sm text-muted-foreground">
            Tu opinión es importante. Escribe aquí lo que necesites comunicarnos: sugerencias, peticiones, quejas o cualquier comentario. Puedes hacerlo de forma anónima.
          </p>
        </div>

        {submitted ? (
          <Card className="border-[hsl(142,60%,40%)]/30 bg-[hsl(142,60%,95%)]">
            <CardContent className="p-6 text-center space-y-3">
              <div className="text-4xl">✅</div>
              <h3 className="font-semibold text-lg">¡Mensaje enviado!</h3>
              <p className="text-sm text-muted-foreground">
                Gracias por tu mensaje. Lo revisaremos lo antes posible.
                {email && ' Si has dejado tu email, recibirás una respuesta.'}
              </p>
              <Button onClick={() => setSubmitted(false)} variant="outline" className="mt-4">
                Enviar otro mensaje
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-5 space-y-4">
              {/* Anonymous toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  {anonimo ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <User className="w-4 h-4 text-primary" />}
                  <Label className="text-sm cursor-pointer">Enviar de forma anónima</Label>
                </div>
                <Switch checked={anonimo} onCheckedChange={setAnonimo} />
              </div>

              {/* Name (if not anonymous) */}
              {!anonimo && (
                <div className="space-y-1.5">
                  <Label className="text-sm">Tu nombre</Label>
                  <Input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="¿Cómo te llamas?" />
                </div>
              )}

              {/* Message */}
              <div className="space-y-1.5">
                <Label className="text-sm">Tu mensaje *</Label>
                <Textarea
                  value={mensaje}
                  onChange={e => setMensaje(e.target.value)}
                  rows={4}
                  placeholder="Escribe aquí tu sugerencia, petición o comentario..."
                  className="resize-none"
                />
              </div>

              {/* Contact info (optional) */}
              <div className="space-y-2 pt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  Opcional: deja tus datos si quieres que podamos responderte
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs flex items-center gap-1"><Mail className="w-3 h-3" /> Email</Label>
                    <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" className="h-9 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs flex items-center gap-1"><Phone className="w-3 h-3" /> Teléfono</Label>
                    <Input type="tel" value={telefono} onChange={e => setTelefono(e.target.value)} placeholder="+34 600..." className="h-9 text-sm" />
                  </div>
                </div>
              </div>

              <Button onClick={handleSubmit} disabled={!mensaje.trim()} className="w-full gap-2" size="lg">
                <Send className="w-4 h-4" /> Enviar mensaje
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // ADMIN VIEW - List of suggestions
  const unread = sugerencias.filter(s => !s.leida).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <MessageSquarePlus className="w-5 h-5 text-primary" /> Buzón de sugerencias
          {unread > 0 && (
            <Badge className="bg-destructive text-destructive-foreground text-xs">{unread} sin leer</Badge>
          )}
        </h2>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Cargando...</p>
      ) : sugerencias.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <MessageSquarePlus className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No hay sugerencias todavía.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sugerencias.map(sug => (
            <Card key={sug.id} className={`border transition-colors ${!sug.leida ? 'border-primary/40 bg-primary/5' : ''}`}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {sug.anonimo ? (
                        <Badge variant="outline" className="text-xs gap-1"><EyeOff className="w-3 h-3" /> Anónimo</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs gap-1"><User className="w-3 h-3" /> {sug.nombre}</Badge>
                      )}
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {(() => {
                          try {
                            return format(new Date(sug.fecha), "d MMM yyyy HH:mm", { locale: es });
                          } catch {
                            return sug.fecha;
                          }
                        })()}
                      </span>
                      {!sug.leida && <Badge className="bg-primary text-primary-foreground text-[10px]">Nueva</Badge>}
                    </div>

                    {/* Contact info */}
                    {(sug.email || sug.telefono) && (
                      <div className="flex gap-3 mt-1">
                        {sug.email && (
                          <a href={`mailto:${sug.email}`} className="text-xs text-primary hover:underline flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {sug.email}
                          </a>
                        )}
                        {sug.telefono && (
                          <a href={`tel:${sug.telefono}`} className="text-xs text-primary hover:underline flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {sug.telefono}
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost" size="sm"
                      onClick={() => setExpandedId(expandedId === sug.id ? null : sug.id)}
                      className="text-xs gap-1"
                    >
                      {expandedId === sug.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </Button>
                  </div>
                </div>

                {/* Message */}
                <p className="text-sm whitespace-pre-wrap">{sug.mensaje}</p>

                {/* Existing reply */}
                {sug.respuesta && (
                  <div className="p-2 rounded bg-[hsl(142,60%,95%)] border border-[hsl(142,60%,70%)]/30">
                    <p className="text-xs font-semibold text-[hsl(142,60%,30%)] flex items-center gap-1"><Reply className="w-3 h-3" /> Tu respuesta:</p>
                    <p className="text-xs text-[hsl(142,60%,30%)] whitespace-pre-wrap">{sug.respuesta}</p>
                  </div>
                )}

                {/* Expanded: reply + actions */}
                {expandedId === sug.id && (
                  <div className="space-y-3 pt-2 border-t">
                    <div className="flex gap-2">
                      {!sug.leida && (
                        <Button variant="outline" size="sm" onClick={() => markAsRead(sug.id)} className="text-xs">
                          Marcar como leída
                        </Button>
                      )}
                      <Button
                        variant="outline" size="sm"
                        onClick={() => handleTranslate(sug.id, sug.mensaje)}
                        disabled={translatingId === sug.id}
                        className="text-xs gap-1"
                      >
                        <Languages className="w-3 h-3" /> Traducir
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-semibold">Responder al huésped</Label>
                      <Textarea
                        value={expandedId === sug.id ? replyText : ''}
                        onChange={e => setReplyText(e.target.value)}
                        rows={2}
                        placeholder="Escribe tu respuesta..."
                        className="resize-none text-sm"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleReply(sug.id)} disabled={!replyText.trim()} className="gap-1">
                          <Send className="w-3 h-3" /> Guardar respuesta
                        </Button>
                        {(sug.email || sug.telefono) && (
                          <p className="text-xs text-muted-foreground self-center">
                            💡 Puedes contactarle por {sug.email ? 'email' : ''}{sug.email && sug.telefono ? ' o ' : ''}{sug.telefono ? 'teléfono' : ''} con los datos de arriba
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

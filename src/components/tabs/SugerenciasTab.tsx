import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { MessageSquarePlus, Send, Languages, User, EyeOff, Mail, Phone, Clock, ChevronDown, ChevronUp, Reply, Trash2, CheckCircle2, CircleDot, AlertTriangle, Paperclip } from 'lucide-react';
import { UserRole } from '@/types';
import { api } from '@/lib/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

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
  resuelta: boolean;
  adjunto?: string;
  adjuntoNombre?: string;
  adjuntoTipo?: string;
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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const loadSugerencias = useCallback(async () => {
    if (!isAdmin) return;
    try {
      setLoading(true);
      const data = await api.getSugerencias(albergueId);
      if (Array.isArray(data)) {
        setSugerencias(data);
      } else {
        const local = JSON.parse(localStorage.getItem(`sugerencias_${albergueId}`) || '[]');
        setSugerencias(local);
      }
    } catch {
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
      setNombre(''); setEmail(''); setTelefono(''); setMensaje(''); setAnonimo(false);
    } catch (err) {
      console.error('Error submitting suggestion:', err);
    }
  };

  const updateLocal = (id: string, updates: Partial<Sugerencia>) => {
    const key = `sugerencias_${albergueId}`;
    const existing: Sugerencia[] = JSON.parse(localStorage.getItem(key) || '[]');
    localStorage.setItem(key, JSON.stringify(existing.map(s => s.id === id ? { ...s, ...updates } : s)));
  };

  const deleteLocal = (ids: string[]) => {
    const key = `sugerencias_${albergueId}`;
    const existing: Sugerencia[] = JSON.parse(localStorage.getItem(key) || '[]');
    localStorage.setItem(key, JSON.stringify(existing.filter(s => !ids.includes(s.id))));
  };

  const clearLocal = () => {
    localStorage.setItem(`sugerencias_${albergueId}`, '[]');
  };

  const handleTranslate = async (id: string, text: string) => {
    setTranslatingId(id);
    try {
      // Use free translation API (MyMemory) to translate to Spanish
      const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=autodetect|es`);
      const data = await response.json();
      const translated = data?.responseData?.translatedText || text;
      
      try {
        await api.updateSugerencia(id, { traduccion: translated });
      } catch {
        updateLocal(id, { traduccion: translated });
      }
      await loadSugerencias();
      // Also update local state immediately
      setSugerencias(prev => prev.map(s => s.id === id ? { ...s, traduccion: translated } : s));
    } catch {
      // Fallback: just mark as attempted
      setSugerencias(prev => prev.map(s => s.id === id ? { ...s, traduccion: '(Error al traducir)' } : s));
    } finally {
      setTranslatingId(null);
    }
  };

  const handleReply = async (id: string) => {
    if (!replyText.trim()) return;
    try {
      await api.updateSugerencia(id, { respuesta: replyText, leida: true });
    } catch {
      updateLocal(id, { respuesta: replyText, leida: true });
    }
    setReplyText('');
    setExpandedId(null);
    await loadSugerencias();
  };

  const markAsRead = async (id: string) => {
    try { await api.updateSugerencia(id, { leida: true }); } catch { updateLocal(id, { leida: true }); }
    await loadSugerencias();
  };

  const toggleResuelta = async (id: string, current: boolean) => {
    const newVal = !current;
    try { await api.updateSugerencia(id, { resuelta: newVal, leida: true }); } catch { updateLocal(id, { resuelta: newVal, leida: true }); }
    setSugerencias(prev => prev.map(s => s.id === id ? { ...s, resuelta: newVal, leida: true } : s));
  };

  const handleDelete = async (id: string) => {
    try { await api.deleteSugerencia(id); } catch { deleteLocal([id]); }
    setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    await loadSugerencias();
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    try { await api.bulkDeleteSugerencias(ids); } catch { deleteLocal(ids); }
    setSelectedIds(new Set());
    await loadSugerencias();
  };

  const handleClearAll = async () => {
    try { await api.clearSugerencias(albergueId); } catch { clearLocal(); }
    setSelectedIds(new Set());
    await loadSugerencias();
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === sugerencias.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sugerencias.map(s => s.id)));
    }
  };

  // GUEST VIEW
  if (!isAdmin) {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <div className="text-center space-y-2">
          <MessageSquarePlus className="w-10 h-10 text-primary mx-auto" />
          <h2 className="text-xl font-bold">Buzón de sugerencias</h2>
          <p className="text-sm text-muted-foreground">
            Tu opinión es importante. Escribe aquí lo que necesites comunicarnos.
          </p>
        </div>
        {submitted ? (
          <Card className="border-[hsl(142,60%,40%)]/30 bg-[hsl(142,60%,95%)]">
            <CardContent className="p-6 text-center space-y-3">
              <div className="text-4xl">✅</div>
              <h3 className="font-semibold text-lg">¡Mensaje enviado!</h3>
              <p className="text-sm text-muted-foreground">
                Gracias por tu mensaje.{email && ' Si has dejado tu email, recibirás una respuesta.'}
              </p>
              <Button onClick={() => setSubmitted(false)} variant="outline" className="mt-4">Enviar otro mensaje</Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  {anonimo ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <User className="w-4 h-4 text-primary" />}
                  <Label className="text-sm cursor-pointer">Enviar de forma anónima</Label>
                </div>
                <Switch checked={anonimo} onCheckedChange={setAnonimo} />
              </div>
              {!anonimo && (
                <div className="space-y-1.5">
                  <Label className="text-sm">Tu nombre</Label>
                  <Input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="¿Cómo te llamas?" />
                </div>
              )}
              <div className="space-y-1.5">
                <Label className="text-sm">Tu mensaje *</Label>
                <Textarea value={mensaje} onChange={e => setMensaje(e.target.value)} rows={4} placeholder="Escribe aquí tu sugerencia..." className="resize-none" />
              </div>
              <div className="space-y-2 pt-2 border-t">
                <p className="text-xs text-muted-foreground">Opcional: deja tus datos si quieres que podamos responderte</p>
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

  // ADMIN VIEW
  const pending = sugerencias.filter(s => !s.resuelta).length;
  const resolved = sugerencias.filter(s => s.resuelta).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 flex-wrap">
          <MessageSquarePlus className="w-5 h-5 text-primary shrink-0" /> Buzón
          {pending > 0 && (
            <Badge className="bg-[hsl(30,90%,50%)] text-[hsl(0,0%,100%)] text-xs">{pending} pendientes</Badge>
          )}
          {resolved > 0 && (
            <Badge className="bg-[hsl(142,60%,40%)] text-[hsl(0,0%,100%)] text-xs">{resolved} resueltas</Badge>
          )}
        </h2>

        <div className="flex items-center gap-2">
          {/* Bulk delete selected */}
          {selectedIds.size > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="gap-1 text-xs">
                  <Trash2 className="w-3 h-3" /> Eliminar ({selectedIds.size})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar {selectedIds.size} sugerencia(s)?</AlertDialogTitle>
                  <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleBulkDelete}>Eliminar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {/* Clear all */}
          {sugerencias.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1 text-xs text-destructive border-destructive/30 hover:bg-destructive/10">
                  <AlertTriangle className="w-3 h-3" /> Vaciar buzón
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Vaciar todo el buzón?</AlertDialogTitle>
                  <AlertDialogDescription>Se eliminarán todas las sugerencias. Esta acción no se puede deshacer.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearAll} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Vaciar todo</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Select all checkbox */}
      {sugerencias.length > 0 && (
        <div className="flex items-center gap-2">
          <Checkbox
            checked={selectedIds.size === sugerencias.length && sugerencias.length > 0}
            onCheckedChange={toggleSelectAll}
          />
          <span className="text-xs text-muted-foreground">Seleccionar todas</span>
        </div>
      )}

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
            <Card
              key={sug.id}
              className={`border-2 transition-colors ${
                sug.resuelta
                  ? 'border-[hsl(142,60%,40%)]/40 bg-[hsl(142,60%,97%)]'
                  : 'border-[hsl(30,90%,50%)]/40 bg-[hsl(30,90%,97%)]'
              }`}
            >
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start gap-3">
                  {/* Selection checkbox */}
                  <div className="pt-1">
                    <Checkbox
                      checked={selectedIds.has(sug.id)}
                      onCheckedChange={() => toggleSelect(sug.id)}
                    />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Resolved/Pending badge */}
                      {sug.resuelta ? (
                        <Badge className="bg-[hsl(142,60%,40%)] text-white text-xs gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Resuelta
                        </Badge>
                      ) : (
                        <Badge className="bg-[hsl(30,90%,50%)] text-white text-xs gap-1">
                          <CircleDot className="w-3 h-3" /> Pendiente
                        </Badge>
                      )}
                      {sug.anonimo ? (
                        <Badge variant="outline" className="text-xs gap-1"><EyeOff className="w-3 h-3" /> Anónimo</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs gap-1"><User className="w-3 h-3" /> {sug.nombre}</Badge>
                      )}
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {(() => {
                          try { return format(new Date(sug.fecha), "d MMM yyyy HH:mm", { locale: es }); }
                          catch { return sug.fecha; }
                        })()}
                      </span>
                      {!sug.leida && <Badge className="bg-primary text-primary-foreground text-[10px]">Nueva</Badge>}
                    </div>

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
                    {/* Delete single */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive h-7 w-7 p-0">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar sugerencia?</AlertDialogTitle>
                          <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(sug.id)}>Eliminar</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    <Button
                      variant="ghost" size="sm"
                      onClick={() => { setExpandedId(expandedId === sug.id ? null : sug.id); setReplyText(sug.respuesta || ''); }}
                      className="h-7 w-7 p-0"
                    >
                      {expandedId === sug.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                </div>

                {/* Message */}
                <p className="text-sm whitespace-pre-wrap ml-9">{sug.mensaje}</p>

                {/* Attachment */}
                {sug.adjunto && (
                  <div className="ml-9 mt-2">
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                      <Paperclip className="w-3 h-3" /> {sug.adjuntoNombre || 'Adjunto'}
                    </p>
                    {sug.adjuntoTipo?.startsWith('image/') ? (
                      <a href={sug.adjunto} target="_blank" rel="noopener noreferrer">
                        <img src={sug.adjunto} alt={sug.adjuntoNombre} className="max-h-60 rounded-lg border object-contain cursor-pointer hover:opacity-90 transition-opacity" />
                      </a>
                    ) : sug.adjuntoTipo?.startsWith('video/') ? (
                      <video src={sug.adjunto} controls className="max-h-60 rounded-lg border" />
                    ) : null}
                  </div>
                )}

                {/* Translation */}
                {sug.traduccion && sug.traduccion !== '__pending__' && (
                  <div className="ml-9 p-2 rounded bg-muted/60 border">
                    <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><Languages className="w-3 h-3" /> Traducción al español:</p>
                    <p className="text-xs whitespace-pre-wrap">{sug.traduccion}</p>
                  </div>
                )}

                {/* Existing reply */}
                {sug.respuesta && expandedId !== sug.id && (
                  <div className="ml-9 p-2 rounded bg-[hsl(142,60%,95%)] border border-[hsl(142,60%,70%)]/30">
                    <p className="text-xs font-semibold text-[hsl(142,60%,30%)] flex items-center gap-1"><Reply className="w-3 h-3" /> Tu respuesta:</p>
                    <p className="text-xs text-[hsl(142,60%,30%)] whitespace-pre-wrap">{sug.respuesta}</p>
                  </div>
                )}

                {/* Expanded: actions */}
                {expandedId === sug.id && (
                  <div className="ml-9 space-y-3 pt-2 border-t">
                    <div className="flex gap-2 flex-wrap">
                      {/* Toggle resolved */}
                      <Button
                        variant="outline" size="sm"
                        onClick={() => toggleResuelta(sug.id, sug.resuelta)}
                        className={`text-xs gap-1 ${sug.resuelta ? 'border-[hsl(30,90%,50%)]/50 text-[hsl(30,90%,40%)]' : 'border-[hsl(142,60%,40%)]/50 text-[hsl(142,60%,30%)]'}`}
                      >
                        {sug.resuelta ? <><CircleDot className="w-3 h-3" /> Marcar pendiente</> : <><CheckCircle2 className="w-3 h-3" /> Marcar resuelta</>}
                      </Button>
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
                        <Languages className="w-3 h-3" /> {translatingId === sug.id ? 'Traduciendo...' : 'Traducir a español'}
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-semibold">Responder al huésped</Label>
                      <Textarea
                        value={replyText}
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
                            💡 Contacta por {sug.email ? 'email' : ''}{sug.email && sug.telefono ? ' o ' : ''}{sug.telefono ? 'teléfono' : ''}
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

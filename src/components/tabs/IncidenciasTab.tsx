import { useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Check, Trash2, FileWarning, Building2, AlertTriangle, Send, MessageCircle,
  ChevronDown, ChevronUp, Eye, Paperclip, Image as ImageIcon, X
} from 'lucide-react';
import { UserRole, IncidentType, IncidenciaVisibilidad } from '@/types';
import { formatDateES } from '@/lib/dateFormat';
import { useI18n } from '@/i18n/I18nContext';

interface Props {
  store: ReturnType<typeof import('@/hooks/useAlbergueStore').useAlbergueStore>;
  role: UserRole;
}

const INCIDENT_TYPES: IncidentType[] = ['behavioral', 'medical', 'administrative', 'social', 'general', 'other'];

const TYPE_COLORS: Record<IncidentType, string> = {
  behavioral: 'bg-[hsl(38,92%,90%)] text-[hsl(38,92%,30%)]',
  medical: 'bg-[hsl(0,72%,92%)] text-destructive',
  administrative: 'bg-[hsl(212,72%,90%)] text-[hsl(212,72%,35%)]',
  social: 'bg-[hsl(142,60%,90%)] text-[hsl(142,60%,30%)]',
  general: 'bg-[hsl(270,60%,90%)] text-[hsl(270,60%,30%)]',
  other: 'bg-secondary text-secondary-foreground',
};

const VIS_LABELS: Record<IncidenciaVisibilidad, string> = {
  todos: 'Todos',
  gestor: 'Solo gestores',
  personal_albergue: 'Solo personal',
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function IncidenciasTab({ store, role }: Props) {
  const { incidencias, huespedActivos, huespedes, addIncidencia, toggleIncidenciaResuelta, deleteIncidencia, addIncidenciaComment } = store;
  const { t } = useI18n();
  const [showForm, setShowForm] = useState(false);
  const [isGeneral, setIsGeneral] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [commentAutor, setCommentAutor] = useState('');
  const [filter, setFilter] = useState<IncidenciaVisibilidad | 'all'>('all');

  const [form, setForm] = useState({
    selectedGuests: [] as string[],
    tipo: 'other' as IncidentType,
    descripcion: '',
    fecha: new Date().toISOString().split('T')[0],
    visibilidad: 'todos' as IncidenciaVisibilidad,
    adjunto: '',
    adjuntoNombre: '',
    adjuntoTipo: '',
  });

  const canResolve = role === 'admin' || role === 'gestor';

  // Visibility filter
  const canSee = (vis: IncidenciaVisibilidad) => {
    if (role === 'admin') return true;
    if (vis === 'todos') return true;
    if (vis === 'gestor' && role === 'gestor') return true;
    if (vis === 'personal_albergue' && role === 'personal_albergue') return true;
    return false;
  };

  const sorted = [...incidencias]
    .filter(i => canSee(i.visibilidad || 'todos'))
    .filter(i => filter === 'all' ? true : i.visibilidad === filter)
    .sort((a, b) => {
      if (a.resuelta !== b.resuelta) return a.resuelta ? 1 : -1;
      return b.fecha.localeCompare(a.fecha);
    });

  const deleteTarget = deleteConfirmId ? incidencias.find(i => i.id === deleteConfirmId) : null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      toast.error('El archivo supera el límite de 10MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setForm(p => ({
        ...p,
        adjunto: reader.result as string,
        adjuntoNombre: file.name,
        adjuntoTipo: file.type,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isGeneral && form.selectedGuests.length === 0) return;
    if (!form.descripcion.trim()) return;

    const guestNames = isGeneral
      ? [t.generalIncidentLabel || 'General']
      : form.selectedGuests.map(id => huespedes.find(h => h.id === id)?.nombre || '');

    try {
      await addIncidencia({
        huespedIds: isGeneral ? [] : form.selectedGuests,
        huespedNombres: guestNames,
        tipo: isGeneral ? 'general' : form.tipo,
        descripcion: form.descripcion,
        fecha: form.fecha,
        resuelta: false,
        creadoPor: role,
        visibilidad: form.visibilidad,
        adjunto: form.adjunto,
        adjuntoNombre: form.adjuntoNombre,
        adjuntoTipo: form.adjuntoTipo,
      });
      setForm({
        selectedGuests: [], tipo: 'other', descripcion: '',
        fecha: new Date().toISOString().split('T')[0],
        visibilidad: 'todos', adjunto: '', adjuntoNombre: '', adjuntoTipo: '',
      });
      setIsGeneral(false);
      setShowForm(false);
    } catch (err: any) {
      toast.error(err.message || 'Error al crear incidencia');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteIncidencia(deleteConfirmId);
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar');
    }
    setDeleteConfirmId(null);
  };

  const handleComment = async (incId: string) => {
    if (!commentText.trim() || !commentAutor.trim()) return;
    try {
      await addIncidenciaComment(incId, { autor: commentAutor, texto: commentText.trim() });
      setCommentText('');
      setCommentAutor('');
    } catch (err: any) {
      toast.error(err.message || 'Error al comentar');
    }
  };

  const toggleGuest = (id: string) => {
    setForm(p => ({
      ...p,
      selectedGuests: p.selectedGuests.includes(id)
        ? p.selectedGuests.filter(g => g !== id)
        : [...p.selectedGuests, id],
    }));
  };

  const pendingCount = incidencias.filter(i => !i.resuelta && canSee(i.visibilidad || 'todos')).length;
  const resolvedCount = incidencias.filter(i => i.resuelta && canSee(i.visibilidad || 'todos')).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <FileWarning className="w-5 h-5 text-primary" /> {t.incidentRegistry}
        </h2>
        <div className="flex gap-2 items-center">
          <Select value={filter} onValueChange={v => setFilter(v as any)}>
            <SelectTrigger className="w-[160px] h-9 text-xs">
              <Eye className="w-3.5 h-3.5 mr-1.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="todos">Visibilidad: Todos</SelectItem>
              <SelectItem value="gestor">Solo gestores</SelectItem>
              <SelectItem value="personal_albergue">Solo personal</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setShowForm(true)}>{t.newIncident}</Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card><CardContent className="pt-4 text-center">
          <div className="text-2xl font-bold">{sorted.length}</div>
          <div className="text-xs text-muted-foreground">Total</div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <div className="text-2xl font-bold text-[hsl(38,92%,50%)]">{pendingCount}</div>
          <div className="text-xs text-muted-foreground">{t.pending}</div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <div className="text-2xl font-bold text-[hsl(var(--success))]">{resolvedCount}</div>
          <div className="text-xs text-muted-foreground">{t.resolved}</div>
        </CardContent></Card>
      </div>

      {/* Incident List */}
      <div className="space-y-3">
        {sorted.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground">{t.noIncidents}</CardContent></Card>
        ) : sorted.map(inc => {
          const isExpanded = expandedId === inc.id;
          const names = (inc.huespedNombres && inc.huespedNombres.length > 0)
            ? inc.huespedNombres.join(', ')
            : 'General';
          const isGeneralInc = !inc.huespedIds || inc.huespedIds.length === 0;

          return (
            <Card key={inc.id} className={`transition-all ${inc.resuelta ? 'opacity-60' : ''}`}>
              <CardContent className="p-4">
                {/* Header row */}
                <div className="flex items-start justify-between gap-2">
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : inc.id)}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={`text-[10px] ${TYPE_COLORS[inc.tipo]}`} variant="secondary">
                        {t.incidentTypes[inc.tipo]}
                      </Badge>
                      <Badge className={inc.resuelta
                        ? 'bg-[hsl(142,60%,90%)] text-[hsl(142,60%,30%)] text-[10px]'
                        : 'bg-[hsl(38,92%,90%)] text-[hsl(38,92%,30%)] text-[10px]'
                      }>{inc.resuelta ? t.resolved : t.pending}</Badge>
                      {inc.visibilidad && inc.visibilidad !== 'todos' && (
                        <Badge variant="outline" className="text-[10px]">
                          <Eye className="w-3 h-3 mr-0.5" /> {VIS_LABELS[inc.visibilidad]}
                        </Badge>
                      )}
                      {inc.comentarios && inc.comentarios.length > 0 && (
                        <Badge variant="outline" className="text-[10px]">
                          <MessageCircle className="w-3 h-3 mr-0.5" /> {inc.comentarios.length}
                        </Badge>
                      )}
                      {inc.adjunto && (
                        <Badge variant="outline" className="text-[10px]">
                          <Paperclip className="w-3 h-3 mr-0.5" /> Adjunto
                        </Badge>
                      )}
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      {isGeneralInc ? (
                        <span className="text-sm font-medium flex items-center gap-1 text-[hsl(270,60%,40%)]">
                          <Building2 className="w-3.5 h-3.5" /> General
                        </span>
                      ) : (
                        <span className="text-sm font-medium">{names}</span>
                      )}
                      <span className="text-xs text-muted-foreground">— {formatDateES(inc.fecha)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{inc.descripcion}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {canResolve && (
                      <>
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={async () => {
                          try { await toggleIncidenciaResuelta(inc.id); } catch (err: any) { toast.error(err.message); }
                        }} title={t.toggleResolved}>
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setDeleteConfirmId(inc.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </>
                    )}
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setExpandedId(isExpanded ? null : inc.id)}>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="mt-4 pt-3 border-t space-y-4">
                    {/* Full description */}
                    <p className="text-sm whitespace-pre-wrap">{inc.descripcion}</p>

                    {/* Attachment */}
                    {inc.adjunto && (
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground flex items-center gap-1">
                          <Paperclip className="w-3 h-3" /> Adjunto: {inc.adjuntoNombre}
                        </Label>
                        {inc.adjuntoTipo?.startsWith('image/') ? (
                          <img src={inc.adjunto} alt={inc.adjuntoNombre} className="max-w-full max-h-80 rounded-lg border" />
                        ) : inc.adjuntoTipo?.startsWith('video/') ? (
                          <video src={inc.adjunto} controls className="max-w-full max-h-80 rounded-lg border" />
                        ) : (
                          <a href={inc.adjunto} download={inc.adjuntoNombre} className="text-sm text-primary underline">
                            Descargar {inc.adjuntoNombre}
                          </a>
                        )}
                      </div>
                    )}

                    {/* Comments */}
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <MessageCircle className="w-3 h-3" /> Comentarios ({inc.comentarios?.length || 0})
                      </p>
                      {inc.comentarios && inc.comentarios.length > 0 && (
                        <div className="space-y-2 ml-2">
                          {inc.comentarios.map(c => (
                            <div key={c.id} className="p-2 rounded-lg bg-muted/50 text-sm">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-xs">{c.autor}</span>
                                <span className="text-[10px] text-muted-foreground">{formatDateES(c.fecha)}</span>
                              </div>
                              <p className="text-sm">{c.texto}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      {/* Add comment */}
                      <div className="flex gap-2 items-end ml-2">
                        <div className="flex-1 space-y-1">
                          <Input
                            placeholder="Tu nombre"
                            value={commentAutor}
                            onChange={e => setCommentAutor(e.target.value)}
                            className="h-8 text-xs"
                          />
                          <Textarea
                            placeholder="Escribir comentario..."
                            value={commentText}
                            onChange={e => setCommentText(e.target.value)}
                            rows={2}
                            className="text-sm"
                          />
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleComment(inc.id)}
                          disabled={!commentText.trim() || !commentAutor.trim()}
                          className="shrink-0"
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Delete confirmation */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent className="max-w-sm" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Eliminar incidencia
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              ¿Estás seguro de que quieres eliminar esta incidencia? Esta acción no se puede deshacer.
            </p>
            {deleteTarget && (
              <div className="p-3 rounded-lg bg-muted/50 text-sm space-y-1">
                <p><span className="font-medium">{deleteTarget.huespedNombres?.join(', ') || 'General'}</span> — {formatDateES(deleteTarget.fecha)}</p>
                <p className="text-xs text-muted-foreground truncate">{deleteTarget.descripcion}</p>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>{t.cancel}</Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              <Trash2 className="w-4 h-4 mr-1" /> Eliminar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* New incident form */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>{t.newIncident}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* General toggle */}
            <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
              <Switch checked={isGeneral} onCheckedChange={setIsGeneral} />
              <div>
                <p className="text-sm font-medium flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-[hsl(270,60%,40%)]" />
                  {t.generalIncident || 'Incidencia general (edificio/albergue)'}
                </p>
              </div>
            </div>

            {/* Multi-guest selector */}
            {!isGeneral && (
              <div className="space-y-2">
                <Label>{t.incidentGuest} (seleccionar uno o varios) *</Label>
                <div className="max-h-40 overflow-y-auto border rounded-lg p-2 space-y-1">
                  {huespedActivos.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-2">No hay huéspedes activos</p>
                  ) : huespedActivos.map(h => (
                    <label key={h.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-muted/50 cursor-pointer">
                      <Checkbox
                        checked={form.selectedGuests.includes(h.id)}
                        onCheckedChange={() => toggleGuest(h.id)}
                      />
                      <span className="text-sm">{h.nombre}</span>
                      <span className="text-[10px] text-muted-foreground ml-auto">Hab {h.habitacion}</span>
                    </label>
                  ))}
                </div>
                {form.selectedGuests.length > 0 && (
                  <p className="text-xs text-muted-foreground">{form.selectedGuests.length} seleccionado(s)</p>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {!isGeneral && (
                <div className="space-y-2">
                  <Label>{t.incidentType}</Label>
                  <Select value={form.tipo} onValueChange={v => setForm(p => ({ ...p, tipo: v as IncidentType }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {INCIDENT_TYPES.filter(tp => tp !== 'general').map(tp => (
                        <SelectItem key={tp} value={tp}>{t.incidentTypes[tp]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label>{t.incidentDate}</Label>
                <Input type="date" value={form.fecha} onChange={e => setForm(p => ({ ...p, fecha: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Visibilidad</Label>
                <Select value={form.visibilidad} onValueChange={v => setForm(p => ({ ...p, visibilidad: v as IncidenciaVisibilidad }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">👁 Todos los roles</SelectItem>
                    <SelectItem value="gestor">🔒 Solo gestores</SelectItem>
                    <SelectItem value="personal_albergue">🔒 Solo personal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t.incidentDescription} *</Label>
              <Textarea value={form.descripcion} onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))} rows={4} required />
            </div>

            {/* Attachment */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Paperclip className="w-4 h-4" /> Adjuntar imagen o vídeo
              </Label>
              {form.adjunto ? (
                <div className="flex items-center gap-2 p-2 border rounded-lg bg-muted/30">
                  <ImageIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-sm truncate flex-1">{form.adjuntoNombre}</span>
                  <Button type="button" size="sm" variant="ghost" className="h-7 w-7 p-0"
                    onClick={() => setForm(p => ({ ...p, adjunto: '', adjuntoNombre: '', adjuntoTipo: '' }))}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Input type="file" accept="image/*,video/*" onChange={handleFileChange} className="text-sm" />
              )}
              <p className="text-[10px] text-muted-foreground">Máx. 10MB — Fotos o vídeos</p>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>{t.cancel}</Button>
              <Button type="submit">{t.save}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, ClipboardList, Plus, Save, X, Unlock, MessageCircle, Send, Pencil, Trash2, RotateCcw, ArrowLeft } from 'lucide-react';
import ExportButton from '@/components/ExportButton';
import { UserRole } from '@/types';
import { useI18n } from '@/i18n/I18nContext';
import { api } from '@/lib/api';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameMonth, isToday, isFuture, isPast } from 'date-fns';
import { es } from 'date-fns/locale';

interface Props {
  role: UserRole;
  albergueId: string;
}

interface TareaDia {
  id?: string;
  fecha: string;
  tareaId: string;
  tareaNombre: string;
  estado: 'pendiente' | 'hecha' | 'no procede';
  turno: 'mañana' | 'tarde' | 'noche';
  hechoPor: string;
  observacion: string;
  orden: number;
  adminObs: string;
  respuestaEmpleado: string;
}

const TAREAS_PLANTILLA = [
  'Patio', 'Comedor', 'Hall', 'Pasillos y escaleras', 'Baño planta baja',
  'Planta 1: baño', 'Habitación 1.1', 'Habitación 1.2', 'Habitación 1.3',
  'Planta 2: baño', 'Habitación 2.1', 'Habitación 2.2', 'Habitación 2.3',
  'Reponer papel', 'Reparaciones varias', 'Servicio de catering',
  'Reserva de comidas', 'Otras tareas',
];

const ESTADO_COLORS: Record<string, string> = {
  pendiente: 'bg-[hsl(38,92%,90%)] text-[hsl(38,92%,30%)] border-[hsl(38,92%,70%)]',
  hecha: 'bg-[hsl(142,60%,90%)] text-[hsl(142,60%,30%)] border-[hsl(142,60%,70%)]',
  'no procede': 'bg-secondary text-secondary-foreground border-border',
};

function createBlankDay(fecha: string): TareaDia[] {
  return TAREAS_PLANTILLA.map((nombre, idx) => ({
    fecha,
    tareaId: `tpl-${idx}`,
    tareaNombre: nombre,
    estado: 'pendiente',
    turno: 'mañana',
    hechoPor: '',
    observacion: '',
    orden: idx,
    adminObs: '',
    respuestaEmpleado: '',
  }));
}

export default function TareasEmpleadosTab({ role, albergueId }: Props) {
  const { t } = useI18n();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [tareas, setTareas] = useState<TareaDia[]>([]);
  const [allTareasDates, setAllTareasDates] = useState<Record<string, TareaDia[]>>({});
  const [loading, setLoading] = useState(false);
  const [reopenedDays, setReopenedDays] = useState<Set<string>>(new Set());
  const [editingIdx, setEditingIdx] = useState<Set<number>>(new Set());
  const [originalTareas, setOriginalTareas] = useState<Record<number, TareaDia>>({});
  const [obsDialogIdx, setObsDialogIdx] = useState<number | null>(null);
  const [obsText, setObsText] = useState('');
  const [replyText, setReplyText] = useState('');
  const isAdmin = role === 'admin';
  const [empleadosList, setEmpleadosList] = useState<string[]>(['Personal externo']);

  // Load employee names from Registro Horario
  useEffect(() => {
    api.getEmpleadosHorario(albergueId)
      .then(data => {
        const names = (data || []).filter((e: any) => e.activo).map((e: any) => e.nombre_completo);
        setEmpleadosList([...names, 'Personal externo']);
      })
      .catch(() => {});
  }, [albergueId]);

  const loadMonth = useCallback(async () => {
    try {
      setLoading(true);
      const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
      const data = await api.getTareasDia(albergueId, start, end);
      const grouped: Record<string, TareaDia[]> = {};
      for (const t of data) {
        // Normalize fecha to YYYY-MM-DD regardless of server format
        const fechaNorm = typeof t.fecha === 'string' ? t.fecha.split('T')[0] : String(t.fecha).split('T')[0];
        const normalized = { ...t, fecha: fechaNorm };
        if (!grouped[fechaNorm]) grouped[fechaNorm] = [];
        grouped[fechaNorm].push(normalized);
      }
      setAllTareasDates(grouped);
    } catch {
      setAllTareasDates({});
    } finally {
      setLoading(false);
    }
  }, [currentMonth, albergueId]);

  useEffect(() => { loadMonth(); }, [loadMonth]);

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const canEditDate = (dateStr: string): boolean => {
    if (isAdmin) return true;
    if (reopenedDays.has(dateStr)) return true;
    return dateStr === todayStr;
  };

  const handleSelectDay = (dateStr: string) => {
    if (dateStr > todayStr) return;
    const existing = allTareasDates[dateStr];
    if (existing && existing.length > 0) {
      setTareas(existing.map(t => ({ ...t, adminObs: t.adminObs || '', respuestaEmpleado: t.respuestaEmpleado || '' })));
    } else {
      setTareas(createBlankDay(dateStr));
    }
    setSelectedDate(dateStr);
    setEditingIdx(new Set());
    setOriginalTareas({});
  };

  const handleUpdateTarea = (idx: number, field: keyof TareaDia, value: string) => {
    setTareas(prev => prev.map((t, i) => i === idx ? { ...t, [field]: value } : t));
  };

  // handleDuplicate is now handleDuplicateAndSave (defined below)

  // Check if a task at index is a duplicate (not the first occurrence of its tareaId)
  const isDuplicate = (idx: number): boolean => {
    const tareaId = tareas[idx].tareaId;
    for (let i = 0; i < idx; i++) {
      if (tareas[i].tareaId === tareaId) return true;
    }
    return false;
  };

  const handleDeleteTarea = async (idx: number) => {
    if (!isDuplicate(idx)) return;
    const updated = tareas.filter((_, i) => i !== idx);
    setTareas(updated);
    setEditingIdx(prev => {
      const s = new Set<number>();
      prev.forEach(i => {
        if (i < idx) s.add(i);
        else if (i > idx) s.add(i - 1);
      });
      return s;
    });
    // Auto-persist
    if (selectedDate) {
      try {
        await api.saveTareasDia(albergueId, selectedDate, updated);
        await loadMonth();
        toast.success('Duplicado eliminado');
      } catch {
        toast.error('Error al eliminar duplicado');
      }
    }
  };

  const handleResetTarea = async (idx: number) => {
    const updated = tareas.map((t, i) => i === idx ? {
      ...t,
      estado: 'pendiente' as const,
      hechoPor: '',
      observacion: '',
      adminObs: '',
      respuestaEmpleado: '',
    } : t);
    setTareas(updated);
    if (selectedDate) {
      try {
        await api.saveTareasDia(albergueId, selectedDate, updated);
        await loadMonth();
        toast.success('Tarea reseteada');
      } catch {
        toast.error('Error al resetear');
      }
    }
  };

  const handleDuplicateAndSave = async (idx: number) => {
    const original = tareas[idx];
    const dup: TareaDia = {
      ...original,
      id: undefined,
      estado: 'pendiente',
      turno: original.turno,
      hechoPor: '',
      observacion: '',
      orden: tareas.length,
      adminObs: '',
      respuestaEmpleado: '',
    };
    const updated = [...tareas];
    updated.splice(idx + 1, 0, dup);
    setTareas(updated);
    // Auto-persist
    if (selectedDate) {
      try {
        await api.saveTareasDia(albergueId, selectedDate, updated);
        await loadMonth();
        toast.success('Tarea duplicada');
      } catch {
        toast.error('Error al duplicar');
      }
    }
  };

  const startEditing = (idx: number) => {
    setOriginalTareas(prev => ({ ...prev, [idx]: { ...tareas[idx] } }));
    setEditingIdx(prev => new Set(prev).add(idx));
  };

  const cancelEditing = (idx: number) => {
    if (originalTareas[idx]) {
      setTareas(prev => prev.map((t, i) => i === idx ? originalTareas[idx] : t));
    }
    setEditingIdx(prev => { const s = new Set(prev); s.delete(idx); return s; });
    setOriginalTareas(prev => { const c = { ...prev }; delete c[idx]; return c; });
  };

  const registerTarea = async (idx: number) => {
    if (!selectedDate) return;
    try {
      // Save all current tareas state to persist
      await api.saveTareasDia(albergueId, selectedDate, tareas);
      // Refresh month data
      await loadMonth();
      // Refresh local tareas for this day from updated allTareasDates
      // (loadMonth updates allTareasDates via setState, but we need to re-fetch)
      const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
      const data = await api.getTareasDia(albergueId, start, end);
      const grouped: Record<string, TareaDia[]> = {};
      for (const t of data) {
        const fechaNorm = typeof t.fecha === 'string' ? t.fecha.split('T')[0] : String(t.fecha).split('T')[0];
        const normalized = { ...t, fecha: fechaNorm };
        if (!grouped[fechaNorm]) grouped[fechaNorm] = [];
        grouped[fechaNorm].push(normalized);
      }
      setAllTareasDates(grouped);
      if (grouped[selectedDate]) {
        setTareas(grouped[selectedDate].map(t => ({ ...t, adminObs: t.adminObs || '', respuestaEmpleado: t.respuestaEmpleado || '' })));
      }
      // Stop editing this task
      setEditingIdx(prev => { const s = new Set(prev); s.delete(idx); return s; });
      setOriginalTareas(prev => { const c = { ...prev }; delete c[idx]; return c; });
      toast.success('Tarea registrada');
    } catch (err) {
      console.error('Error saving tareas:', err);
      toast.error('Error al registrar la tarea');
    }
  };

  const handleReopen = () => {
    if (selectedDate) {
      setReopenedDays(prev => new Set(prev).add(selectedDate));
    }
  };

  // Admin observation dialog
  const openObsDialog = (idx: number) => {
    setObsDialogIdx(idx);
    setObsText(tareas[idx].adminObs || '');
    setReplyText('');
  };

  const saveAdminObs = () => {
    if (obsDialogIdx === null) return;
    handleUpdateTarea(obsDialogIdx, 'adminObs', obsText);
    setObsDialogIdx(null);
  };

  const clearAdminObs = () => {
    if (obsDialogIdx === null) return;
    handleUpdateTarea(obsDialogIdx, 'adminObs', '');
    setObsText('');
  };

  const saveEmployeeReply = () => {
    if (obsDialogIdx === null || !replyText.trim()) return;
    const current = tareas[obsDialogIdx].respuestaEmpleado;
    const newReply = current ? `${current}\n---\n${replyText}` : replyText;
    handleUpdateTarea(obsDialogIdx, 'respuestaEmpleado', newReply);
    setReplyText('');
  };

  const clearEmployeeReply = () => {
    if (obsDialogIdx === null) return;
    handleUpdateTarea(obsDialogIdx, 'respuestaEmpleado', '');
  };

  // Calendar grid
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const days: Date[] = [];
    let d = calStart;
    while (d <= calEnd) {
      days.push(d);
      d = addDays(d, 1);
    }
    return days;
  }, [currentMonth]);

  const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  if (selectedDate) {
    const editable = canEditDate(selectedDate);
    const dateObj = new Date(selectedDate + 'T12:00:00');
    const isPastDay = isPast(dateObj) && !isToday(dateObj);

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-primary" />
            {format(dateObj, "EEEE dd-MM-yyyy", { locale: es })}
          </h2>
          <div className="flex gap-2">
            <ExportButton type="tareas" getData={() => tareas.map(t => ({
              tarea: t.tareaNombre,
              estado: t.estado,
              turno: t.turno,
              responsable: t.hechoPor,
              observaciones: t.observacion,
            }))} />
            {isAdmin && isPastDay && !reopenedDays.has(selectedDate) && (
              <Button variant="outline" size="sm" onClick={handleReopen} className="gap-1">
                <Unlock className="w-4 h-4" /> Reabrir día
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => { setSelectedDate(null); setEditingIdx(new Set()); setOriginalTareas({}); }}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Volver
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {tareas.map((tarea, idx) => {
            const isHecha = tarea.estado === 'hecha';
            const isEditing = editingIdx.has(idx);
            // Pendiente/no-procede: always editable if day is editable
            // Hecha: locked, need pencil to edit
            const taskEditable = editable && (isHecha ? isEditing : true);
            const canDelete = isDuplicate(idx);

            // Card background based on estado
            const cardBg = isHecha
              ? 'border-[hsl(142,60%,70%)] bg-[hsl(142,60%,95%)]'
              : tarea.estado === 'no procede'
                ? 'border-border bg-muted/50'
                : 'border-[hsl(38,92%,70%)] bg-[hsl(38,92%,95%)]';

            return (
            <Card key={idx} className={`border transition-colors ${cardBg}`}>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="font-semibold text-sm">{tarea.tareaNombre}</p>
                      {canDelete && <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-muted-foreground/30 text-muted-foreground">duplicado</Badge>}
                      {/* Pencil only for "hecha" tasks that need unlocking */}
                      {editable && isHecha && !isEditing && (
                        <button
                          onClick={() => startEditing(idx)}
                          className="p-1 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-primary"
                          title="Editar tarea"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {/* Reset button */}
                      {editable && (isHecha || tarea.hechoPor || tarea.observacion) && (
                        <button
                          onClick={() => handleResetTarea(idx)}
                          className="p-1 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-amber-600"
                          title="Dejar en blanco"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {/* Delete icon for duplicates */}
                      {editable && canDelete && (
                        <button
                          onClick={() => handleDeleteTarea(idx)}
                          className="p-1 rounded hover:bg-destructive/10 transition-colors text-destructive"
                          title="Eliminar duplicado"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {/* Admin observation icon */}
                      <button
                        onClick={() => openObsDialog(idx)}
                        className={`relative p-1 rounded hover:bg-accent transition-colors ${tarea.adminObs ? 'text-destructive' : 'text-muted-foreground'}`}
                        title={isAdmin ? 'Observaciones del administrador' : 'Ver observaciones'}
                      >
                        <MessageCircle className="w-4 h-4" />
                        {(tarea.adminObs || tarea.respuestaEmpleado) && (
                          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-destructive" />
                        )}
                      </button>
                    </div>

                    {/* Show admin observation inline in red */}
                    {tarea.adminObs && (
                      <div className="mb-2 p-2 rounded bg-destructive/10 border border-destructive/20">
                        <p className="text-xs font-semibold text-destructive">📌 Admin:</p>
                        <p className="text-xs text-destructive whitespace-pre-wrap">{tarea.adminObs}</p>
                        {tarea.respuestaEmpleado && (
                          <div className="mt-1.5 pt-1.5 border-t border-destructive/20">
                            <p className="text-xs font-semibold text-foreground">💬 Respuesta:</p>
                            <p className="text-xs text-foreground whitespace-pre-wrap">{tarea.respuestaEmpleado}</p>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div>
                        <label className="text-xs text-muted-foreground">Estado</label>
                        <Select value={tarea.estado} onValueChange={v => handleUpdateTarea(idx, 'estado', v)} disabled={!taskEditable}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pendiente">Pendiente</SelectItem>
                            <SelectItem value="hecha">Hecha</SelectItem>
                            <SelectItem value="no procede">No procede</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Turno</label>
                        <Select value={tarea.turno} onValueChange={v => handleUpdateTarea(idx, 'turno', v)} disabled={!taskEditable}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mañana">Mañana</SelectItem>
                            <SelectItem value="tarde">Tarde</SelectItem>
                            <SelectItem value="noche">Noche</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Hecho por</label>
                        <Select value={tarea.hechoPor || undefined} onValueChange={v => handleUpdateTarea(idx, 'hechoPor', v)} disabled={!taskEditable}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                          <SelectContent>
                            {empleadosList.map(name => (
                              <SelectItem key={name} value={name}>{name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Observación</label>
                        <Input className="h-8 text-xs" value={tarea.observacion} onChange={e => handleUpdateTarea(idx, 'observacion', e.target.value)} readOnly={!taskEditable} placeholder="..." />
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge className={`text-xs border ${ESTADO_COLORS[tarea.estado]}`} variant="outline">
                      {tarea.estado}
                    </Badge>
                    {/* Registrar button: for pending tasks or when editing a hecha task */}
                    {editable && ((!isHecha) || isEditing) && (
                      <Button size="sm" onClick={() => registerTarea(idx)} className="text-xs gap-1 bg-[hsl(142,60%,40%)] hover:bg-[hsl(142,60%,35%)] text-white">
                        <Save className="w-3 h-3" /> Registrar
                      </Button>
                    )}
                    {editable && isEditing && isHecha && (
                      <Button variant="outline" size="sm" onClick={() => cancelEditing(idx)} className="text-xs gap-1">
                        <X className="w-3 h-3" /> Cancelar
                      </Button>
                    )}
                    {editable && (
                      <Button variant="outline" size="sm" onClick={() => handleDuplicateAndSave(idx)} className="text-xs gap-1">
                        <Plus className="w-3 h-3" /> Duplicar tarea
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            );
          })}
        </div>

        {/* Admin observation dialog */}
        <Dialog open={obsDialogIdx !== null} onOpenChange={open => { if (!open) setObsDialogIdx(null); }}>
          <DialogContent className="max-w-md" aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-destructive" />
                {obsDialogIdx !== null ? tareas[obsDialogIdx]?.tareaNombre : ''}
              </DialogTitle>
            </DialogHeader>
            {obsDialogIdx !== null && (
              <div className="space-y-4">
                {/* Admin observation */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-destructive">📌 Observación del administrador</label>
                  {isAdmin ? (
                    <>
                      <Textarea
                        value={obsText}
                        onChange={e => setObsText(e.target.value)}
                        rows={3}
                        placeholder="Escribe tus observaciones..."
                        className="border-destructive/30 focus:border-destructive"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={saveAdminObs} className="bg-destructive hover:bg-destructive/90 text-white gap-1">
                          <Save className="w-3 h-3" /> Guardar observación
                        </Button>
                        {obsText && (
                          <Button size="sm" variant="outline" onClick={clearAdminObs} className="text-destructive border-destructive/30 gap-1">
                            <X className="w-3 h-3" /> Borrar
                          </Button>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="p-3 rounded bg-destructive/10 border border-destructive/20">
                      <p className="text-sm text-destructive whitespace-pre-wrap">
                        {tareas[obsDialogIdx].adminObs || 'Sin observaciones del administrador.'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Existing replies */}
                {tareas[obsDialogIdx].respuestaEmpleado && (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">💬 Respuestas</label>
                    <div className="p-3 rounded bg-muted border">
                      <p className="text-sm whitespace-pre-wrap">{tareas[obsDialogIdx].respuestaEmpleado}</p>
                    </div>
                    {editable && (
                      <Button size="sm" variant="outline" onClick={clearEmployeeReply} className="text-muted-foreground gap-1">
                        <X className="w-3 h-3" /> Borrar respuestas
                      </Button>
                    )}
                  </div>
                )}

                {/* Employee reply input */}
                {tareas[obsDialogIdx].adminObs && editable && (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Responder</label>
                    <div className="flex gap-2">
                      <Input
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        placeholder="Escribe tu respuesta..."
                        className="flex-1"
                        onKeyDown={e => { if (e.key === 'Enter') saveEmployeeReply(); }}
                      />
                      <Button size="sm" onClick={saveEmployeeReply} disabled={!replyText.trim()} className="gap-1">
                        <Send className="w-3 h-3" /> Enviar
                      </Button>
                    </div>
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  ⚠️ Recuerda pulsar "Registrar" en la tarea correspondiente para guardar los cambios.
                </p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-primary" /> {t.employeeTasks || 'Tareas Empleados'}
        </h2>
      </div>

      {/* Month selector */}
      <div className="flex items-center justify-center gap-4">
        <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <h3 className="text-lg font-semibold min-w-[200px] text-center capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: es })}
        </h3>
        <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Calendar grid */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-7 gap-1">
            {weekDays.map(d => (
              <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2">{d}</div>
            ))}
            {calendarDays.map((day, i) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const inMonth = isSameMonth(day, currentMonth);
              const today = isToday(day);
              const future = dateStr > todayStr;
              const hasTareas = !!allTareasDates[dateStr]?.length;
              const allDone = hasTareas && allTareasDates[dateStr].every(t => t.estado === 'hecha' || t.estado === 'no procede');

              return (
                <button
                  key={i}
                  disabled={future || !inMonth}
                  onClick={() => inMonth && !future && handleSelectDay(dateStr)}
                  className={`
                    relative h-14 sm:h-16 rounded-md text-sm font-medium transition-all
                    ${!inMonth ? 'opacity-20 cursor-default' : ''}
                    ${future && inMonth ? 'bg-muted/50 text-muted-foreground cursor-not-allowed' : ''}
                    ${today ? 'ring-2 ring-[hsl(142,60%,40%)] bg-[hsl(142,60%,95%)]' : ''}
                    ${!future && !today && inMonth && isPast(day) ? 'bg-muted hover:bg-accent cursor-pointer' : ''}
                    ${!future && inMonth && !today ? 'hover:bg-accent cursor-pointer' : ''}
                  `}
                >
                  <span className="text-xs sm:text-sm">{format(day, 'd')}</span>
                  {hasTareas && inMonth && (
                    <div className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full ${allDone ? 'bg-[hsl(142,60%,40%)]' : 'bg-[hsl(38,92%,50%)]'}`} />
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

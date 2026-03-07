import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, ClipboardList, Plus, Save, X, Unlock, MessageCircle, Send } from 'lucide-react';
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
  const [obsDialogIdx, setObsDialogIdx] = useState<number | null>(null);
  const [obsText, setObsText] = useState('');
  const [replyText, setReplyText] = useState('');
  const isAdmin = role === 'admin';

  // Load tareas for current month
  const loadMonth = useCallback(async () => {
    try {
      setLoading(true);
      const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
      const data = await api.getTareasDia(albergueId, start, end);
      const grouped: Record<string, TareaDia[]> = {};
      for (const t of data) {
        if (!grouped[t.fecha]) grouped[t.fecha] = [];
        grouped[t.fecha].push(t);
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
    if (isAdmin) return true; // Admin can always edit
    if (reopenedDays.has(dateStr)) return true;
    return dateStr === todayStr;
  };

  const handleSelectDay = (dateStr: string) => {
    if (dateStr > todayStr) return; // Block future days, allow today
    const existing = allTareasDates[dateStr];
    if (existing && existing.length > 0) {
      setTareas(existing.map(t => ({ ...t, adminObs: t.adminObs || '', respuestaEmpleado: t.respuestaEmpleado || '' })));
    } else {
      setTareas(createBlankDay(dateStr));
    }
    setSelectedDate(dateStr);
  };

  const handleUpdateTarea = (idx: number, field: keyof TareaDia, value: string) => {
    setTareas(prev => prev.map((t, i) => i === idx ? { ...t, [field]: value } : t));
  };

  const handleDuplicate = (idx: number) => {
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
    setTareas(prev => {
      const copy = [...prev];
      copy.splice(idx + 1, 0, dup);
      return copy;
    });
  };

  const handleSave = async () => {
    if (!selectedDate) return;
    try {
      await api.saveTareasDia(albergueId, selectedDate, tareas);
      await loadMonth();
      setSelectedDate(null);
    } catch (err) {
      console.error('Error saving tareas:', err);
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
            {format(dateObj, "EEEE d 'de' MMMM yyyy", { locale: es })}
          </h2>
          <div className="flex gap-2">
            {isAdmin && isPastDay && !reopenedDays.has(selectedDate) && (
              <Button variant="outline" size="sm" onClick={handleReopen} className="gap-1">
                <Unlock className="w-4 h-4" /> Reabrir día
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setSelectedDate(null)}>
              <X className="w-4 h-4 mr-1" /> {t.cancel}
            </Button>
            {editable && (
              <Button size="sm" onClick={handleSave} className="bg-[hsl(142,60%,40%)] hover:bg-[hsl(142,60%,35%)] text-white gap-1">
                <Save className="w-4 h-4" /> {t.save}
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {tareas.map((tarea, idx) => (
            <Card key={idx} className="border hover:border-primary/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="font-semibold text-sm">{tarea.tareaNombre}</p>
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
                        <Select value={tarea.estado} onValueChange={v => handleUpdateTarea(idx, 'estado', v)} disabled={!editable}>
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
                        <Select value={tarea.turno} onValueChange={v => handleUpdateTarea(idx, 'turno', v)} disabled={!editable}>
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
                        <Input className="h-8 text-xs" value={tarea.hechoPor} onChange={e => handleUpdateTarea(idx, 'hechoPor', e.target.value)} readOnly={!editable} placeholder="Nombre..." />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Observación</label>
                        <Input className="h-8 text-xs" value={tarea.observacion} onChange={e => handleUpdateTarea(idx, 'observacion', e.target.value)} readOnly={!editable} placeholder="..." />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`text-xs border ${ESTADO_COLORS[tarea.estado]}`} variant="outline">
                      {tarea.estado}
                    </Badge>
                    {editable && (
                      <Button variant="outline" size="sm" onClick={() => handleDuplicate(idx)} className="text-xs gap-1">
                        <Plus className="w-3 h-3" /> Añadir otra
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {editable && (
          <div className="flex justify-end pt-4">
            <Button size="lg" onClick={handleSave} className="bg-[hsl(142,60%,40%)] hover:bg-[hsl(142,60%,35%)] text-white gap-2">
              <Save className="w-5 h-5" /> {t.save}
            </Button>
          </div>
        )}

        {/* Admin observation dialog */}
        <Dialog open={obsDialogIdx !== null} onOpenChange={open => { if (!open) setObsDialogIdx(null); }}>
          <DialogContent className="max-w-md">
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
                      <Button size="sm" onClick={saveAdminObs} className="bg-destructive hover:bg-destructive/90 text-white gap-1">
                        <Save className="w-3 h-3" /> Guardar observación
                      </Button>
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
                  </div>
                )}

                {/* Employee reply input (only if there's an admin observation and user is not admin, or admin can also reply) */}
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
                  ⚠️ Recuerda pulsar "Guardar" en la hoja del día para que los cambios se persistan.
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
              const future = isFuture(day) && !today;
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

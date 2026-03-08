import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CalendarPlus, Check, Trash2, Pencil, PackagePlus } from 'lucide-react';
import ExportButton from '@/components/ExportButton';
import ConfirmDialog from '@/components/ConfirmDialog';
import { DIETAS, Dieta, UserRole, ProximaLlegada } from '@/types';
import { formatDateES } from '@/lib/dateFormat';
import { useI18n } from '@/i18n/I18nContext';

interface Props {
  store: ReturnType<typeof import('@/hooks/useAlbergueStore').useAlbergueStore>;
  role: UserRole;
}

interface LlegadaFormData {
  nombre: string;
  nie: string;
  nacionalidad: string;
  idioma: string;
  dieta: Dieta;
  fechaLlegada: string;
  notas: string;
  habitacionAsignada: string;
  camaAsignada: string;
}

const emptyForm = (): LlegadaFormData => ({
  nombre: '', nie: '', nacionalidad: '', idioma: '',
  dieta: 'Omnívora estándar',
  fechaLlegada: new Date().toISOString().split('T')[0],
  notas: '',
  habitacionAsignada: '',
  camaAsignada: '',
});

export default function LlegadasTab({ store, role }: Props) {
  const { llegadas, rooms, addLlegada, editLlegada, confirmarLlegada, deleteLlegada, huespedActivos } = store;
  const { t } = useI18n();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<LlegadaFormData>(emptyForm());
  const [confirmingLlegada, setConfirmingLlegada] = useState<ProximaLlegada | null>(null);
  const [confirmForm, setConfirmForm] = useState<LlegadaFormData>(emptyForm());
  const [deleteLlegadaId, setDeleteLlegadaId] = useState<string | null>(null);

  const canManage = role === 'admin' || role === 'gestor';

  const occupiedBeds = useMemo(() => {
    const set = new Set<string>();
    huespedActivos.forEach(h => set.add(`${h.habitacion}-${h.cama}`));
    return set;
  }, [huespedActivos]);

  const freeBeds = useMemo(() => {
    const occupied = new Set(huespedActivos.map(h => `${h.habitacion}-${h.cama}`));
    llegadas.forEach(l => {
      if (l.habitacionAsignada && l.camaAsignada && l.id !== editingId) {
        occupied.add(`${l.habitacionAsignada}-${l.camaAsignada}`);
      }
    });
    const free: { habitacion: string; cama: number }[] = [];
    for (const room of rooms) {
      for (let i = 1; i <= room.camas; i++) {
        if (!occupied.has(`${room.id}-${i}`)) free.push({ habitacion: room.id, cama: i });
      }
    }
    return free;
  }, [huespedActivos, llegadas, editingId, rooms]);

  const bedsForRoom = freeBeds.filter(fb => fb.habitacion === form.habitacionAsignada);
  const confirmBedsForRoom = useMemo(() => {
    if (!confirmForm.habitacionAsignada) return [];
    const free: { habitacion: string; cama: number }[] = [];
    const room = rooms.find(r => r.id === confirmForm.habitacionAsignada);
    if (!room) return [];
    for (let i = 1; i <= room.camas; i++) {
      if (!occupiedBeds.has(`${confirmForm.habitacionAsignada}-${i}`)) {
        free.push({ habitacion: confirmForm.habitacionAsignada, cama: i });
      }
    }
    return free;
  }, [confirmForm.habitacionAsignada, occupiedBeds, rooms]);

  const openNew = () => { setEditingId(null); setForm(emptyForm()); setShowForm(true); };

  const openEdit = (l: ProximaLlegada) => {
    setEditingId(l.id);
    setForm({
      nombre: l.nombre, nie: l.nie, nacionalidad: l.nacionalidad, idioma: l.idioma,
      dieta: l.dieta, fechaLlegada: l.fechaLlegada, notas: l.notas,
      habitacionAsignada: l.habitacionAsignada || '', camaAsignada: l.camaAsignada ? String(l.camaAsignada) : '',
    });
    setShowForm(true);
  };

  const update = (field: keyof LlegadaFormData, value: string) => setForm(prev => ({ ...prev, [field]: value }));
  const updateConfirm = (field: keyof LlegadaFormData, value: string) => setConfirmForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim()) return;
    const data = {
      nombre: form.nombre, nie: form.nie, nacionalidad: form.nacionalidad,
      idioma: form.idioma, dieta: form.dieta, fechaLlegada: form.fechaLlegada,
      notas: form.notas,
      habitacionAsignada: form.habitacionAsignada || undefined,
      camaAsignada: form.camaAsignada ? parseInt(form.camaAsignada) : undefined,
    };
    try {
      if (editingId) { await editLlegada(editingId, data); } else { await addLlegada(data); }
      setShowForm(false);
      setEditingId(null);
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar llegada');
    }
  };

  const openConfirm = (l: ProximaLlegada) => {
    setConfirmingLlegada(l);
    setConfirmForm({
      nombre: l.nombre, nie: l.nie, nacionalidad: l.nacionalidad, idioma: l.idioma,
      dieta: l.dieta, fechaLlegada: l.fechaLlegada, notas: l.notas,
      habitacionAsignada: l.habitacionAsignada || '', camaAsignada: l.camaAsignada ? String(l.camaAsignada) : '',
    });
  };

  const handleConfirmSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmingLlegada || !confirmForm.habitacionAsignada || !confirmForm.camaAsignada) return;
    try {
      await editLlegada(confirmingLlegada.id, {
        nombre: confirmForm.nombre, nie: confirmForm.nie, nacionalidad: confirmForm.nacionalidad,
        idioma: confirmForm.idioma, dieta: confirmForm.dieta, fechaLlegada: confirmForm.fechaLlegada,
        notas: confirmForm.notas,
        habitacionAsignada: confirmForm.habitacionAsignada,
        camaAsignada: parseInt(confirmForm.camaAsignada),
      });
      await confirmarLlegada(confirmingLlegada.id);
      setConfirmingLlegada(null);
    } catch (err: any) {
      toast.error(err.message || 'Error al confirmar llegada');
    }
  };

  const isRoomOccupied = (roomId: string) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return true;
    for (let i = 1; i <= room.camas; i++) {
      if (!occupiedBeds.has(`${roomId}-${i}`)) return false;
    }
    return true;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <CalendarPlus className="w-5 h-5 text-primary" /> {t.upcomingArrivals}
        </h2>
        <div className="flex items-center gap-2">
          <ExportButton type="llegadas" getData={() => llegadas} />
          {canManage && <Button onClick={openNew}>{t.newArrival}</Button>}
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          {llegadas.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">{t.noArrivals}</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.name}</TableHead>
                    <TableHead>{t.arrivalDate}</TableHead>
                    <TableHead>{t.nationality}</TableHead>
                    <TableHead>{t.diet}</TableHead>
                    <TableHead>{t.assignedRoomBed}</TableHead>
                    <TableHead>{t.notes}</TableHead>
                    {canManage && <TableHead className="text-right">{t.actions}</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {llegadas.map(l => (
                    <TableRow key={l.id}>
                      <TableCell className="font-medium">{l.nombre}</TableCell>
                      <TableCell>{formatDateES(l.fechaLlegada)}</TableCell>
                      <TableCell>{l.nacionalidad || '-'}</TableCell>
                      <TableCell><Badge variant="outline">{l.dieta}</Badge></TableCell>
                      <TableCell>
                        {l.habitacionAsignada && l.camaAsignada
                          ? <Badge variant="secondary">Hab {l.habitacionAsignada} - {t.bed} {l.camaAsignada}</Badge>
                          : <span className="text-xs text-muted-foreground">{t.unassigned}</span>
                        }
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">{l.notas || '-'}</TableCell>
                      {canManage && (
                        <TableCell className="text-right space-x-2">
                          <Button size="sm" variant="outline" onClick={() => openEdit(l)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button size="sm" onClick={() => openConfirm(l)}>
                            <Check className="w-4 h-4 mr-1" /> {t.confirm}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={async () => {
                            try { await deleteLlegada(l.id); } catch (err: any) { toast.error(err.message || 'Error al eliminar'); }
                          }}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Register/Edit Form */}
      <Dialog open={showForm} onOpenChange={() => setShowForm(false)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>{editingId ? t.editArrival : t.newScheduledArrival}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t.name} *</Label>
                <Input value={form.nombre} onChange={e => update('nombre', e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>{t.nieDocument}</Label>
                <Input value={form.nie} onChange={e => update('nie', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t.nationality}</Label>
                <Input value={form.nacionalidad} onChange={e => update('nacionalidad', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t.language}</Label>
                <Input value={form.idioma} onChange={e => update('idioma', e.target.value)} />
              </div>
              <div className="space-y-2 col-span-1 sm:col-span-2">
                <Label>{t.diet}</Label>
                <Select value={form.dieta} onValueChange={v => update('dieta', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DIETAS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t.plannedArrivalDate}</Label>
                <Input type="date" value={form.fechaLlegada} onChange={e => update('fechaLlegada', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t.plannedRoom}</Label>
                <Select value={form.habitacionAsignada} onValueChange={v => { update('habitacionAsignada', v); update('camaAsignada', ''); }}>
                  <SelectTrigger><SelectValue placeholder={t.selectRoom} /></SelectTrigger>
                  <SelectContent>
                    {[...new Set(freeBeds.map(fb => fb.habitacion))].map(r => (
                      <SelectItem key={r} value={r}>{t.room} {r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {form.habitacionAsignada && (
                <div className="space-y-2">
                  <Label>{t.plannedBed}</Label>
                  <Select value={form.camaAsignada} onValueChange={v => update('camaAsignada', v)}>
                    <SelectTrigger><SelectValue placeholder={t.selectBed} /></SelectTrigger>
                    <SelectContent>
                      {bedsForRoom.map(fb => (
                        <SelectItem key={fb.cama} value={String(fb.cama)}>{t.bed} {fb.cama}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>{t.notes}</Label>
              <Textarea value={form.notas} onChange={e => update('notas', e.target.value)} rows={3} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>{t.cancel}</Button>
              <Button type="submit">{editingId ? t.saveChanges : t.scheduleArrival}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={!!confirmingLlegada} onOpenChange={() => setConfirmingLlegada(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>{t.confirmEntry} — {confirmingLlegada?.nombre}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{t.reviewBeforeConfirm}</p>
          <form onSubmit={handleConfirmSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t.name} *</Label>
                <Input value={confirmForm.nombre} onChange={e => updateConfirm('nombre', e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>{t.nieDocument}</Label>
                <Input value={confirmForm.nie} onChange={e => updateConfirm('nie', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t.nationality}</Label>
                <Input value={confirmForm.nacionalidad} onChange={e => updateConfirm('nacionalidad', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t.language}</Label>
                <Input value={confirmForm.idioma} onChange={e => updateConfirm('idioma', e.target.value)} />
              </div>
              <div className="space-y-2 col-span-1 sm:col-span-2">
                <Label>{t.diet}</Label>
                <Select value={confirmForm.dieta} onValueChange={v => updateConfirm('dieta', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DIETAS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t.entryDate}</Label>
                <Input type="date" value={confirmForm.fechaLlegada} onChange={e => updateConfirm('fechaLlegada', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t.room} *</Label>
                <Select value={confirmForm.habitacionAsignada} onValueChange={v => { updateConfirm('habitacionAsignada', v); updateConfirm('camaAsignada', ''); }}>
                  <SelectTrigger><SelectValue placeholder={t.selectRoom} /></SelectTrigger>
                  <SelectContent>
                    {rooms.map(r => {
                      const full = isRoomOccupied(r.id);
                      return (
                        <SelectItem key={r.id} value={r.id} disabled={full}>
                          <span className={full ? 'text-destructive' : 'text-[hsl(142,60%,30%)]'}>
                            {r.nombre} {full ? t.roomFull : t.roomAvailable}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              {confirmForm.habitacionAsignada && (
                <div className="space-y-2">
                  <Label>{t.bed} *</Label>
                  <Select value={confirmForm.camaAsignada} onValueChange={v => updateConfirm('camaAsignada', v)}>
                    <SelectTrigger><SelectValue placeholder={t.selectBed} /></SelectTrigger>
                    <SelectContent>
                      {confirmBedsForRoom.map(fb => (
                        <SelectItem key={fb.cama} value={String(fb.cama)}>{t.bed} {fb.cama}</SelectItem>
                      ))}
                      {confirmBedsForRoom.length === 0 && (
                        <SelectItem value="__none" disabled>{t.noFreeBeds}</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>{t.notes}</Label>
              <Textarea value={confirmForm.notas} onChange={e => updateConfirm('notas', e.target.value)} rows={3} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setConfirmingLlegada(null)}>{t.cancel}</Button>
              <Button type="submit" disabled={!confirmForm.habitacionAsignada || !confirmForm.camaAsignada}>
                <Check className="w-4 h-4 mr-1" /> {t.confirmTransfer}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

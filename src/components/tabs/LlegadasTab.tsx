import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CalendarPlus, Check, Trash2, Pencil } from 'lucide-react';
import { ROOMS, DIETAS, Dieta, UserRole, ProximaLlegada } from '@/types';
import { formatDateES } from '@/lib/dateFormat';

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
  const { llegadas, addLlegada, editLlegada, confirmarLlegada, deleteLlegada, huespedActivos } = store;
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<LlegadaFormData>(emptyForm());
  // Confirmation flow: open edit dialog before final confirm
  const [confirmingLlegada, setConfirmingLlegada] = useState<ProximaLlegada | null>(null);
  const [confirmForm, setConfirmForm] = useState<LlegadaFormData>(emptyForm());

  const canManage = role === 'admin' || role === 'gestor';

  // Occupied beds set
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
    for (const room of ROOMS) {
      for (let i = 1; i <= room.camas; i++) {
        if (!occupied.has(`${room.id}-${i}`)) free.push({ habitacion: room.id, cama: i });
      }
    }
    return free;
  }, [huespedActivos, llegadas, editingId]);

  const bedsForRoom = freeBeds.filter(fb => fb.habitacion === form.habitacionAsignada);
  const confirmBedsForRoom = useMemo(() => {
    if (!confirmForm.habitacionAsignada) return [];
    const free: { habitacion: string; cama: number }[] = [];
    const room = ROOMS.find(r => r.id === confirmForm.habitacionAsignada);
    if (!room) return [];
    for (let i = 1; i <= room.camas; i++) {
      if (!occupiedBeds.has(`${confirmForm.habitacionAsignada}-${i}`)) {
        free.push({ habitacion: confirmForm.habitacionAsignada, cama: i });
      }
    }
    return free;
  }, [confirmForm.habitacionAsignada, occupiedBeds]);

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm());
    setShowForm(true);
  };

  const openEdit = (l: ProximaLlegada) => {
    setEditingId(l.id);
    setForm({
      nombre: l.nombre, nie: l.nie, nacionalidad: l.nacionalidad, idioma: l.idioma,
      dieta: l.dieta, fechaLlegada: l.fechaLlegada, notas: l.notas,
      habitacionAsignada: l.habitacionAsignada || '',
      camaAsignada: l.camaAsignada ? String(l.camaAsignada) : '',
    });
    setShowForm(true);
  };

  const update = (field: keyof LlegadaFormData, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const updateConfirm = (field: keyof LlegadaFormData, value: string) =>
    setConfirmForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim()) return;
    const data = {
      nombre: form.nombre, nie: form.nie, nacionalidad: form.nacionalidad,
      idioma: form.idioma, dieta: form.dieta, fechaLlegada: form.fechaLlegada,
      notas: form.notas,
      habitacionAsignada: form.habitacionAsignada || undefined,
      camaAsignada: form.camaAsignada ? parseInt(form.camaAsignada) : undefined,
    };
    if (editingId) {
      editLlegada(editingId, data);
    } else {
      addLlegada(data);
    }
    setShowForm(false);
    setEditingId(null);
  };

  // Open confirmation dialog
  const openConfirm = (l: ProximaLlegada) => {
    setConfirmingLlegada(l);
    setConfirmForm({
      nombre: l.nombre, nie: l.nie, nacionalidad: l.nacionalidad, idioma: l.idioma,
      dieta: l.dieta, fechaLlegada: l.fechaLlegada, notas: l.notas,
      habitacionAsignada: l.habitacionAsignada || '',
      camaAsignada: l.camaAsignada ? String(l.camaAsignada) : '',
    });
  };

  const handleConfirmSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmingLlegada || !confirmForm.habitacionAsignada || !confirmForm.camaAsignada) return;
    // First update the llegada data, then confirm
    editLlegada(confirmingLlegada.id, {
      nombre: confirmForm.nombre, nie: confirmForm.nie, nacionalidad: confirmForm.nacionalidad,
      idioma: confirmForm.idioma, dieta: confirmForm.dieta, fechaLlegada: confirmForm.fechaLlegada,
      notas: confirmForm.notas,
      habitacionAsignada: confirmForm.habitacionAsignada,
      camaAsignada: parseInt(confirmForm.camaAsignada),
    });
    confirmarLlegada(confirmingLlegada.id);
    setConfirmingLlegada(null);
  };

  // Check if a room is fully occupied
  const isRoomOccupied = (roomId: string) => {
    const room = ROOMS.find(r => r.id === roomId);
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
          <CalendarPlus className="w-5 h-5 text-primary" /> Próximas Llegadas
        </h2>
        {canManage && <Button onClick={openNew}>+ Nueva llegada</Button>}
      </div>

      <Card>
        <CardContent className="pt-6">
          {llegadas.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No hay llegadas programadas</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Fecha llegada</TableHead>
                    <TableHead>Nacionalidad</TableHead>
                    <TableHead>Dieta</TableHead>
                    <TableHead>Hab. / Cama</TableHead>
                    <TableHead>Notas</TableHead>
                    {canManage && <TableHead className="text-right">Acciones</TableHead>}
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
                          ? <Badge variant="secondary">Hab {l.habitacionAsignada} - Cama {l.camaAsignada}</Badge>
                          : <span className="text-xs text-muted-foreground">Sin asignar</span>
                        }
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">{l.notas || '-'}</TableCell>
                      {canManage && (
                        <TableCell className="text-right space-x-2">
                          <Button size="sm" variant="outline" onClick={() => openEdit(l)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => openConfirm(l)}
                          >
                            <Check className="w-4 h-4 mr-1" /> Confirmar
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => deleteLlegada(l.id)}>
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

      {/* Register/Edit Form Dialog */}
      <Dialog open={showForm} onOpenChange={() => setShowForm(false)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar llegada' : 'Nueva llegada programada'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre *</Label>
                <Input value={form.nombre} onChange={e => update('nombre', e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>NIE / Documento</Label>
                <Input value={form.nie} onChange={e => update('nie', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Nacionalidad</Label>
                <Input value={form.nacionalidad} onChange={e => update('nacionalidad', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Idioma</Label>
                <Input value={form.idioma} onChange={e => update('idioma', e.target.value)} />
              </div>
              <div className="space-y-2 col-span-1 sm:col-span-2">
                <Label>Dieta</Label>
                <Select value={form.dieta} onValueChange={v => update('dieta', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DIETAS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fecha de llegada prevista</Label>
                <Input type="date" value={form.fechaLlegada} onChange={e => update('fechaLlegada', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Habitación prevista</Label>
                <Select value={form.habitacionAsignada} onValueChange={v => { update('habitacionAsignada', v); update('camaAsignada', ''); }}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    {[...new Set(freeBeds.map(fb => fb.habitacion))].map(r => (
                      <SelectItem key={r} value={r}>Habitación {r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {form.habitacionAsignada && (
                <div className="space-y-2">
                  <Label>Cama prevista</Label>
                  <Select value={form.camaAsignada} onValueChange={v => update('camaAsignada', v)}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      {bedsForRoom.map(fb => (
                        <SelectItem key={fb.cama} value={String(fb.cama)}>Cama {fb.cama}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea value={form.notas} onChange={e => update('notas', e.target.value)} rows={3} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button type="submit">{editingId ? 'Guardar cambios' : 'Programar llegada'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog - editable before final confirm */}
      <Dialog open={!!confirmingLlegada} onOpenChange={() => setConfirmingLlegada(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Confirmar entrada — {confirmingLlegada?.nombre}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Revisa y edita los datos antes de confirmar el traslado a la habitación. Solo puedes asignar camas libres.
          </p>
          <form onSubmit={handleConfirmSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre *</Label>
                <Input value={confirmForm.nombre} onChange={e => updateConfirm('nombre', e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>NIE / Documento</Label>
                <Input value={confirmForm.nie} onChange={e => updateConfirm('nie', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Nacionalidad</Label>
                <Input value={confirmForm.nacionalidad} onChange={e => updateConfirm('nacionalidad', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Idioma</Label>
                <Input value={confirmForm.idioma} onChange={e => updateConfirm('idioma', e.target.value)} />
              </div>
              <div className="space-y-2 col-span-1 sm:col-span-2">
                <Label>Dieta</Label>
                <Select value={confirmForm.dieta} onValueChange={v => updateConfirm('dieta', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DIETAS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fecha de entrada</Label>
                <Input type="date" value={confirmForm.fechaLlegada} onChange={e => updateConfirm('fechaLlegada', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Habitación *</Label>
                <Select value={confirmForm.habitacionAsignada} onValueChange={v => { updateConfirm('habitacionAsignada', v); updateConfirm('camaAsignada', ''); }}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    {ROOMS.map(r => {
                      const full = isRoomOccupied(r.id);
                      return (
                        <SelectItem key={r.id} value={r.id} disabled={full}>
                          <span className={full ? 'text-destructive' : 'text-[hsl(142,60%,30%)]'}>
                            {r.nombre} {full ? '(Completa)' : '(Disponible)'}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              {confirmForm.habitacionAsignada && (
                <div className="space-y-2">
                  <Label>Cama *</Label>
                  <Select value={confirmForm.camaAsignada} onValueChange={v => updateConfirm('camaAsignada', v)}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      {confirmBedsForRoom.map(fb => (
                        <SelectItem key={fb.cama} value={String(fb.cama)}>Cama {fb.cama}</SelectItem>
                      ))}
                      {confirmBedsForRoom.length === 0 && (
                        <SelectItem value="__none" disabled>No hay camas libres</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea value={confirmForm.notas} onChange={e => updateConfirm('notas', e.target.value)} rows={3} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setConfirmingLlegada(null)}>Cancelar</Button>
              <Button type="submit" disabled={!confirmForm.habitacionAsignada || !confirmForm.camaAsignada}>
                <Check className="w-4 h-4 mr-1" /> Confirmar traslado
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

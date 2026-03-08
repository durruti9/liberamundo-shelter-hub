import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { History, Pencil, Trash2, UserPlus, AlertTriangle } from 'lucide-react';
import ExportButton from '@/components/ExportButton';
import { DIETAS, Dieta, UserRole } from '@/types';
import { formatDateES } from '@/lib/dateFormat';
import { useI18n } from '@/i18n/I18nContext';

interface Props {
  store: ReturnType<typeof import('@/hooks/useAlbergueStore').useAlbergueStore>;
  role: UserRole;
}

export default function HistorialTab({ store, role }: Props) {
  const { huespedes, rooms, deleteHuesped, editHuesped, reincorporar, huespedActivos } = store;
  const { t } = useI18n();
  const [editId, setEditId] = useState<string | null>(null);
  const [reincorporarId, setReincorporarId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [selectedBed, setSelectedBed] = useState('');
  const [editForm, setEditForm] = useState({ nombre: '', nie: '', nacionalidad: '', idioma: '', dieta: '' as Dieta, notas: '' });

  const sorted = [...huespedes].sort((a, b) => b.fechaEntrada.localeCompare(a.fechaEntrada));

  const freeBeds = useMemo(() => {
    const occupied = new Set(huespedActivos.map(h => `${h.habitacion}-${h.cama}`));
    const free: { habitacion: string; cama: number }[] = [];
    for (const room of rooms) {
      for (let i = 1; i <= room.camas; i++) {
        if (!occupied.has(`${room.id}-${i}`)) free.push({ habitacion: room.id, cama: i });
      }
    }
    return free;
  }, [huespedActivos, rooms]);

  const openEdit = (h: typeof huespedes[0]) => {
    setEditForm({ nombre: h.nombre, nie: h.nie, nacionalidad: h.nacionalidad, idioma: h.idioma, dieta: h.dieta, notas: h.notas });
    setEditId(h.id);
  };

  const saveEdit = () => {
    if (!editId) return;
    editHuesped(editId, editForm);
    setEditId(null);
  };

  const handleReincorporar = () => {
    if (!reincorporarId || !selectedRoom || !selectedBed) return;
    reincorporar(reincorporarId, selectedRoom, parseInt(selectedBed));
    setReincorporarId(null);
    setSelectedRoom('');
    setSelectedBed('');
  };

  const bedsForRoom = freeBeds.filter(fb => fb.habitacion === selectedRoom);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            {t.guestHistory}
          </CardTitle>
          <ExportButton type="historial" getData={() => sorted.map(h => ({ ...h, estado: h.activo ? 'Activo' : 'Inactivo' }))} />
        </CardHeader>
        <CardContent>
          {sorted.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">{t.noRecords}</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.name}</TableHead>
                    <TableHead>{t.room}</TableHead>
                    <TableHead>{t.checkInDate}</TableHead>
                    <TableHead>{t.checkOutDate}</TableHead>
                    <TableHead>{t.diet}</TableHead>
                    <TableHead>{t.status}</TableHead>
                    <TableHead className="text-right">{t.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sorted.map(h => (
                    <TableRow key={h.id}>
                      <TableCell className="font-medium">{h.nombre}</TableCell>
                      <TableCell>
                        <Badge variant="outline">Hab {h.habitacion} - C{h.cama}</Badge>
                      </TableCell>
                      <TableCell>{formatDateES(h.fechaEntrada)}</TableCell>
                      <TableCell>{formatDateES(h.fechaCheckout)}</TableCell>
                      <TableCell className="text-xs">{h.dieta}</TableCell>
                      <TableCell>
                        <Badge variant={h.activo ? 'default' : 'secondary'}>
                          {h.activo ? t.active : t.historic}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" onClick={() => openEdit(h)} title={t.edit}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          {!h.activo && (
                            <Button size="icon" variant="ghost" onClick={() => setReincorporarId(h.id)} title={t.reincorporate}>
                              <UserPlus className="w-4 h-4 text-primary" />
                            </Button>
                          )}
                          <Button size="icon" variant="ghost" onClick={() => setDeleteConfirmId(h.id)} title={t.delete}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editId} onOpenChange={() => setEditId(null)}>
        <DialogContent className="max-w-lg" aria-describedby={undefined}>
          <DialogHeader><DialogTitle>{t.editGuest}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t.name}</Label>
                <Input value={editForm.nombre} onChange={e => setEditForm(p => ({ ...p, nombre: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>{t.nieDocument}</Label>
                <Input value={editForm.nie} onChange={e => setEditForm(p => ({ ...p, nie: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>{t.nationality}</Label>
                <Input value={editForm.nacionalidad} onChange={e => setEditForm(p => ({ ...p, nacionalidad: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>{t.language}</Label>
                <Input value={editForm.idioma} onChange={e => setEditForm(p => ({ ...p, idioma: e.target.value }))} />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>{t.diet}</Label>
                <Select value={editForm.dieta} onValueChange={v => setEditForm(p => ({ ...p, dieta: v as Dieta }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DIETAS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t.notes}</Label>
              <Textarea value={editForm.notas} onChange={e => setEditForm(p => ({ ...p, notas: e.target.value }))} rows={3} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditId(null)}>{t.cancel}</Button>
              <Button onClick={saveEdit}>{t.save}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!reincorporarId} onOpenChange={() => setReincorporarId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t.reincorporateToRoom}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t.room}</Label>
              <Select value={selectedRoom} onValueChange={v => { setSelectedRoom(v); setSelectedBed(''); }}>
                <SelectTrigger><SelectValue placeholder={t.selectRoom} /></SelectTrigger>
                <SelectContent>
                  {[...new Set(freeBeds.map(fb => fb.habitacion))].map(r => (
                    <SelectItem key={r} value={r}>{t.room} {r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedRoom && (
              <div className="space-y-2">
                <Label>{t.bed}</Label>
                <Select value={selectedBed} onValueChange={setSelectedBed}>
                  <SelectTrigger><SelectValue placeholder={t.selectBed} /></SelectTrigger>
                  <SelectContent>
                    {bedsForRoom.map(fb => (
                      <SelectItem key={fb.cama} value={String(fb.cama)}>{t.bed} {fb.cama}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setReincorporarId(null)}>{t.cancel}</Button>
              <Button disabled={!selectedRoom || !selectedBed} onClick={handleReincorporar}>{t.reincorporate}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent className="max-w-sm" aria-describedby={undefined}>
          <DialogHeader><DialogTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-destructive" /> {t.confirmDeletion}</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">{t.deleteConfirmMsg}</p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>{t.cancel}</Button>
            <Button variant="destructive" onClick={() => { if (deleteConfirmId) deleteHuesped(deleteConfirmId); setDeleteConfirmId(null); }}>{t.delete}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

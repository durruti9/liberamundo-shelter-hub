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
import { Download, History, Pencil, Trash2, UserPlus, AlertTriangle } from 'lucide-react';
import { DIETAS, ROOMS, Dieta, UserRole } from '@/types';
import { formatDateES } from '@/lib/dateFormat';

interface Props {
  store: ReturnType<typeof import('@/hooks/useAlbergueStore').useAlbergueStore>;
  role: UserRole;
}

export default function HistorialTab({ store, role }: Props) {
  const { huespedes, deleteHuesped, editHuesped, reincorporar, huespedActivos } = store;
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
    for (const room of ROOMS) {
      for (let i = 1; i <= room.camas; i++) {
        if (!occupied.has(`${room.id}-${i}`)) free.push({ habitacion: room.id, cama: i });
      }
    }
    return free;
  }, [huespedActivos]);

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

  const exportCSV = () => {
    const headers = ['Nombre', 'Habitación', 'Cama', 'Check-in', 'Check-out', 'Dieta', 'NIE', 'Nacionalidad', 'Estado'];
    const rows = sorted.map(h => [
      h.nombre, h.habitacion, h.cama, h.fechaEntrada, h.fechaCheckout || '-', h.dieta, h.nie, h.nacionalidad, h.activo ? 'Activo' : 'Histórico'
    ]);
    const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `historial_${new Date().toISOString().split('T')[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const bedsForRoom = freeBeds.filter(fb => fb.habitacion === selectedRoom);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            Historial de Huéspedes
          </CardTitle>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="w-4 h-4 mr-2" /> Exportar CSV
          </Button>
        </CardHeader>
        <CardContent>
          {sorted.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No hay registros</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Habitación</TableHead>
                    <TableHead>Check-in</TableHead>
                    <TableHead>Check-out</TableHead>
                    <TableHead>Dieta</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sorted.map(h => (
                    <TableRow key={h.id}>
                      <TableCell className="font-medium">{h.nombre}</TableCell>
                      <TableCell>
                        <Badge variant="outline">Hab {h.habitacion} - C{h.cama}</Badge>
                      </TableCell>
                      <TableCell>{h.fechaEntrada}</TableCell>
                      <TableCell>{h.fechaCheckout || '-'}</TableCell>
                      <TableCell className="text-xs">{h.dieta}</TableCell>
                      <TableCell>
                        <Badge variant={h.activo ? 'default' : 'secondary'}>
                          {h.activo ? 'Activo' : 'Histórico'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" onClick={() => openEdit(h)} title="Editar">
                            <Pencil className="w-4 h-4" />
                          </Button>
                          {!h.activo && (
                            <Button size="icon" variant="ghost" onClick={() => setReincorporarId(h.id)} title="Reincorporar">
                              <UserPlus className="w-4 h-4 text-primary" />
                            </Button>
                          )}
                          <Button size="icon" variant="ghost" onClick={() => setDeleteConfirmId(h.id)} title="Eliminar">
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

      {/* Edit dialog */}
      <Dialog open={!!editId} onOpenChange={() => setEditId(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Editar huésped</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input value={editForm.nombre} onChange={e => setEditForm(p => ({ ...p, nombre: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>NIE</Label>
                <Input value={editForm.nie} onChange={e => setEditForm(p => ({ ...p, nie: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Nacionalidad</Label>
                <Input value={editForm.nacionalidad} onChange={e => setEditForm(p => ({ ...p, nacionalidad: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Idioma</Label>
                <Input value={editForm.idioma} onChange={e => setEditForm(p => ({ ...p, idioma: e.target.value }))} />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Dieta</Label>
                <Select value={editForm.dieta} onValueChange={v => setEditForm(p => ({ ...p, dieta: v as Dieta }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DIETAS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea value={editForm.notas} onChange={e => setEditForm(p => ({ ...p, notas: e.target.value }))} rows={3} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditId(null)}>Cancelar</Button>
              <Button onClick={saveEdit}>Guardar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reincorporar dialog */}
      <Dialog open={!!reincorporarId} onOpenChange={() => setReincorporarId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reincorporar a habitación</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Habitación</Label>
              <Select value={selectedRoom} onValueChange={v => { setSelectedRoom(v); setSelectedBed(''); }}>
                <SelectTrigger><SelectValue placeholder="Seleccionar habitación" /></SelectTrigger>
                <SelectContent>
                  {[...new Set(freeBeds.map(fb => fb.habitacion))].map(r => (
                    <SelectItem key={r} value={r}>Habitación {r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedRoom && (
              <div className="space-y-2">
                <Label>Cama</Label>
                <Select value={selectedBed} onValueChange={setSelectedBed}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar cama" /></SelectTrigger>
                  <SelectContent>
                    {bedsForRoom.map(fb => (
                      <SelectItem key={fb.cama} value={String(fb.cama)}>Cama {fb.cama}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setReincorporarId(null)}>Cancelar</Button>
              <Button disabled={!selectedRoom || !selectedBed} onClick={handleReincorporar}>Reincorporar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-destructive" /> Confirmar eliminación</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">¿Estás seguro de que quieres eliminar este huésped permanentemente? Esta acción no se puede deshacer.</p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => { if (deleteConfirmId) deleteHuesped(deleteConfirmId); setDeleteConfirmId(null); }}>Eliminar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

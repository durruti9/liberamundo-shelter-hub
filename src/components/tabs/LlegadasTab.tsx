import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { CalendarPlus, Check, Trash2 } from 'lucide-react';
import CheckInModal from '@/components/CheckInModal';
import { ROOMS } from '@/types';

interface Props {
  store: ReturnType<typeof import('@/hooks/useAlbergueStore').useAlbergueStore>;
}

export default function LlegadasTab({ store }: Props) {
  const { llegadas, addLlegada, confirmarLlegada, deleteLlegada, huespedActivos } = store;
  const [showForm, setShowForm] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [selectedBed, setSelectedBed] = useState('');

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

  const handleConfirm = () => {
    if (!confirmTarget || !selectedRoom || !selectedBed) return;
    confirmarLlegada(confirmTarget, selectedRoom, parseInt(selectedBed));
    setConfirmTarget(null);
    setSelectedRoom('');
    setSelectedBed('');
  };

  const bedsForRoom = freeBeds.filter(fb => fb.habitacion === selectedRoom);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <CalendarPlus className="w-5 h-5 text-primary" /> Próximas Llegadas
        </h2>
        <Button onClick={() => setShowForm(true)}>+ Nueva llegada</Button>
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
                    <TableHead>Notas</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {llegadas.map(l => (
                    <TableRow key={l.id}>
                      <TableCell className="font-medium">{l.nombre}</TableCell>
                      <TableCell>{l.fechaLlegada}</TableCell>
                      <TableCell>{l.nacionalidad || '-'}</TableCell>
                      <TableCell><Badge variant="outline">{l.dieta}</Badge></TableCell>
                      <TableCell className="max-w-[200px] truncate">{l.notas || '-'}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button size="sm" onClick={() => setConfirmTarget(l.id)}>
                          <Check className="w-4 h-4 mr-1" /> Confirmar
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => deleteLlegada(l.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <CheckInModal
        open={showForm}
        onClose={() => setShowForm(false)}
        title="Nueva llegada programada"
        submitLabel="Programar llegada"
        onSubmit={data => {
          addLlegada({
            nombre: data.nombre, nie: data.nie, nacionalidad: data.nacionalidad,
            idioma: data.idioma, dieta: data.dieta, fechaLlegada: data.fechaEntrada, notas: data.notas,
          });
        }}
      />

      {/* Confirm arrival dialog */}
      <Dialog open={!!confirmTarget} onOpenChange={() => setConfirmTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Asignar habitación y cama</DialogTitle></DialogHeader>
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
              <Button variant="outline" onClick={() => setConfirmTarget(null)}>Cancelar</Button>
              <Button disabled={!selectedRoom || !selectedBed} onClick={handleConfirm}>Confirmar llegada</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger } from '@/components/ui/dropdown-menu';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { ROOMS, TOTAL_CAMAS, UserRole } from '@/types';
import CheckInModal from '@/components/CheckInModal';
import { BedDouble, MoreVertical } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { stayDuration, formatDateES } from '@/lib/dateFormat';

interface Props {
  store: ReturnType<typeof import('@/hooks/useAlbergueStore').useAlbergueStore>;
  role: UserRole;
}

export default function HabitacionesTab({ store, role }: Props) {
  const { huespedActivos, checkIn, checkOut, cambiarCama, editHuesped, getOccupant } = store;
  const [checkInTarget, setCheckInTarget] = useState<{ habitacion: string; cama: number } | null>(null);
  const [editTarget, setEditTarget] = useState<string | null>(null);
  const [checkoutTarget, setCheckoutTarget] = useState<string | null>(null);
  const [checkoutDate, setCheckoutDate] = useState<Date | undefined>(new Date());

  const canManage = role === 'admin' || role === 'gestor';

  const ocupadas = huespedActivos.length;
  const libres = TOTAL_CAMAS - ocupadas;
  const porcentaje = Math.round((ocupadas / TOTAL_CAMAS) * 100);

  const dietStats = useMemo(() => {
    const counts: Record<string, number> = {};
    huespedActivos.forEach(h => { counts[h.dieta] = (counts[h.dieta] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [huespedActivos]);

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

  const editingHuesped = editTarget ? huespedActivos.find(h => h.id === editTarget) : null;
  const checkoutHuesped = checkoutTarget ? huespedActivos.find(h => h.id === checkoutTarget) : null;

  const dietColors: Record<string, string> = {
    'Omnívora estándar': 'bg-secondary text-secondary-foreground',
    'Halal': 'bg-[hsl(142,60%,90%)] text-[hsl(142,60%,30%)]',
    'Kosher': 'bg-accent text-accent-foreground',
    'Vegetariana': 'bg-[hsl(212,72%,90%)] text-primary',
    'Vegana': 'bg-primary text-primary-foreground',
    'Sin cerdo (no halal)': 'bg-[hsl(38,92%,90%)] text-[hsl(38,92%,30%)]',
    'Situación especial': 'bg-accent text-accent-foreground',
    'Alergias e intolerancias': 'bg-[hsl(0,72%,92%)] text-destructive',
  };

  const handleCheckoutConfirm = () => {
    if (!checkoutTarget) return;
    const dateStr = checkoutDate ? format(checkoutDate, 'yyyy-MM-dd') : new Date().toISOString().split('T')[0];
    checkOut(checkoutTarget, dateStr);
    setCheckoutTarget(null);
    setCheckoutDate(new Date());
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-3xl font-bold text-primary">{ocupadas}</div>
                <div className="text-xs text-muted-foreground">Ocupadas</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-[hsl(var(--success))]">{libres}</div>
                <div className="text-xs text-muted-foreground">Libres</div>
              </div>
              <div>
                <div className="text-3xl font-bold">{porcentaje}%</div>
                <div className="text-xs text-muted-foreground">Ocupación</div>
              </div>
            </div>
            <div className="mt-4 w-full bg-secondary rounded-full h-2.5">
              <div className="bg-primary h-2.5 rounded-full transition-all" style={{ width: `${porcentaje}%` }} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Dietas activas</CardTitle>
          </CardHeader>
          <CardContent>
            {dietStats.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin huéspedes</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {dietStats.map(([dieta, count]) => (
                  <Badge key={dieta} className={dietColors[dieta] || ''} variant="secondary">
                    {dieta}: {count}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Rooms grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ROOMS.map(room => (
          <Card key={room.id}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <BedDouble className="w-4 h-4 text-primary" />
                  {room.nombre}
                </span>
                <Badge variant="outline" className="text-xs">{room.camas} camas</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {Array.from({ length: room.camas }, (_, i) => i + 1).map(cama => {
                  const occupant = getOccupant(room.id, cama);
                  if (occupant) {
                    const hasFutureCheckout = occupant.fechaCheckout && occupant.fechaCheckout > today;
                    const duration = stayDuration(occupant.fechaEntrada);
                    if (!canManage) {
                      return (
                        <div key={cama} className="bed-occupied rounded-lg p-3 text-left text-xs w-full">
                          <div className="font-medium truncate">{occupant.nombre}</div>
                          <div className="opacity-70 mt-0.5">Cama {cama}</div>
                          <div className="opacity-60 mt-0.5 text-[10px]">⏱ {duration}</div>
                          {hasFutureCheckout && (
                            <div className="text-[10px] opacity-60 mt-0.5">Sale: {formatDateES(occupant.fechaCheckout)}</div>
                          )}
                        </div>
                      );
                    }
                    return (
                      <DropdownMenu key={cama}>
                        <DropdownMenuTrigger asChild>
                          <button className="bed-occupied rounded-lg p-3 text-left text-xs w-full relative group">
                            <div className="font-medium truncate pr-4">{occupant.nombre}</div>
                            <div className="opacity-70 mt-0.5">Cama {cama}</div>
                            <div className="opacity-60 mt-0.5 text-[10px]">⏱ {duration}</div>
                            {hasFutureCheckout && (
                              <div className="text-[10px] opacity-60 mt-0.5">Sale: {formatDateES(occupant.fechaCheckout)}</div>
                            )}
                            <MoreVertical className="w-3 h-3 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => setEditTarget(occupant.id)}>
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setCheckoutTarget(occupant.id); setCheckoutDate(new Date()); }} className="text-destructive">
                            Check-out
                          </DropdownMenuItem>
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger>Cambiar cama</DropdownMenuSubTrigger>
                            <DropdownMenuSubContent className="max-h-60 overflow-y-auto">
                              {freeBeds.map(fb => (
                                <DropdownMenuItem key={`${fb.habitacion}-${fb.cama}`} onClick={() => cambiarCama(occupant.id, fb.habitacion, fb.cama)}>
                                  Hab {fb.habitacion} - Cama {fb.cama}
                                </DropdownMenuItem>
                              ))}
                              {freeBeds.length === 0 && <DropdownMenuItem disabled>No hay camas libres</DropdownMenuItem>}
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    );
                  }
                  if (!canManage) {
                    return (
                      <div key={cama} className="bed-free rounded-lg p-3 text-left text-xs opacity-70">
                        <div className="font-medium">Libre</div>
                        <div className="opacity-80 mt-0.5">Cama {cama}</div>
                      </div>
                    );
                  }
                  return (
                    <button
                      key={cama}
                      onClick={() => setCheckInTarget({ habitacion: room.id, cama })}
                      className="bed-free rounded-lg p-3 text-left text-xs hover:opacity-90 transition-opacity"
                    >
                      <div className="font-medium">Check-in</div>
                      <div className="opacity-80 mt-0.5">Cama {cama}</div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Check-in Modal */}
      {checkInTarget && (
        <CheckInModal
          open={!!checkInTarget}
          onClose={() => setCheckInTarget(null)}
          title={`Check-in: Hab ${checkInTarget.habitacion} - Cama ${checkInTarget.cama}`}
          onSubmit={data => {
            checkIn({ ...data, habitacion: checkInTarget.habitacion, cama: checkInTarget.cama });
            setCheckInTarget(null);
          }}
        />
      )}

      {/* Edit Modal */}
      {editingHuesped && (
        <CheckInModal
          open={!!editTarget}
          onClose={() => setEditTarget(null)}
          title={`Editar: ${editingHuesped.nombre}`}
          submitLabel="Guardar cambios"
          initialValues={{
            nombre: editingHuesped.nombre,
            nie: editingHuesped.nie,
            nacionalidad: editingHuesped.nacionalidad,
            idioma: editingHuesped.idioma,
            dieta: editingHuesped.dieta,
            fechaEntrada: editingHuesped.fechaEntrada,
            notas: editingHuesped.notas,
          }}
          onSubmit={data => {
            editHuesped(editTarget!, data);
            setEditTarget(null);
          }}
        />
      )}

      {/* Checkout date dialog */}
      <Dialog open={!!checkoutTarget} onOpenChange={() => setCheckoutTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Fecha de Check-out</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Selecciona la fecha de salida</Label>
              {checkoutHuesped && (
                <p className="text-sm text-muted-foreground">
                  Si seleccionas una fecha futura, {checkoutHuesped.nombre} permanecerá en la habitación hasta ese día.
                </p>
              )}
              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={checkoutDate}
                  onSelect={setCheckoutDate}
                  className={cn("p-3 pointer-events-auto rounded-md border")}
                />
              </div>
              {checkoutDate && (
                <p className="text-sm text-center text-muted-foreground">
                  Fecha seleccionada: <strong>{format(checkoutDate, 'dd-MM-yyyy')}</strong>
                  {format(checkoutDate, 'yyyy-MM-dd') > today && (
                    <span className="block text-xs text-primary mt-1">
                      El huésped permanecerá hasta esta fecha
                    </span>
                  )}
                </p>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCheckoutTarget(null)}>Cancelar</Button>
              <Button variant="destructive" onClick={handleCheckoutConfirm}>Confirmar Check-out</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

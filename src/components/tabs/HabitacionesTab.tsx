import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger } from '@/components/ui/dropdown-menu';
import { ROOMS, TOTAL_CAMAS, Dieta } from '@/types';
import CheckInModal from '@/components/CheckInModal';
import { BedDouble, Users, TrendingUp, MoreVertical } from 'lucide-react';

interface Props {
  store: ReturnType<typeof import('@/hooks/useAlbergueStore').useAlbergueStore>;
}

export default function HabitacionesTab({ store }: Props) {
  const { huespedActivos, checkIn, checkOut, cambiarCama, getOccupant } = store;
  const [checkInTarget, setCheckInTarget] = useState<{ habitacion: string; cama: number } | null>(null);

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
        if (!occupied.has(`${room.id}-${i}`)) {
          free.push({ habitacion: room.id, cama: i });
        }
      }
    }
    return free;
  }, [huespedActivos]);

  const dietColors: Record<string, string> = {
    'Sin restricciones': 'bg-secondary text-secondary-foreground',
    'Sin cerdo': 'bg-warning text-warning-foreground',
    'Situación especial': 'bg-accent text-accent-foreground',
    'Halal': 'bg-success text-success-foreground',
    'Vegano': 'bg-primary text-primary-foreground',
  };

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
                <div className="text-3xl font-bold text-success">{libres}</div>
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
                    return (
                      <DropdownMenu key={cama}>
                        <DropdownMenuTrigger asChild>
                          <button className="bed-occupied rounded-lg p-3 text-left text-xs w-full relative group">
                            <div className="font-medium truncate pr-4">{occupant.nombre}</div>
                            <div className="opacity-70 mt-0.5">Cama {cama}</div>
                            <MoreVertical className="w-3 h-3 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => checkOut(occupant.id)} className="text-destructive">
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
    </div>
  );
}

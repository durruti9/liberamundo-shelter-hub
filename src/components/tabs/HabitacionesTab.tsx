import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { UserRole } from '@/types';
import CheckInModal from '@/components/CheckInModal';
import { BedDouble, MoreVertical, AlertTriangle, SprayCan } from 'lucide-react';
import ExportButton from '@/components/ExportButton';
import { format, differenceInDays } from 'date-fns';
import { es, fr, ar, enUS, ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { stayDuration, formatDateES } from '@/lib/dateFormat';
import { useI18n } from '@/i18n/I18nContext';
import { toast } from 'sonner';

interface Props {
  store: ReturnType<typeof import('@/hooks/useAlbergueStore').useAlbergueStore>;
  role: UserRole;
}

export default function HabitacionesTab({ store, role }: Props) {
  const { huespedActivos, rooms, totalCamas, checkIn, checkOut, cambiarCama, editHuesped, deleteHuesped, getOccupant, updateRooms, updateRoomCleaning } = store;
  const { t, lang } = useI18n();
  const dateFnsLocale = { es, fr, ar, en: enUS, ru }[lang] || es;
  const canClean = role === 'admin' || role === 'personal_albergue';
  const [checkInTarget, setCheckInTarget] = useState<{ habitacion: string; cama: number } | null>(null);
  const [editTarget, setEditTarget] = useState<string | null>(null);
  const [checkoutTarget, setCheckoutTarget] = useState<string | null>(null);
  const [checkoutDate, setCheckoutDate] = useState<Date | undefined>(new Date());
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleteStep, setDeleteStep] = useState<1 | 2>(1);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const canManage = role === 'admin' || role === 'gestor';

  const ocupadas = huespedActivos.length;
  const libres = totalCamas - ocupadas;
  const porcentaje = totalCamas > 0 ? Math.round((ocupadas / totalCamas) * 100) : 0;

  const dietStats = useMemo(() => {
    const counts: Record<string, number> = {};
    huespedActivos.forEach(h => { counts[h.dieta] = (counts[h.dieta] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [huespedActivos]);

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

  const editingHuesped = editTarget ? huespedActivos.find(h => h.id === editTarget) : null;
  const checkoutHuesped = checkoutTarget ? huespedActivos.find(h => h.id === checkoutTarget) : null;
  const deleteHuespedData = deleteTarget ? huespedActivos.find(h => h.id === deleteTarget) : null;

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

  const handleDeleteWithoutRecord = () => {
    if (!deleteTarget || deleteConfirmText.toUpperCase() !== 'CONFIRMAR') return;
    deleteHuesped(deleteTarget);
    setDeleteTarget(null);
    setDeleteStep(1);
    setDeleteConfirmText('');
  };

  const openDeleteConfirm = (id: string) => {
    setDeleteTarget(id);
    setDeleteStep(1);
    setDeleteConfirmText('');
  };

  const today = new Date().toISOString().split('T')[0];

  if (rooms.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <BedDouble className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>{t.noRooms || 'No hay habitaciones configuradas. Accede a Configuración para añadirlas.'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex justify-end">
        <ExportButton type="huespedes" getData={() => huespedActivos.map(h => ({ ...h, estado: h.activo ? 'Activo' : 'Inactivo' }))} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-3xl font-bold text-primary">{ocupadas}</div>
                <div className="text-xs text-muted-foreground">{t.occupied}</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-[hsl(var(--success))]">{libres}</div>
                <div className="text-xs text-muted-foreground">{t.free}</div>
              </div>
              <div>
                <div className="text-3xl font-bold">{porcentaje}%</div>
                <div className="text-xs text-muted-foreground">{t.occupancy}</div>
              </div>
            </div>
            <div className="mt-4 w-full bg-secondary rounded-full h-2.5">
              <div className="bg-primary h-2.5 rounded-full transition-all" style={{ width: `${porcentaje}%` }} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t.activeDiets}</CardTitle>
          </CardHeader>
          <CardContent>
            {dietStats.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t.noGuests}</p>
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
        {rooms.map(room => (
          <Card key={room.id}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <BedDouble className="w-4 h-4 text-primary" />
                  {room.nombre}
                </span>
                <Badge variant="outline" className="text-xs">{room.camas} {t.beds}</Badge>
              </CardTitle>
              {/* Última limpieza - solo admin y personal_albergue */}
              {canClean && (
              <div className="flex items-center gap-1.5 mt-1">
                <SprayCan className="w-3 h-3 text-muted-foreground shrink-0" />
                <Popover>
                  <PopoverTrigger asChild>
                     <button className="text-[10px] text-muted-foreground hover:text-foreground transition-colors underline decoration-dotted">
                      {room.ultimaLimpieza
                        ? (() => { try { return `${t.lastCleaning || 'Limpieza'}: ${format(new Date(room.ultimaLimpieza + 'T00:00:00'), 'dd/MM/yyyy')}`; } catch { return t.lastCleaning || 'Limpieza'; } })()
                        : (t.noCleaningRecorded || 'Sin registrar limpieza')}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={room.ultimaLimpieza ? new Date(room.ultimaLimpieza + 'T00:00:00') : undefined}
                      onSelect={(date) => {
                        if (date) {
                          const year = date.getFullYear();
                          const month = String(date.getMonth() + 1).padStart(2, '0');
                          const day = String(date.getDate()).padStart(2, '0');
                          const dateStr = `${year}-${month}-${day}`;
                          updateRoomCleaning(room.id, dateStr);
                        }
                      }}
                      disabled={(date) => date > new Date()}
                      locale={dateFnsLocale}
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
                {room.ultimaLimpieza && (() => {
                  try {
                  const days = differenceInDays(new Date(), new Date(room.ultimaLimpieza + 'T00:00:00'));
                  if (isNaN(days)) return null;
                  return (
                    <span className={cn(
                      "text-[10px] font-medium",
                      days <= 1 ? "text-[hsl(var(--success))]" : days <= 3 ? "text-primary" : days <= 7 ? "text-[hsl(38,92%,50%)]" : "text-destructive"
                    )}>
                      ({days === 0 ? (t.today || 'Hoy') : days === 1 ? (t.yesterday || 'Ayer') : `${t.ago || 'hace'} ${days}d`})
                    </span>
                  );
                  } catch { return null; }
                })()}
              </div>
              )}
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
                          <div className="opacity-70 mt-0.5">{t.bed} {cama}</div>
                          <div className="opacity-60 mt-0.5 text-[10px]">⏱ {duration}</div>
                          {hasFutureCheckout && (
                            <div className="text-[10px] opacity-60 mt-0.5">{t.exitDate}: {formatDateES(occupant.fechaCheckout)}</div>
                          )}
                        </div>
                      );
                    }
                    return (
                      <DropdownMenu key={cama}>
                        <DropdownMenuTrigger asChild>
                          <button className="bed-occupied rounded-lg p-3 text-left text-xs w-full relative group">
                            <div className="font-medium truncate pr-4">{occupant.nombre}</div>
                            <div className="opacity-70 mt-0.5">{t.bed} {cama}</div>
                            <div className="opacity-60 mt-0.5 text-[10px]">⏱ {duration}</div>
                            {hasFutureCheckout && (
                              <div className="text-[10px] opacity-60 mt-0.5">{t.exitDate}: {formatDateES(occupant.fechaCheckout)}</div>
                            )}
                            <MoreVertical className="w-3 h-3 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => setEditTarget(occupant.id)}>
                            {t.edit}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setCheckoutTarget(occupant.id); setCheckoutDate(new Date()); }} className="text-destructive">
                            {t.checkOut}
                          </DropdownMenuItem>
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger>{t.changeBed}</DropdownMenuSubTrigger>
                            <DropdownMenuSubContent className="max-h-60 overflow-y-auto">
                              {freeBeds.map(fb => (
                                <DropdownMenuItem key={`${fb.habitacion}-${fb.cama}`} onClick={() => cambiarCama(occupant.id, fb.habitacion, fb.cama)}>
                                  Hab {fb.habitacion} - {t.bed} {fb.cama}
                                </DropdownMenuItem>
                              ))}
                              {freeBeds.length === 0 && <DropdownMenuItem disabled>{t.noFreeBeds}</DropdownMenuItem>}
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => openDeleteConfirm(occupant.id)} className="text-destructive">
                            <AlertTriangle className="w-3 h-3 mr-1" /> {t.deleteWithoutRecord}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    );
                  }
                  if (!canManage) {
                    return (
                      <div key={cama} className="bed-free rounded-lg p-3 text-left text-xs opacity-70">
                        <div className="font-medium">{t.free}</div>
                        <div className="opacity-80 mt-0.5">{t.bed} {cama}</div>
                      </div>
                    );
                  }
                  return (
                    <button
                      key={cama}
                      onClick={() => setCheckInTarget({ habitacion: room.id, cama })}
                      className="bed-free rounded-lg p-3 text-left text-xs hover:opacity-90 transition-opacity"
                    >
                      <div className="font-medium">{t.checkIn}</div>
                      <div className="opacity-80 mt-0.5">{t.bed} {cama}</div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {checkInTarget && (
        <CheckInModal
          open={!!checkInTarget}
          onClose={() => setCheckInTarget(null)}
          title={`${t.checkIn}: Hab ${checkInTarget.habitacion} - ${t.bed} ${checkInTarget.cama}`}
          onSubmit={data => {
            checkIn({ ...data, habitacion: checkInTarget.habitacion, cama: checkInTarget.cama });
            setCheckInTarget(null);
          }}
        />
      )}

      {editingHuesped && (
        <CheckInModal
          open={!!editTarget}
          onClose={() => setEditTarget(null)}
          title={`${t.edit}: ${editingHuesped.nombre}`}
          submitLabel={t.saveChanges}
          showCheckout
          initialValues={{
            nombre: editingHuesped.nombre, nie: editingHuesped.nie,
            nacionalidad: editingHuesped.nacionalidad, idioma: editingHuesped.idioma,
            dieta: editingHuesped.dieta, fechaEntrada: editingHuesped.fechaEntrada, notas: editingHuesped.notas,
            fechaCheckout: editingHuesped.fechaCheckout || '',
          }}
          onSubmit={data => {
            const { fechaCheckout, ...rest } = data;
            editHuesped(editTarget!, rest);
            if (fechaCheckout) {
              checkOut(editTarget!, fechaCheckout);
            }
            setEditTarget(null);
          }}
        />
      )}

      <Dialog open={!!checkoutTarget} onOpenChange={() => setCheckoutTarget(null)}>
        <DialogContent className="max-w-sm" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>{t.checkoutDate}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t.selectExitDate}</Label>
              {checkoutHuesped && (
                <p className="text-sm text-muted-foreground">{t.futureCheckoutNote}</p>
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
                  {t.selectedDate}: <strong>{format(checkoutDate, 'dd-MM-yyyy')}</strong>
                  {format(checkoutDate, 'yyyy-MM-dd') > today && (
                    <span className="block text-xs text-primary mt-1">{t.guestWillStay}</span>
                  )}
                </p>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCheckoutTarget(null)}>{t.cancel}</Button>
              <Button variant="destructive" onClick={handleCheckoutConfirm}>{t.confirmCheckout}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={() => { setDeleteTarget(null); setDeleteStep(1); setDeleteConfirmText(''); }}>
        <DialogContent className="max-w-sm" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" /> {t.deleteWithoutRecord}
            </DialogTitle>
          </DialogHeader>
          {deleteStep === 1 ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{t.deleteWithoutRecordWarning}</p>
              {deleteHuespedData && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="font-medium text-sm">{deleteHuespedData.nombre}</p>
                  <p className="text-xs text-muted-foreground">Hab {deleteHuespedData.habitacion} - {t.bed} {deleteHuespedData.cama}</p>
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setDeleteTarget(null); setDeleteStep(1); }}>{t.cancel}</Button>
                <Button variant="destructive" onClick={() => setDeleteStep(2)}>{t.confirm}</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{t.deleteWithoutRecordConfirm}</p>
              <Input
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value)}
                placeholder="CONFIRMAR"
                className="border-destructive"
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setDeleteStep(1); setDeleteConfirmText(''); }}>{t.cancel}</Button>
                <Button
                  variant="destructive"
                  disabled={deleteConfirmText.toUpperCase() !== 'CONFIRMAR'}
                  onClick={handleDeleteWithoutRecord}
                >
                  {t.deleteWithoutRecordFinal}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

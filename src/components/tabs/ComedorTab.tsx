import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { UtensilsCrossed, Clock } from 'lucide-react';
import { UserRole } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useI18n } from '@/i18n/I18nContext';

interface Props {
  store: ReturnType<typeof import('@/hooks/useAlbergueStore').useAlbergueStore>;
  role: UserRole;
}

const SEPARAR_OPTIONS = ['Todas', 'Desayuno', 'Comida', 'Cena'];
const DIAS_OPTIONS = ['Todos los días', 'Laborables', 'Fines de semana', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const MOTIVO_OPTIONS = ['Accem', 'Empleo', 'Formación', 'Médico', 'Otros'];
const ESTADO_OPTIONS = ['Activo', 'Pausado'] as const;

const ROOM_COLORS: Record<string, string> = {
  '1.1': 'bg-[hsl(212,72%,90%)] text-[hsl(212,72%,35%)] border-[hsl(212,72%,75%)]',
  '1.2': 'bg-[hsl(142,60%,90%)] text-[hsl(142,60%,30%)] border-[hsl(142,60%,70%)]',
  '1.3': 'bg-[hsl(38,92%,90%)] text-[hsl(38,92%,30%)] border-[hsl(38,92%,70%)]',
  '2.1': 'bg-[hsl(280,60%,92%)] text-[hsl(280,60%,35%)] border-[hsl(280,60%,75%)]',
  '2.2': 'bg-[hsl(340,60%,92%)] text-[hsl(340,60%,35%)] border-[hsl(340,60%,75%)]',
  '2.3': 'bg-[hsl(180,50%,90%)] text-[hsl(180,50%,30%)] border-[hsl(180,50%,70%)]',
};

const DIET_COLORS: Record<string, string> = {
  'Omnívora estándar': 'bg-secondary text-secondary-foreground',
  'Halal': 'bg-[hsl(142,60%,90%)] text-[hsl(142,60%,30%)]',
  'Kosher': 'bg-[hsl(240,50%,92%)] text-[hsl(240,50%,35%)]',
  'Vegetariana': 'bg-[hsl(80,60%,90%)] text-[hsl(80,60%,30%)]',
  'Vegana': 'bg-[hsl(142,50%,88%)] text-[hsl(142,50%,25%)]',
  'Sin cerdo (no halal)': 'bg-[hsl(25,80%,90%)] text-[hsl(25,80%,30%)]',
  'Situación especial': 'bg-[hsl(38,92%,90%)] text-[hsl(38,92%,30%)]',
  'Alergias e intolerancias': 'bg-[hsl(0,72%,92%)] text-destructive',
};

function MultiCheckbox({ options, selected, onChange, label }: { options: string[]; selected: string[]; onChange: (val: string[]) => void; label: string }) {
  const toggleOption = (opt: string) => {
    if (opt === options[0]) { onChange([options[0]]); return; }
    const without = selected.filter(s => s !== options[0]);
    if (without.includes(opt)) {
      const next = without.filter(s => s !== opt);
      onChange(next.length === 0 ? [options[0]] : next);
    } else {
      onChange([...without, opt]);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="min-w-[120px] h-8 text-xs justify-start font-normal truncate">
          {selected.length === 1 && selected[0] === options[0] ? options[0] : selected.join(', ')}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2" align="start">
        <p className="text-xs font-medium text-muted-foreground mb-2">{label}</p>
        {options.map(opt => (
          <label key={opt} className="flex items-center gap-2 py-1 px-1 hover:bg-muted rounded cursor-pointer text-xs">
            <Checkbox checked={selected.includes(opt)} onCheckedChange={() => toggleOption(opt)} />
            {opt}
          </label>
        ))}
      </PopoverContent>
    </Popover>
  );
}

export default function ComedorTab({ store, role }: Props) {
  const { huespedActivos, comedor, updateComedor } = store;
  const { t } = useI18n();

  // All roles can edit comedor
  const canEdit = true;

  const entries = useMemo(() => {
    return huespedActivos
      .sort((a, b) => {
        const roomCmp = a.habitacion.localeCompare(b.habitacion);
        return roomCmp !== 0 ? roomCmp : a.cama - b.cama;
      })
      .map((h, idx) => {
        const entry = comedor.find(c => c.huespedId === h.id);
        return {
          num: idx + 1,
          huesped: h,
          comedor: entry || {
            huespedId: h.id, estado: 'Activo' as const,
            separarComidas: ['Todas'], diasSeparar: ['Todos los días'],
            motivoAusencia: '', observaciones: '', particularidades: '',
            ultimaModificacion: new Date().toISOString(),
          },
        };
      });
  }, [huespedActivos, comedor]);

  const handleUpdate = (huespedId: string, field: string, value: unknown) => {
    updateComedor(huespedId, { [field]: value } as Partial<import('@/types').ComedorEntry>);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-primary" /> {t.diningOrganization}
          </h2>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge variant="outline" className="text-xs">{entries.length} {t.diners}</Badge>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          {entries.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">{t.noActiveGuests}</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>{t.fullName}</TableHead>
                    <TableHead className="w-16">{t.roomShort}</TableHead>
                    <TableHead className="w-24">{t.status}</TableHead>
                    <TableHead>{t.dietType}</TableHead>
                    <TableHead>{t.foodParticularities}</TableHead>
                    <TableHead>{t.separateMeals}</TableHead>
                    <TableHead>{t.daysToSeparate}</TableHead>
                    <TableHead>{t.absenceReason}</TableHead>
                    <TableHead>{t.lastModification}</TableHead>
                    <TableHead>{t.observations}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map(({ num, huesped, comedor: c }) => {
                    const separarArr = Array.isArray(c.separarComidas) ? c.separarComidas : [c.separarComidas || 'Todas'];
                    const diasArr = Array.isArray(c.diasSeparar) ? c.diasSeparar : [c.diasSeparar || 'Todos los días'];
                    const estado = c.estado || 'Activo';
                    const lastMod = c.ultimaModificacion
                      ? formatDistanceToNow(new Date(c.ultimaModificacion), { addSuffix: true, locale: es })
                      : '—';

                    return (
                      <TableRow key={huesped.id}>
                        <TableCell className="text-muted-foreground text-xs">{num}</TableCell>
                        <TableCell className="font-medium whitespace-nowrap">{huesped.nombre.toUpperCase()}</TableCell>
                        <TableCell>
                          <Badge className={`text-xs font-bold border ${ROOM_COLORS[huesped.habitacion] || ''}`} variant="outline">
                            {huesped.habitacion}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {canEdit ? (
                            <Select value={estado} onValueChange={v => handleUpdate(huesped.id, 'estado', v)}>
                              <SelectTrigger className="h-8 text-xs w-24 p-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {ESTADO_OPTIONS.map(o => (
                                  <SelectItem key={o} value={o}>
                                    <span className={o === 'Pausado' ? 'text-destructive font-medium' : 'text-[hsl(142,60%,30%)] font-medium'}>
                                      {o === 'Activo' ? t.active : t.paused}
                                    </span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge className={estado === 'Pausado'
                              ? 'bg-[hsl(0,72%,92%)] text-destructive text-xs'
                              : 'bg-[hsl(142,60%,90%)] text-[hsl(142,60%,30%)] text-xs'
                            }>
                              {estado === 'Activo' ? t.active : t.paused}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={`text-xs ${DIET_COLORS[huesped.dieta] || 'bg-secondary text-secondary-foreground'}`} variant="secondary">
                            {huesped.dieta}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Input
                            className="min-w-[160px] h-8 text-xs"
                            value={c.particularidades}
                            onChange={e => handleUpdate(huesped.id, 'particularidades', e.target.value)}
                            placeholder={t.foodPlaceholder}
                            readOnly={!canEdit}
                          />
                        </TableCell>
                        <TableCell>
                          <MultiCheckbox options={SEPARAR_OPTIONS} selected={separarArr} onChange={v => handleUpdate(huesped.id, 'separarComidas', v)} label={t.separateMeals} />
                        </TableCell>
                        <TableCell>
                          <MultiCheckbox options={DIAS_OPTIONS} selected={diasArr} onChange={v => handleUpdate(huesped.id, 'diasSeparar', v)} label={t.daysToSeparate} />
                        </TableCell>
                        <TableCell>
                          <Select value={c.motivoAusencia || 'none'} onValueChange={v => handleUpdate(huesped.id, 'motivoAusencia', v === 'none' ? '' : v)}>
                            <SelectTrigger className="min-w-[110px] h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">—</SelectItem>
                              {MOTIVO_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {lastMod}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Input
                            className="min-w-[140px] h-8 text-xs"
                            value={c.observaciones}
                            onChange={e => handleUpdate(huesped.id, 'observaciones', e.target.value)}
                            placeholder={t.observationsPlaceholder}
                            readOnly={!canEdit}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

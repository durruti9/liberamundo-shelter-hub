import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { UtensilsCrossed, RefreshCw, Copy, CalendarDays } from 'lucide-react';
import { getCurrentWeek } from '@/hooks/useAlbergueStore';

interface Props {
  store: ReturnType<typeof import('@/hooks/useAlbergueStore').useAlbergueStore>;
}

const SEPARAR_OPTIONS = ['Todas', 'Desayuno', 'Comida', 'Cena'];
const DIAS_OPTIONS = ['Todos los días', 'Laborables', 'Fines de semana', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const MOTIVO_OPTIONS = ['Accem', 'Empleo', 'Formación', 'Médico', 'Otros'];

const ROOM_COLORS: Record<string, string> = {
  '1.1': 'bg-blue-100 text-blue-800 border-blue-300',
  '1.2': 'bg-green-100 text-green-800 border-green-300',
  '1.3': 'bg-amber-100 text-amber-800 border-amber-300',
  '2.1': 'bg-purple-100 text-purple-800 border-purple-300',
  '2.2': 'bg-pink-100 text-pink-800 border-pink-300',
  '2.3': 'bg-teal-100 text-teal-800 border-teal-300',
};

const DIET_COLORS: Record<string, string> = {
  'Omnívora estándar': 'bg-secondary text-secondary-foreground',
  'Halal': 'bg-emerald-100 text-emerald-800',
  'Kosher': 'bg-indigo-100 text-indigo-800',
  'Vegetariana': 'bg-lime-100 text-lime-800',
  'Vegana': 'bg-green-100 text-green-800',
  'Sin cerdo (no halal)': 'bg-orange-100 text-orange-800',
  'Situación especial': 'bg-amber-100 text-amber-800',
  'Alergias e intolerancias': 'bg-red-100 text-red-800',
};

export default function ComedorTab({ store }: Props) {
  const { huespedActivos, comedor, updateComedor, nuevaSemana } = store;
  const semana = getCurrentWeek();

  const entries = useMemo(() => {
    return huespedActivos
      .sort((a, b) => {
        const roomCmp = a.habitacion.localeCompare(b.habitacion);
        return roomCmp !== 0 ? roomCmp : a.cama - b.cama;
      })
      .map((h, idx) => {
        const entry = comedor.find(c => c.huespedId === h.id && c.semana === semana);
        return {
          num: idx + 1,
          huesped: h,
          comedor: entry || {
            huespedId: h.id, semana, separarComidas: 'Todas',
            diasSeparar: 'Todos los días', motivoAusencia: '', observaciones: '', particularidades: '',
          },
        };
      });
  }, [huespedActivos, comedor, semana]);

  const handleUpdate = (huespedId: string, field: string, value: string) => {
    updateComedor(huespedId, semana, { [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-primary" /> Comedor — Organización de Comidas
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <CalendarDays className="w-4 h-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground font-medium">Semana: {semana}</p>
            <Badge variant="outline" className="text-xs">{entries.length} comensales</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={nuevaSemana}>
            <RefreshCw className="w-4 h-4 mr-2" /> Nueva semana
          </Button>
          <Button variant="outline" size="sm" onClick={nuevaSemana}>
            <Copy className="w-4 h-4 mr-2" /> Copiar anterior
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          {entries.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No hay huéspedes activos</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>Nombre Completo</TableHead>
                    <TableHead className="w-16">Hab.</TableHead>
                    <TableHead className="w-20">Estado</TableHead>
                    <TableHead>Tipo de Dieta</TableHead>
                    <TableHead>Particularidades Alimentarias</TableHead>
                    <TableHead>Separar Comidas</TableHead>
                    <TableHead>Días a Separar</TableHead>
                    <TableHead>Motivo Ausencia</TableHead>
                    <TableHead>Semana</TableHead>
                    <TableHead>Observaciones de la semana</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map(({ num, huesped, comedor: c }) => (
                    <TableRow key={huesped.id}>
                      <TableCell className="text-muted-foreground text-xs">{num}</TableCell>
                      <TableCell className="font-medium whitespace-nowrap">{huesped.nombre.toUpperCase()}</TableCell>
                      <TableCell>
                        <Badge className={`text-xs font-bold border ${ROOM_COLORS[huesped.habitacion] || ''}`} variant="outline">
                          {huesped.habitacion}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-800 text-xs">Activo</Badge>
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
                          placeholder="Alimentación preferiblemente..."
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={c.separarComidas || 'Todas'}
                          onValueChange={v => handleUpdate(huesped.id, 'separarComidas', v)}
                        >
                          <SelectTrigger className="min-w-[100px] h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {SEPARAR_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select value={c.diasSeparar || 'Todos los días'} onValueChange={v => handleUpdate(huesped.id, 'diasSeparar', v)}>
                          <SelectTrigger className="min-w-[130px] h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {DIAS_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                          </SelectContent>
                        </Select>
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
                      <TableCell className="text-xs whitespace-nowrap text-muted-foreground">{semana.split(' a ')[0]}</TableCell>
                      <TableCell>
                        <Input
                          className="min-w-[140px] h-8 text-xs"
                          value={c.observaciones}
                          onChange={e => handleUpdate(huesped.id, 'observaciones', e.target.value)}
                          placeholder="Ramadán, etc."
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

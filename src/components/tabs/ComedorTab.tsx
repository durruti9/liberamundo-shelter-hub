import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { UtensilsCrossed, RefreshCw, Copy } from 'lucide-react';
import { getCurrentWeek } from '@/hooks/useAlbergueStore';

interface Props {
  store: ReturnType<typeof import('@/hooks/useAlbergueStore').useAlbergueStore>;
}

const SEPARAR_OPTIONS = ['Todas', 'Desayuno', 'Comida', 'Cena'];
const DIAS_OPTIONS = ['Todos', 'Laborables', 'Fines semana', 'L-V'];
const MOTIVO_OPTIONS = ['', 'Accem', 'Empleo', 'Formación', 'Médico', 'Otros'];

export default function ComedorTab({ store }: Props) {
  const { huespedActivos, comedor, updateComedor, nuevaSemana } = store;
  const semana = getCurrentWeek();

  const entries = useMemo(() => {
    return huespedActivos.map(h => {
      const entry = comedor.find(c => c.huespedId === h.id && c.semana === semana);
      return {
        huesped: h,
        comedor: entry || {
          huespedId: h.id, semana, separarComidas: ['Todas'],
          dias: 'Todos', motivoAusencia: '', observaciones: '', particularidades: '',
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
            <UtensilsCrossed className="w-5 h-5 text-primary" /> Comedor
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Semana: {semana}</p>
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
                    <TableHead>Nombre</TableHead>
                    <TableHead>Hab.</TableHead>
                    <TableHead>Dieta</TableHead>
                    <TableHead>Particularidades</TableHead>
                    <TableHead>Comidas</TableHead>
                    <TableHead>Días</TableHead>
                    <TableHead>Motivo ausencia</TableHead>
                    <TableHead>Observaciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map(({ huesped, comedor: c }) => (
                    <TableRow key={huesped.id}>
                      <TableCell className="font-medium whitespace-nowrap">{huesped.nombre}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs whitespace-nowrap">
                          {huesped.habitacion}-C{huesped.cama}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{huesped.dieta}</TableCell>
                      <TableCell>
                        <Input
                          className="min-w-[120px] h-8 text-xs"
                          value={c.particularidades}
                          onChange={e => handleUpdate(huesped.id, 'particularidades', e.target.value)}
                          placeholder="—"
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={c.separarComidas?.[0] || 'Todas'}
                          onValueChange={v => handleUpdate(huesped.id, 'separarComidas', v)}
                        >
                          <SelectTrigger className="min-w-[100px] h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {SEPARAR_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select value={c.dias} onValueChange={v => handleUpdate(huesped.id, 'dias', v)}>
                          <SelectTrigger className="min-w-[110px] h-8 text-xs"><SelectValue /></SelectTrigger>
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
                            {MOTIVO_OPTIONS.filter(Boolean).map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          className="min-w-[120px] h-8 text-xs"
                          value={c.observaciones}
                          onChange={e => handleUpdate(huesped.id, 'observaciones', e.target.value)}
                          placeholder="—"
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

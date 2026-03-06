import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, History } from 'lucide-react';

interface Props {
  store: ReturnType<typeof import('@/hooks/useAlbergueStore').useAlbergueStore>;
}

export default function HistorialTab({ store }: Props) {
  const { huespedes } = store;

  const sorted = [...huespedes].sort((a, b) => b.fechaEntrada.localeCompare(a.fechaEntrada));

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

  return (
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
                    <TableCell>{h.dieta}</TableCell>
                    <TableCell>
                      <Badge variant={h.activo ? 'default' : 'secondary'}>
                        {h.activo ? 'Activo' : 'Histórico'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

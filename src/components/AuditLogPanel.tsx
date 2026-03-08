import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { History, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';

interface AuditEntry {
  id: string;
  empleado_id: string;
  empleado_nombre: string;
  fecha_registro: string;
  campo_modificado: string;
  valor_anterior: string;
  valor_nuevo: string;
  modificado_por: string;
  created_at: string;
}

interface Props {
  albergueId: string;
  empleados: { id: string; nombre_completo: string }[];
}

export default function AuditLogPanel({ albergueId, empleados }: Props) {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterEmpleado, setFilterEmpleado] = useState('all');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 15;

  const loadEntries = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getAuditoria(albergueId);
      setEntries(data);
    } catch {
      // API not available
    }
    setLoading(false);
  }, [albergueId]);

  useEffect(() => { loadEntries(); }, [loadEntries]);

  const filtered = filterEmpleado === 'all'
    ? entries
    : entries.filter(e => e.empleado_id === filterEmpleado);

  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('es-ES', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    } catch { return dateStr; }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <History className="w-4 h-4" /> Historial de auditoría
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={filterEmpleado} onValueChange={v => { setFilterEmpleado(v); setPage(0); }}>
              <SelectTrigger className="w-40 h-8 text-xs">
                <SelectValue placeholder="Filtrar empleado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {empleados.map(e => (
                  <SelectItem key={e.id} value={e.id}>{e.nombre_completo}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={loadEntries} disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {paged.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">Sin registros de auditoría</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Fecha</TableHead>
                    <TableHead className="text-xs">Empleado</TableHead>
                    <TableHead className="text-xs">Día registro</TableHead>
                    <TableHead className="text-xs">Cambio</TableHead>
                    <TableHead className="text-xs">Anterior</TableHead>
                    <TableHead className="text-xs">Nuevo</TableHead>
                    <TableHead className="text-xs">Modificado por</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.map(entry => (
                    <TableRow key={entry.id}>
                      <TableCell className="text-xs">{formatDate(entry.created_at)}</TableCell>
                      <TableCell className="text-xs font-medium">{entry.empleado_nombre}</TableCell>
                      <TableCell className="text-xs">{entry.fecha_registro}</TableCell>
                      <TableCell className="text-xs">
                        <Badge variant="outline" className="text-[10px]">{entry.campo_modificado}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{entry.valor_anterior || '—'}</TableCell>
                      <TableCell className="text-xs">{entry.valor_nuevo || '—'}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{entry.modificado_por}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 p-3 border-t">
                <Button size="icon" variant="ghost" className="h-7 w-7" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-xs text-muted-foreground">{page + 1} / {totalPages}</span>
                <Button size="icon" variant="ghost" className="h-7 w-7" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

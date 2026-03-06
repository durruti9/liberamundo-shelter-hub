import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Check, Trash2, FileWarning } from 'lucide-react';
import { UserRole, IncidentType } from '@/types';
import { formatDateES } from '@/lib/dateFormat';
import { useI18n } from '@/i18n/I18nContext';

interface Props {
  store: ReturnType<typeof import('@/hooks/useAlbergueStore').useAlbergueStore>;
  role: UserRole;
}

const INCIDENT_TYPES: IncidentType[] = ['behavioral', 'medical', 'administrative', 'social', 'other'];

const TYPE_COLORS: Record<IncidentType, string> = {
  behavioral: 'bg-[hsl(38,92%,90%)] text-[hsl(38,92%,30%)]',
  medical: 'bg-[hsl(0,72%,92%)] text-destructive',
  administrative: 'bg-[hsl(212,72%,90%)] text-[hsl(212,72%,35%)]',
  social: 'bg-[hsl(142,60%,90%)] text-[hsl(142,60%,30%)]',
  other: 'bg-secondary text-secondary-foreground',
};

export default function IncidenciasTab({ store, role }: Props) {
  const { incidencias, huespedActivos, huespedes, addIncidencia, toggleIncidenciaResuelta, deleteIncidencia } = store;
  const { t } = useI18n();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    huespedId: '', tipo: 'other' as IncidentType, descripcion: '', fecha: new Date().toISOString().split('T')[0],
  });

  // Anyone can create incidents; only admin/gestor can resolve/delete
  const canResolve = role === 'admin' || role === 'gestor';

  const sorted = [...incidencias].sort((a, b) => b.fecha.localeCompare(a.fecha));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.huespedId || !form.descripcion.trim()) return;
    const huesped = huespedes.find(h => h.id === form.huespedId);
    addIncidencia({
      huespedId: form.huespedId,
      huespedNombre: huesped?.nombre || '',
      tipo: form.tipo,
      descripcion: form.descripcion,
      fecha: form.fecha,
      resuelta: false,
      creadoPor: role,
    });
    setForm({ huespedId: '', tipo: 'other', descripcion: '', fecha: new Date().toISOString().split('T')[0] });
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <FileWarning className="w-5 h-5 text-primary" /> {t.incidentRegistry}
        </h2>
        {/* All roles can create incidents */}
        <Button onClick={() => setShowForm(true)}>{t.newIncident}</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold">{incidencias.length}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold text-[hsl(38,92%,50%)]">{incidencias.filter(i => !i.resuelta).length}</div>
            <div className="text-xs text-muted-foreground">{t.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold text-[hsl(var(--success))]">{incidencias.filter(i => i.resuelta).length}</div>
            <div className="text-xs text-muted-foreground">{t.resolved}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          {sorted.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">{t.noIncidents}</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.incidentDate}</TableHead>
                    <TableHead>{t.incidentGuest}</TableHead>
                    <TableHead>{t.incidentType}</TableHead>
                    <TableHead>{t.incidentDescription}</TableHead>
                    <TableHead>{t.status}</TableHead>
                    {canResolve && <TableHead className="text-right">{t.actions}</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sorted.map(inc => (
                    <TableRow key={inc.id} className={inc.resuelta ? 'opacity-60' : ''}>
                      <TableCell className="whitespace-nowrap text-sm">{formatDateES(inc.fecha)}</TableCell>
                      <TableCell className="font-medium">{inc.huespedNombre}</TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${TYPE_COLORS[inc.tipo]}`} variant="secondary">
                          {t.incidentTypes[inc.tipo]}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[300px]">
                        <p className="text-sm truncate">{inc.descripcion}</p>
                      </TableCell>
                      <TableCell>
                        <Badge className={inc.resuelta
                          ? 'bg-[hsl(142,60%,90%)] text-[hsl(142,60%,30%)] text-xs'
                          : 'bg-[hsl(38,92%,90%)] text-[hsl(38,92%,30%)] text-xs'
                        }>
                          {inc.resuelta ? t.resolved : t.pending}
                        </Badge>
                      </TableCell>
                      {canResolve && (
                        <TableCell className="text-right space-x-1">
                          <Button size="sm" variant="outline" onClick={() => toggleIncidenciaResuelta(inc.id)} title={t.toggleResolved}>
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => deleteIncidencia(inc.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* New incident form */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t.newIncident}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t.incidentGuest} *</Label>
                <Select value={form.huespedId} onValueChange={v => setForm(p => ({ ...p, huespedId: v }))}>
                  <SelectTrigger><SelectValue placeholder="..." /></SelectTrigger>
                  <SelectContent>
                    {huespedActivos.map(h => (
                      <SelectItem key={h.id} value={h.id}>{h.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t.incidentType}</Label>
                <Select value={form.tipo} onValueChange={v => setForm(p => ({ ...p, tipo: v as IncidentType }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {INCIDENT_TYPES.map(tp => (
                      <SelectItem key={tp} value={tp}>{t.incidentTypes[tp]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t.incidentDate}</Label>
                <Input type="date" value={form.fecha} onChange={e => setForm(p => ({ ...p, fecha: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t.incidentDescription} *</Label>
              <Textarea value={form.descripcion} onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))} rows={4} required />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>{t.cancel}</Button>
              <Button type="submit">{t.save}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

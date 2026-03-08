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
import { Switch } from '@/components/ui/switch';
import { Check, Trash2, FileWarning, Building2 } from 'lucide-react';
import { UserRole, IncidentType } from '@/types';
import { formatDateES } from '@/lib/dateFormat';
import { useI18n } from '@/i18n/I18nContext';

interface Props {
  store: ReturnType<typeof import('@/hooks/useAlbergueStore').useAlbergueStore>;
  role: UserRole;
}

const INCIDENT_TYPES: IncidentType[] = ['behavioral', 'medical', 'administrative', 'social', 'general', 'other'];

const TYPE_COLORS: Record<IncidentType, string> = {
  behavioral: 'bg-[hsl(38,92%,90%)] text-[hsl(38,92%,30%)]',
  medical: 'bg-[hsl(0,72%,92%)] text-destructive',
  administrative: 'bg-[hsl(212,72%,90%)] text-[hsl(212,72%,35%)]',
  social: 'bg-[hsl(142,60%,90%)] text-[hsl(142,60%,30%)]',
  general: 'bg-[hsl(270,60%,90%)] text-[hsl(270,60%,30%)]',
  other: 'bg-secondary text-secondary-foreground',
};

export default function IncidenciasTab({ store, role }: Props) {
  const { incidencias, huespedActivos, huespedes, addIncidencia, toggleIncidenciaResuelta, deleteIncidencia } = store;
  const { t } = useI18n();
  const [showForm, setShowForm] = useState(false);
  const [isGeneral, setIsGeneral] = useState(false);
  const [form, setForm] = useState({
    huespedId: '', tipo: 'other' as IncidentType, descripcion: '', fecha: new Date().toISOString().split('T')[0],
  });

  const canResolve = role === 'admin' || role === 'gestor';
  const sorted = [...incidencias].sort((a, b) => b.fecha.localeCompare(a.fecha));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isGeneral && !form.huespedId) return;
    if (!form.descripcion.trim()) return;
    const huesped = !isGeneral ? huespedes.find(h => h.id === form.huespedId) : null;
    try {
      await addIncidencia({
        huespedId: isGeneral ? '' : form.huespedId,
        huespedNombre: isGeneral ? (t.generalIncidentLabel || 'General') : (huesped?.nombre || ''),
        tipo: isGeneral ? 'general' : form.tipo,
        descripcion: form.descripcion,
        fecha: form.fecha,
        resuelta: false,
        creadoPor: role,
      });
      setForm({ huespedId: '', tipo: 'other', descripcion: '', fecha: new Date().toISOString().split('T')[0] });
      setIsGeneral(false);
      setShowForm(false);
    } catch (err: any) {
      toast.error(err.message || 'Error al crear incidencia');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <FileWarning className="w-5 h-5 text-primary" /> {t.incidentRegistry}
        </h2>
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
                      <TableCell className="font-medium">
                        {!inc.huespedId ? (
                          <span className="flex items-center gap-1 text-[hsl(270,60%,40%)]">
                            <Building2 className="w-3.5 h-3.5" />
                            {inc.huespedNombre}
                          </span>
                        ) : inc.huespedNombre}
                      </TableCell>
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
                          <Button size="sm" variant="outline" onClick={async () => {
                            try { await toggleIncidenciaResuelta(inc.id); } catch (err: any) { toast.error(err.message || 'Error'); }
                          }} title={t.toggleResolved}>
                             <Check className="w-4 h-4" />
                           </Button>
                           <Button size="sm" variant="ghost" onClick={async () => {
                            try { await deleteIncidencia(inc.id); } catch (err: any) { toast.error(err.message || 'Error al eliminar'); }
                          }}>
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
        <DialogContent className="max-w-lg" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>{t.newIncident}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* General incident toggle */}
            <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
              <Switch checked={isGeneral} onCheckedChange={setIsGeneral} />
              <div>
                <p className="text-sm font-medium flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-[hsl(270,60%,40%)]" />
                  {t.generalIncident || 'Incidencia general (edificio/albergue)'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {!isGeneral && (
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
              )}
              {!isGeneral && (
                <div className="space-y-2">
                  <Label>{t.incidentType}</Label>
                  <Select value={form.tipo} onValueChange={v => setForm(p => ({ ...p, tipo: v as IncidentType }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {INCIDENT_TYPES.filter(tp => tp !== 'general').map(tp => (
                        <SelectItem key={tp} value={tp}>{t.incidentTypes[tp]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
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

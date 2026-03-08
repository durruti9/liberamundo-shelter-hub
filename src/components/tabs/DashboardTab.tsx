import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BedDouble, Users, Clock, AlertTriangle, TrendingUp, CalendarPlus, MessageSquarePlus, ListChecks } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useI18n } from '@/i18n/I18nContext';
import { formatDateES } from '@/lib/dateFormat';
import BoardPanel from '@/components/BoardPanel';
import { UserRole } from '@/types';
import { api } from '@/lib/api';

interface Props {
  store: ReturnType<typeof import('@/hooks/useAlbergueStore').useAlbergueStore>;
  role?: UserRole;
}

const COLORS = [
  'hsl(212, 72%, 59%)', 'hsl(142, 60%, 45%)', 'hsl(38, 92%, 55%)',
  'hsl(280, 60%, 55%)', 'hsl(340, 60%, 55%)', 'hsl(180, 50%, 45%)',
  'hsl(25, 80%, 55%)', 'hsl(0, 72%, 55%)',
];

export default function DashboardTab({ store, role = 'personal_albergue' }: Props) {
  const { huespedActivos, huespedes, totalCamas, incidencias, llegadas, boardMessages, addBoardMessage, addBoardReply, resolveBoardMessage, deleteBoardMessage } = store;
  const { t } = useI18n();
  const isAdmin = role === 'admin';

  // Pending suggestions count (admin only)
  const [pendingSugerencias, setPendingSugerencias] = useState(0);
  const [pendingTareas, setPendingTareas] = useState(0);

  useEffect(() => {
    const alId = store.currentAlbergue?.id || 'default';

    if (isAdmin) {
      api.getSugerencias(alId)
        .then(data => {
          if (Array.isArray(data)) {
            setPendingSugerencias(data.filter((s: any) => !s.respuesta).length);
          } else {
            const local = JSON.parse(localStorage.getItem(`sugerencias_${alId}`) || '[]');
            setPendingSugerencias(local.filter((s: any) => !s.respuesta).length);
          }
        })
        .catch(() => {
          const local = JSON.parse(localStorage.getItem(`sugerencias_${alId}`) || '[]');
          setPendingSugerencias(local.filter((s: any) => !s.respuesta).length);
        });
    }

    // Today's pending tasks
    const today = new Date().toISOString().split('T')[0];
    api.getTareasDia(alId, today, today)
      .then(data => {
        if (Array.isArray(data)) {
          setPendingTareas(data.filter((t: any) => t.estado === 'pendiente').length);
        }
      })
      .catch(() => {});
  }, [isAdmin, store.currentAlbergue?.id]);

  const ocupadas = huespedActivos.length;
  const libres = totalCamas - ocupadas;
  const porcentaje = totalCamas > 0 ? Math.round((ocupadas / totalCamas) * 100) : 0;

  const avgStay = useMemo(() => {
    if (huespedActivos.length === 0) return 0;
    const today = new Date();
    const total = huespedActivos.reduce((acc, h) => {
      const entry = new Date(h.fechaEntrada);
      const diff = Math.max(1, Math.ceil((today.getTime() - entry.getTime()) / (1000 * 60 * 60 * 24)));
      return acc + diff;
    }, 0);
    return Math.round(total / huespedActivos.length);
  }, [huespedActivos]);

  const upcomingCheckouts = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const twoWeeks = new Date();
    twoWeeks.setDate(twoWeeks.getDate() + 14);
    const limit = twoWeeks.toISOString().split('T')[0];
    return huespedActivos
      .filter(h => h.fechaCheckout && h.fechaCheckout >= today && h.fechaCheckout <= limit)
      .sort((a, b) => (a.fechaCheckout || '').localeCompare(b.fechaCheckout || ''))
      .slice(0, 8);
  }, [huespedActivos]);

  const upcomingArrivals = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const twoWeeks = new Date();
    twoWeeks.setDate(twoWeeks.getDate() + 14);
    const limit = twoWeeks.toISOString().split('T')[0];
    return llegadas
      .filter(l => l.fechaLlegada >= today && l.fechaLlegada <= limit)
      .sort((a, b) => a.fechaLlegada.localeCompare(b.fechaLlegada))
      .slice(0, 8);
  }, [llegadas]);

  const dietData = useMemo(() => {
    const counts: Record<string, number> = {};
    huespedActivos.forEach(h => { counts[h.dieta] = (counts[h.dieta] || 0) + 1; });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [huespedActivos]);

  const monthlyData = useMemo(() => {
    const months: { month: string; count: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('es', { month: 'short', year: '2-digit' });
      const count = huespedes.filter(h => h.fechaEntrada.startsWith(key)).length;
      months.push({ month: label, count });
    }
    return months;
  }, [huespedes]);

  const activeIncidentCount = useMemo(() => incidencias.filter(i => !i.resuelta).length, [incidencias]);

  const daysUntil = (date: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(date + 'T00:00:00');
    return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-primary" /> {t.dashboard}
      </h2>

      {/* KPI Cards */}
      <div className={`grid gap-4 grid-cols-2 ${isAdmin ? 'md:grid-cols-6' : 'md:grid-cols-5'}`}>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-primary">{porcentaje}%</div>
            <p className="text-xs text-muted-foreground mt-1">{t.occupancyRate}</p>
            <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${porcentaje}%` }} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="flex items-center justify-center gap-2">
              <BedDouble className="w-5 h-5 text-muted-foreground" />
              <span className="text-3xl font-bold">{ocupadas}</span>
              <span className="text-muted-foreground text-lg">/ {totalCamas}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{t.occupiedBeds} / {t.totalBeds}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="flex items-center justify-center gap-2">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <span className="text-3xl font-bold">{avgStay}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{t.avgStayDays}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="flex items-center justify-center gap-2">
              <AlertTriangle className={`w-5 h-5 ${activeIncidentCount > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
              <span className={`text-3xl font-bold ${activeIncidentCount > 0 ? 'text-destructive' : ''}`}>{activeIncidentCount}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{t.activeIncidents}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="flex items-center justify-center gap-2">
              <ListChecks className={`w-5 h-5 ${pendingTareas > 0 ? 'text-warning' : 'text-muted-foreground'}`} />
              <span className={`text-3xl font-bold ${pendingTareas > 0 ? 'text-warning' : ''}`}>{pendingTareas}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Tareas pendientes hoy</p>
          </CardContent>
        </Card>
        {isAdmin && (
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="flex items-center justify-center gap-2">
                <MessageSquarePlus className={`w-5 h-5 ${pendingSugerencias > 0 ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className={`text-3xl font-bold ${pendingSugerencias > 0 ? 'text-primary' : ''}`}>{pendingSugerencias}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Sugerencias pendientes</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t.dietDistribution}</CardTitle>
          </CardHeader>
          <CardContent>
            {dietData.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">{t.noActiveGuests}</p>
            ) : (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={180}>
                  <PieChart>
                    <Pie data={dietData} dataKey="value" cx="50%" cy="50%" outerRadius={70} strokeWidth={2}>
                      {dietData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-1.5">
                  {dietData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-2 text-xs">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="truncate">{d.name}</span>
                      <span className="ml-auto font-medium">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t.guestsOverTime}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(212, 72%, 59%)" radius={[4, 4, 0, 0]} name={t.guestsOverTime} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Board Panels - Instructions & Requests (below charts) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <BoardPanel
          title={t.instructions}
          icon="instructions"
          tipo="instrucciones"
          messages={boardMessages}
          role={role}
          onAdd={addBoardMessage}
          onReply={addBoardReply}
          onResolve={resolveBoardMessage}
          onDelete={deleteBoardMessage}
        />
        <BoardPanel
          title={t.requests}
          icon="requests"
          tipo="peticiones"
          messages={boardMessages}
          role={role}
          onAdd={addBoardMessage}
          onReply={addBoardReply}
          onResolve={resolveBoardMessage}
          onDelete={deleteBoardMessage}
        />
      </div>

      {/* Upcoming checkouts & arrivals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="w-4 h-4" /> {t.upcomingCheckouts}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingCheckouts.length === 0 ? (
              <p className="text-center text-muted-foreground py-4 text-sm">{t.noUpcomingCheckouts}</p>
            ) : (
              <div className="space-y-2">
                {upcomingCheckouts.map(h => {
                  const days = daysUntil(h.fechaCheckout!);
                  return (
                    <div key={h.id} className="p-3 rounded-lg border bg-card flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm truncate">{h.nombre}</p>
                        <p className="text-xs text-muted-foreground">Hab {h.habitacion} - Cama {h.cama}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-muted-foreground">{formatDateES(h.fechaCheckout!)}</span>
                        <Badge variant={days <= 1 ? 'destructive' : days <= 3 ? 'secondary' : 'outline'} className="text-xs ml-2">
                          {days === 0 ? 'Hoy' : `${days}d`}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <CalendarPlus className="w-4 h-4" /> {t.upcomingArrivalsBoard}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingArrivals.length === 0 ? (
              <p className="text-center text-muted-foreground py-4 text-sm">{t.noArrivals}</p>
            ) : (
              <div className="space-y-2">
                {upcomingArrivals.map(l => {
                  const days = daysUntil(l.fechaLlegada);
                  return (
                    <div key={l.id} className="p-3 rounded-lg border bg-card flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm truncate">{l.nombre}</p>
                        <p className="text-xs text-muted-foreground">
                          {l.habitacionAsignada ? `Hab ${l.habitacionAsignada} - Cama ${l.camaAsignada}` : t.unassigned}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-muted-foreground">{formatDateES(l.fechaLlegada)}</span>
                        <Badge variant={days <= 1 ? 'destructive' : days <= 3 ? 'secondary' : 'outline'} className="text-xs ml-2">
                          {days === 0 ? 'Hoy' : `${days}d`}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
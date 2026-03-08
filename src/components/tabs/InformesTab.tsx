import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { BarChart3, Users, TrendingUp, Globe, Clock, BedDouble, UtensilsCrossed } from 'lucide-react';
import { UserRole } from '@/types';

interface Props {
  store: ReturnType<typeof import('@/hooks/useAlbergueStore').useAlbergueStore>;
  role: UserRole;
}

const COLORS = [
  'hsl(212, 72%, 59%)', 'hsl(142, 60%, 45%)', 'hsl(38, 92%, 55%)',
  'hsl(280, 60%, 55%)', 'hsl(340, 60%, 55%)', 'hsl(180, 50%, 45%)',
  'hsl(25, 80%, 55%)', 'hsl(0, 72%, 55%)', 'hsl(160, 50%, 45%)',
  'hsl(220, 60%, 65%)', 'hsl(50, 80%, 50%)', 'hsl(300, 40%, 55%)',
];

export default function InformesTab({ store }: Props) {
  const { huespedes, huespedActivos, totalCamas, incidencias, rooms, comedor } = store;
  const [period, setPeriod] = useState<'3m' | '6m' | '12m'>('6m');

  // --- Occupancy over time ---
  const occupancyData = useMemo(() => {
    const months = period === '3m' ? 3 : period === '6m' ? 6 : 12;
    const data: { mes: string; ocupacion: number; entradas: number; salidas: number }[] = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = d.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

      const activeInMonth = huespedes.filter(h => {
        const entry = h.fechaEntrada;
        const exit = h.fechaCheckout || (h.activo ? '9999-12-31' : h.fechaEntrada);
        const monthStart = `${monthKey}-01`;
        const monthEnd = `${monthKey}-31`;
        return entry <= monthEnd && exit >= monthStart;
      }).length;

      const entradas = huespedes.filter(h => h.fechaEntrada.startsWith(monthKey)).length;
      const salidas = huespedes.filter(h => h.fechaCheckout?.startsWith(monthKey) && !h.activo).length;

      data.push({ mes: monthStr, ocupacion: totalCamas > 0 ? Math.round((activeInMonth / totalCamas) * 100) : 0, entradas, salidas });
    }
    return data;
  }, [huespedes, totalCamas, period]);

  // --- Nationality distribution ---
  const nationalityData = useMemo(() => {
    const counts: Record<string, number> = {};
    huespedes.forEach(h => {
      const nat = h.nacionalidad || 'Sin especificar';
      counts[nat] = (counts[nat] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([name, value]) => ({ name, value }));
  }, [huespedes]);

  // --- Average stay ---
  const avgStay = useMemo(() => {
    const completed = huespedes.filter(h => !h.activo && h.fechaCheckout);
    if (completed.length === 0) return 0;
    const total = completed.reduce((acc, h) => {
      const entry = new Date(h.fechaEntrada);
      const exit = new Date(h.fechaCheckout!);
      return acc + Math.max(1, Math.round((exit.getTime() - entry.getTime()) / 86400000));
    }, 0);
    return Math.round(total / completed.length);
  }, [huespedes]);

  // --- Diet distribution ---
  const dietData = useMemo(() => {
    const counts: Record<string, number> = {};
    huespedActivos.forEach(h => {
      counts[h.dieta] = (counts[h.dieta] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));
  }, [huespedActivos]);

  // --- Incident stats ---
  const incidentStats = useMemo(() => {
    const total = incidencias.length;
    const resolved = incidencias.filter(i => i.resuelta).length;
    const byType: Record<string, number> = {};
    incidencias.forEach(i => {
      byType[i.tipo] = (byType[i.tipo] || 0) + 1;
    });
    return { total, resolved, pending: total - resolved, byType };
  }, [incidencias]);

  // --- Room occupancy ---
  const roomOccupancy = useMemo(() => {
    return rooms.map(r => {
      const occupied = huespedActivos.filter(h => h.habitacion === r.id).length;
      return { name: r.nombre, ocupadas: occupied, libres: r.camas - occupied, total: r.camas };
    });
  }, [rooms, huespedActivos]);

  // --- Language distribution ---
  const languageData = useMemo(() => {
    const counts: Record<string, number> = {};
    huespedes.forEach(h => {
      const lang = h.idioma || 'Sin especificar';
      counts[lang] = (counts[lang] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, value]) => ({ name, value }));
  }, [huespedes]);

  const totalHistorico = huespedes.length;
  const totalActivos = huespedActivos.length;
  const occupancyRate = totalCamas > 0 ? Math.round((totalActivos / totalCamas) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold">Informes y Estadísticas</h2>
        </div>
        <Select value={period} onValueChange={v => setPeriod(v as any)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3m">Últimos 3 meses</SelectItem>
            <SelectItem value="6m">Últimos 6 meses</SelectItem>
            <SelectItem value="12m">Último año</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Users className="w-3.5 h-3.5" /> Total histórico
            </div>
            <div className="text-2xl font-bold">{totalHistorico}</div>
            <div className="text-xs text-muted-foreground">{totalActivos} activos</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <BedDouble className="w-3.5 h-3.5" /> Ocupación
            </div>
            <div className="text-2xl font-bold">{occupancyRate}%</div>
            <div className="text-xs text-muted-foreground">{totalActivos}/{totalCamas} camas</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Clock className="w-3.5 h-3.5" /> Estancia media
            </div>
            <div className="text-2xl font-bold">{avgStay}</div>
            <div className="text-xs text-muted-foreground">días</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <TrendingUp className="w-3.5 h-3.5" /> Incidencias
            </div>
            <div className="text-2xl font-bold">{incidentStats.total}</div>
            <div className="text-xs text-muted-foreground">{incidentStats.pending} pendientes</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Occupancy over time */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Evolución de ocupación</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={occupancyData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis unit="%" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="ocupacion" name="Ocupación %" stroke="hsl(212, 72%, 59%)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Entradas/Salidas */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Entradas y salidas mensuales</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={occupancyData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="entradas" name="Entradas" fill="hsl(142, 60%, 45%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="salidas" name="Salidas" fill="hsl(0, 72%, 55%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Nationality */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Globe className="w-4 h-4" /> Distribución por nacionalidad
            </CardTitle>
          </CardHeader>
          <CardContent>
            {nationalityData.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">Sin datos</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={nationalityData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`} labelLine={false}>
                    {nationalityData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Diet distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <UtensilsCrossed className="w-4 h-4" /> Dietas activas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dietData.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">Sin datos</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={dietData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="value" name="Huéspedes" fill="hsl(38, 92%, 55%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Room occupancy */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Ocupación por habitación</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={roomOccupancy}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="ocupadas" name="Ocupadas" stackId="a" fill="hsl(212, 72%, 59%)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="libres" name="Libres" stackId="a" fill="hsl(212, 72%, 85%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Language */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Idiomas</CardTitle>
          </CardHeader>
          <CardContent>
            {languageData.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">Sin datos</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={languageData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`} labelLine={false}>
                    {languageData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

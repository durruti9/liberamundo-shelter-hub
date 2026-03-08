import { useMemo, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { BarChart3, Users, TrendingUp, Globe, Clock, BedDouble, UtensilsCrossed, FileDown } from 'lucide-react';
import { UserRole } from '@/types';
import ExportButton from '@/components/ExportButton';
import ChartTooltip from '@/components/ChartTooltip';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

export default function InformesTab({ store, role }: Props) {
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

  const exportPDF = useCallback(() => {
    const doc = new jsPDF();
    const albergueName = store.currentAlbergue?.nombre || 'Albergue';
    const dateStr = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });

    // Title
    doc.setFontSize(18);
    doc.text(`${albergueName} — Informe`, 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generado el ${dateStr}`, 14, 27);

    // KPIs
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text('Resumen general', 14, 38);
    autoTable(doc, {
      startY: 42,
      head: [['Métrica', 'Valor']],
      body: [
        ['Total huéspedes histórico', String(totalHistorico)],
        ['Huéspedes activos', String(totalActivos)],
        ['Ocupación actual', `${occupancyRate}%  (${totalActivos}/${totalCamas})`],
        ['Estancia media', `${avgStay} días`],
        ['Incidencias totales', String(incidentStats.total)],
        ['Incidencias pendientes', String(incidentStats.pending)],
      ],
      theme: 'grid',
      headStyles: { fillColor: [41, 98, 168] },
    });

    // Occupancy table
    let y = (doc as any).lastAutoTable?.finalY || 80;
    doc.text('Evolución de ocupación', 14, y + 10);
    autoTable(doc, {
      startY: y + 14,
      head: [['Mes', 'Ocupación %', 'Entradas', 'Salidas']],
      body: occupancyData.map(d => [d.mes, `${d.ocupacion}%`, String(d.entradas), String(d.salidas)]),
      theme: 'striped',
      headStyles: { fillColor: [41, 98, 168] },
    });

    // Nationality table
    y = (doc as any).lastAutoTable?.finalY || 120;
    if (y > 240) { doc.addPage(); y = 20; }
    doc.text('Distribución por nacionalidad', 14, y + 10);
    autoTable(doc, {
      startY: y + 14,
      head: [['Nacionalidad', 'Huéspedes']],
      body: nationalityData.map(d => [d.name, String(d.value)]),
      theme: 'striped',
      headStyles: { fillColor: [41, 98, 168] },
    });

    // Diet table
    y = (doc as any).lastAutoTable?.finalY || 180;
    if (y > 240) { doc.addPage(); y = 20; }
    doc.text('Dietas activas', 14, y + 10);
    autoTable(doc, {
      startY: y + 14,
      head: [['Dieta', 'Huéspedes']],
      body: dietData.map(d => [d.name, String(d.value)]),
      theme: 'striped',
      headStyles: { fillColor: [41, 98, 168] },
    });

    // Room occupancy
    y = (doc as any).lastAutoTable?.finalY || 220;
    if (y > 240) { doc.addPage(); y = 20; }
    doc.text('Ocupación por habitación', 14, y + 10);
    autoTable(doc, {
      startY: y + 14,
      head: [['Habitación', 'Ocupadas', 'Libres', 'Total']],
      body: roomOccupancy.map(r => [r.name, String(r.ocupadas), String(r.libres), String(r.total)]),
      theme: 'striped',
      headStyles: { fillColor: [41, 98, 168] },
    });

    doc.save(`informe_${albergueName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
  }, [store, totalHistorico, totalActivos, occupancyRate, totalCamas, avgStay, incidentStats, occupancyData, nationalityData, dietData, roomOccupancy]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold">Informes y Estadísticas</h2>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportPDF} className="gap-1.5">
            <FileDown className="w-4 h-4" /> PDF
          </Button>
          <ExportButton type="informes" getData={() => occupancyData} />
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
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" className="opacity-50" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis unit="%" tick={{ fontSize: 11 }} />
                <Tooltip content={<ChartTooltip />} />
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
                <Tooltip content={<ChartTooltip />} />
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
                  <Tooltip content={<ChartTooltip />} />
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
                   <Tooltip content={<ChartTooltip />} />
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
                <Tooltip content={<ChartTooltip />} />
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
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Clock, ChevronLeft, ChevronRight, Plus, Trash2, UserPlus, Users,
  Check, X, CalendarDays, FileDown, Lock, Pencil, Save, Building2, Settings2
} from 'lucide-react';
import { UserRole } from '@/types';
import { api } from '@/lib/api';
import SignaturePad from '@/components/SignaturePad';
import ExportButton from '@/components/ExportButton';

interface Props {
  role: UserRole;
  albergueId: string;
}

interface Empleado {
  id: string;
  nombre_completo: string;
  jornada_diaria_horas: number;
  vacaciones_anuales: number;
  activo: boolean;
}

interface RegistroDia {
  id?: string;
  empleado_id: string;
  fecha: string;
  estado: string;
  entrada_manana: string | null;
  salida_manana: string | null;
  entrada_tarde: string | null;
  salida_tarde: string | null;
  entrada_noche: string | null;
  salida_noche: string | null;
  pausa_min: number;
  horas_ordinarias: number;
  horas_extra: number;
  horas_complementarias: number;
  horas_vacaciones: number;
  horas_totales: number;
  observaciones: string;
  firma_data: string;
  firmado_en: string | null;
}

interface VacacionesSaldo {
  asignadas: number;
  consumidas: number;
}

const ESTADOS = [
  { value: 'trabajado', label: 'Trabajado', icon: '✓', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  { value: 'vacaciones', label: 'Vacaciones', icon: '🏖', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  { value: 'festivo', label: 'Festivo', icon: '🎉', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
  { value: 'baja', label: 'Baja', icon: '🏥', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  { value: 'permiso', label: 'Permiso', icon: '📋', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  { value: 'descanso', label: 'Descanso', icon: '😴', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' },
  { value: 'teletrabajo', label: 'Teletrabajo', icon: '🏠', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400' },
];

const DAYS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function formatDate(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function formatDisplayDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-');
  return `${d}-${m}-${y}`;
}

function parseTime(t: string | null): number {
  if (!t) return 0;
  const clean = t.includes('T') ? t.split('T')[1].substring(0, 5) : t.substring(0, 5);
  const [h, m] = clean.split(':').map(Number);
  return h * 60 + (m || 0);
}

function calcHours(record: Partial<RegistroDia>, jornadaDiaria: number) {
  let totalMin = 0;
  if (record.entrada_manana && record.salida_manana) {
    totalMin += parseTime(record.salida_manana) - parseTime(record.entrada_manana);
  }
  if (record.entrada_tarde && record.salida_tarde) {
    totalMin += parseTime(record.salida_tarde) - parseTime(record.entrada_tarde);
  }
  if (record.entrada_noche && record.salida_noche) {
    totalMin += parseTime(record.salida_noche) - parseTime(record.entrada_noche);
  }
  totalMin -= (record.pausa_min || 0);
  totalMin = Math.max(0, totalMin);
  
  const totalHours = totalMin / 60;
  const ordinarias = Math.min(totalHours, jornadaDiaria);
  const extra = Math.max(0, totalHours - jornadaDiaria);
  
  return {
    horas_ordinarias: Math.round(ordinarias * 100) / 100,
    horas_extra: Math.round(extra * 100) / 100,
    horas_totales: Math.round(totalHours * 100) / 100,
  };
}

function timeToStr(h: number, m: number) {
  return `${Math.floor(h)}h ${m > 0 ? `${m}m` : ''}`.trim();
}

function hoursToHM(h: number) {
  const hours = Math.floor(h);
  const mins = Math.round((h - hours) * 60);
  return timeToStr(hours, mins);
}

function emptyRecord(empleadoId: string, fecha: string): RegistroDia {
  return {
    empleado_id: empleadoId,
    fecha,
    estado: '',
    entrada_manana: null, salida_manana: null,
    entrada_tarde: null, salida_tarde: null,
    entrada_noche: null, salida_noche: null,
    pausa_min: 0,
    horas_ordinarias: 0, horas_extra: 0, horas_complementarias: 0,
    horas_vacaciones: 0, horas_totales: 0,
    observaciones: '', firma_data: '', firmado_en: null,
  };
}

export default function RegistroHorarioTab({ role, albergueId }: Props) {
  const isAdmin = role === 'admin';
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [selectedEmpleado, setSelectedEmpleado] = useState<string>('');
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const [records, setRecords] = useState<Map<string, RegistroDia>>(new Map());
  const [vacSaldo, setVacSaldo] = useState<VacacionesSaldo>({ asignadas: 22, consumidas: 0 });
  const [loading, setLoading] = useState(false);

  // Empresa config
  const [empresaConfig, setEmpresaConfig] = useState({ razon_social: '', cif: '' });
  const [showEmpresaConfig, setShowEmpresaConfig] = useState(false);
  const [editEmpresa, setEditEmpresa] = useState({ razon_social: '', cif: '' });

  // Modal states
  const [showDayModal, setShowDayModal] = useState(false);
  const [editingDay, setEditingDay] = useState<RegistroDia | null>(null);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [showManageEmployees, setShowManageEmployees] = useState(false);
  const [newEmp, setNewEmp] = useState({ nombre_completo: '', jornada_diaria_horas: 8, vacaciones_anuales: 22 });
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const today = useMemo(() => {
    const d = new Date();
    return formatDate(d.getFullYear(), d.getMonth(), d.getDate());
  }, []);

  // Load employees
  const loadEmpleados = useCallback(async () => {
    try {
      const data = await api.getEmpleadosHorario(albergueId);
      setEmpleados(data);
      if (data.length > 0 && !selectedEmpleado) {
        setSelectedEmpleado(data[0].id);
      }
    } catch { /* API not available */ }
  }, [albergueId, selectedEmpleado]);

  // Load records for selected employee + month
  const loadRecords = useCallback(async () => {
    if (!selectedEmpleado) return;
    setLoading(true);
    try {
      const start = formatDate(year, month, 1);
      const end = formatDate(year, month, daysInMonth(year, month));
      const data = await api.getRegistrosHorario(selectedEmpleado, start, end);
      const map = new Map<string, RegistroDia>();
      data.forEach((r: any) => {
        const fecha = typeof r.fecha === 'string' && r.fecha.includes('T') ? r.fecha.split('T')[0] : r.fecha;
        map.set(fecha, { ...r, fecha });
      });
      setRecords(map);
    } catch { /* API not available */ }
    setLoading(false);
  }, [selectedEmpleado, year, month]);

  // Load vacation balance
  const loadVacaciones = useCallback(async () => {
    if (!selectedEmpleado) return;
    try {
      const data = await api.getVacacionesSaldo(selectedEmpleado, year);
      setVacSaldo({ asignadas: data.asignadas || 22, consumidas: Number(data.consumidas) || 0 });
    } catch { /* API not available */ }
  }, [selectedEmpleado, year]);

  useEffect(() => { loadEmpleados(); }, [loadEmpleados]);
  useEffect(() => { loadRecords(); loadVacaciones(); }, [loadRecords, loadVacaciones]);

  // Load empresa config
  const loadEmpresaConfig = useCallback(async () => {
    try {
      const data = await api.getConfigEmpresa(albergueId);
      setEmpresaConfig({ razon_social: data.razon_social || '', cif: data.cif || '' });
    } catch { /* ignore */ }
  }, [albergueId]);
  useEffect(() => { loadEmpresaConfig(); }, [loadEmpresaConfig]);

  const currentEmpleado = empleados.find(e => e.id === selectedEmpleado);
  const numDays = daysInMonth(year, month);

  // Navigation
  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };
  const goToToday = () => {
    const d = new Date();
    setMonth(d.getMonth());
    setYear(d.getFullYear());
  };

  // Check if date is future
  const isFuture = (dateStr: string) => dateStr > today;

  // Save a record with audit log
  const saveRecord = useCallback(async (record: RegistroDia) => {
    setSaving(true);
    try {
      const oldRecord = records.get(record.fecha);
      await api.saveRegistroHorario(record.empleado_id, record);
      setRecords(prev => {
        const next = new Map(prev);
        next.set(record.fecha, record);
        return next;
      });
      setLastSaved(new Date());

      // Audit log (silent, don't block)
      const empName = currentEmpleado?.nombre_completo || '';
      const userEmail = localStorage.getItem('authEmail') || '';
      const changes: string[] = [];
      if (!oldRecord || oldRecord.estado !== record.estado) changes.push(`estado: ${oldRecord?.estado || '(vacío)'} → ${record.estado}`);
      if (oldRecord?.entrada_manana !== record.entrada_manana) changes.push(`entrada_mañana`);
      if (oldRecord?.salida_manana !== record.salida_manana) changes.push(`salida_mañana`);
      if (oldRecord?.firma_data !== record.firma_data) changes.push(`firma`);
      
      if (changes.length > 0) {
        api.logAuditoria({
          empleado_id: record.empleado_id,
          empleado_nombre: empName,
          fecha_registro: record.fecha,
          campo_modificado: changes.join(', '),
          valor_anterior: oldRecord?.estado || '',
          valor_nuevo: record.estado,
          modificado_por: userEmail,
        }).catch(() => {});
      }
    } catch (err: any) {
      toast.error('Error al guardar: ' + (err.message || ''));
    }
    setSaving(false);
  }, [records, currentEmpleado]);

  // Open day modal
  const openDay = (dayNum: number) => {
    if (!selectedEmpleado) return;
    const fecha = formatDate(year, month, dayNum);
    if (isFuture(fecha)) return;
    const existing = records.get(fecha) || emptyRecord(selectedEmpleado, fecha);
    setEditingDay({ ...existing });
    setShowDayModal(true);
  };

  // Save day from modal
  const handleSaveDay = async () => {
    if (!editingDay || !currentEmpleado) return;
    const needsWork = ['trabajado', 'teletrabajo'].includes(editingDay.estado);
    const hours = needsWork ? calcHours(editingDay, currentEmpleado.jornada_diaria_horas) : { horas_ordinarias: 0, horas_extra: 0, horas_totales: 0 };
    const isVac = editingDay.estado === 'vacaciones';
    const updated: RegistroDia = {
      ...editingDay,
      ...hours,
      horas_vacaciones: isVac ? editingDay.horas_vacaciones || 1 : 0,
    };
    await saveRecord(updated);
    
    // Recalc vacations
    if (isVac || records.get(editingDay.fecha)?.estado === 'vacaciones') {
      await recalcVacaciones();
    }
    
    setShowDayModal(false);
    toast.success('Registro guardado');
  };

  // Recalculate vacaciones consumed
  const recalcVacaciones = useCallback(async () => {
    if (!selectedEmpleado) return;
    try {
      // Fetch all records for the year to sum vacation days
      const start = `${year}-01-01`;
      const end = `${year}-12-31`;
      const allRecs = await api.getRegistrosHorario(selectedEmpleado, start, end);
      const consumed = allRecs
        .filter((r: any) => r.estado === 'vacaciones')
        .reduce((sum: number, r: any) => sum + (Number(r.horas_vacaciones) || 1), 0);
      
      await api.updateVacacionesSaldo(selectedEmpleado, year, {
        asignadas: vacSaldo.asignadas,
        consumidas: consumed,
      });
      setVacSaldo(prev => ({ ...prev, consumidas: consumed }));
    } catch { /* ignore */ }
  }, [selectedEmpleado, year, vacSaldo.asignadas]);

  // Add employee
  const handleAddEmployee = async () => {
    if (!newEmp.nombre_completo.trim()) return;
    try {
      const emp = await api.addEmpleadoHorario(albergueId, newEmp);
      setEmpleados(prev => [...prev, emp]);
      setSelectedEmpleado(emp.id);
      setNewEmp({ nombre_completo: '', jornada_diaria_horas: 8, vacaciones_anuales: 22 });
      setShowAddEmployee(false);
      toast.success('Empleado añadido');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Delete employee
  const handleDeleteEmployee = async (id: string) => {
    if (!confirm('¿Eliminar empleado y todos sus registros?')) return;
    try {
      await api.deleteEmpleadoHorario(id);
      setEmpleados(prev => prev.filter(e => e.id !== id));
      if (selectedEmpleado === id) {
        setSelectedEmpleado(empleados.find(e => e.id !== id)?.id || '');
      }
      toast.success('Empleado eliminado');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Month totals
  const monthTotals = useMemo(() => {
    let ordinarias = 0, extra = 0, complementarias = 0, vacDays = 0, worked = 0, unsigned = 0;
    for (let d = 1; d <= numDays; d++) {
      const fecha = formatDate(year, month, d);
      const rec = records.get(fecha);
      if (!rec) continue;
      ordinarias += Number(rec.horas_ordinarias) || 0;
      extra += Number(rec.horas_extra) || 0;
      complementarias += Number(rec.horas_complementarias) || 0;
      if (rec.estado === 'vacaciones') vacDays += Number(rec.horas_vacaciones) || 1;
      if (['trabajado', 'teletrabajo'].includes(rec.estado)) worked++;
      if (rec.estado && !rec.firma_data && !isFuture(fecha)) unsigned++;
    }
    return { ordinarias, extra, complementarias, vacDays, worked, unsigned };
  }, [records, numDays, year, month, today]);

  // Export data
  const exportData = useMemo(() => {
    const rows: any[] = [];
    for (let d = 1; d <= numDays; d++) {
      const fecha = formatDate(year, month, d);
      const rec = records.get(fecha);
      const dayOfWeek = DAYS_ES[new Date(year, month, d).getDay()];
      rows.push({
        'Día': `${dayOfWeek} ${String(d).padStart(2, '0')}`,
        'Estado': rec?.estado || '',
        'E. Mañana': rec?.entrada_manana?.substring(0, 5) || '',
        'S. Mañana': rec?.salida_manana?.substring(0, 5) || '',
        'E. Tarde': rec?.entrada_tarde?.substring(0, 5) || '',
        'S. Tarde': rec?.salida_tarde?.substring(0, 5) || '',
        'E. Noche': rec?.entrada_noche?.substring(0, 5) || '',
        'S. Noche': rec?.salida_noche?.substring(0, 5) || '',
        'Pausa': rec?.pausa_min || 0,
        'Ordinarias': rec?.horas_ordinarias || 0,
        'Extra': rec?.horas_extra || 0,
        'Total': rec?.horas_totales || 0,
        'Firmado': rec?.firma_data ? 'Sí' : 'No',
      });
    }
    return rows;
  }, [records, numDays, year, month]);

  return (
    <div className="space-y-4">
      {/* HEADER */}
      <Card>
        <CardContent className="p-4 space-y-4">
          {/* Empresa header */}
          {(empresaConfig.razon_social || empresaConfig.cif) && (
            <div className="flex items-center gap-2 text-sm bg-muted/50 rounded-lg px-3 py-2">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">EMPRESA: {empresaConfig.razon_social}</span>
              {empresaConfig.cif && <span className="text-muted-foreground">CIF: {empresaConfig.cif}</span>}
            </div>
          )}

          {/* Row 1: Title + employee selector */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold">Registro Horario</h2>
            </div>
            <div className="flex-1 w-full sm:w-auto">
              <Select value={selectedEmpleado} onValueChange={setSelectedEmpleado}>
                <SelectTrigger className="w-full sm:w-64">
                  <SelectValue placeholder="Seleccionar empleado" />
                </SelectTrigger>
                <SelectContent>
                  {empleados.filter(e => e.activo).map(e => (
                    <SelectItem key={e.id} value={e.id}>{e.nombre_completo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {isAdmin && (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setShowAddEmployee(true)}>
                  <UserPlus className="w-4 h-4 mr-1" /> Añadir
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowManageEmployees(true)}>
                  <Users className="w-4 h-4 mr-1" /> Gestionar
                </Button>
                <Button size="sm" variant="outline" onClick={() => {
                  setEditEmpresa({ ...empresaConfig });
                  setShowEmpresaConfig(true);
                }}>
                  <Settings2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Row 2: Month navigation + export */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex items-center gap-2">
              <Button size="icon" variant="outline" className="h-8 w-8" onClick={prevMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={goToToday} className="text-xs">Hoy</Button>
              <span className="font-semibold text-sm min-w-[140px] text-center">
                {MONTHS_ES[month]} {year}
              </span>
              <Button size="icon" variant="outline" className="h-8 w-8" onClick={nextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex gap-2 ml-auto">
              {saving && <Badge variant="outline" className="text-xs animate-pulse">Guardando...</Badge>}
              {lastSaved && !saving && (
                <Badge variant="outline" className="text-xs text-green-600">
                  <Check className="w-3 h-3 mr-1" /> Guardado
                </Badge>
              )}
              {selectedEmpleado && (
                <ExportButton
                  type="registroHorario"
                  getData={() => exportData}
                  pdfOptions={{
                    empresa: empresaConfig.razon_social,
                    cif: empresaConfig.cif,
                    employeeName: currentEmpleado?.nombre_completo,
                    legalText: 'Registro conservado durante 4 años conforme al Art. 34.9 del Estatuto de los Trabajadores (Real Decreto Legislativo 2/2015).',
                  }}
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* MONTHLY TABLE */}
      {selectedEmpleado && currentEmpleado ? (
        <>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs w-20 sticky left-0 bg-card z-10">Día</TableHead>
                      <TableHead className="text-xs w-24">Estado</TableHead>
                      <TableHead className="text-xs text-center">E.Mañ</TableHead>
                      <TableHead className="text-xs text-center">S.Mañ</TableHead>
                      <TableHead className="text-xs text-center">E.Tar</TableHead>
                      <TableHead className="text-xs text-center">S.Tar</TableHead>
                      <TableHead className="text-xs text-center hidden md:table-cell">E.Noc</TableHead>
                      <TableHead className="text-xs text-center hidden md:table-cell">S.Noc</TableHead>
                      <TableHead className="text-xs text-center hidden sm:table-cell">Pausa</TableHead>
                      <TableHead className="text-xs text-center">Ord.</TableHead>
                      <TableHead className="text-xs text-center hidden sm:table-cell">Extra</TableHead>
                      <TableHead className="text-xs text-center">Total</TableHead>
                      <TableHead className="text-xs text-center w-12">Firma</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from({ length: numDays }, (_, i) => i + 1).map(dayNum => {
                      const fecha = formatDate(year, month, dayNum);
                      const rec = records.get(fecha);
                      const future = isFuture(fecha);
                      const isToday = fecha === today;
                      const dayOfWeek = new Date(year, month, dayNum).getDay();
                      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                      const estado = ESTADOS.find(e => e.value === rec?.estado);
                      const hasWork = rec && ['trabajado', 'teletrabajo'].includes(rec.estado);

                      return (
                        <TableRow
                          key={dayNum}
                          className={`cursor-pointer transition-colors ${future ? 'opacity-40 cursor-not-allowed' : 'hover:bg-muted/50'} ${isToday ? 'bg-primary/5 border-l-2 border-l-primary' : ''} ${isWeekend && !rec?.estado ? 'bg-muted/30' : ''}`}
                          onClick={() => openDay(dayNum)}
                        >
                          <TableCell className="text-xs font-medium sticky left-0 bg-inherit z-10">
                            <span className={isWeekend ? 'text-muted-foreground' : ''}>
                              {DAYS_ES[dayOfWeek]} {String(dayNum).padStart(2, '0')}
                            </span>
                            {future && <Lock className="w-3 h-3 ml-1 inline text-muted-foreground" />}
                          </TableCell>
                          <TableCell className="text-xs p-1">
                            {estado && (
                              <Badge className={`text-[10px] px-1.5 py-0 ${estado.color}`}>
                                {estado.icon} {estado.label}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-center font-mono">{hasWork && rec.entrada_manana ? rec.entrada_manana.substring(0, 5) : ''}</TableCell>
                          <TableCell className="text-xs text-center font-mono">{hasWork && rec.salida_manana ? rec.salida_manana.substring(0, 5) : ''}</TableCell>
                          <TableCell className="text-xs text-center font-mono">{hasWork && rec.entrada_tarde ? rec.entrada_tarde.substring(0, 5) : ''}</TableCell>
                          <TableCell className="text-xs text-center font-mono">{hasWork && rec.salida_tarde ? rec.salida_tarde.substring(0, 5) : ''}</TableCell>
                          <TableCell className="text-xs text-center font-mono hidden md:table-cell">{hasWork && rec.entrada_noche ? rec.entrada_noche.substring(0, 5) : ''}</TableCell>
                          <TableCell className="text-xs text-center font-mono hidden md:table-cell">{hasWork && rec.salida_noche ? rec.salida_noche.substring(0, 5) : ''}</TableCell>
                          <TableCell className="text-xs text-center hidden sm:table-cell">{hasWork && rec.pausa_min ? `${rec.pausa_min}'` : ''}</TableCell>
                          <TableCell className="text-xs text-center font-medium">{hasWork ? Number(rec.horas_ordinarias).toFixed(1) : ''}</TableCell>
                          <TableCell className="text-xs text-center hidden sm:table-cell">{hasWork && Number(rec.horas_extra) > 0 ? Number(rec.horas_extra).toFixed(1) : ''}</TableCell>
                          <TableCell className="text-xs text-center font-bold">{hasWork ? Number(rec.horas_totales).toFixed(1) : ''}</TableCell>
                          <TableCell className="text-xs text-center">
                            {rec?.firma_data ? (
                              <span title="Firmado" className="text-green-600">✅</span>
                            ) : rec?.estado ? (
                              <span title="Pendiente" className="text-amber-500">⚠️</span>
                            ) : null}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* FOOTER - Month totals */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 text-center">
                <div>
                  <p className="text-xs text-muted-foreground">Ordinarias</p>
                  <p className="text-lg font-bold">{hoursToHM(monthTotals.ordinarias)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Extra</p>
                  <p className="text-lg font-bold text-amber-600">{hoursToHM(monthTotals.extra)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Complementarias</p>
                  <p className="text-lg font-bold">{hoursToHM(monthTotals.complementarias)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Días trabajados</p>
                  <p className="text-lg font-bold">{monthTotals.worked}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Vacaciones (mes)</p>
                  <p className="text-lg font-bold text-blue-600">{monthTotals.vacDays} días</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Sin firmar</p>
                  <p className={`text-lg font-bold ${monthTotals.unsigned > 0 ? 'text-destructive' : 'text-green-600'}`}>
                    {monthTotals.unsigned > 0 ? `${monthTotals.unsigned} ⚠️` : '0 ✅'}
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t flex flex-col sm:flex-row items-center justify-between gap-2">
                <div className="flex items-center gap-4 text-sm">
                  <span>🏖 Vacaciones {year}:</span>
                  <Badge variant="outline">{vacSaldo.asignadas} asignadas</Badge>
                  <Badge variant="secondary">{vacSaldo.consumidas} consumidas</Badge>
                  <Badge className={vacSaldo.asignadas - vacSaldo.consumidas > 0 ? 'bg-green-600' : 'bg-destructive'}>
                    {(vacSaldo.asignadas - vacSaldo.consumidas).toFixed(1)} pendientes
                  </Badge>
                </div>
                {isAdmin && (
                  <Button size="sm" variant="outline" className="text-xs" onClick={async () => {
                    const newVal = prompt('Días de vacaciones asignadas:', String(vacSaldo.asignadas));
                    if (newVal && !isNaN(Number(newVal))) {
                      await api.updateVacacionesSaldo(selectedEmpleado, year, { asignadas: Number(newVal), consumidas: vacSaldo.consumidas });
                      setVacSaldo(prev => ({ ...prev, asignadas: Number(newVal) }));
                      toast.success('Vacaciones actualizadas');
                    }
                  }}>
                    <Pencil className="w-3 h-3 mr-1" /> Editar saldo
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            {empleados.length === 0 ? (
              <div className="space-y-3">
                <Users className="w-12 h-12 mx-auto opacity-50" />
                <p>No hay empleados registrados</p>
                {isAdmin && (
                  <Button onClick={() => setShowAddEmployee(true)}>
                    <UserPlus className="w-4 h-4 mr-2" /> Añadir primer empleado
                  </Button>
                )}
              </div>
            ) : (
              <p>Selecciona un empleado para ver su registro</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* DAY MODAL */}
      <Dialog open={showDayModal} onOpenChange={setShowDayModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5" />
              {editingDay && formatDisplayDate(editingDay.fecha)}
              {editingDay && (
                <span className="text-sm font-normal text-muted-foreground">
                  ({DAYS_ES[new Date(editingDay.fecha).getDay()]})
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          {editingDay && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select value={editingDay.estado} onValueChange={v => setEditingDay({ ...editingDay, estado: v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar estado" /></SelectTrigger>
                  <SelectContent>
                    {ESTADOS.map(e => (
                      <SelectItem key={e.value} value={e.value}>
                        {e.icon} {e.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {['trabajado', 'teletrabajo'].includes(editingDay.estado) && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Entrada Mañana</Label>
                      <Input type="time" value={editingDay.entrada_manana?.substring(0, 5) || ''} onChange={e => setEditingDay({ ...editingDay, entrada_manana: e.target.value || null })} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Salida Mañana</Label>
                      <Input type="time" value={editingDay.salida_manana?.substring(0, 5) || ''} onChange={e => setEditingDay({ ...editingDay, salida_manana: e.target.value || null })} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Entrada Tarde</Label>
                      <Input type="time" value={editingDay.entrada_tarde?.substring(0, 5) || ''} onChange={e => setEditingDay({ ...editingDay, entrada_tarde: e.target.value || null })} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Salida Tarde</Label>
                      <Input type="time" value={editingDay.salida_tarde?.substring(0, 5) || ''} onChange={e => setEditingDay({ ...editingDay, salida_tarde: e.target.value || null })} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Entrada Noche</Label>
                      <Input type="time" value={editingDay.entrada_noche?.substring(0, 5) || ''} onChange={e => setEditingDay({ ...editingDay, entrada_noche: e.target.value || null })} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Salida Noche</Label>
                      <Input type="time" value={editingDay.salida_noche?.substring(0, 5) || ''} onChange={e => setEditingDay({ ...editingDay, salida_noche: e.target.value || null })} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Pausa (minutos)</Label>
                    <Input type="number" min={0} max={120} value={editingDay.pausa_min} onChange={e => setEditingDay({ ...editingDay, pausa_min: Number(e.target.value) })} />
                  </div>
                  {/* Live calculation */}
                  {currentEmpleado && (() => {
                    const calc = calcHours(editingDay, currentEmpleado.jornada_diaria_horas);
                    return (
                      <div className="flex gap-4 text-sm bg-muted/50 rounded-lg p-3">
                        <div><span className="text-muted-foreground">Ord:</span> <b>{calc.horas_ordinarias.toFixed(1)}h</b></div>
                        <div><span className="text-muted-foreground">Extra:</span> <b className="text-amber-600">{calc.horas_extra.toFixed(1)}h</b></div>
                        <div><span className="text-muted-foreground">Total:</span> <b>{calc.horas_totales.toFixed(1)}h</b></div>
                      </div>
                    );
                  })()}
                </>
              )}

              {editingDay.estado === 'vacaciones' && (
                <div className="space-y-2">
                  <Label>Tipo de vacaciones</Label>
                  <Select value={String(editingDay.horas_vacaciones || 1)} onValueChange={v => setEditingDay({ ...editingDay, horas_vacaciones: Number(v) })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Día completo</SelectItem>
                      <SelectItem value="0.5">Medio día (mañana)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-1">
                <Label className="text-xs">Horas complementarias (manual)</Label>
                <Input type="number" min={0} step={0.5} value={editingDay.horas_complementarias}
                  onChange={e => setEditingDay({ ...editingDay, horas_complementarias: Number(e.target.value) })} />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Observaciones</Label>
                <Textarea value={editingDay.observaciones} onChange={e => setEditingDay({ ...editingDay, observaciones: e.target.value })} rows={2} />
              </div>

              <div className="space-y-2">
                <Label>Firma</Label>
                <SignaturePad
                  value={editingDay.firma_data}
                  onChange={dataUrl => setEditingDay({ ...editingDay, firma_data: dataUrl, firmado_en: dataUrl ? new Date().toISOString() : null })}
                />
                {editingDay.firmado_en && (
                  <p className="text-xs text-muted-foreground">
                    Firmado el {new Date(editingDay.firmado_en).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })} {new Date(editingDay.firmado_en).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowDayModal(false)}>Cancelar</Button>
                <Button onClick={handleSaveDay} disabled={saving}>
                  <Save className="w-4 h-4 mr-1" /> {saving ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ADD EMPLOYEE MODAL */}
      <Dialog open={showAddEmployee} onOpenChange={setShowAddEmployee}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Añadir empleado</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Nombre completo</Label>
              <Input value={newEmp.nombre_completo} onChange={e => setNewEmp({ ...newEmp, nombre_completo: e.target.value })} placeholder="Nombre y apellidos" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Jornada diaria (h)</Label>
                <Input type="number" min={1} max={12} step={0.5} value={newEmp.jornada_diaria_horas}
                  onChange={e => setNewEmp({ ...newEmp, jornada_diaria_horas: Number(e.target.value) })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Vacaciones anuales</Label>
                <Input type="number" min={0} max={60} value={newEmp.vacaciones_anuales}
                  onChange={e => setNewEmp({ ...newEmp, vacaciones_anuales: Number(e.target.value) })} />
              </div>
            </div>
            <Button className="w-full" onClick={handleAddEmployee} disabled={!newEmp.nombre_completo.trim()}>
              <Plus className="w-4 h-4 mr-1" /> Añadir
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* MANAGE EMPLOYEES MODAL */}
      <Dialog open={showManageEmployees} onOpenChange={setShowManageEmployees}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Gestionar empleados</DialogTitle></DialogHeader>
          <div className="space-y-2">
            {empleados.map(emp => (
              <div key={emp.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium text-sm">{emp.nombre_completo}</p>
                  <p className="text-xs text-muted-foreground">
                    Jornada: {emp.jornada_diaria_horas}h | Vacaciones: {emp.vacaciones_anuales} días
                  </p>
                </div>
                <Button size="icon" variant="ghost" onClick={() => handleDeleteEmployee(emp.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}
            {empleados.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No hay empleados</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* EMPRESA CONFIG MODAL (admin only) */}
      <Dialog open={showEmpresaConfig} onOpenChange={setShowEmpresaConfig}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" /> Configuración Empresa
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Estos datos aparecerán en la cabecera del registro horario y en las exportaciones PDF. Requisito legal Art. 34.9 ET.
            </p>
            <div className="space-y-1">
              <Label>Razón Social</Label>
              <Input value={editEmpresa.razon_social} onChange={e => setEditEmpresa({ ...editEmpresa, razon_social: e.target.value })} placeholder="Nombre de la empresa" />
            </div>
            <div className="space-y-1">
              <Label>CIF</Label>
              <Input value={editEmpresa.cif} onChange={e => setEditEmpresa({ ...editEmpresa, cif: e.target.value })} placeholder="B12345678" />
            </div>
            <Button className="w-full" onClick={async () => {
              try {
                await api.updateConfigEmpresa(albergueId, editEmpresa);
                setEmpresaConfig({ ...editEmpresa });
                setShowEmpresaConfig(false);
                toast.success('Configuración de empresa guardada');
              } catch (err: any) {
                toast.error(err.message);
              }
            }}>
              <Save className="w-4 h-4 mr-1" /> Guardar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

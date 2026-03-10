import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Clock, ChevronLeft, ChevronRight, Plus, Trash2, UserPlus, Users,
  Check, X, CalendarDays, FileDown, Lock, Pencil, Save, Building2, Settings2, AlertTriangle, History as HistoryIcon,
  Fingerprint, CheckCircle2, XCircle
} from 'lucide-react';
import { UserRole } from '@/types';
import { api } from '@/lib/api';
import SignaturePad from '@/components/SignaturePad';
import ExportButton from '@/components/ExportButton';
import { exportToCSV, exportToPDF, EXPORT_CONFIGS } from '@/lib/export';
import AuditLogPanel from '@/components/AuditLogPanel';
import { useBeforeUnload } from '@/hooks/useBeforeUnload';

interface Props {
  role: UserRole;
  albergueId: string;
  userEmail?: string;
}

interface Empleado {
  id: string;
  nombre_completo: string;
  jornada_diaria_horas: number;
  vacaciones_anuales: number;
  activo: boolean;
  user_email?: string;
}

interface UsuarioDisponible {
  email: string;
  role: string;
  nombre: string;
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
  marcado_revision: boolean;
  motivo_revision: string;
  updated_at?: string;
  pendiente_aprobacion: boolean;
  aprobado: boolean;
  fecha_original_fichada?: string | null;
}

interface VacacionesSaldo {
  asignadas: number;
  consumidas: number;
}

const ESTADOS = [
  { value: 'trabajado', label: 'Trabajado', icon: '✓', color: 'bg-[hsl(142,60%,90%)] text-[hsl(142,60%,30%)] dark:bg-[hsl(142,60%,15%)] dark:text-[hsl(142,60%,70%)]' },
  { value: 'vacaciones', label: 'Vacaciones', icon: '🏖', color: 'bg-[hsl(212,72%,90%)] text-[hsl(212,72%,35%)] dark:bg-[hsl(212,72%,15%)] dark:text-[hsl(212,72%,70%)]' },
  { value: 'festivo', label: 'Festivo', icon: '🎉', color: 'bg-[hsl(280,60%,92%)] text-[hsl(280,60%,35%)] dark:bg-[hsl(280,60%,15%)] dark:text-[hsl(280,60%,70%)]' },
  { value: 'baja', label: 'Baja', icon: '🏥', color: 'bg-[hsl(0,72%,92%)] text-[hsl(0,72%,35%)] dark:bg-[hsl(0,72%,15%)] dark:text-[hsl(0,72%,70%)]' },
  { value: 'permiso', label: 'Permiso', icon: '📋', color: 'bg-[hsl(38,92%,90%)] text-[hsl(38,92%,30%)] dark:bg-[hsl(38,92%,15%)] dark:text-[hsl(38,92%,70%)]' },
  { value: 'descanso', label: 'Descanso', icon: '😴', color: 'bg-muted text-muted-foreground' },
  { value: 'teletrabajo', label: 'Teletrabajo', icon: '🏠', color: 'bg-accent text-accent-foreground' },
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

function calcHours(record: Partial<RegistroDia>, jornadaSemanal: number) {
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
  const jornadaDiaria = jornadaSemanal / 5;
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
    estado: 'trabajado',
    entrada_manana: null, salida_manana: null,
    entrada_tarde: null, salida_tarde: null,
    entrada_noche: null, salida_noche: null,
    pausa_min: 0,
    horas_ordinarias: 0, horas_extra: 0, horas_complementarias: 0,
    horas_vacaciones: 0, horas_totales: 0,
    observaciones: '', firma_data: '', firmado_en: null,
    marcado_revision: false, motivo_revision: '',
    pendiente_aprobacion: false, aprobado: false, fecha_original_fichada: null,
  };
}

export default function RegistroHorarioTab({ role, albergueId, userEmail }: Props) {
  const isAdmin = role === 'admin';
  const isPersonal = role === 'personal_albergue';
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [selectedEmpleado, setSelectedEmpleado] = useState<string>('');
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const [records, setRecords] = useState<Map<string, RegistroDia>>(new Map());
  const [vacSaldo, setVacSaldo] = useState<VacacionesSaldo>({ asignadas: 22, consumidas: 0 });
  const [loading, setLoading] = useState(false);
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [usuariosDisponibles, setUsuariosDisponibles] = useState<UsuarioDisponible[]>([]);

  // Empresa config
  const [empresaConfig, setEmpresaConfig] = useState({ razon_social: '', cif: '' });
  const [showEmpresaConfig, setShowEmpresaConfig] = useState(false);
  const [editEmpresa, setEditEmpresa] = useState({ razon_social: '', cif: '' });

  // Modal states
  const [showDayModal, setShowDayModal] = useState(false);
  const [editingDay, setEditingDay] = useState<RegistroDia | null>(null);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [showManageEmployees, setShowManageEmployees] = useState(false);
  const [newEmp, setNewEmp] = useState({ nombre_completo: '', jornada_diaria_horas: 40, vacaciones_anuales: 22, user_email: '' });
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Dialog states for replacing confirm()/prompt()
  const [deleteEmpTarget, setDeleteEmpTarget] = useState<string | null>(null);
  const [revisionDialog, setRevisionDialog] = useState<{ dayNum: number; motivo: string } | null>(null);
  const [vacDialog, setVacDialog] = useState<{ value: string } | null>(null);

  // beforeunload when editing a day
  useBeforeUnload(showDayModal && !!editingDay);

  const today = useMemo(() => {
    const d = new Date();
    return formatDate(d.getFullYear(), d.getMonth(), d.getDate());
  }, []);

  // Load employees (for personal_albergue, auto-select their linked employee)
  const loadEmpleados = useCallback(async () => {
    try {
      if (isPersonal) {
        // Personal laboral: find their linked employee
        const miEmp = await api.getMiEmpleado(albergueId);
        if (miEmp) {
          setEmpleados([miEmp]);
          setSelectedEmpleado(miEmp.id);
        } else {
          setEmpleados([]);
        }
      } else {
        const data = await api.getEmpleadosHorario(albergueId);
        setEmpleados(data);
        if (data.length > 0 && !selectedEmpleado) {
          setSelectedEmpleado(data[0].id);
        }
      }
    } catch { /* API not available */ }
  }, [albergueId, selectedEmpleado, isPersonal]);

  // Load available users (admin only, for linking)
  useEffect(() => {
    if (isAdmin) {
      api.getUsuariosDisponibles().then(setUsuariosDisponibles).catch(() => {});
    }
  }, [isAdmin]);

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
    // Admin can view but not edit; non-admin with no record on that day can create
    if (isAdmin && !existing.estado) return; // Admin: nothing to view on empty days
    setEditingDay({ ...existing });
    setShowDayModal(true);
  };

  // Open today's record directly (Fichar button)
  const handleFichar = () => {
    if (!selectedEmpleado) return;
    const d = new Date();
    const todayDate = formatDate(d.getFullYear(), d.getMonth(), d.getDate());
    // Navigate to current month if needed
    if (d.getMonth() !== month || d.getFullYear() !== year) {
      setMonth(d.getMonth());
      setYear(d.getFullYear());
    }
    const existing = records.get(todayDate) || emptyRecord(selectedEmpleado, todayDate);
    setEditingDay({ ...existing });
    setShowDayModal(true);
  };

  // Check if a record is from a past day (not today)
  const isPastDay = (fecha: string) => fecha < today;

  // Toggle review flag (admin only)
  const toggleRevision = async (dayNum: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAdmin || !selectedEmpleado) return;
    const fecha = formatDate(year, month, dayNum);
    const rec = records.get(fecha);
    if (!rec || !rec.estado) return;

    const newFlag = !rec.marcado_revision;
    if (newFlag) {
      // Open revision dialog instead of prompt()
      setRevisionDialog({ dayNum, motivo: '' });
      return;
    }
    // Unreview: clear directly
    const updated = { ...rec, marcado_revision: false, motivo_revision: '' };
    await saveRecord(updated);
    toast.success('Revisión resuelta');
  };

  const confirmRevision = async () => {
    if (!revisionDialog || !selectedEmpleado) return;
    const fecha = formatDate(year, month, revisionDialog.dayNum);
    const rec = records.get(fecha);
    if (!rec) return;
    const updated = { ...rec, marcado_revision: true, motivo_revision: revisionDialog.motivo };
    await saveRecord(updated);
    toast.success('Marcado para revisión');
    setRevisionDialog(null);
  };

  // Save day from modal
  const handleSaveDay = async () => {
    if (!editingDay || !currentEmpleado) return;
    const needsWork = ['trabajado', 'teletrabajo'].includes(editingDay.estado);
    const hours = needsWork ? calcHours(editingDay, currentEmpleado.jornada_diaria_horas) : { horas_ordinarias: 0, horas_extra: 0, horas_totales: 0 };
    const isVac = editingDay.estado === 'vacaciones';
    
    // Determine if this is a past-day edit by non-admin
    const isEditingPastDay = isPastDay(editingDay.fecha);
    const existingRecord = records.get(editingDay.fecha);
    const isPastDayModification = isEditingPastDay && !isAdmin && existingRecord?.estado;
    
    const updated: RegistroDia = {
      ...editingDay,
      ...hours,
      horas_vacaciones: isVac ? editingDay.horas_vacaciones || 1 : 0,
      // If non-admin edits a past day that already had a record, mark as pending approval
      pendiente_aprobacion: isPastDayModification ? true : editingDay.pendiente_aprobacion,
      aprobado: isPastDayModification ? false : (isEditingPastDay ? editingDay.aprobado : false),
      fecha_original_fichada: editingDay.fecha_original_fichada || (existingRecord ? null : new Date().toISOString().split('T')[0]),
    };
    await saveRecord(updated);
    
    // Recalc vacations
    if (isVac || records.get(editingDay.fecha)?.estado === 'vacaciones') {
      await recalcVacaciones();
    }
    
    setShowDayModal(false);
    if (isPastDayModification) {
      toast.info('Modificación enviada. Requiere aprobación del administrador.');
    } else {
      toast.success('Registro guardado');
    }
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
      setNewEmp({ nombre_completo: '', jornada_diaria_horas: 40, vacaciones_anuales: 22, user_email: '' });
      setShowAddEmployee(false);
      toast.success('Empleado añadido');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Delete employee (triggered from AlertDialog)
  const confirmDeleteEmployee = async () => {
    if (!deleteEmpTarget) return;
    const id = deleteEmpTarget;
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
    setDeleteEmpTarget(null);
  };

  // Month totals
  const monthTotals = useMemo(() => {
    let ordinarias = 0, extra = 0, complementarias = 0, vacDays = 0, worked = 0, unsigned = 0;
    let bajaDays = 0, permisoDays = 0, festivoDays = 0, descansoDays = 0;
    for (let d = 1; d <= numDays; d++) {
      const fecha = formatDate(year, month, d);
      const rec = records.get(fecha);
      if (!rec) continue;
      ordinarias += Number(rec.horas_ordinarias) || 0;
      extra += Number(rec.horas_extra) || 0;
      complementarias += Number(rec.horas_complementarias) || 0;
      if (rec.estado === 'vacaciones') vacDays += Number(rec.horas_vacaciones) || 1;
      if (rec.estado === 'baja') bajaDays++;
      if (rec.estado === 'permiso') permisoDays++;
      if (rec.estado === 'festivo') festivoDays++;
      if (rec.estado === 'descanso') descansoDays++;
      if (['trabajado', 'teletrabajo'].includes(rec.estado)) worked++;
      if (rec.estado && !rec.firma_data && !isFuture(fecha)) unsigned++;
    }
    return { ordinarias, extra, complementarias, vacDays, worked, unsigned, bajaDays, permisoDays, festivoDays, descansoDays };
  }, [records, numDays, year, month, today]);

  // Weekly totals (current week within displayed month)
  const weekTotals = useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay() || 7; // 1=Mon...7=Sun
    const monday = new Date(now);
    monday.setDate(now.getDate() - dayOfWeek + 1);

    let totalHours = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      if (d.getMonth() !== month || d.getFullYear() !== year) continue;
      const fecha = formatDate(d.getFullYear(), d.getMonth(), d.getDate());
      const rec = records.get(fecha);
      if (rec) totalHours += Number(rec.horas_totales) || 0;
    }
    return totalHours;
  }, [records, month, year]);

  // Export all employees summary for the month
  const handleExportAllEmployees = useCallback(async () => {
    if (empleados.length === 0) { toast.error('No hay empleados'); return; }
    toast.loading('Generando resumen...', { id: 'export-summary' });
    try {
      const start = formatDate(year, month, 1);
      const end = formatDate(year, month, daysInMonth(year, month));
      const rows: Record<string, any>[] = [];

      for (const emp of empleados.filter(e => e.activo)) {
        const recs: any[] = await api.getRegistrosHorario(emp.id, start, end);
        let ordinarias = 0, extra = 0, totales = 0, vacDays = 0, bajaDays = 0, permisoDays = 0, worked = 0, unsigned = 0;
        for (const r of recs) {
          ordinarias += Number(r.horas_ordinarias) || 0;
          extra += Number(r.horas_extra) || 0;
          totales += Number(r.horas_totales) || 0;
          if (r.estado === 'vacaciones') vacDays++;
          if (r.estado === 'baja') bajaDays++;
          if (r.estado === 'permiso') permisoDays++;
          if (['trabajado', 'teletrabajo'].includes(r.estado)) worked++;
          if (r.estado && !r.firma_data) unsigned++;
        }
        rows.push({
          empleado: emp.nombre_completo,
          dias_trabajados: worked,
          horas_ordinarias: Math.round(ordinarias * 100) / 100,
          horas_extra: Math.round(extra * 100) / 100,
          horas_totales: Math.round(totales * 100) / 100,
          dias_vacaciones: vacDays,
          dias_baja: bajaDays,
          dias_permiso: permisoDays,
          dias_sin_firmar: unsigned,
        });
      }

      const config = EXPORT_CONFIGS.resumenHorasEmpleados;
      const filename = `${config.title}_${MONTHS_ES[month]}_${year}`;
      exportToPDF(rows, filename, config.columns, `${config.title} — ${MONTHS_ES[month]} ${year}`, {
        empresa: empresaConfig.razon_social,
        cif: empresaConfig.cif,
      });
      exportToCSV(rows, filename, config.columns);
      toast.success('Resumen exportado (PDF + CSV)', { id: 'export-summary' });
    } catch (err: any) {
      toast.error('Error al generar resumen: ' + (err.message || ''), { id: 'export-summary' });
    }
  }, [empleados, year, month, empresaConfig]);

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
            {!isPersonal && (
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
            )}
            {isPersonal && currentEmpleado && (
              <Badge variant="outline" className="text-sm px-3 py-1.5">{currentEmpleado.nombre_completo}</Badge>
            )}
            {isAdmin && (
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" variant="outline" onClick={() => setShowAddEmployee(true)}>
                  <UserPlus className="w-4 h-4 sm:mr-1" /> <span className="hidden sm:inline">Añadir</span>
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowManageEmployees(true)}>
                  <Users className="w-4 h-4 sm:mr-1" /> <span className="hidden sm:inline">Gestionar</span>
                </Button>
                <Button size="sm" variant="outline" onClick={() => {
                  setEditEmpresa({ ...empresaConfig });
                  setShowEmpresaConfig(true);
                }}>
                  <Settings2 className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowAuditLog(!showAuditLog)}>
                  <HistoryIcon className="w-4 h-4 sm:mr-1" /> <span className="hidden sm:inline">Auditoría</span>
                </Button>
                <Button size="sm" variant="outline" onClick={handleExportAllEmployees}>
                  <FileDown className="w-4 h-4 sm:mr-1" /> <span className="hidden sm:inline">Resumen horas</span>
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
                <Badge variant="outline" className="text-xs text-[hsl(var(--success))]">
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
                    signatures: Array.from(records.values())
                      .filter(r => r.firma_data && r.firma_data.startsWith('data:'))
                      .map(r => ({ fecha: r.fecha, firma_data: r.firma_data })),
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
                      <TableHead className="text-xs text-center w-12">Firma</TableHead>
                      <TableHead className="text-xs text-center w-10">Rev.</TableHead>
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
                      const hasRevision = rec?.marcado_revision;

                      return (
                        <TableRow
                          key={dayNum}
                          className={`transition-colors ${future ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-muted/50'} ${isToday ? 'bg-primary/5 border-l-2 border-l-primary' : ''} ${isWeekend && !rec?.estado ? 'bg-muted/30' : ''} ${hasRevision ? 'bg-destructive/5 border-l-2 border-l-destructive' : ''}`}
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
                          <TableCell className="text-xs text-center">
                            {rec?.firma_data ? (
                              <span title="Firmado" className="text-[hsl(var(--success))]">✅</span>
                            ) : rec?.estado ? (
                              <span title="Pendiente" className="text-[hsl(38,92%,50%)]">⚠️</span>
                            ) : null}
                            {rec?.updated_at && rec?.estado && (
                              <span className="block text-[9px] text-muted-foreground mt-0.5" title={`Última modificación: ${new Date(rec.updated_at).toLocaleString('es-ES')}`}>
                                {new Date(rec.updated_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })} {new Date(rec.updated_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-center p-1">
                            {isAdmin && rec?.estado && !future ? (
                              <button
                                onClick={(e) => toggleRevision(dayNum, e)}
                                className={`p-1 rounded transition-colors ${hasRevision ? 'text-destructive hover:text-destructive/70' : 'text-muted-foreground/30 hover:text-destructive/50'}`}
                                title={hasRevision ? `Revisión: ${rec.motivo_revision || 'Sin motivo'}` : 'Marcar para revisión'}
                              >
                                <AlertTriangle className="w-4 h-4" />
                              </button>
                            ) : hasRevision ? (
                              <span title={`Revisión: ${rec?.motivo_revision || 'Revisar este registro'}`} className="text-destructive">
                                <AlertTriangle className="w-4 h-4 inline" />
                              </span>
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
            <CardContent className="p-4 space-y-4">
              {/* Horas */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div className="p-3 rounded-lg bg-primary/5">
                  <p className="text-xs text-muted-foreground">Horas esta semana</p>
                  <p className="text-xl font-bold text-primary">{hoursToHM(weekTotals)}</p>
                  <p className="text-[10px] text-muted-foreground">Jornada: {currentEmpleado?.jornada_diaria_horas || 40}h/sem</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Horas totales (mes)</p>
                  <p className="text-xl font-bold">{hoursToHM(monthTotals.ordinarias + monthTotals.extra)}</p>
                  <p className="text-[10px] text-muted-foreground">{hoursToHM(monthTotals.ordinarias)} ord + {hoursToHM(monthTotals.extra)} extra</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Días trabajados</p>
                  <p className="text-xl font-bold">{monthTotals.worked}</p>
                  <p className="text-[10px] text-muted-foreground">{monthTotals.unsigned > 0 ? `${monthTotals.unsigned} sin firmar ⚠️` : 'Todo firmado ✅'}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">🏖 Vacaciones (mes)</p>
                  <p className="text-xl font-bold text-primary">{monthTotals.vacDays} días</p>
                </div>
              </div>

              {/* Singularidades */}
              {(monthTotals.bajaDays > 0 || monthTotals.permisoDays > 0 || monthTotals.festivoDays > 0 || monthTotals.descansoDays > 0) && (
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-xs text-muted-foreground font-medium">Singularidades:</span>
                  {monthTotals.bajaDays > 0 && <Badge variant="secondary" className="text-xs">🏥 {monthTotals.bajaDays} baja</Badge>}
                  {monthTotals.permisoDays > 0 && <Badge variant="secondary" className="text-xs">📋 {monthTotals.permisoDays} permiso</Badge>}
                  {monthTotals.festivoDays > 0 && <Badge variant="secondary" className="text-xs">🎉 {monthTotals.festivoDays} festivo</Badge>}
                  {monthTotals.descansoDays > 0 && <Badge variant="secondary" className="text-xs">😴 {monthTotals.descansoDays} descanso</Badge>}
                </div>
              )}

              {/* Vacaciones anuales */}
              <div className="pt-3 border-t flex flex-col sm:flex-row items-center justify-between gap-2">
                <div className="flex items-center gap-2 sm:gap-4 text-sm flex-wrap justify-center sm:justify-start">
                  <span>🏖 Vacaciones {year}:</span>
                  <Badge variant="outline" className="text-xs">{vacSaldo.asignadas} asignadas</Badge>
                  <Badge variant="secondary" className="text-xs">{vacSaldo.consumidas} consumidas</Badge>
                  <Badge className={`text-xs ${vacSaldo.asignadas - vacSaldo.consumidas > 0 ? 'bg-success text-success-foreground' : 'bg-destructive text-destructive-foreground'}`}>
                    {(vacSaldo.asignadas - vacSaldo.consumidas).toFixed(1)} pendientes
                  </Badge>
                </div>
                {isAdmin && (
                  <Button size="sm" variant="outline" className="text-xs" onClick={() => setVacDialog({ value: String(vacSaldo.asignadas) })}>
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
            ) : isPersonal ? (
              <p>No tienes una ficha de empleado vinculada a tu usuario. Contacta con el administrador.</p>
            ) : (
              <p>Selecciona un empleado para ver su registro</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* AUDIT LOG PANEL */}
      {isAdmin && showAuditLog && (
        <AuditLogPanel albergueId={albergueId} empleados={empleados.map(e => ({ id: e.id, nombre_completo: e.nombre_completo }))} />
      )}

      {/* DAY MODAL */}
      <Dialog open={showDayModal} onOpenChange={setShowDayModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5" />
              {editingDay && formatDisplayDate(editingDay.fecha)}
              {editingDay && (() => {
                const [y, m, d] = editingDay.fecha.split('-').map(Number);
                return (
                  <span className="text-sm font-normal text-muted-foreground">
                    ({DAYS_ES[new Date(y, m - 1, d).getDay()]})
                  </span>
                );
              })()}
            </DialogTitle>
          </DialogHeader>
          {editingDay && (() => {
            const readOnly = isAdmin;
            const needsWork = ['trabajado', 'teletrabajo'].includes(editingDay.estado);
            const liveCalc = needsWork && currentEmpleado ? calcHours(editingDay, currentEmpleado.jornada_diaria_horas) : null;
            const estado = ESTADOS.find(e => e.value === editingDay.estado);

            return (
            <div className="space-y-4">
              {/* Read-only banner for admin */}
              {readOnly && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Vista de solo lectura (administrador)</p>
                </div>
              )}

              {/* Admin review banner */}
              {editingDay.marcado_revision && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-destructive">Marcado para revisión</p>
                    {editingDay.motivo_revision && (
                      <p className="text-xs text-muted-foreground mt-1">{editingDay.motivo_revision}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Estado */}
              <div className="space-y-2">
                <Label>Estado</Label>
                {readOnly ? (
                  estado ? (
                    <Badge className={`text-sm px-3 py-1 ${estado.color}`}>{estado.icon} {estado.label}</Badge>
                  ) : <p className="text-sm text-muted-foreground">Sin estado</p>
                ) : (
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
                )}
              </div>

              {/* Horarios */}
              {needsWork && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      ['Entrada Mañana', 'entrada_manana'],
                      ['Salida Mañana', 'salida_manana'],
                      ['Entrada Tarde', 'entrada_tarde'],
                      ['Salida Tarde', 'salida_tarde'],
                      ['Entrada Noche', 'entrada_noche'],
                      ['Salida Noche', 'salida_noche'],
                    ] as const).map(([label, field]) => (
                      <div key={field} className="space-y-1">
                        <Label className="text-xs">{label}</Label>
                        {readOnly ? (
                          <p className="text-sm font-mono h-10 flex items-center">{editingDay[field]?.substring(0, 5) || '—'}</p>
                        ) : (
                          <Input type="time" value={editingDay[field]?.substring(0, 5) || ''} onChange={e => setEditingDay({ ...editingDay, [field]: e.target.value || null })} />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Live hour calculation */}
                  {liveCalc && (
                    <div className="flex items-center gap-4 p-3 rounded-lg bg-primary/5 border border-primary/10">
                      <Clock className="w-4 h-4 text-primary" />
                      <div className="flex gap-4 text-sm">
                        <span><strong className="text-primary">{hoursToHM(liveCalc.horas_totales)}</strong> total</span>
                        <span className="text-muted-foreground">{hoursToHM(liveCalc.horas_ordinarias)} ord</span>
                        {liveCalc.horas_extra > 0 && <span className="text-destructive font-medium">+{hoursToHM(liveCalc.horas_extra)} extra</span>}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Vacaciones */}
              {editingDay.estado === 'vacaciones' && (
                <div className="space-y-2">
                  <Label>Tipo de vacaciones</Label>
                  {readOnly ? (
                    <p className="text-sm">{editingDay.horas_vacaciones === 0.5 ? 'Medio día (mañana)' : 'Día completo'}</p>
                  ) : (
                    <Select value={String(editingDay.horas_vacaciones || 1)} onValueChange={v => setEditingDay({ ...editingDay, horas_vacaciones: Number(v) })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Día completo</SelectItem>
                        <SelectItem value="0.5">Medio día (mañana)</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}

              {/* Observaciones */}
              <div className="space-y-1">
                <Label className="text-xs">Observaciones</Label>
                {readOnly ? (
                  <p className="text-sm">{editingDay.observaciones || <span className="text-muted-foreground italic">Sin observaciones</span>}</p>
                ) : (
                  <Textarea value={editingDay.observaciones} onChange={e => setEditingDay({ ...editingDay, observaciones: e.target.value })} rows={2} />
                )}
              </div>

              {/* Última modificación (visible para admin) */}
              {editingDay.updated_at && (
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground bg-muted/40 rounded px-2 py-1">
                  <HistoryIcon className="w-3 h-3" />
                  Última modificación: {new Date(editingDay.updated_at).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              )}

              {/* Firma */}
              <div className="space-y-2">
                <Label>Firma</Label>
                {readOnly ? (
                  editingDay.firma_data && editingDay.firma_data.startsWith('data:') ? (
                    <div className="border rounded-lg p-2 bg-background">
                      <img src={editingDay.firma_data} alt="Firma" className="max-h-24 mx-auto" />
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Sin firma</p>
                  )
                ) : (
                  <SignaturePad
                    value={editingDay.firma_data}
                    onChange={dataUrl => setEditingDay({ ...editingDay, firma_data: dataUrl, firmado_en: dataUrl ? new Date().toISOString() : null })}
                  />
                )}
                {editingDay.firmado_en && (
                  <p className="text-xs text-muted-foreground">
                    Firmado el {new Date(editingDay.firmado_en).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })} {new Date(editingDay.firmado_en).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowDayModal(false)}>
                  {readOnly ? 'Cerrar' : 'Cancelar'}
                </Button>
                {!readOnly && (
                  <Button onClick={handleSaveDay} disabled={saving}>
                    <Save className="w-4 h-4 mr-1" /> {saving ? 'Guardando...' : 'Guardar'}
                  </Button>
                )}
              </div>
            </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ADD EMPLOYEE MODAL */}
      <Dialog open={showAddEmployee} onOpenChange={setShowAddEmployee}>
        <DialogContent className="max-w-sm" aria-describedby={undefined}>
          <DialogHeader><DialogTitle>Añadir empleado</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Nombre completo</Label>
              <Input value={newEmp.nombre_completo} onChange={e => setNewEmp({ ...newEmp, nombre_completo: e.target.value })} placeholder="Nombre y apellidos" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Vincular a usuario (sesión)</Label>
              <Select value={newEmp.user_email || '__none__'} onValueChange={v => setNewEmp({ ...newEmp, user_email: v === '__none__' ? '' : v })}>
                <SelectTrigger><SelectValue placeholder="Sin vincular" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— Sin vincular —</SelectItem>
                  {usuariosDisponibles.map(u => (
                    <SelectItem key={u.email} value={u.email}>
                      {u.email} ({u.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground">
                Al vincular un usuario, este verá su ficha al entrar en Registro Horario y podrá fichar su jornada.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Jornada semanal (h)</Label>
                <Input type="number" min={1} max={60} step={0.5} value={newEmp.jornada_diaria_horas}
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
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto" aria-describedby={undefined}>
          <DialogHeader><DialogTitle>Gestionar empleados</DialogTitle></DialogHeader>
          <div className="space-y-2">
            {empleados.map(emp => (
              <div key={emp.id} className="flex items-center justify-between p-3 border rounded-lg gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{emp.nombre_completo}</p>
                  <p className="text-xs text-muted-foreground">
                    Jornada semanal: {emp.jornada_diaria_horas}h | Vacaciones: {emp.vacaciones_anuales} días
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-[10px] text-muted-foreground">Usuario:</span>
                    <Select
                      value={emp.user_email || '__none__'}
                      onValueChange={async (v) => {
                        const newEmail = v === '__none__' ? '' : v;
                        try {
                          await api.updateEmpleadoHorario(emp.id, { user_email: newEmail });
                          setEmpleados(prev => prev.map(e => e.id === emp.id ? { ...e, user_email: newEmail || undefined } : e));
                          toast.success('Usuario vinculado actualizado');
                        } catch (err: any) { toast.error(err.message); }
                      }}
                    >
                      <SelectTrigger className="h-6 text-[10px] w-40">
                        <SelectValue placeholder="Sin vincular" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">— Sin vincular —</SelectItem>
                        {usuariosDisponibles.map(u => (
                          <SelectItem key={u.email} value={u.email}>
                            {u.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button size="icon" variant="ghost" onClick={() => setDeleteEmpTarget(emp.id)}>
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
        <DialogContent className="max-w-sm" aria-describedby={undefined}>
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

      {/* DELETE EMPLOYEE CONFIRMATION */}
      <AlertDialog open={!!deleteEmpTarget} onOpenChange={() => setDeleteEmpTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar empleado?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminarán todos sus registros horarios. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteEmployee} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* REVISION DIALOG */}
      <Dialog open={!!revisionDialog} onOpenChange={() => setRevisionDialog(null)}>
        <DialogContent className="max-w-sm" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" /> Marcar para revisión
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-sm">Motivo (opcional)</Label>
              <Textarea
                value={revisionDialog?.motivo || ''}
                onChange={e => setRevisionDialog(prev => prev ? { ...prev, motivo: e.target.value } : null)}
                rows={2}
                placeholder="Describe el motivo de la revisión..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRevisionDialog(null)}>Cancelar</Button>
              <Button variant="destructive" onClick={confirmRevision}>Marcar revisión</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* VACATION EDIT DIALOG */}
      <Dialog open={!!vacDialog} onOpenChange={() => setVacDialog(null)}>
        <DialogContent className="max-w-xs" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Editar vacaciones asignadas</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-sm">Días de vacaciones asignadas</Label>
              <Input
                type="number"
                min={0}
                max={60}
                value={vacDialog?.value || ''}
                onChange={e => setVacDialog(prev => prev ? { ...prev, value: e.target.value } : null)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setVacDialog(null)}>Cancelar</Button>
              <Button onClick={async () => {
                if (!vacDialog || !vacDialog.value || isNaN(Number(vacDialog.value))) return;
                try {
                  await api.updateVacacionesSaldo(selectedEmpleado, year, { asignadas: Number(vacDialog.value), consumidas: vacSaldo.consumidas });
                  setVacSaldo(prev => ({ ...prev, asignadas: Number(vacDialog.value) }));
                  toast.success('Vacaciones actualizadas');
                  setVacDialog(null);
                } catch (err: any) {
                  toast.error(err.message);
                }
              }}>
                <Save className="w-4 h-4 mr-1" /> Guardar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { UtensilsCrossed, Clock, Download, Upload, FileText, Trash2 } from 'lucide-react';
import ExportButton from '@/components/ExportButton';
import { api } from '@/lib/api';
import { UserRole } from '@/types';
import { formatDistanceToNow, startOfWeek, endOfWeek, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useI18n } from '@/i18n/I18nContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';

interface Props {
  store: ReturnType<typeof import('@/hooks/useAlbergueStore').useAlbergueStore>;
  role: UserRole;
}

const SEPARAR_OPTIONS = ['Todas', 'Desayuno', 'Comida', 'Cena'];
const DIAS_OPTIONS = ['Todos los días', 'Laborables', 'Fines de semana', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const MOTIVO_OPTIONS = ['Accem', 'Empleo', 'Formación', 'Médico', 'Otros'];
const ESTADO_OPTIONS = ['Activo', 'Pausado'] as const;

const ROOM_COLORS: Record<string, string> = {
  '1.1': 'bg-[hsl(212,72%,90%)] text-[hsl(212,72%,35%)] border-[hsl(212,72%,75%)]',
  '1.2': 'bg-[hsl(142,60%,90%)] text-[hsl(142,60%,30%)] border-[hsl(142,60%,70%)]',
  '1.3': 'bg-[hsl(38,92%,90%)] text-[hsl(38,92%,30%)] border-[hsl(38,92%,70%)]',
  '2.1': 'bg-[hsl(280,60%,92%)] text-[hsl(280,60%,35%)] border-[hsl(280,60%,75%)]',
  '2.2': 'bg-[hsl(340,60%,92%)] text-[hsl(340,60%,35%)] border-[hsl(340,60%,75%)]',
  '2.3': 'bg-[hsl(180,50%,90%)] text-[hsl(180,50%,30%)] border-[hsl(180,50%,70%)]',
};

const DIET_COLORS: Record<string, string> = {
  'Omnívora estándar': 'bg-secondary text-secondary-foreground',
  'Halal': 'bg-[hsl(142,60%,90%)] text-[hsl(142,60%,30%)]',
  'Kosher': 'bg-[hsl(240,50%,92%)] text-[hsl(240,50%,35%)]',
  'Vegetariana': 'bg-[hsl(80,60%,90%)] text-[hsl(80,60%,30%)]',
  'Vegana': 'bg-[hsl(142,50%,88%)] text-[hsl(142,50%,25%)]',
  'Sin cerdo (no halal)': 'bg-[hsl(25,80%,90%)] text-[hsl(25,80%,30%)]',
  'Situación especial': 'bg-[hsl(38,92%,90%)] text-[hsl(38,92%,30%)]',
  'Alergias e intolerancias': 'bg-[hsl(0,72%,92%)] text-destructive',
};

function MultiCheckbox({ options, selected, onChange, label }: { options: string[]; selected: string[]; onChange: (val: string[]) => void; label: string }) {
  const toggleOption = (opt: string) => {
    if (opt === options[0]) { onChange([options[0]]); return; }
    const without = selected.filter(s => s !== options[0]);
    if (without.includes(opt)) {
      const next = without.filter(s => s !== opt);
      onChange(next.length === 0 ? [options[0]] : next);
    } else {
      onChange([...without, opt]);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="min-w-[120px] h-8 text-xs justify-start font-normal truncate">
          {selected.length === 1 && selected[0] === options[0] ? options[0] : selected.join(', ')}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2" align="start">
        <p className="text-xs font-medium text-muted-foreground mb-2">{label}</p>
        {options.map(opt => (
          <label key={opt} className="flex items-center gap-2 py-1 px-1 hover:bg-muted rounded cursor-pointer text-xs">
            <Checkbox checked={selected.includes(opt)} onCheckedChange={() => toggleOption(opt)} />
            {opt}
          </label>
        ))}
      </PopoverContent>
    </Popover>
  );
}

export default function ComedorTab({ store, role }: Props) {
  const { huespedActivos, comedor, updateComedor, currentAlbergue } = store;
  const { t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [menuInfo, setMenuInfo] = useState<{ exists: boolean; filename?: string; uploadedAt?: string; size?: number } | null>(null);
  const [uploading, setUploading] = useState(false);
  const albergueId = currentAlbergue?.id;

  const loadMenuInfo = useCallback(() => {
    if (!albergueId) return;
    api.getMenuInfo(albergueId).then(setMenuInfo).catch(() => setMenuInfo({ exists: false }));
  }, [albergueId]);

  useEffect(() => { loadMenuInfo(); }, [loadMenuInfo]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !albergueId) return;
    setUploading(true);
    try {
      await api.uploadMenu(albergueId, file);
      toast.success(t.menuUploaded);
      loadMenuInfo();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteMenu = async () => {
    if (!albergueId) return;
    try {
      await api.deleteMenu(albergueId);
      toast.success(t.menuDeleted);
      setMenuInfo({ exists: false });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const canEdit = true;

  const entries = useMemo(() => {
    return huespedActivos
      .sort((a, b) => {
        const roomCmp = a.habitacion.localeCompare(b.habitacion);
        return roomCmp !== 0 ? roomCmp : a.cama - b.cama;
      })
      .map((h, idx) => {
        const entry = comedor.find(c => c.huespedId === h.id);
        return {
          num: idx + 1,
          huesped: h,
          comedor: entry || {
            huespedId: h.id, estado: 'Activo' as const,
            separarComidas: ['Todas'], diasSeparar: ['Todos los días'],
            motivoAusencia: '', observaciones: '', particularidades: '',
            ultimaModificacion: new Date().toISOString(),
          },
        };
      });
  }, [huespedActivos, comedor]);

  const handleUpdate = (huespedId: string, field: string, value: unknown) => {
    updateComedor(huespedId, { [field]: value } as Partial<import('@/types').ComedorEntry>);
  };

  const downloadWeeklyPdf = useCallback(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const weekLabel = `${format(weekStart, 'dd/MM/yyyy')} - ${format(weekEnd, 'dd/MM/yyyy')}`;

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    // Title
    doc.setFontSize(16);
    doc.text(`${currentAlbergue?.nombre || 'Albergue'} — ${t.diningOrganization}`, 14, 15);
    doc.setFontSize(11);
    doc.text(`${t.weekOf} ${weekLabel}`, 14, 22);
    doc.setFontSize(9);
    doc.text(`${entries.length} ${t.diners}`, 14, 27);

    const headers = ['#', t.fullName, t.roomShort, t.status, t.dietType, t.foodParticularities, t.separateMeals, t.daysToSeparate, t.absenceReason, t.observations];

    const body = entries.map(({ num, huesped, comedor: c }) => {
      const separarArr = Array.isArray(c.separarComidas) ? c.separarComidas : [c.separarComidas || 'Todas'];
      const diasArr = Array.isArray(c.diasSeparar) ? c.diasSeparar : [c.diasSeparar || 'Todos los días'];
      const estado = c.estado || 'Activo';
      return [
        num.toString(),
        huesped.nombre.toUpperCase(),
        `Hab ${huesped.habitacion}`,
        estado === 'Activo' ? t.active : t.paused,
        huesped.dieta,
        c.particularidades || '—',
        separarArr.join(', '),
        diasArr.join(', '),
        c.motivoAusencia || '—',
        c.observaciones || '—',
      ];
    });

    autoTable(doc, {
      startY: 31,
      head: [headers],
      body,
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold', fontSize: 7 },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      columnStyles: {
        0: { cellWidth: 8 },
        1: { cellWidth: 35 },
        2: { cellWidth: 15 },
        3: { cellWidth: 16 },
        4: { cellWidth: 28 },
        5: { cellWidth: 35 },
        6: { cellWidth: 30 },
        7: { cellWidth: 35 },
        8: { cellWidth: 22 },
        9: { cellWidth: 40 },
      },
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(150);
      doc.text(`${format(now, 'dd/MM/yyyy HH:mm')} — ${i}/${pageCount}`, doc.internal.pageSize.getWidth() - 14, doc.internal.pageSize.getHeight() - 5, { align: 'right' });
    }

    doc.save(`comedor_${format(weekStart, 'yyyy-MM-dd')}.pdf`);
  }, [entries, t, currentAlbergue]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-primary" /> {t.diningOrganization}
          </h2>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge variant="outline" className="text-xs">{entries.length} {t.diners}</Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton type="comedor" getData={() => entries.map(e => ({
            nombre: e.huesped.nombre,
            dieta: e.huesped.dieta,
            estado: e.comedor.estado,
            particularidades: e.comedor.particularidades,
            observaciones: e.comedor.observaciones,
          }))} />
          <Button variant="outline" size="sm" onClick={downloadWeeklyPdf} disabled={entries.length === 0} className="flex items-center gap-2">
            <Download className="w-4 h-4" /> {t.downloadWeeklyPdf}
          </Button>
        </div>
      </div>

      {/* Menu upload section */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">{t.currentMenu}:</span>
            </div>
            {menuInfo?.exists ? (
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="text-xs">
                  {menuInfo.filename}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {t.menuUploadedAt} {menuInfo.uploadedAt ? formatDistanceToNow(new Date(menuInfo.uploadedAt), { addSuffix: true, locale: es }) : ''}
                </span>
                <a href={api.getMenuDownloadUrl(albergueId!)} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                    <Download className="w-3 h-3" /> {t.downloadMenu}
                  </Button>
                </a>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1 text-destructive hover:text-destructive" onClick={handleDeleteMenu}>
                  <Trash2 className="w-3 h-3" /> {t.deleteMenu}
                </Button>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">{t.noMenuUploaded}</span>
            )}
            <div className="sm:ml-auto">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.doc,.xlsx,.jpg,.png"
                className="hidden"
                onChange={handleUpload}
              />
              <Button
                variant="default"
                size="sm"
                className="gap-1"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Upload className="w-4 h-4" />
                {uploading ? t.uploadingMenu : t.uploadMenu}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {entries.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">{t.noActiveGuests}</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>{t.fullName}</TableHead>
                    <TableHead className="w-16">{t.roomShort}</TableHead>
                    <TableHead className="w-24">{t.status}</TableHead>
                    <TableHead>{t.dietType}</TableHead>
                    <TableHead>{t.foodParticularities}</TableHead>
                    <TableHead>{t.separateMeals}</TableHead>
                    <TableHead>{t.daysToSeparate}</TableHead>
                    <TableHead>{t.absenceReason}</TableHead>
                    <TableHead>{t.lastModification}</TableHead>
                    <TableHead>{t.observations}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map(({ num, huesped, comedor: c }) => {
                    const separarArr = Array.isArray(c.separarComidas) ? c.separarComidas : [c.separarComidas || 'Todas'];
                    const diasArr = Array.isArray(c.diasSeparar) ? c.diasSeparar : [c.diasSeparar || 'Todos los días'];
                    const estado = c.estado || 'Activo';
                    const lastMod = c.ultimaModificacion
                      ? formatDistanceToNow(new Date(c.ultimaModificacion), { addSuffix: true, locale: es })
                      : '—';

                    return (
                      <TableRow key={huesped.id}>
                        <TableCell className="text-muted-foreground text-xs">{num}</TableCell>
                        <TableCell className="font-medium whitespace-nowrap">{huesped.nombre.toUpperCase()}</TableCell>
                        <TableCell>
                          <Badge className={`text-xs font-bold border ${ROOM_COLORS[huesped.habitacion] || ''}`} variant="outline">
                            {huesped.habitacion}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {canEdit ? (
                            <Select value={estado} onValueChange={v => handleUpdate(huesped.id, 'estado', v)}>
                              <SelectTrigger className="h-8 text-xs w-24 p-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {ESTADO_OPTIONS.map(o => (
                                  <SelectItem key={o} value={o}>
                                    <span className={o === 'Pausado' ? 'text-destructive font-medium' : 'text-[hsl(142,60%,30%)] font-medium'}>
                                      {o === 'Activo' ? t.active : t.paused}
                                    </span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge className={estado === 'Pausado'
                              ? 'bg-[hsl(0,72%,92%)] text-destructive text-xs'
                              : 'bg-[hsl(142,60%,90%)] text-[hsl(142,60%,30%)] text-xs'
                            }>
                              {estado === 'Activo' ? t.active : t.paused}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={`text-xs ${DIET_COLORS[huesped.dieta] || 'bg-secondary text-secondary-foreground'}`} variant="secondary">
                            {huesped.dieta}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Input
                            className="min-w-[160px] h-8 text-xs"
                            value={c.particularidades}
                            onChange={e => handleUpdate(huesped.id, 'particularidades', e.target.value)}
                            placeholder={t.foodPlaceholder}
                            readOnly={!canEdit}
                          />
                        </TableCell>
                        <TableCell>
                          <MultiCheckbox options={SEPARAR_OPTIONS} selected={separarArr} onChange={v => handleUpdate(huesped.id, 'separarComidas', v)} label={t.separateMeals} />
                        </TableCell>
                        <TableCell>
                          <MultiCheckbox options={DIAS_OPTIONS} selected={diasArr} onChange={v => handleUpdate(huesped.id, 'diasSeparar', v)} label={t.daysToSeparate} />
                        </TableCell>
                        <TableCell>
                          <Select value={c.motivoAusencia || 'none'} onValueChange={v => handleUpdate(huesped.id, 'motivoAusencia', v === 'none' ? '' : v)}>
                            <SelectTrigger className="min-w-[110px] h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">—</SelectItem>
                              {MOTIVO_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {lastMod}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Input
                            className="min-w-[140px] h-8 text-xs"
                            value={c.observaciones}
                            onChange={e => handleUpdate(huesped.id, 'observaciones', e.target.value)}
                            placeholder={t.observationsPlaceholder}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

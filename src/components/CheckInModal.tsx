import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DIETAS, Dieta } from '@/types';
import { useI18n } from '@/i18n/I18nContext';

interface FormData {
  nombre: string; nie: string; nacionalidad: string;
  idioma: string; dieta: Dieta; fechaEntrada: string; notas: string;
  fechaCheckout?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: FormData) => void;
  title?: string;
  submitLabel?: string;
  defaultDate?: string;
  initialValues?: Partial<FormData>;
  showCheckout?: boolean;
}

const emptyForm = (defaultDate?: string): FormData => ({
  nombre: '', nie: '', nacionalidad: '', idioma: '',
  dieta: 'Omnívora estándar',
  fechaEntrada: defaultDate || new Date().toISOString().split('T')[0],
  notas: '',
  fechaCheckout: '',
});

export default function CheckInModal({ open, onClose, onSubmit, title = 'Check-in', submitLabel = 'Registrar', defaultDate, initialValues, showCheckout = false }: Props) {
  const [form, setForm] = useState<FormData>(() => ({ ...emptyForm(defaultDate), ...initialValues }));
  const { t } = useI18n();

  useEffect(() => {
    if (open) {
      setForm({ ...emptyForm(defaultDate), ...initialValues });
    }
  }, [open, initialValues, defaultDate]);

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const daysUntilCheckout = useMemo(() => {
    if (!form.fechaCheckout) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkout = new Date(form.fechaCheckout + 'T00:00:00');
    const diff = Math.ceil((checkout.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  }, [form.fechaCheckout]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim()) return;
    onSubmit(form);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t.name || 'Nombre y Apellidos'} *</Label>
              <Input value={form.nombre} onChange={e => update('nombre', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>NIE / {t.nationality}</Label>
              <Input value={form.nie} onChange={e => update('nie', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t.nationality}</Label>
              <Input value={form.nacionalidad} onChange={e => update('nacionalidad', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t.language}</Label>
              <Input value={form.idioma} onChange={e => update('idioma', e.target.value)} />
            </div>
            <div className="space-y-2 col-span-1 sm:col-span-2">
              <Label>{t.diet || 'Dieta'}</Label>
              <Select value={form.dieta} onValueChange={v => update('dieta', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DIETAS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t.entryDate || 'Fecha entrada'}</Label>
              <Input type="date" value={form.fechaEntrada} onChange={e => update('fechaEntrada', e.target.value)} />
            </div>
            {showCheckout && (
              <div className="space-y-2">
                <Label>{t.checkoutDate || 'Fecha salida'}</Label>
                <Input type="date" value={form.fechaCheckout || ''} onChange={e => update('fechaCheckout', e.target.value)} />
                {daysUntilCheckout !== null && (
                  <p className={`text-xs font-medium ${daysUntilCheckout <= 0 ? 'text-destructive' : daysUntilCheckout <= 3 ? 'text-[hsl(38,92%,50%)]' : 'text-primary'}`}>
                    {daysUntilCheckout > 0
                      ? `${daysUntilCheckout} ${daysUntilCheckout === 1 ? (t.day || 'día') : (t.days || 'días')} ${t.remaining || 'restantes'}`
                      : daysUntilCheckout === 0
                        ? t.checkoutToday || 'Sale hoy'
                        : t.checkoutPassed || 'Fecha de salida pasada'}
                  </p>
                )}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label>{t.notes}</Label>
            <Textarea value={form.notas} onChange={e => update('notas', e.target.value)} rows={3} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>{t.cancel}</Button>
            <Button type="submit">{submitLabel}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

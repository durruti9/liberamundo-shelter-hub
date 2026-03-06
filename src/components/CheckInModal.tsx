import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DIETAS, Dieta } from '@/types';

interface FormData {
  nombre: string; nie: string; nacionalidad: string;
  idioma: string; dieta: Dieta; fechaEntrada: string; notas: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: FormData) => void;
  title?: string;
  submitLabel?: string;
  defaultDate?: string;
  initialValues?: Partial<FormData>;
}

const emptyForm = (defaultDate?: string): FormData => ({
  nombre: '', nie: '', nacionalidad: '', idioma: '',
  dieta: 'Omnívora estándar',
  fechaEntrada: defaultDate || new Date().toISOString().split('T')[0],
  notas: '',
});

export default function CheckInModal({ open, onClose, onSubmit, title = 'Check-in', submitLabel = 'Registrar', defaultDate, initialValues }: Props) {
  const [form, setForm] = useState<FormData>(() => ({ ...emptyForm(defaultDate), ...initialValues }));

  useEffect(() => {
    if (open) {
      setForm({ ...emptyForm(defaultDate), ...initialValues });
    }
  }, [open, initialValues, defaultDate]);

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

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
              <Label>Nombre *</Label>
              <Input value={form.nombre} onChange={e => update('nombre', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>NIE / Documento</Label>
              <Input value={form.nie} onChange={e => update('nie', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Nacionalidad</Label>
              <Input value={form.nacionalidad} onChange={e => update('nacionalidad', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Idioma</Label>
              <Input value={form.idioma} onChange={e => update('idioma', e.target.value)} />
            </div>
            <div className="space-y-2 col-span-1 sm:col-span-2">
              <Label>Dieta</Label>
              <Select value={form.dieta} onValueChange={v => update('dieta', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DIETAS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Fecha entrada</Label>
              <Input type="date" value={form.fechaEntrada} onChange={e => update('fechaEntrada', e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea value={form.notas} onChange={e => update('notas', e.target.value)} rows={3} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit">{submitLabel}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

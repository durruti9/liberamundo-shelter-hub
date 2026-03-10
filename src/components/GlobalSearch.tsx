import { useState, useEffect, useCallback } from 'react';
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { BedDouble, FileWarning, CalendarPlus, MessageSquare, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SearchableItem {
  id: string;
  type: 'huesped' | 'incidencia' | 'llegada' | 'mensaje';
  title: string;
  subtitle?: string;
}

interface Props {
  huespedes: { id: string; nombre: string; habitacion: string; cama: number; activo: boolean }[];
  incidencias: { id: string; huespedNombres?: string[]; huespedNombre?: string; descripcion: string; resuelta: boolean }[];
  llegadas: { id: string; nombre: string; fechaLlegada: string }[];
  boardMessages: { id: string; texto: string; autor: string; tipo: string }[];
  onNavigate: (type: string, id?: string) => void;
}

const ICONS = {
  huesped: BedDouble,
  incidencia: FileWarning,
  llegada: CalendarPlus,
  mensaje: MessageSquare,
};

const TYPE_LABELS = {
  huesped: 'Huéspedes',
  incidencia: 'Incidencias',
  llegada: 'Llegadas',
  mensaje: 'Tablón',
};

export default function GlobalSearch({ huespedes, incidencias, llegadas, boardMessages, onNavigate }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(o => !o);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const items: SearchableItem[] = [
    ...huespedes.map(h => ({
      id: h.id,
      type: 'huesped' as const,
      title: h.nombre,
      subtitle: `Hab ${h.habitacion} - Cama ${h.cama} ${h.activo ? '(activo)' : '(inactivo)'}`,
    })),
    ...incidencias.map(i => ({
      id: i.id,
      type: 'incidencia' as const,
      title: i.huespedNombre,
      subtitle: i.descripcion.substring(0, 60) + (i.descripcion.length > 60 ? '...' : ''),
    })),
    ...llegadas.map(l => ({
      id: l.id,
      type: 'llegada' as const,
      title: l.nombre,
      subtitle: `Llegada: ${l.fechaLlegada}`,
    })),
    ...boardMessages.map(m => ({
      id: m.id,
      type: 'mensaje' as const,
      title: m.texto.substring(0, 50) + (m.texto.length > 50 ? '...' : ''),
      subtitle: `${m.autor} · ${m.tipo}`,
    })),
  ];

  const grouped = items.reduce((acc, item) => {
    if (!acc[item.type]) acc[item.type] = [];
    acc[item.type].push(item);
    return acc;
  }, {} as Record<string, SearchableItem[]>);

  const handleSelect = useCallback((item: SearchableItem) => {
    setOpen(false);
    const tabMap: Record<string, string> = {
      huesped: 'habitaciones',
      incidencia: 'incidencias',
      llegada: 'llegadas',
      mensaje: 'dashboard',
    };
    onNavigate(tabMap[item.type], item.id);
  }, [onNavigate]);

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)} className="gap-1.5">
        <Search className="w-4 h-4" />
        <span className="hidden md:inline text-xs text-muted-foreground">Ctrl+K</span>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Buscar huéspedes, incidencias, llegadas..." />
        <CommandList>
          <CommandEmpty>Sin resultados.</CommandEmpty>
          {Object.entries(grouped).map(([type, groupItems]) => {
            const Icon = ICONS[type as keyof typeof ICONS];
            return (
              <CommandGroup key={type} heading={TYPE_LABELS[type as keyof typeof TYPE_LABELS]}>
                {groupItems.slice(0, 8).map(item => (
                  <CommandItem key={`${item.type}-${item.id}`} onSelect={() => handleSelect(item)} className="gap-2">
                    <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm truncate">{item.title}</p>
                      {item.subtitle && <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            );
          })}
        </CommandList>
      </CommandDialog>
    </>
  );
}

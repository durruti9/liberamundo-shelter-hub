import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, PinOff, Pin, Trash2, StickyNote, Search } from 'lucide-react';
import { api, isApiAvailable } from '@/lib/api';
import { toast } from 'sonner';

interface Nota {
  id: string;
  titulo: string;
  contenido: string;
  color: string;
  pinned: boolean;
  created_at: string;
  updated_at: string;
}

interface Props {
  userEmail: string;
}

const STORAGE_KEY = 'notas_local';

function loadLocal(email: string): Nota[] {
  try {
    const data = localStorage.getItem(`${STORAGE_KEY}_${email}`);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

function saveLocal(email: string, notas: Nota[]) {
  localStorage.setItem(`${STORAGE_KEY}_${email}`, JSON.stringify(notas));
}

const NOTE_COLORS = [
  { name: 'Default', value: 'default', bg: 'bg-card', border: 'border-border' },
  { name: 'Coral', value: 'coral', bg: 'bg-[hsl(0,80%,95%)] dark:bg-[hsl(0,40%,18%)]', border: 'border-[hsl(0,80%,85%)] dark:border-[hsl(0,40%,30%)]' },
  { name: 'Melocotón', value: 'peach', bg: 'bg-[hsl(25,90%,94%)] dark:bg-[hsl(25,45%,18%)]', border: 'border-[hsl(25,90%,84%)] dark:border-[hsl(25,45%,30%)]' },
  { name: 'Arena', value: 'sand', bg: 'bg-[hsl(40,80%,92%)] dark:bg-[hsl(40,40%,18%)]', border: 'border-[hsl(40,80%,82%)] dark:border-[hsl(40,40%,30%)]' },
  { name: 'Menta', value: 'mint', bg: 'bg-[hsl(150,50%,93%)] dark:bg-[hsl(150,30%,16%)]', border: 'border-[hsl(150,50%,83%)] dark:border-[hsl(150,30%,28%)]' },
  { name: 'Salvia', value: 'sage', bg: 'bg-[hsl(130,30%,91%)] dark:bg-[hsl(130,20%,16%)]', border: 'border-[hsl(130,30%,81%)] dark:border-[hsl(130,20%,28%)]' },
  { name: 'Niebla', value: 'fog', bg: 'bg-[hsl(210,30%,94%)] dark:bg-[hsl(210,20%,18%)]', border: 'border-[hsl(210,30%,84%)] dark:border-[hsl(210,20%,28%)]' },
  { name: 'Lavanda', value: 'lavender', bg: 'bg-[hsl(270,50%,94%)] dark:bg-[hsl(270,30%,18%)]', border: 'border-[hsl(270,50%,84%)] dark:border-[hsl(270,30%,28%)]' },
  { name: 'Rosa', value: 'pink', bg: 'bg-[hsl(330,60%,94%)] dark:bg-[hsl(330,30%,18%)]', border: 'border-[hsl(330,60%,84%)] dark:border-[hsl(330,30%,28%)]' },
];

function getColorClasses(color: string) {
  return NOTE_COLORS.find(c => c.value === color) || NOTE_COLORS[0];
}

export default function NotasTab({ userEmail }: Props) {
  const [notas, setNotas] = useState<Nota[]>(() => loadLocal(userEmail));
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [newTitulo, setNewTitulo] = useState('');
  const [newContenido, setNewContenido] = useState('');
  const [newColor, setNewColor] = useState('default');
  const newInputRef = useRef<HTMLTextAreaElement>(null);
  const useApiRef = useRef(false);

  const syncLocal = useCallback((updated: Nota[]) => {
    saveLocal(userEmail, updated);
  }, [userEmail]);

  const fetchNotas = useCallback(async () => {
    if (!userEmail) return;
    const available = await isApiAvailable();
    useApiRef.current = available;
    if (available) {
      try {
        const data = await api.getNotas(userEmail);
        setNotas(data);
        syncLocal(data);
      } catch {
        // use local
        setNotas(loadLocal(userEmail));
      }
    } else {
      setNotas(loadLocal(userEmail));
    }
  }, [userEmail, syncLocal]);

  useEffect(() => { fetchNotas(); }, [fetchNotas]);

  const addNota = async () => {
    if (!newTitulo.trim() && !newContenido.trim()) { setShowNew(false); return; }
    const newNotaLocal: Nota = {
      id: crypto.randomUUID(),
      titulo: newTitulo,
      contenido: newContenido,
      color: newColor,
      pinned: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    if (useApiRef.current) {
      try {
        const nota = await api.addNota(userEmail, { titulo: newTitulo, contenido: newContenido, color: newColor, pinned: false });
        const updated = [nota, ...notas];
        setNotas(updated);
        syncLocal(updated);
      } catch {
        // fallback local
        const updated = [newNotaLocal, ...notas];
        setNotas(updated);
        syncLocal(updated);
        toast.info('Nota guardada localmente');
      }
    } else {
      const updated = [newNotaLocal, ...notas];
      setNotas(updated);
      syncLocal(updated);
    }
    setNewTitulo(''); setNewContenido(''); setNewColor('default'); setShowNew(false);
  };

  const updateNota = async (id: string, updates: Partial<Nota>) => {
    if (useApiRef.current) {
      try {
        const updated = await api.updateNota(id, updates);
        const newNotas = notas.map(n => n.id === id ? updated : n);
        setNotas(newNotas);
        syncLocal(newNotas);
      } catch {
        const newNotas = notas.map(n => n.id === id ? { ...n, ...updates, updated_at: new Date().toISOString() } : n);
        setNotas(newNotas);
        syncLocal(newNotas);
      }
    } else {
      const newNotas = notas.map(n => n.id === id ? { ...n, ...updates, updated_at: new Date().toISOString() } : n);
      setNotas(newNotas);
      syncLocal(newNotas);
    }
  };

  const deleteNota = async (id: string) => {
    if (useApiRef.current) {
      try {
        await api.deleteNota(id);
      } catch { /* continue locally */ }
    }
    const newNotas = notas.filter(n => n.id !== id);
    setNotas(newNotas);
    syncLocal(newNotas);
    if (editingId === id) setEditingId(null);
  };

  const togglePin = (id: string) => {
    const nota = notas.find(n => n.id === id);
    if (nota) updateNota(id, { pinned: !nota.pinned });
  };

  const filtered = notas.filter(n => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return n.titulo.toLowerCase().includes(q) || n.contenido.toLowerCase().includes(q);
  });

  const pinned = filtered.filter(n => n.pinned);
  const unpinned = filtered.filter(n => !n.pinned);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <StickyNote className="w-5 h-5 text-primary" /> Mis notas
        </h2>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar notas..." className="pl-8 h-9 w-48 text-sm" />
        </div>
      </div>

      {!showNew ? (
        <Card className="cursor-text border-2 border-dashed hover:border-primary/40 transition-colors max-w-2xl mx-auto"
          onClick={() => { setShowNew(true); setTimeout(() => newInputRef.current?.focus(), 50); }}>
          <CardContent className="p-4 flex items-center gap-3 text-muted-foreground">
            <Plus className="w-5 h-5" /><span className="text-sm">Crear una nota...</span>
          </CardContent>
        </Card>
      ) : (
        <Card className={`max-w-2xl mx-auto border-2 shadow-lg ${getColorClasses(newColor).bg} ${getColorClasses(newColor).border}`}>
          <CardContent className="p-4 space-y-3">
            <Input value={newTitulo} onChange={e => setNewTitulo(e.target.value)} placeholder="Título"
              className="border-0 bg-transparent text-base font-semibold placeholder:text-muted-foreground/60 px-0 focus-visible:ring-0" />
            <Textarea ref={newInputRef} value={newContenido} onChange={e => setNewContenido(e.target.value)}
              placeholder="Escribe una nota..." rows={3}
              className="border-0 bg-transparent resize-none text-sm placeholder:text-muted-foreground/60 px-0 focus-visible:ring-0" />
            <div className="flex items-center justify-between">
              <div className="flex gap-1">
                {NOTE_COLORS.map(c => (
                  <button key={c.value} onClick={() => setNewColor(c.value)}
                    className={`w-6 h-6 rounded-full border-2 transition-all ${c.bg} ${newColor === c.value ? 'border-foreground scale-110' : c.border + ' hover:scale-105'}`}
                    title={c.name} />
                ))}
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => { setShowNew(false); setNewTitulo(''); setNewContenido(''); setNewColor('default'); }}>Cancelar</Button>
                <Button size="sm" onClick={addNota} disabled={!newTitulo.trim() && !newContenido.trim()}>Guardar</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {pinned.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">📌 Fijadas</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {pinned.map(nota => (
              <NoteCard key={nota.id} nota={nota} editing={editingId === nota.id}
                onEdit={() => setEditingId(editingId === nota.id ? null : nota.id)}
                onUpdate={updateNota} onDelete={deleteNota} onTogglePin={togglePin} />
            ))}
          </div>
        </div>
      )}

      {unpinned.length > 0 && (
        <div className="space-y-2">
          {pinned.length > 0 && <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Otras</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {unpinned.map(nota => (
              <NoteCard key={nota.id} nota={nota} editing={editingId === nota.id}
                onEdit={() => setEditingId(editingId === nota.id ? null : nota.id)}
                onUpdate={updateNota} onDelete={deleteNota} onTogglePin={togglePin} />
            ))}
          </div>
        </div>
      )}

      {notas.length === 0 && !showNew && (
        <div className="text-center py-16 text-muted-foreground">
          <StickyNote className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p className="text-lg font-medium">No hay notas</p>
          <p className="text-sm">Haz clic en "Crear una nota" para empezar</p>
        </div>
      )}

      {filtered.length === 0 && notas.length > 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Search className="w-10 h-10 mx-auto mb-2 opacity-20" />
          <p className="text-sm">No se encontraron notas para "{search}"</p>
        </div>
      )}
    </div>
  );
}

// ─── Note Card ───
interface NoteCardProps {
  nota: Nota;
  editing: boolean;
  onEdit: () => void;
  onUpdate: (id: string, updates: Partial<Nota>) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
}

function NoteCard({ nota, editing, onEdit, onUpdate, onDelete, onTogglePin }: NoteCardProps) {
  const colors = getColorClasses(nota.color);
  const [editTitulo, setEditTitulo] = useState(nota.titulo);
  const [editContenido, setEditContenido] = useState(nota.contenido);

  useEffect(() => { setEditTitulo(nota.titulo); setEditContenido(nota.contenido); }, [nota.titulo, nota.contenido, editing]);

  const saveEdit = () => { onUpdate(nota.id, { titulo: editTitulo, contenido: editContenido }); onEdit(); };

  return (
    <Card className={`group border-2 transition-all hover:shadow-md cursor-pointer ${colors.bg} ${colors.border} ${editing ? 'shadow-lg ring-2 ring-primary/20' : ''}`}
      onClick={() => !editing && onEdit()}>
      <CardContent className="p-3 space-y-2">
        {editing ? (
          <>
            <Input value={editTitulo} onChange={e => setEditTitulo(e.target.value)} placeholder="Título"
              className="border-0 bg-transparent text-sm font-semibold px-0 focus-visible:ring-0" onClick={e => e.stopPropagation()} />
            <Textarea value={editContenido} onChange={e => setEditContenido(e.target.value)} placeholder="Nota..." rows={4}
              className="border-0 bg-transparent resize-none text-xs px-0 focus-visible:ring-0" onClick={e => e.stopPropagation()} />
            <div className="flex gap-1 pt-1" onClick={e => e.stopPropagation()}>
              {NOTE_COLORS.map(c => (
                <button key={c.value} onClick={() => onUpdate(nota.id, { color: c.value })}
                  className={`w-5 h-5 rounded-full border-2 transition-all ${c.bg} ${nota.color === c.value ? 'border-foreground scale-110' : c.border + ' hover:scale-105'}`}
                  title={c.name} />
              ))}
            </div>
            <div className="flex justify-between pt-1" onClick={e => e.stopPropagation()}>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onTogglePin(nota.id)} title={nota.pinned ? 'Desfijar' : 'Fijar'}>
                  {nota.pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                </Button>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => onDelete(nota.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="text-xs h-7" onClick={onEdit}>Cancelar</Button>
                <Button size="sm" className="text-xs h-7" onClick={saveEdit}>Guardar</Button>
              </div>
            </div>
          </>
        ) : (
          <>
            {nota.titulo && <p className="font-semibold text-sm leading-tight line-clamp-2">{nota.titulo}</p>}
            {nota.contenido && <p className="text-xs text-foreground/80 whitespace-pre-wrap line-clamp-8 leading-relaxed">{nota.contenido}</p>}
            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity pt-1" onClick={e => e.stopPropagation()}>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => onTogglePin(nota.id)} title={nota.pinned ? 'Desfijar' : 'Fijar'}>
                {nota.pinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
              </Button>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive hover:text-destructive" onClick={() => onDelete(nota.id)}>
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

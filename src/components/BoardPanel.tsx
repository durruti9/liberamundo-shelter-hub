import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, CheckCircle2, MessageCircle, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { BoardMessage, BoardType, BoardVisibility, UserRole } from '@/types';
import { useI18n } from '@/i18n/I18nContext';
import { formatDateES } from '@/lib/dateFormat';

interface Props {
  title: string;
  tipo: BoardType;
  messages: BoardMessage[];
  role: UserRole;
  onAdd: (msg: { tipo: BoardType; autor: string; fecha: string; texto: string; visibilidad: BoardVisibility }) => void;
  onReply: (messageId: string, reply: { autor: string; fecha: string; texto: string }) => void;
  onResolve: (messageId: string, resolucion: { autor: string; fecha: string; descripcion: string }) => void;
  onDelete: (messageId: string) => void;
}

export default function BoardPanel({ title, tipo, messages, role, onAdd, onReply, onResolve, onDelete }: Props) {
  const { t } = useI18n();
  const [showNew, setShowNew] = useState(false);
  const [filter, setFilter] = useState<BoardVisibility | 'all'>('all');
  const [newMsg, setNewMsg] = useState({ autor: '', texto: '', visibilidad: 'todos' as BoardVisibility });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyAutor, setReplyAutor] = useState('');
  const [resolveId, setResolveId] = useState<string | null>(null);
  const [resolveData, setResolveData] = useState({ autor: '', descripcion: '' });

  const filtered = messages
    .filter(m => m.tipo === tipo)
    .filter(m => {
      if (filter === 'all') return true;
      return m.visibilidad === filter;
    })
    .sort((a, b) => {
      if (a.resuelta !== b.resuelta) return a.resuelta ? 1 : -1;
      return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
    });

  const handleAdd = () => {
    if (!newMsg.autor || !newMsg.texto) return;
    onAdd({ tipo, autor: newMsg.autor, fecha: new Date().toISOString(), texto: newMsg.texto, visibilidad: newMsg.visibilidad });
    setNewMsg({ autor: '', texto: '', visibilidad: 'todos' });
    setShowNew(false);
  };

  const handleReply = (messageId: string) => {
    if (!replyAutor || !replyText) return;
    onReply(messageId, { autor: replyAutor, fecha: new Date().toISOString(), texto: replyText });
    setReplyText('');
    setReplyAutor('');
  };

  const handleResolve = () => {
    if (!resolveId || !resolveData.autor || !resolveData.descripcion) return;
    onResolve(resolveId, { autor: resolveData.autor, fecha: new Date().toISOString(), descripcion: resolveData.descripcion });
    setResolveId(null);
    setResolveData({ autor: '', descripcion: '' });
  };

  const visLabel: Record<BoardVisibility, string> = {
    todos: t.visibilityAll,
    gestor: t.visibilityManager,
    personal_albergue: t.visibilityStaff,
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-sm">{title}</CardTitle>
          <div className="flex items-center gap-2">
            <Select value={filter} onValueChange={v => setFilter(v as BoardVisibility | 'all')}>
              <SelectTrigger className="h-7 text-xs w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.visibilityAll}</SelectItem>
                <SelectItem value="todos">{t.visibilityAll}</SelectItem>
                <SelectItem value="gestor">{t.visibilityManager}</SelectItem>
                <SelectItem value="personal_albergue">{t.visibilityStaff}</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setShowNew(true)}>
              <Plus className="w-3 h-3 mr-1" /> {t.newMessage}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 max-h-[400px] overflow-y-auto">
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-4 text-sm">{t.noMessages}</p>
        )}
        {filtered.map(msg => (
          <div key={msg.id} className={`p-3 rounded-lg border ${msg.resuelta ? 'bg-muted/50 opacity-70' : 'bg-card'}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold">{msg.autor}</span>
                  <span className="text-xs text-muted-foreground">{formatDateES(msg.fecha.split('T')[0])}</span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">{visLabel[msg.visibilidad]}</Badge>
                  {msg.resuelta && <Badge className="text-[10px] px-1.5 py-0 bg-green-600">{t.resolved}</Badge>}
                </div>
                <p className="text-sm mt-1">{msg.texto}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {!msg.resuelta && (
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { setResolveId(msg.id); setResolveData({ autor: '', descripcion: '' }); }}>
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                  </Button>
                )}
                {(role === 'admin' || role === 'gestor') && (
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => onDelete(msg.id)}>
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                )}
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setExpandedId(expandedId === msg.id ? null : msg.id)}>
                  {expandedId === msg.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  {msg.respuestas.length > 0 && (
                    <span className="absolute -top-1 -right-1 text-[9px] bg-primary text-primary-foreground rounded-full w-3.5 h-3.5 flex items-center justify-center">
                      {msg.respuestas.length}
                    </span>
                  )}
                </Button>
              </div>
            </div>

            {/* Resolution info */}
            {msg.resuelta && msg.resolucion && (
              <div className="mt-2 p-2 rounded bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 text-xs">
                <span className="font-medium">{t.resolvedBy}: {msg.resolucion.autor}</span>
                <span className="text-muted-foreground ml-2">{formatDateES(msg.resolucion.fecha.split('T')[0])}</span>
                <p className="mt-1">{msg.resolucion.descripcion}</p>
              </div>
            )}

            {/* Replies */}
            {expandedId === msg.id && (
              <div className="mt-3 space-y-2 border-t pt-2">
                {msg.respuestas.map(r => (
                  <div key={r.id} className="flex gap-2 text-xs">
                    <MessageCircle className="w-3 h-3 mt-0.5 text-muted-foreground flex-shrink-0" />
                    <div>
                      <span className="font-semibold">{r.autor}</span>
                      <span className="text-muted-foreground ml-1">{formatDateES(r.fecha.split('T')[0])}</span>
                      <p className="mt-0.5">{r.texto}</p>
                    </div>
                  </div>
                ))}
                <div className="flex gap-2 mt-2">
                  <Input
                    className="h-7 text-xs flex-1"
                    placeholder={t.author}
                    value={replyAutor}
                    onChange={e => setReplyAutor(e.target.value)}
                  />
                  <Input
                    className="h-7 text-xs flex-[2]"
                    placeholder={t.writeReply}
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleReply(msg.id)}
                  />
                  <Button size="sm" className="h-7 text-xs" onClick={() => handleReply(msg.id)}>{t.addReply}</Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </CardContent>

      {/* New message dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{t.newMessage}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">{t.author}</Label>
              <Input value={newMsg.autor} onChange={e => setNewMsg(p => ({ ...p, autor: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t.message}</Label>
              <Textarea value={newMsg.texto} onChange={e => setNewMsg(p => ({ ...p, texto: e.target.value }))} rows={3} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t.visibility}</Label>
              <Select value={newMsg.visibilidad} onValueChange={v => setNewMsg(p => ({ ...p, visibilidad: v as BoardVisibility }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">{t.visibilityAll}</SelectItem>
                  <SelectItem value="gestor">{t.visibilityManager}</SelectItem>
                  <SelectItem value="personal_albergue">{t.visibilityStaff}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={handleAdd}>{t.newMessage}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Resolve dialog */}
      <Dialog open={!!resolveId} onOpenChange={open => !open && setResolveId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{t.resolveMessage}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">{t.author}</Label>
              <Input value={resolveData.autor} onChange={e => setResolveData(p => ({ ...p, autor: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t.resolutionDescription}</Label>
              <Textarea value={resolveData.descripcion} onChange={e => setResolveData(p => ({ ...p, descripcion: e.target.value }))} rows={3} />
            </div>
            <Button className="w-full" onClick={handleResolve}>{t.confirm}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, CheckCircle2, MessageCircle, Trash2, Send, ClipboardList, MessageSquareText } from 'lucide-react';
import { BoardMessage, BoardType, BoardVisibility, UserRole } from '@/types';
import { useI18n } from '@/i18n/I18nContext';
import { formatDateES } from '@/lib/dateFormat';

interface Props {
  title: string;
  icon: 'instructions' | 'requests';
  tipo: BoardType;
  messages: BoardMessage[];
  role: UserRole;
  onAdd: (msg: { tipo: BoardType; autor: string; fecha: string; texto: string; visibilidad: BoardVisibility }) => void;
  onReply: (messageId: string, reply: { autor: string; fecha: string; texto: string }) => void;
  onResolve: (messageId: string, resolucion: { autor: string; fecha: string; descripcion: string }) => void;
  onDelete: (messageId: string) => void;
}

export default function BoardPanel({ title, icon, tipo, messages, role, onAdd, onReply, onResolve, onDelete }: Props) {
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
    .filter(m => filter === 'all' ? true : m.visibilidad === filter)
    .sort((a, b) => {
      if (a.resuelta !== b.resuelta) return a.resuelta ? 1 : -1;
      return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
    });

  const pendingCount = filtered.filter(m => !m.resuelta).length;

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

  const IconComponent = icon === 'instructions' ? ClipboardList : MessageSquareText;

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${icon === 'instructions' ? 'bg-accent text-accent-foreground' : 'bg-primary/10 text-primary'}`}>
              <IconComponent className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">{title}</CardTitle>
              {pendingCount > 0 && (
                <p className="text-[11px] text-muted-foreground">{pendingCount} {t.pending.toLowerCase()}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Select value={filter} onValueChange={v => setFilter(v as BoardVisibility | 'all')}>
              <SelectTrigger className="h-7 text-[11px] w-[100px] border-dashed">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.visibilityAll}</SelectItem>
                <SelectItem value="todos">{t.visibilityAll} ✓</SelectItem>
                <SelectItem value="gestor">{t.visibilityManager}</SelectItem>
                <SelectItem value="personal_albergue">{t.visibilityStaff}</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" className="h-7 text-[11px] gap-1" onClick={() => setShowNew(true)}>
              <Plus className="w-3 h-3" /> {t.newMessage}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-2 max-h-[420px] overflow-y-auto pt-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <IconComponent className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-sm">{t.noMessages}</p>
          </div>
        ) : filtered.map(msg => (
          <div
            key={msg.id}
            className={`group rounded-xl border transition-all ${
              msg.resuelta
                ? 'bg-muted/40 border-muted'
                : 'bg-card hover:shadow-sm border-border'
            }`}
          >
            {/* Message header + body */}
            <div className="p-3 pb-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap mb-1">
                    <span className="text-xs font-bold text-foreground">{msg.autor}</span>
                    <span className="text-[11px] text-muted-foreground">· {formatDateES(msg.fecha.split('T')[0])}</span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal">{visLabel[msg.visibilidad]}</Badge>
                    {msg.resuelta && (
                      <Badge className="text-[10px] px-1.5 py-0 bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))]">
                        ✓ {t.resolved}
                      </Badge>
                    )}
                  </div>
                  <p className={`text-sm leading-relaxed ${msg.resuelta ? 'text-muted-foreground' : 'text-foreground'}`}>{msg.texto}</p>
                </div>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  {!msg.resuelta && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-[hsl(var(--success))] hover:bg-[hsl(var(--success))]/10"
                      onClick={() => { setResolveId(msg.id); setResolveData({ autor: '', descripcion: '' }); }}
                      title={t.markResolved}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </Button>
                  )}
                  {(role === 'admin' || role === 'gestor') && (
                    <Button size="icon" variant="ghost" className="h-7 w-7 hover:bg-destructive/10" onClick={() => onDelete(msg.id)}>
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Resolution info */}
            {msg.resuelta && msg.resolucion && (
              <div className="mx-3 mb-2 p-2.5 rounded-lg bg-[hsl(var(--success))]/8 border border-[hsl(var(--success))]/20 text-xs">
                <div className="flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className="w-3 h-3 text-[hsl(var(--success))]" />
                  <span className="font-semibold">{msg.resolucion.autor}</span>
                  <span className="text-muted-foreground">· {formatDateES(msg.resolucion.fecha.split('T')[0])}</span>
                </div>
                <p className="text-muted-foreground pl-[18px]">{msg.resolucion.descripcion}</p>
              </div>
            )}

            {/* Replies toggle + section */}
            <div className="border-t border-dashed px-3 py-1.5">
              <button
                className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors w-full"
                onClick={() => setExpandedId(expandedId === msg.id ? null : msg.id)}
              >
                <MessageCircle className="w-3 h-3" />
                {msg.respuestas.length > 0
                  ? `${msg.respuestas.length} ${msg.respuestas.length === 1 ? t.reply.toLowerCase() : t.replies.toLowerCase()}`
                  : t.addReply}
              </button>
            </div>

            {expandedId === msg.id && (
              <div className="px-3 pb-3 space-y-2">
                {msg.respuestas.map(r => (
                  <div key={r.id} className="flex gap-2 pl-2 border-l-2 border-muted ml-1">
                    <div className="text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold">{r.autor}</span>
                        <span className="text-muted-foreground">· {formatDateES(r.fecha.split('T')[0])}</span>
                      </div>
                      <p className="mt-0.5 text-muted-foreground">{r.texto}</p>
                    </div>
                  </div>
                ))}
                <div className="flex gap-1.5 items-center pt-1">
                  <Input
                    className="h-7 text-xs"
                    placeholder={t.author}
                    value={replyAutor}
                    onChange={e => setReplyAutor(e.target.value)}
                    style={{ flex: '0 0 120px' }}
                  />
                  <Input
                    className="h-7 text-xs flex-1"
                    placeholder={t.writeReply}
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleReply(msg.id)}
                  />
                  <Button size="icon" className="h-7 w-7 flex-shrink-0" onClick={() => handleReply(msg.id)}>
                    <Send className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </CardContent>

      {/* New message dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconComponent className="w-5 h-5" /> {t.newMessage}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">{t.author}</Label>
              <Input value={newMsg.autor} onChange={e => setNewMsg(p => ({ ...p, autor: e.target.value }))} placeholder={t.name} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">{t.message}</Label>
              <Textarea value={newMsg.texto} onChange={e => setNewMsg(p => ({ ...p, texto: e.target.value }))} rows={4} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">{t.visibility}</Label>
              <Select value={newMsg.visibilidad} onValueChange={v => setNewMsg(p => ({ ...p, visibilidad: v as BoardVisibility }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">{t.visibilityAll}</SelectItem>
                  <SelectItem value="gestor">{t.visibilityManager}</SelectItem>
                  <SelectItem value="personal_albergue">{t.visibilityStaff}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full gap-2" onClick={handleAdd}>
              <Plus className="w-4 h-4" /> {t.newMessage}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Resolve dialog */}
      <Dialog open={!!resolveId} onOpenChange={open => !open && setResolveId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[hsl(var(--success))]" /> {t.resolveMessage}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">{t.author}</Label>
              <Input value={resolveData.autor} onChange={e => setResolveData(p => ({ ...p, autor: e.target.value }))} placeholder={t.name} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">{t.resolutionDescription}</Label>
              <Textarea value={resolveData.descripcion} onChange={e => setResolveData(p => ({ ...p, descripcion: e.target.value }))} rows={4} />
            </div>
            <Button className="w-full gap-2" onClick={handleResolve}>
              <CheckCircle2 className="w-4 h-4" /> {t.confirm}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
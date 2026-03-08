import { useState, useEffect, useCallback, useRef } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { api } from '@/lib/api';

interface Notification {
  id: string;
  type: 'incidencia' | 'board' | 'sugerencia';
  text: string;
  time: string;
}

interface Props {
  albergueId: string;
  role: string;
  onNavigate: (tab: string) => void;
}

export default function NotificationBell({ albergueId, role, onNavigate }: Props) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const lastCheckRef = useRef<string>(new Date().toISOString());
  const knownIdsRef = useRef<Set<string>>(new Set());
  const initializedRef = useRef(false);
  const apiAvailableRef = useRef(true);
  const consecutiveFailsRef = useRef(0);

  const checkUpdates = useCallback(async () => {
    // Back off if API has been failing
    if (!apiAvailableRef.current) {
      consecutiveFailsRef.current++;
      // After 3 consecutive fails, stop polling until page reload
      if (consecutiveFailsRef.current > 3) return;
    }

    try {
      const newNotifs: Notification[] = [];

      // Check incidencias
      const incidencias = await api.getIncidencias(albergueId);
      // If we got here, API is available
      apiAvailableRef.current = true;
      consecutiveFailsRef.current = 0;

      incidencias.forEach((i: any) => {
        if (!knownIdsRef.current.has(`inc-${i.id}`)) {
          if (initializedRef.current) {
            newNotifs.push({
              id: `inc-${i.id}`,
              type: 'incidencia',
              text: `Nueva incidencia: ${i.huespedNombre}`,
              time: i.fecha,
            });
          }
          knownIdsRef.current.add(`inc-${i.id}`);
        }
      });

      // Check board messages
      const messages = await api.getBoardMessages(albergueId);
      messages.forEach((m: any) => {
        if (!knownIdsRef.current.has(`board-${m.id}`)) {
          if (initializedRef.current) {
            newNotifs.push({
              id: `board-${m.id}`,
              type: 'board',
              text: `${m.tipo === 'instrucciones' ? 'Instrucción' : 'Petición'}: ${m.texto.substring(0, 40)}...`,
              time: m.fecha,
            });
          }
          knownIdsRef.current.add(`board-${m.id}`);
        }
        // Check replies
        if (m.respuestas) {
          m.respuestas.forEach((r: any) => {
            if (!knownIdsRef.current.has(`reply-${r.id}`)) {
              if (initializedRef.current) {
                newNotifs.push({
                  id: `reply-${r.id}`,
                  type: 'board',
                  text: `Respuesta de ${r.autor} en tablón`,
                  time: r.fecha,
                });
              }
              knownIdsRef.current.add(`reply-${r.id}`);
            }
          });
        }
      });

      // Check sugerencias (admin only)
      if (role === 'admin') {
        const sugerencias = await api.getSugerencias(albergueId);
        if (Array.isArray(sugerencias)) {
          sugerencias.forEach((s: any) => {
            if (!knownIdsRef.current.has(`sug-${s.id}`)) {
              if (initializedRef.current) {
                newNotifs.push({
                  id: `sug-${s.id}`,
                  type: 'sugerencia',
                  text: `Nueva sugerencia${s.nombre ? ` de ${s.nombre}` : ''}`,
                  time: s.fecha,
                });
              }
              knownIdsRef.current.add(`sug-${s.id}`);
            }
          });
        }
      }

      if (newNotifs.length > 0) {
        setNotifications(prev => [...newNotifs, ...prev].slice(0, 20));
      }

      if (!initializedRef.current) {
        initializedRef.current = true;
      }

      lastCheckRef.current = new Date().toISOString();
    } catch {
      // API not available — mark and back off
      apiAvailableRef.current = false;
      consecutiveFailsRef.current++;
    }
  }, [albergueId, role]);

  useEffect(() => {
    // Only start polling if we have an auth token (API mode)
    const token = localStorage.getItem('authToken');
    if (!token) return;

    checkUpdates();
    const interval = setInterval(checkUpdates, 30000);
    return () => clearInterval(interval);
  }, [checkUpdates]);

  const unreadCount = notifications.length;

  const handleClick = (notif: Notification) => {
    setNotifications(prev => prev.filter(n => n.id !== notif.id));
    const tabMap: Record<string, string> = {
      incidencia: 'incidencias',
      board: 'dashboard',
      sugerencia: 'sugerencias',
    };
    onNavigate(tabMap[notif.type]);
  };

  const clearAll = () => setNotifications([]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] flex items-center justify-center bg-destructive text-destructive-foreground">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Sin notificaciones nuevas
          </div>
        ) : (
          <>
            {notifications.slice(0, 10).map(notif => (
              <DropdownMenuItem key={notif.id} onClick={() => handleClick(notif)} className="flex flex-col items-start gap-0.5 py-2">
                <span className="text-sm">{notif.text}</span>
                <span className="text-[10px] text-muted-foreground">{notif.time}</span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={clearAll} className="text-xs text-center justify-center text-muted-foreground">
              Limpiar todo
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

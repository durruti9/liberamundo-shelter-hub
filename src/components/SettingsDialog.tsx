import { useState, useCallback, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Pencil, AlertTriangle, BedDouble, Building2, Download, Upload, Database, Shield } from 'lucide-react';
import { Room, Albergue } from '@/types';
import { useI18n } from '@/i18n/I18nContext';
import { toast } from 'sonner';
import { api, isApiAvailable } from '@/lib/api';

interface Props {
  open: boolean;
  onClose: () => void;
  store: ReturnType<typeof import('@/hooks/useAlbergueStore').useAlbergueStore>;
  albergueId: string;
  onAlbergueDeleted?: (id: string) => void;
}

export default function SettingsDialog({ open, onClose, store, albergueId, onAlbergueDeleted }: Props) {
  const { t } = useI18n();
  const { rooms, albergues, updateRooms, addAlbergue, editAlbergueName, deleteAlbergue, huespedActivos } = store;

  // Room editing
  const [editingRooms, setEditingRooms] = useState<Room[]>([]);
  const [roomsDirty, setRoomsDirty] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomBeds, setNewRoomBeds] = useState(2);

  // Albergue management
  const [newAlbergueName, setNewAlbergueName] = useState('');
  const [editingAlbergueId, setEditingAlbergueId] = useState<string | null>(null);
  const [editingAlbergueName, setEditingAlbergueName] = useState('');
  const [deleteAlbergueTarget, setDeleteAlbergueTarget] = useState<string | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // New albergue creation with rooms
  const [creatingAlbergue, setCreatingAlbergue] = useState(false);
  const [newAlbergueRooms, setNewAlbergueRooms] = useState<Room[]>([]);
  const [newAlbergueRoomName, setNewAlbergueRoomName] = useState('');
  const [newAlbergueRoomBeds, setNewAlbergueRoomBeds] = useState(2);

  // Init rooms when dialog opens
  const currentRooms = roomsDirty ? editingRooms : rooms;

  const startEditingRooms = () => {
    if (!roomsDirty) {
      setEditingRooms([...rooms]);
    }
  };

  const updateRoom = (id: string, field: keyof Room, value: string | number) => {
    startEditingRooms();
    setEditingRooms(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
    setRoomsDirty(true);
  };

  const addRoom = () => {
    if (!newRoomName.trim()) return;
    startEditingRooms();
    const newRoom: Room = {
      id: crypto.randomUUID().split('-')[0],
      nombre: newRoomName,
      camas: newRoomBeds,
    };
    setEditingRooms(prev => [...prev, newRoom]);
    setRoomsDirty(true);
    setNewRoomName('');
    setNewRoomBeds(2);
  };

  const removeRoom = (id: string) => {
    const hasGuests = huespedActivos.some(h => h.habitacion === id);
    if (hasGuests) return;
    startEditingRooms();
    setEditingRooms(prev => prev.filter(r => r.id !== id));
    setRoomsDirty(true);
  };

  const saveRooms = () => {
    updateRooms(editingRooms);
    setRoomsDirty(false);
  };

  // New albergue creation flow
  const startCreatingAlbergue = () => {
    if (!newAlbergueName.trim()) return;
    setCreatingAlbergue(true);
    setNewAlbergueRooms([]);
  };

  const addNewAlbergueRoom = () => {
    if (!newAlbergueRoomName.trim()) return;
    setNewAlbergueRooms(prev => [...prev, {
      id: crypto.randomUUID().split('-')[0],
      nombre: newAlbergueRoomName,
      camas: newAlbergueRoomBeds,
    }]);
    setNewAlbergueRoomName('');
    setNewAlbergueRoomBeds(2);
  };

  const removeNewAlbergueRoom = (id: string) => {
    setNewAlbergueRooms(prev => prev.filter(r => r.id !== id));
  };

  const confirmCreateAlbergue = () => {
    addAlbergue(newAlbergueName, newAlbergueRooms);
    setNewAlbergueName('');
    setNewAlbergueRooms([]);
    setCreatingAlbergue(false);
  };

  const cancelCreateAlbergue = () => {
    setCreatingAlbergue(false);
    setNewAlbergueRooms([]);
    setNewAlbergueRoomName('');
  };

  const handleSaveAlbergueName = () => {
    if (editingAlbergueId && editingAlbergueName.trim()) {
      editAlbergueName(editingAlbergueId, editingAlbergueName);
      setEditingAlbergueId(null);
    }
  };

  const handleDeleteAlbergue = () => {
    if (!deleteAlbergueTarget || deleteConfirmText.toUpperCase() !== 'ELIMINAR') return;
    deleteAlbergue(deleteAlbergueTarget);
    onAlbergueDeleted?.(deleteAlbergueTarget);
    setDeleteAlbergueTarget(null);
    setDeleteConfirmText('');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby="settings-desc">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">⚙️ {t.settings}</DialogTitle>
          <DialogDescription id="settings-desc" className="sr-only">
            {t.roomConfiguration} / {t.shelterManagement}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="rooms" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="rooms" className="flex items-center gap-2">
              <BedDouble className="w-4 h-4" /> <span className="hidden sm:inline">{t.roomConfiguration}</span><span className="sm:hidden">{t.rooms}</span>
            </TabsTrigger>
            <TabsTrigger value="albergues" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" /> <span className="hidden sm:inline">{t.shelterManagement}</span><span className="sm:hidden">Albergues</span>
            </TabsTrigger>
            <TabsTrigger value="backup" className="flex items-center gap-2">
              <Database className="w-4 h-4" /> <span className="hidden sm:inline">{t.backupRestore}</span><span className="sm:hidden">Backup</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="w-4 h-4" /> <span className="hidden sm:inline">Seguridad</span><span className="sm:hidden">Logs</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rooms">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t.roomConfiguration}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentRooms.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">{t.noRooms}</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>{t.roomName}</TableHead>
                        <TableHead className="w-24">{t.numberOfBeds}</TableHead>
                        <TableHead className="w-16"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentRooms.map(room => {
                        const hasGuests = huespedActivos.some(h => h.habitacion === room.id);
                        return (
                          <TableRow key={room.id}>
                            <TableCell className="text-xs text-muted-foreground font-mono">{room.id}</TableCell>
                            <TableCell>
                              <Input
                                value={roomsDirty ? (editingRooms.find(r => r.id === room.id)?.nombre || room.nombre) : room.nombre}
                                onChange={e => updateRoom(room.id, 'nombre', e.target.value)}
                                className="h-8 text-sm"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min={1}
                                max={20}
                                value={roomsDirty ? (editingRooms.find(r => r.id === room.id)?.camas || room.camas) : room.camas}
                                onChange={e => updateRoom(room.id, 'camas', parseInt(e.target.value) || 1)}
                                className="h-8 text-sm w-20"
                              />
                            </TableCell>
                            <TableCell>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => removeRoom(room.id)}
                                disabled={hasGuests}
                                title={hasGuests ? 'No se puede eliminar con huéspedes' : t.deleteRoom}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}

                <div className="flex items-end gap-3 p-3 border rounded-lg bg-muted/50">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">{t.roomName}</Label>
                    <Input value={newRoomName} onChange={e => setNewRoomName(e.target.value)} placeholder="Ej: Habitación 3.1" className="h-8 text-sm" />
                  </div>
                  <div className="w-24 space-y-1">
                    <Label className="text-xs">{t.numberOfBeds}</Label>
                    <Input type="number" min={1} max={20} value={newRoomBeds} onChange={e => setNewRoomBeds(parseInt(e.target.value) || 1)} className="h-8 text-sm" />
                  </div>
                  <Button size="sm" onClick={addRoom} disabled={!newRoomName.trim()}>
                    <Plus className="w-4 h-4 mr-1" /> {t.addRoom}
                  </Button>
                </div>

                {roomsDirty && (
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => { setRoomsDirty(false); setEditingRooms([]); }}>{t.cancel}</Button>
                    <Button size="sm" onClick={saveRooms}>{t.save}</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="albergues">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t.shelterManagement}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.shelterName}</TableHead>
                      <TableHead className="w-20">{t.rooms}</TableHead>
                      <TableHead className="w-32 text-right">{t.actions}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {albergues.map(a => (
                      <TableRow key={a.id} className={a.id === albergueId ? 'bg-primary/5' : ''}>
                        <TableCell>
                          {editingAlbergueId === a.id ? (
                            <div className="flex gap-2">
                              <Input
                                value={editingAlbergueName}
                                onChange={e => setEditingAlbergueName(e.target.value)}
                                className="h-8 text-sm"
                                autoFocus
                              />
                              <Button size="sm" onClick={handleSaveAlbergueName}>{t.save}</Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingAlbergueId(null)}>{t.cancel}</Button>
                            </div>
                          ) : (
                            <span className="font-medium">
                              {a.nombre}
                              {a.id === albergueId && <span className="text-xs text-primary ml-2">({t.currentShelter})</span>}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">{(a.rooms || []).length}</TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button size="icon" variant="ghost" onClick={() => { setEditingAlbergueId(a.id); setEditingAlbergueName(a.nombre); }}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          {albergues.length > 1 && (
                            <Button size="icon" variant="ghost" onClick={() => { setDeleteAlbergueTarget(a.id); setDeleteConfirmText(''); }}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Create albergue form */}
                {!creatingAlbergue ? (
                  <div className="flex items-end gap-3 p-3 border rounded-lg bg-muted/50">
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs">{t.shelterName}</Label>
                      <Input value={newAlbergueName} onChange={e => setNewAlbergueName(e.target.value)} placeholder="Ej: Albergue Norte" className="h-8 text-sm" />
                    </div>
                    <Button size="sm" onClick={startCreatingAlbergue} disabled={!newAlbergueName.trim()}>
                      <Plus className="w-4 h-4 mr-1" /> {t.createShelter}
                    </Button>
                  </div>
                ) : (
                  <Card className="border-primary/30 bg-primary/5">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        {t.createShelter}: <span className="text-primary">{newAlbergueName}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-xs text-muted-foreground">{t.roomConfiguration}</p>

                      {newAlbergueRooms.length > 0 && (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>{t.roomName}</TableHead>
                              <TableHead className="w-24">{t.numberOfBeds}</TableHead>
                              <TableHead className="w-12"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {newAlbergueRooms.map(room => (
                              <TableRow key={room.id}>
                                <TableCell className="text-sm">{room.nombre}</TableCell>
                                <TableCell className="text-sm text-center">{room.camas}</TableCell>
                                <TableCell>
                                  <Button size="icon" variant="ghost" onClick={() => removeNewAlbergueRoom(room.id)}>
                                    <Trash2 className="w-3 h-3 text-destructive" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}

                      <div className="flex items-end gap-2">
                        <div className="flex-1 space-y-1">
                          <Label className="text-xs">{t.roomName}</Label>
                          <Input value={newAlbergueRoomName} onChange={e => setNewAlbergueRoomName(e.target.value)} placeholder="Ej: Habitación 1" className="h-8 text-sm" />
                        </div>
                        <div className="w-20 space-y-1">
                          <Label className="text-xs">{t.numberOfBeds}</Label>
                          <Input type="number" min={1} max={20} value={newAlbergueRoomBeds} onChange={e => setNewAlbergueRoomBeds(parseInt(e.target.value) || 1)} className="h-8 text-sm" />
                        </div>
                        <Button size="sm" variant="outline" onClick={addNewAlbergueRoom} disabled={!newAlbergueRoomName.trim()}>
                          <Plus className="w-3 h-3 mr-1" /> {t.addRoom}
                        </Button>
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t">
                        <Button size="sm" variant="outline" onClick={cancelCreateAlbergue}>{t.cancel}</Button>
                        <Button size="sm" onClick={confirmCreateAlbergue}>
                          <Plus className="w-4 h-4 mr-1" /> {t.createShelter} ({newAlbergueRooms.length} {t.rooms})
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="backup">
            <BackupSection t={t} />
          </TabsContent>

          <TabsContent value="security">
            <AccessLogsSection />
          </TabsContent>
        </Tabs>
      </DialogContent>

      {/* Delete albergue confirmation */}
      <Dialog open={!!deleteAlbergueTarget} onOpenChange={() => { setDeleteAlbergueTarget(null); setDeleteConfirmText(''); }}>
        <DialogContent className="max-w-sm" aria-describedby="delete-shelter-desc">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" /> {t.deleteShelter}
            </DialogTitle>
            <DialogDescription id="delete-shelter-desc">
              {t.deleteShelterWarning}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{t.deleteShelterConfirm}</p>
            <Input
              value={deleteConfirmText}
              onChange={e => setDeleteConfirmText(e.target.value)}
              placeholder="ELIMINAR"
              className="border-destructive"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setDeleteAlbergueTarget(null); setDeleteConfirmText(''); }}>{t.cancel}</Button>
              <Button variant="destructive" disabled={deleteConfirmText.toUpperCase() !== 'ELIMINAR'} onClick={handleDeleteAlbergue}>
                {t.delete}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

function BackupSection({ t }: { t: import('@/i18n/translations').Translations }) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const BACKUP_KEYS = ['albergues', 'users', '_migrated_v2'];

  const exportData = useCallback(() => {
    const data: Record<string, unknown> = {};
    // Collect all localStorage keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || key === 'auth' || key === 'authRole' || key === 'currentAlbergueId' || key === 'userAlbergueIds' || key === 'app_language') continue;
      try {
        data[key] = JSON.parse(localStorage.getItem(key)!);
      } catch {
        data[key] = localStorage.getItem(key);
      }
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_albergue_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t.exportSuccess);
  }, [t]);

  const importData = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (typeof data !== 'object' || data === null) throw new Error('Invalid');
        
        // Clear relevant keys
        const keysToKeep = ['auth', 'authRole', 'currentAlbergueId', 'userAlbergueIds', 'app_language'];
        const allKeys: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && !keysToKeep.includes(k)) allKeys.push(k);
        }
        allKeys.forEach(k => localStorage.removeItem(k));

        // Restore
        Object.entries(data).forEach(([key, value]) => {
          localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
        });
        toast.success(t.importSuccess);
        setTimeout(() => window.location.reload(), 1500);
      } catch {
        toast.error(t.importError);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [t]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Database className="w-4 h-4" /> {t.backupRestore}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Export */}
        <div className="p-4 border rounded-lg space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Download className="w-4 h-4" /> {t.exportAllData}
          </h3>
          <p className="text-xs text-muted-foreground">{t.exportDescription}</p>
          <Button size="sm" onClick={exportData}>
            <Download className="w-4 h-4 mr-2" /> {t.downloadBackup}
          </Button>
        </div>

        {/* Import */}
        <div className="p-4 border rounded-lg border-destructive/30 space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Upload className="w-4 h-4" /> {t.importData}
          </h3>
          <p className="text-xs text-muted-foreground">{t.importDescription}</p>
          <p className="text-xs text-destructive font-medium">{t.importWarning}</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={importData}
            className="hidden"
          />
          <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-4 h-4 mr-2" /> {t.selectFile}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function AccessLogsSection() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const available = await isApiAvailable();
      if (!available) { setError('API no disponible'); setLoading(false); return; }
      const data = await api.getAccessLogs();
      setLogs(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useState(() => { loadLogs(); });

  const clearLogs = async () => {
    try {
      await api.clearAccessLogs();
      setLogs([]);
      toast.success('Logs eliminados');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const formatDate = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' +
           d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const roleLabel = (r: string) => {
    if (r === 'admin') return 'Administración';
    if (r === 'gestor') return 'Personal gestor';
    return 'Personal laboral';
  };

  const getBrowser = (ua: string) => {
    if (!ua) return '—';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Edg')) return 'Edge';
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Safari')) return 'Safari';
    return 'Otro';
  };

  const getDevice = (ua: string) => {
    if (!ua) return '';
    if (ua.includes('Mobile') || ua.includes('Android')) return '📱';
    return '💻';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="w-4 h-4" /> Registro de accesos
          </CardTitle>
          {logs.length > 0 && (
            <Button size="sm" variant="outline" className="text-destructive" onClick={clearLogs}>
              <Trash2 className="w-3 h-3 mr-1" /> Limpiar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-4">Cargando...</p>
        ) : error ? (
          <p className="text-sm text-destructive text-center py-4">{error}</p>
        ) : logs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Sin registros de acceso</p>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Fecha/Hora</TableHead>
                  <TableHead className="text-xs">Usuario</TableHead>
                  <TableHead className="text-xs">Rol</TableHead>
                  <TableHead className="text-xs">IP</TableHead>
                  <TableHead className="text-xs">Navegador</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map(log => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs whitespace-nowrap">{formatDate(log.timestamp)}</TableCell>
                    <TableCell className="text-xs font-medium">{log.user_email}</TableCell>
                    <TableCell className="text-xs">{roleLabel(log.user_role)}</TableCell>
                    <TableCell className="text-xs font-mono">{log.ip_address || '—'}</TableCell>
                    <TableCell className="text-xs">{getDevice(log.user_agent)} {getBrowser(log.user_agent)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-3">
          Últimos {logs.length} accesos registrados. Máximo 500.
        </p>
      </CardContent>
    </Card>
  );
}
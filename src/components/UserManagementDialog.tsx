import { useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, KeyRound, Building2 } from 'lucide-react';
import PasswordInput from '@/components/PasswordInput';
import { UserRole } from '@/types';
import { useI18n } from '@/i18n/I18nContext';
import { api } from '@/lib/api';

interface Props {
  open: boolean;
  onClose: () => void;
  store: ReturnType<typeof import('@/hooks/useAlbergueStore').useAlbergueStore>;
}

const roleLabel: Record<UserRole, string> = {
  admin: 'Administración',
  gestor: 'Personal gestor',
  personal_albergue: 'Personal laboral',
};

export default function UserManagementDialog({ open, onClose, store }: Props) {
  const { t } = useI18n();
  const [newUser, setNewUser] = useState({ email: '', password: '', role: 'personal_albergue' as UserRole, albergueIds: [] as string[] });
  const [changingPasswordFor, setChangingPasswordFor] = useState<string | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState('');
  const [editingAlberguesFor, setEditingAlberguesFor] = useState<string | null>(null);
  const [editAlbergueIds, setEditAlbergueIds] = useState<string[]>([]);
  const [deleteUserEmail, setDeleteUserEmail] = useState<string | null>(null);

  const adminCount = store.users.filter(u => u.role === 'admin').length;

  const handleAddUser = async () => {
    if (!newUser.email || !newUser.password) return;
    try {
      await store.addUser(newUser);
      setNewUser({ email: '', password: '', role: 'personal_albergue', albergueIds: [] });
    } catch (err: any) {
      toast.error(err.message || 'Error al crear usuario');
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUserEmail) return;
    try {
      await store.removeUser(deleteUserEmail);
      toast.success('Usuario eliminado');
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar');
    }
    setDeleteUserEmail(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
          <DialogHeader><DialogTitle>{t.userManagement}</DialogTitle></DialogHeader>
          <div className="space-y-6">
            <div className="space-y-3 p-4 border rounded-lg">
              <h3 className="text-sm font-semibold">Crear nuevo usuario</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Usuario</Label>
                  <Input value={newUser.email} onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))} placeholder="Nombre" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Contraseña</Label>
                  <PasswordInput value={newUser.password} onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))} placeholder="••••••" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Rol</Label>
                  <Select value={newUser.role} onValueChange={v => setNewUser(p => ({ ...p, role: v as UserRole }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administración</SelectItem>
                      <SelectItem value="gestor">Personal gestor</SelectItem>
                      <SelectItem value="personal_albergue">Personal laboral</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Albergues asignados {store.albergues.length === 1 && <span className="text-muted-foreground">(auto-asignado)</span>}</Label>
                <div className="flex flex-wrap gap-2">
                  {store.albergues.map(a => (
                    <label key={a.id} className="flex items-center gap-1.5 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={store.albergues.length === 1 || newUser.albergueIds.includes(a.id)}
                        disabled={store.albergues.length === 1}
                        onChange={e => {
                          setNewUser(p => ({
                            ...p,
                            albergueIds: e.target.checked
                              ? [...p.albergueIds, a.id]
                              : p.albergueIds.filter(id => id !== a.id)
                          }));
                        }}
                        className="rounded"
                      />
                      {a.nombre}
                    </label>
                  ))}
                </div>
              </div>
              <Button size="sm" onClick={handleAddUser} className="w-full">
                <Plus className="w-4 h-4 mr-1" /> Crear usuario
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead className="w-32"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {store.users.map(u => (
                  <TableRow key={u.email}>
                    <TableCell>
                      <div className="text-sm font-medium">{u.email}</div>
                      {(u as any).albergueIds && (u as any).albergueIds.length > 0 && (
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          {(u as any).albergueIds.map((id: string) => store.albergues.find(a => a.id === id)?.nombre || id).join(', ')}
                        </div>
                      )}
                    </TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{roleLabel[u.role]}</Badge></TableCell>
                    <TableCell className="space-x-1">
                      {store.albergues.length > 1 && (
                        <Button size="icon" variant="ghost" title="Asignar albergues" onClick={() => {
                          setEditingAlberguesFor(u.email);
                          setEditAlbergueIds((u as any).albergueIds || []);
                        }}>
                          <Building2 className="w-4 h-4" />
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" title="Cambiar contraseña" onClick={() => { setChangingPasswordFor(u.email); setNewPasswordValue(''); }}>
                        <KeyRound className="w-4 h-4" />
                      </Button>
                      {!(u.role === 'admin' && adminCount <= 1) && (
                        <Button size="icon" variant="ghost" onClick={() => setDeleteUserEmail(u.email)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete user confirmation */}
      <AlertDialog open={!!deleteUserEmail} onOpenChange={() => setDeleteUserEmail(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará permanentemente el usuario <strong>{deleteUserEmail}</strong>. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Change password dialog */}
      <Dialog open={!!changingPasswordFor} onOpenChange={() => setChangingPasswordFor(null)}>
        <DialogContent className="max-w-sm" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><KeyRound className="w-5 h-5" /> {t.changePassword}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{changingPasswordFor}</p>
            <div className="space-y-2">
              <Label>{t.newPassword}</Label>
              <PasswordInput value={newPasswordValue} onChange={e => setNewPasswordValue(e.target.value)} placeholder="••••••" autoFocus />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setChangingPasswordFor(null)}>{t.cancel}</Button>
              <Button disabled={newPasswordValue.length < 4} onClick={async () => {
                try {
                  await store.changePassword(changingPasswordFor!, newPasswordValue);
                  toast.success(t.passwordChanged);
                  setChangingPasswordFor(null);
                } catch { /* error handled by api */ }
              }}>{t.save}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign albergues dialog */}
      <Dialog open={!!editingAlberguesFor} onOpenChange={() => setEditingAlberguesFor(null)}>
        <DialogContent className="max-w-sm" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Building2 className="w-5 h-5" /> Asignar albergues</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{editingAlberguesFor}</p>
            <div className="space-y-2">
              {store.albergues.map(a => (
                <label key={a.id} className="flex items-center gap-2 text-sm cursor-pointer p-2 rounded hover:bg-muted">
                  <input
                    type="checkbox"
                    checked={editAlbergueIds.includes(a.id)}
                    onChange={e => {
                      setEditAlbergueIds(prev =>
                        e.target.checked ? [...prev, a.id] : prev.filter(id => id !== a.id)
                      );
                    }}
                    className="rounded"
                  />
                  {a.nombre}
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingAlberguesFor(null)}>{t.cancel}</Button>
              <Button onClick={async () => {
                try {
                  if (store.useApi) {
                    await api.updateUserAlbergues(editingAlberguesFor!, editAlbergueIds);
                  }
                  toast.success('Albergues actualizados');
                  setEditingAlberguesFor(null);
                } catch { /* error handled by api */ }
              }}>{t.save}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

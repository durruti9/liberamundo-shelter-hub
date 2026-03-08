import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Package, Plus, Minus, AlertTriangle, Trash2, Edit, ArrowDownUp, History } from 'lucide-react';
import { api } from '@/lib/api';
import { UserRole } from '@/types';
import ExportButton from '@/components/ExportButton';

interface Category {
  id: string;
  nombre: string;
  icono: string;
}

interface Item {
  id: string;
  categoria_id: string;
  categoria_nombre: string;
  nombre: string;
  unidad: string;
  stock_actual: number;
  stock_minimo: number;
  ubicacion: string;
  notas: string;
}

interface Movement {
  id: string;
  tipo: 'entrada' | 'salida';
  cantidad: number;
  motivo: string;
  usuario: string;
  fecha: string;
}

interface Props {
  role: UserRole;
  albergueId: string;
}

export default function InventarioTab({ role, albergueId }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [showAddItem, setShowAddItem] = useState(false);
  const [showMovement, setShowMovement] = useState<{ item: Item; tipo: 'entrada' | 'salida' } | null>(null);
  const [showHistory, setShowHistory] = useState<Item | null>(null);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [editItem, setEditItem] = useState<Item | null>(null);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const [newItem, setNewItem] = useState({
    categoria_id: '', nombre: '', unidad: 'unidades', stock_actual: 0, stock_minimo: 0, ubicacion: '', notas: '',
  });
  const [movAmount, setMovAmount] = useState(0);
  const [movMotivo, setMovMotivo] = useState('');

  const isAdmin = role === 'admin';

  // Example data for when API is not available
  const MOCK_CATEGORIES: Category[] = [
    { id: 'cat-1', nombre: 'Ropa y calzado', icono: 'Shirt' },
    { id: 'cat-2', nombre: 'Higiene personal', icono: 'Droplets' },
    { id: 'cat-3', nombre: 'Limpieza', icono: 'SprayCan' },
    { id: 'cat-4', nombre: 'Alimentación', icono: 'Apple' },
    { id: 'cat-5', nombre: 'Ropa de cama', icono: 'BedDouble' },
    { id: 'cat-6', nombre: 'Material oficina', icono: 'Paperclip' },
    { id: 'cat-7', nombre: 'Otros', icono: 'Package' },
  ];

  const MOCK_ITEMS: Item[] = [
    // Ropa y calzado
    { id: 'i-1', categoria_id: 'cat-1', categoria_nombre: 'Ropa y calzado', nombre: 'Camisetas talla M', unidad: 'unidades', stock_actual: 45, stock_minimo: 20, ubicacion: 'Almacén principal - Estantería A1', notas: 'Colores variados' },
    { id: 'i-2', categoria_id: 'cat-1', categoria_nombre: 'Ropa y calzado', nombre: 'Camisetas talla L', unidad: 'unidades', stock_actual: 12, stock_minimo: 20, ubicacion: 'Almacén principal - Estantería A1', notas: '' },
    { id: 'i-3', categoria_id: 'cat-1', categoria_nombre: 'Ropa y calzado', nombre: 'Pantalones chándal', unidad: 'unidades', stock_actual: 30, stock_minimo: 15, ubicacion: 'Almacén principal - Estantería A2', notas: 'Tallas S-XL' },
    { id: 'i-4', categoria_id: 'cat-1', categoria_nombre: 'Ropa y calzado', nombre: 'Zapatillas deportivas', unidad: 'pares', stock_actual: 8, stock_minimo: 10, ubicacion: 'Almacén principal - Estantería A3', notas: 'Números 39-45' },
    { id: 'i-5', categoria_id: 'cat-1', categoria_nombre: 'Ropa y calzado', nombre: 'Calcetines', unidad: 'pares', stock_actual: 60, stock_minimo: 30, ubicacion: 'Almacén principal - Estantería A1', notas: '' },
    { id: 'i-6', categoria_id: 'cat-1', categoria_nombre: 'Ropa y calzado', nombre: 'Chaquetas de invierno', unidad: 'unidades', stock_actual: 5, stock_minimo: 10, ubicacion: 'Almacén principal - Perchero', notas: 'Tallas variadas' },
    // Higiene personal
    { id: 'i-7', categoria_id: 'cat-2', categoria_nombre: 'Higiene personal', nombre: 'Gel de ducha', unidad: 'litros', stock_actual: 25, stock_minimo: 10, ubicacion: 'Almacén baños', notas: 'Formato 500ml' },
    { id: 'i-8', categoria_id: 'cat-2', categoria_nombre: 'Higiene personal', nombre: 'Champú', unidad: 'litros', stock_actual: 3, stock_minimo: 8, ubicacion: 'Almacén baños', notas: '' },
    { id: 'i-9', categoria_id: 'cat-2', categoria_nombre: 'Higiene personal', nombre: 'Pasta de dientes', unidad: 'unidades', stock_actual: 40, stock_minimo: 20, ubicacion: 'Almacén baños', notas: 'Tubos 75ml' },
    { id: 'i-10', categoria_id: 'cat-2', categoria_nombre: 'Higiene personal', nombre: 'Cepillos de dientes', unidad: 'unidades', stock_actual: 15, stock_minimo: 20, ubicacion: 'Almacén baños', notas: 'Individuales envasados' },
    { id: 'i-11', categoria_id: 'cat-2', categoria_nombre: 'Higiene personal', nombre: 'Compresas', unidad: 'paquetes', stock_actual: 18, stock_minimo: 10, ubicacion: 'Almacén baños', notas: '' },
    { id: 'i-12', categoria_id: 'cat-2', categoria_nombre: 'Higiene personal', nombre: 'Pañales infantiles T3-T5', unidad: 'paquetes', stock_actual: 4, stock_minimo: 6, ubicacion: 'Almacén baños', notas: 'Distribución por talla: T3(2), T4(1), T5(1)' },
    // Limpieza
    { id: 'i-13', categoria_id: 'cat-3', categoria_nombre: 'Limpieza', nombre: 'Lejía', unidad: 'litros', stock_actual: 20, stock_minimo: 10, ubicacion: 'Cuarto limpieza', notas: '' },
    { id: 'i-14', categoria_id: 'cat-3', categoria_nombre: 'Limpieza', nombre: 'Fregasuelos', unidad: 'litros', stock_actual: 15, stock_minimo: 8, ubicacion: 'Cuarto limpieza', notas: '' },
    { id: 'i-15', categoria_id: 'cat-3', categoria_nombre: 'Limpieza', nombre: 'Bolsas de basura 100L', unidad: 'rollos', stock_actual: 3, stock_minimo: 5, ubicacion: 'Cuarto limpieza', notas: '25 uds/rollo' },
    { id: 'i-16', categoria_id: 'cat-3', categoria_nombre: 'Limpieza', nombre: 'Papel higiénico', unidad: 'paquetes', stock_actual: 8, stock_minimo: 5, ubicacion: 'Cuarto limpieza', notas: '12 rollos/paquete' },
    // Alimentación
    { id: 'i-17', categoria_id: 'cat-4', categoria_nombre: 'Alimentación', nombre: 'Arroz', unidad: 'kg', stock_actual: 50, stock_minimo: 20, ubicacion: 'Cocina - Despensa', notas: '' },
    { id: 'i-18', categoria_id: 'cat-4', categoria_nombre: 'Alimentación', nombre: 'Aceite de oliva', unidad: 'litros', stock_actual: 12, stock_minimo: 5, ubicacion: 'Cocina - Despensa', notas: '' },
    { id: 'i-19', categoria_id: 'cat-4', categoria_nombre: 'Alimentación', nombre: 'Leche entera', unidad: 'litros', stock_actual: 6, stock_minimo: 15, ubicacion: 'Cocina - Frigorífico', notas: '' },
    { id: 'i-20', categoria_id: 'cat-4', categoria_nombre: 'Alimentación', nombre: 'Legumbres variadas', unidad: 'kg', stock_actual: 30, stock_minimo: 10, ubicacion: 'Cocina - Despensa', notas: 'Garbanzos, lentejas, alubias' },
    { id: 'i-21', categoria_id: 'cat-4', categoria_nombre: 'Alimentación', nombre: 'Azúcar', unidad: 'kg', stock_actual: 8, stock_minimo: 5, ubicacion: 'Cocina - Despensa', notas: '' },
    // Ropa de cama
    { id: 'i-22', categoria_id: 'cat-5', categoria_nombre: 'Ropa de cama', nombre: 'Sábanas individuales', unidad: 'juegos', stock_actual: 25, stock_minimo: 15, ubicacion: 'Lavandería', notas: '' },
    { id: 'i-23', categoria_id: 'cat-5', categoria_nombre: 'Ropa de cama', nombre: 'Mantas', unidad: 'unidades', stock_actual: 18, stock_minimo: 10, ubicacion: 'Lavandería', notas: '' },
    { id: 'i-24', categoria_id: 'cat-5', categoria_nombre: 'Ropa de cama', nombre: 'Almohadas', unidad: 'unidades', stock_actual: 22, stock_minimo: 15, ubicacion: 'Lavandería', notas: '' },
    { id: 'i-25', categoria_id: 'cat-5', categoria_nombre: 'Ropa de cama', nombre: 'Toallas de baño', unidad: 'unidades', stock_actual: 10, stock_minimo: 20, ubicacion: 'Lavandería', notas: '' },
    // Material oficina
    { id: 'i-26', categoria_id: 'cat-6', categoria_nombre: 'Material oficina', nombre: 'Folios A4', unidad: 'paquetes', stock_actual: 5, stock_minimo: 3, ubicacion: 'Oficina', notas: '500 hojas/paquete' },
    { id: 'i-27', categoria_id: 'cat-6', categoria_nombre: 'Material oficina', nombre: 'Tóner impresora', unidad: 'unidades', stock_actual: 1, stock_minimo: 2, ubicacion: 'Oficina', notas: 'HP LaserJet' },
  ];

  const loadData = useCallback(async () => {
    try {
      const [cats, itms] = await Promise.all([
        api.getInventarioCategorias(albergueId),
        api.getInventarioItems(albergueId),
      ]);
      setCategories(cats);
      setItems(itms.map((i: any) => ({ ...i, stock_actual: parseFloat(i.stock_actual), stock_minimo: parseFloat(i.stock_minimo) })));
    } catch (err: any) {
      console.warn('[Inventario] Using example data (API not available)');
      // Load mock data when API is not available
      if (categories.length === 0 && items.length === 0) {
        setCategories(MOCK_CATEGORIES);
        setItems(MOCK_ITEMS);
      }
    }
  }, [albergueId]);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredItems = items.filter(i => {
    if (selectedCategory !== 'all' && i.categoria_id !== selectedCategory) return false;
    if (search && !i.nombre.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const alertItems = items.filter(i => i.stock_minimo > 0 && i.stock_actual <= i.stock_minimo);

  const handleAddItem = async () => {
    if (!newItem.nombre || !newItem.categoria_id) return;
    try {
      await api.addInventarioItem(albergueId, newItem);
      toast.success('Artículo añadido');
      setShowAddItem(false);
      setNewItem({ categoria_id: '', nombre: '', unidad: 'unidades', stock_actual: 0, stock_minimo: 0, ubicacion: '', notas: '' });
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleMovement = async () => {
    if (!showMovement || movAmount <= 0) return;
    try {
      await api.addInventarioMovimiento(showMovement.item.id, {
        tipo: showMovement.tipo, cantidad: movAmount, motivo: movMotivo,
      });
      toast.success(showMovement.tipo === 'entrada' ? 'Entrada registrada' : 'Salida registrada');
      setShowMovement(null);
      setMovAmount(0);
      setMovMotivo('');
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('¿Eliminar este artículo y su historial?')) return;
    try {
      await api.deleteInventarioItem(id);
      toast.success('Artículo eliminado');
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleUpdateItem = async () => {
    if (!editItem) return;
    try {
      await api.updateInventarioItem(editItem.id, {
        nombre: editItem.nombre, unidad: editItem.unidad,
        stock_minimo: editItem.stock_minimo, ubicacion: editItem.ubicacion, notas: editItem.notas,
      });
      toast.success('Artículo actualizado');
      setEditItem(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleShowHistory = async (item: Item) => {
    setShowHistory(item);
    try {
      const movs = await api.getInventarioMovimientos(item.id);
      setMovements(movs);
    } catch { setMovements([]); }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      await api.addInventarioCategoria(albergueId, { nombre: newCategoryName.trim() });
      toast.success('Categoría creada');
      setShowAddCategory(false);
      setNewCategoryName('');
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    const catItems = items.filter(i => i.categoria_id === id);
    if (catItems.length > 0) {
      toast.error('No se puede eliminar una categoría con artículos');
      return;
    }
    try {
      await api.deleteInventarioCategoria(id);
      toast.success('Categoría eliminada');
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const stockColor = (item: Item) => {
    if (item.stock_minimo <= 0) return '';
    if (item.stock_actual <= 0) return 'text-red-600 dark:text-red-400 font-bold';
    if (item.stock_actual <= item.stock_minimo) return 'text-amber-600 dark:text-amber-400 font-semibold';
    return 'text-emerald-600 dark:text-emerald-400';
  };

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {alertItems.length > 0 && (
        <Card className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4" />
              {alertItems.length} artículo{alertItems.length !== 1 ? 's' : ''} con stock bajo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {alertItems.map(item => (
                <Badge key={item.id} variant="outline" className="border-amber-500/50 text-amber-700 dark:text-amber-400">
                  {item.nombre}: {item.stock_actual} / {item.stock_minimo} {item.unidad}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold">Inventario</h2>
          <Badge variant="secondary">{items.length} artículos</Badge>
        </div>
        <div className="flex gap-2">
          <ExportButton type="inventario" getData={() => items} />
          {isAdmin && (
            <Button variant="outline" size="sm" onClick={() => setShowAddCategory(true)}>
              + Categoría
            </Button>
          )}
          <Button size="sm" onClick={() => setShowAddItem(true)}>
            <Plus className="w-4 h-4 mr-1" /> Nuevo artículo
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input placeholder="Buscar artículo..." value={search} onChange={e => setSearch(e.target.value)} className="sm:max-w-xs" />
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="sm:max-w-[200px]">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {categories.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Items table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Artículo</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Mínimo</TableHead>
                  <TableHead className="hidden sm:table-cell">Ubicación</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No hay artículos{selectedCategory !== 'all' ? ' en esta categoría' : ''}
                    </TableCell>
                  </TableRow>
                ) : filteredItems.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.nombre}
                      {item.notas && <span className="block text-xs text-muted-foreground">{item.notas}</span>}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{item.categoria_nombre}</Badge>
                    </TableCell>
                    <TableCell className={`text-right ${stockColor(item)}`}>
                      {item.stock_actual} {item.unidad}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {item.stock_minimo > 0 ? `${item.stock_minimo} ${item.unidad}` : '—'}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                      {item.ubicacion || '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600" title="Entrada"
                          onClick={() => setShowMovement({ item, tipo: 'entrada' })}>
                          <Plus className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" title="Salida"
                          onClick={() => setShowMovement({ item, tipo: 'salida' })}>
                          <Minus className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Historial"
                          onClick={() => handleShowHistory(item)}>
                          <History className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Editar"
                          onClick={() => setEditItem({ ...item })}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        {(isAdmin || role === 'personal_albergue') && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" title="Eliminar"
                            onClick={() => handleDeleteItem(item.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Categories list for admin */}
      {isAdmin && categories.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Categorías</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {categories.map(c => (
                <Badge key={c.id} variant="secondary" className="gap-1 pr-1">
                  {c.nombre}
                  {items.filter(i => i.categoria_id === c.id).length === 0 && (
                    <button onClick={() => handleDeleteCategory(c.id)} className="ml-1 hover:text-destructive">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add item dialog */}
      <Dialog open={showAddItem} onOpenChange={setShowAddItem}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader><DialogTitle>Nuevo artículo</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Categoría *</Label>
              <Select value={newItem.categoria_id} onValueChange={v => setNewItem(p => ({ ...p, categoria_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Nombre *</Label>
              <Input value={newItem.nombre} onChange={e => setNewItem(p => ({ ...p, nombre: e.target.value }))} placeholder="Ej: Toallas" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Unidad</Label>
                <Input value={newItem.unidad} onChange={e => setNewItem(p => ({ ...p, unidad: e.target.value }))} placeholder="unidades" />
              </div>
              <div className="space-y-1">
                <Label>Stock inicial</Label>
                <Input type="number" min={0} value={newItem.stock_actual} onChange={e => setNewItem(p => ({ ...p, stock_actual: parseFloat(e.target.value) || 0 }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Stock mínimo</Label>
                <Input type="number" min={0} value={newItem.stock_minimo} onChange={e => setNewItem(p => ({ ...p, stock_minimo: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div className="space-y-1">
                <Label>Ubicación</Label>
                <Input value={newItem.ubicacion} onChange={e => setNewItem(p => ({ ...p, ubicacion: e.target.value }))} placeholder="Almacén 1" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Notas</Label>
              <Input value={newItem.notas} onChange={e => setNewItem(p => ({ ...p, notas: e.target.value }))} placeholder="Opcional" />
            </div>
            <Button onClick={handleAddItem} className="w-full">Añadir artículo</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Movement dialog */}
      <Dialog open={!!showMovement} onOpenChange={() => setShowMovement(null)}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>
              {showMovement?.tipo === 'entrada' ? '📥 Entrada de stock' : '📤 Salida de stock'}
              {' — '}{showMovement?.item.nombre}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Stock actual: <strong>{showMovement?.item.stock_actual} {showMovement?.item.unidad}</strong>
            </p>
            <div className="space-y-1">
              <Label>Cantidad</Label>
              <Input type="number" min={0.1} step={0.1} value={movAmount || ''} onChange={e => setMovAmount(parseFloat(e.target.value) || 0)} autoFocus />
            </div>
            <div className="space-y-1">
              <Label>Motivo (opcional)</Label>
              <Input value={movMotivo} onChange={e => setMovMotivo(e.target.value)} placeholder="Ej: Donación recibida, Entrega a huéspedes..." />
            </div>
            <Button onClick={handleMovement} className="w-full" disabled={movAmount <= 0}>
              Registrar {showMovement?.tipo}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* History dialog */}
      <Dialog open={!!showHistory} onOpenChange={() => setShowHistory(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Historial — {showHistory?.nombre}</DialogTitle>
          </DialogHeader>
          {movements.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">Sin movimientos registrados</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Cant.</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Usuario</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map(m => (
                  <TableRow key={m.id}>
                    <TableCell className="text-xs">{new Date(m.fecha).toLocaleDateString('es-ES')}</TableCell>
                    <TableCell>
                      <Badge variant={m.tipo === 'entrada' ? 'default' : 'destructive'} className="text-xs">
                        {m.tipo === 'entrada' ? '📥' : '📤'} {m.tipo}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">{parseFloat(String(m.cantidad))}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{m.motivo || '—'}</TableCell>
                    <TableCell className="text-xs">{m.usuario || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit item dialog */}
      <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader><DialogTitle>Editar artículo</DialogTitle></DialogHeader>
          {editItem && (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Nombre</Label>
                <Input value={editItem.nombre} onChange={e => setEditItem({ ...editItem, nombre: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Unidad</Label>
                  <Input value={editItem.unidad} onChange={e => setEditItem({ ...editItem, unidad: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>Stock mínimo</Label>
                  <Input type="number" min={0} value={editItem.stock_minimo} onChange={e => setEditItem({ ...editItem, stock_minimo: parseFloat(e.target.value) || 0 })} />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Ubicación</Label>
                <Input value={editItem.ubicacion} onChange={e => setEditItem({ ...editItem, ubicacion: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Notas</Label>
                <Input value={editItem.notas} onChange={e => setEditItem({ ...editItem, notas: e.target.value })} />
              </div>
              <Button onClick={handleUpdateItem} className="w-full">Guardar cambios</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add category dialog */}
      <Dialog open={showAddCategory} onOpenChange={setShowAddCategory}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader><DialogTitle>Nueva categoría</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Nombre</Label>
              <Input value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="Ej: Medicamentos" autoFocus />
            </div>
            <Button onClick={handleAddCategory} className="w-full" disabled={!newCategoryName.trim()}>Crear categoría</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

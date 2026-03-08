import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { Package, Plus, Minus, AlertTriangle, Trash2, Edit, ChevronDown, BarChart3 } from 'lucide-react';
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

interface LocalMovement {
  item_id: string;
  item_nombre: string;
  categoria_nombre: string;
  tipo: 'entrada' | 'salida';
  cantidad: number;
  fecha: string; // YYYY-MM
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
  const [editItem, setEditItem] = useState<Item | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [newItem, setNewItem] = useState({
    categoria_id: '', nombre: '', unidad: 'unidades', stock_actual: 0, stock_minimo: 0, ubicacion: '', notas: '',
  });
  const [statsOpen, setStatsOpen] = useState(false);
  const [localMovements, setLocalMovements] = useState<LocalMovement[]>([]);
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  const [consumoData, setConsumoData] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const canManage = role === 'admin' || role === 'personal_albergue';

  // Example data for when API is not available
  const MOCK_CATEGORIES: Category[] = [
    { id: 'cat-2', nombre: 'Higiene personal', icono: 'Droplets' },
    { id: 'cat-3', nombre: 'Limpieza', icono: 'SprayCan' },
    { id: 'cat-4', nombre: 'Alimentación', icono: 'Apple' },
    { id: 'cat-5', nombre: 'Ropa de cama', icono: 'BedDouble' },
    { id: 'cat-6', nombre: 'Material oficina', icono: 'Paperclip' },
    { id: 'cat-7', nombre: 'Otros', icono: 'Package' },
  ];

  const MOCK_ITEMS: Item[] = [
    { id: 'i-7', categoria_id: 'cat-2', categoria_nombre: 'Higiene personal', nombre: 'Gel de ducha', unidad: 'litros', stock_actual: 25, stock_minimo: 10, ubicacion: '', notas: 'Formato 500ml' },
    { id: 'i-8', categoria_id: 'cat-2', categoria_nombre: 'Higiene personal', nombre: 'Champú', unidad: 'litros', stock_actual: 3, stock_minimo: 8, ubicacion: '', notas: '' },
    { id: 'i-9', categoria_id: 'cat-2', categoria_nombre: 'Higiene personal', nombre: 'Pasta de dientes', unidad: 'unidades', stock_actual: 40, stock_minimo: 20, ubicacion: '', notas: 'Tubos 75ml' },
    { id: 'i-10', categoria_id: 'cat-2', categoria_nombre: 'Higiene personal', nombre: 'Cepillos de dientes', unidad: 'unidades', stock_actual: 15, stock_minimo: 20, ubicacion: '', notas: 'Individuales envasados' },
    { id: 'i-11', categoria_id: 'cat-2', categoria_nombre: 'Higiene personal', nombre: 'Compresas', unidad: 'paquetes', stock_actual: 18, stock_minimo: 10, ubicacion: '', notas: '' },
    { id: 'i-12', categoria_id: 'cat-2', categoria_nombre: 'Higiene personal', nombre: 'Pañales infantiles T3-T5', unidad: 'paquetes', stock_actual: 4, stock_minimo: 6, ubicacion: '', notas: 'Distribución por talla: T3(2), T4(1), T5(1)' },
    { id: 'i-13', categoria_id: 'cat-3', categoria_nombre: 'Limpieza', nombre: 'Lejía', unidad: 'litros', stock_actual: 20, stock_minimo: 10, ubicacion: '', notas: '' },
    { id: 'i-14', categoria_id: 'cat-3', categoria_nombre: 'Limpieza', nombre: 'Fregasuelos', unidad: 'litros', stock_actual: 15, stock_minimo: 8, ubicacion: '', notas: '' },
    { id: 'i-15', categoria_id: 'cat-3', categoria_nombre: 'Limpieza', nombre: 'Bolsas de basura 100L', unidad: 'rollos', stock_actual: 3, stock_minimo: 5, ubicacion: '', notas: '25 uds/rollo' },
    { id: 'i-16', categoria_id: 'cat-3', categoria_nombre: 'Limpieza', nombre: 'Papel higiénico', unidad: 'paquetes', stock_actual: 8, stock_minimo: 5, ubicacion: '', notas: '12 rollos/paquete' },
    { id: 'i-17', categoria_id: 'cat-4', categoria_nombre: 'Alimentación', nombre: 'Arroz', unidad: 'kg', stock_actual: 50, stock_minimo: 20, ubicacion: '', notas: '' },
    { id: 'i-18', categoria_id: 'cat-4', categoria_nombre: 'Alimentación', nombre: 'Aceite de oliva', unidad: 'litros', stock_actual: 12, stock_minimo: 5, ubicacion: '', notas: '' },
    { id: 'i-19', categoria_id: 'cat-4', categoria_nombre: 'Alimentación', nombre: 'Leche entera', unidad: 'litros', stock_actual: 6, stock_minimo: 15, ubicacion: '', notas: '' },
    { id: 'i-20', categoria_id: 'cat-4', categoria_nombre: 'Alimentación', nombre: 'Legumbres variadas', unidad: 'kg', stock_actual: 30, stock_minimo: 10, ubicacion: '', notas: 'Garbanzos, lentejas, alubias' },
    { id: 'i-21', categoria_id: 'cat-4', categoria_nombre: 'Alimentación', nombre: 'Azúcar', unidad: 'kg', stock_actual: 8, stock_minimo: 5, ubicacion: '', notas: '' },
    { id: 'i-22', categoria_id: 'cat-5', categoria_nombre: 'Ropa de cama', nombre: 'Sábanas bajeras individuales', unidad: 'unidades', stock_actual: 25, stock_minimo: 15, ubicacion: '', notas: '' },
    { id: 'i-23', categoria_id: 'cat-5', categoria_nombre: 'Ropa de cama', nombre: 'Sábanas encimeras', unidad: 'unidades', stock_actual: 20, stock_minimo: 15, ubicacion: '', notas: '' },
    { id: 'i-24', categoria_id: 'cat-5', categoria_nombre: 'Ropa de cama', nombre: 'Mantas polares', unidad: 'unidades', stock_actual: 18, stock_minimo: 10, ubicacion: '', notas: '' },
    { id: 'i-25', categoria_id: 'cat-5', categoria_nombre: 'Ropa de cama', nombre: 'Edredones nórdicos', unidad: 'unidades', stock_actual: 8, stock_minimo: 10, ubicacion: '', notas: '' },
    { id: 'i-26', categoria_id: 'cat-5', categoria_nombre: 'Ropa de cama', nombre: 'Almohadas', unidad: 'unidades', stock_actual: 22, stock_minimo: 15, ubicacion: '', notas: '' },
    { id: 'i-27', categoria_id: 'cat-5', categoria_nombre: 'Ropa de cama', nombre: 'Fundas de almohada', unidad: 'unidades', stock_actual: 30, stock_minimo: 15, ubicacion: '', notas: '' },
    { id: 'i-28', categoria_id: 'cat-5', categoria_nombre: 'Ropa de cama', nombre: 'Colchones individuales', unidad: 'unidades', stock_actual: 4, stock_minimo: 3, ubicacion: '', notas: 'De repuesto' },
    { id: 'i-29', categoria_id: 'cat-5', categoria_nombre: 'Ropa de cama', nombre: 'Protectores de colchón', unidad: 'unidades', stock_actual: 12, stock_minimo: 10, ubicacion: '', notas: 'Impermeables' },
    { id: 'i-30', categoria_id: 'cat-5', categoria_nombre: 'Ropa de cama', nombre: 'Toallas de baño', unidad: 'unidades', stock_actual: 10, stock_minimo: 20, ubicacion: '', notas: '' },
    { id: 'i-31', categoria_id: 'cat-5', categoria_nombre: 'Ropa de cama', nombre: 'Toallas de mano', unidad: 'unidades', stock_actual: 15, stock_minimo: 20, ubicacion: '', notas: '' },
    { id: 'i-32', categoria_id: 'cat-6', categoria_nombre: 'Material oficina', nombre: 'Folios A4', unidad: 'paquetes', stock_actual: 5, stock_minimo: 3, ubicacion: '', notas: '500 hojas/paquete' },
    { id: 'i-33', categoria_id: 'cat-6', categoria_nombre: 'Material oficina', nombre: 'Tóner impresora', unidad: 'unidades', stock_actual: 1, stock_minimo: 2, ubicacion: '', notas: 'HP LaserJet' },
  ];

  const loadData = useCallback(async () => {
    try {
      const [cats, itms] = await Promise.all([
        api.getInventarioCategorias(albergueId),
        api.getInventarioItems(albergueId),
      ]);
      setCategories(cats);
      setItems(itms.map((i: any) => ({ ...i, stock_actual: parseFloat(i.stock_actual), stock_minimo: parseFloat(i.stock_minimo) })));
    } catch {
      console.warn('[Inventario] Using example data (API not available)');
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

  const loadConsumo = useCallback(async () => {
    try {
      const data = await api.getInventarioConsumoMensual(albergueId);
      setConsumoData(data);
    } catch {
      setConsumoData([]);
    }
  }, [albergueId]);

  useEffect(() => { if (statsOpen) loadConsumo(); }, [statsOpen, loadConsumo]);

  // Merge API data + local movements into unified stats
  const consumoMes = useMemo(() => {
    const itemMap: Record<string, { nombre: string; categoria: string; salidas: number; entradas: number }> = {};

    // API data
    for (const r of consumoData.filter((r: any) => r.mes === selectedMonth)) {
      const key = `${r.categoria_nombre}::${r.item_nombre}`;
      if (!itemMap[key]) itemMap[key] = { nombre: r.item_nombre, categoria: r.categoria_nombre, salidas: 0, entradas: 0 };
      itemMap[key].salidas += parseFloat(r.total_salidas);
      itemMap[key].entradas += parseFloat(r.total_entradas);
    }

    // Local movements
    for (const m of localMovements.filter(m => m.fecha === selectedMonth)) {
      const key = `${m.categoria_nombre}::${m.item_nombre}`;
      if (!itemMap[key]) itemMap[key] = { nombre: m.item_nombre, categoria: m.categoria_nombre, salidas: 0, entradas: 0 };
      if (m.tipo === 'salida') itemMap[key].salidas += m.cantidad;
      else itemMap[key].entradas += m.cantidad;
    }

    // Group by category
    const byCat: Record<string, { categoria: string; totalSalidas: number; items: { nombre: string; salidas: number; entradas: number }[] }> = {};
    for (const item of Object.values(itemMap)) {
      if (!byCat[item.categoria]) byCat[item.categoria] = { categoria: item.categoria, totalSalidas: 0, items: [] };
      byCat[item.categoria].items.push({ nombre: item.nombre, salidas: item.salidas, entradas: item.entradas });
      byCat[item.categoria].totalSalidas += item.salidas;
    }
    return Object.values(byCat).sort((a, b) => b.totalSalidas - a.totalSalidas);
  }, [consumoData, localMovements, selectedMonth]);

  const availableMonths = useMemo(() => {
    const months = new Set([
      ...consumoData.map((r: any) => r.mes),
      ...localMovements.map(m => m.fecha),
    ]);
    if (!months.has(selectedMonth)) months.add(selectedMonth);
    return Array.from(months).sort().reverse();
  }, [consumoData, localMovements, selectedMonth]);

  const totalSalidasMes = consumoMes.reduce((sum, cat) => sum + cat.totalSalidas, 0);

  const toggleCatExpand = (cat: string) => {
    setExpandedCats(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  };

  const handleAddItem = async () => {
    if (!newItem.nombre || !newItem.categoria_id) return;
    try {
      await api.addInventarioItem(albergueId, newItem);
      toast.success('Artículo añadido');
      setShowAddItem(false);
      setNewItem({ categoria_id: '', nombre: '', unidad: 'unidades', stock_actual: 0, stock_minimo: 0, ubicacion: '', notas: '' });
      loadData();
    } catch {
      // Mock: add locally
      const cat = categories.find(c => c.id === newItem.categoria_id);
      const mockItem: Item = { ...newItem, id: `i-${Date.now()}`, categoria_nombre: cat?.nombre || '', stock_actual: newItem.stock_actual, stock_minimo: newItem.stock_minimo };
      setItems(prev => [...prev, mockItem]);
      setShowAddItem(false);
      setNewItem({ categoria_id: '', nombre: '', unidad: 'unidades', stock_actual: 0, stock_minimo: 0, ubicacion: '', notas: '' });
      toast.success('Artículo añadido');
    }
  };

  const handleQuickMovement = (item: Item, tipo: 'entrada' | 'salida') => {
    const delta = tipo === 'entrada' ? 1 : -1;
    const newStock = Math.max(0, item.stock_actual + delta);
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, stock_actual: newStock } : i));
    // Track locally for stats
    const now = new Date();
    const mes = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    setLocalMovements(prev => [...prev, { item_id: item.id, item_nombre: item.nombre, categoria_nombre: item.categoria_nombre, tipo, cantidad: 1, fecha: mes }]);
    api.addInventarioMovimiento(item.id, { tipo, cantidad: 1, motivo: '' }).catch(() => {});
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('¿Eliminar este artículo y su historial?')) return;
    try {
      await api.deleteInventarioItem(id);
      toast.success('Artículo eliminado');
      loadData();
    } catch {
      setItems(prev => prev.filter(i => i.id !== id));
      toast.success('Artículo eliminado');
    }
  };

  const handleUpdateItem = async () => {
    if (!editItem) return;
    try {
      await api.updateInventarioItem(editItem.id, {
        nombre: editItem.nombre, unidad: editItem.unidad,
        stock_minimo: editItem.stock_minimo, notas: editItem.notas,
      });
      toast.success('Artículo actualizado');
      setEditItem(null);
      loadData();
    } catch {
      setItems(prev => prev.map(i => i.id === editItem.id ? { ...editItem } : i));
      toast.success('Artículo actualizado');
      setEditItem(null);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      await api.addInventarioCategoria(albergueId, { nombre: newCategoryName.trim() });
      toast.success('Categoría creada');
      setNewCategoryName('');
      loadData();
    } catch {
      const newCat: Category = { id: `cat-${Date.now()}`, nombre: newCategoryName.trim(), icono: 'Package' };
      setCategories(prev => [...prev, newCat]);
      setNewCategoryName('');
      toast.success('Categoría creada');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    const catItems = items.filter(i => i.categoria_id === id);
    const msg = catItems.length > 0
      ? `Esta categoría tiene ${catItems.length} artículo(s). ¿Eliminar la categoría y todos sus artículos?`
      : '¿Eliminar esta categoría?';
    if (!confirm(msg)) return;
    try {
      await api.deleteInventarioCategoria(id);
      toast.success('Categoría eliminada');
      loadData();
    } catch {
      setItems(prev => prev.filter(i => i.categoria_id !== id));
      setCategories(prev => prev.filter(c => c.id !== id));
      if (selectedCategory === id) setSelectedCategory('all');
      toast.success('Categoría eliminada');
    }
  };

  const handleEditCategory = async () => {
    if (!editCategory || !editCategory.nombre.trim()) return;
    try {
      throw new Error('mock');
    } catch {
      setCategories(prev => prev.map(c => c.id === editCategory.id ? { ...c, nombre: editCategory.nombre } : c));
      setItems(prev => prev.map(i => i.categoria_id === editCategory.id ? { ...i, categoria_nombre: editCategory.nombre } : i));
      toast.success('Categoría actualizada');
      setEditCategory(null);
    }
  };

  const stockColor = (item: Item) => {
    if (item.stock_minimo <= 0) return '';
    if (item.stock_actual <= 0) return 'text-destructive font-bold';
    if (item.stock_actual <= item.stock_minimo) return 'text-amber-600 dark:text-amber-400 font-semibold';
    return 'text-emerald-600 dark:text-emerald-400';
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Alerts */}
      {alertItems.length > 0 && (
        <Card className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/30">
          <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-sm flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4" />
              {alertItems.length} artículo{alertItems.length !== 1 ? 's' : ''} con stock bajo
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {alertItems.map(item => (
                <Badge key={item.id} variant="outline" className="border-amber-500/50 text-amber-700 dark:text-amber-400 text-xs">
                  {item.nombre}: {item.stock_actual}/{item.stock_minimo}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            <h2 className="text-lg sm:text-xl font-bold">Inventario</h2>
            <Badge variant="secondary">{items.length}</Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            <ExportButton type="inventario" getData={() => items} />
            <Button size="sm" onClick={() => setShowAddItem(true)}>
              <Plus className="w-4 h-4 mr-1" /> Artículo
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Input placeholder="Buscar artículo..." value={search} onChange={e => setSearch(e.target.value)} className="sm:max-w-xs" />
          <div className="flex gap-2">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {categories.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {canManage && (
              <Button variant="outline" size="icon" className="shrink-0" title="Gestionar categorías" onClick={() => setShowCategoryManager(true)}>
                <Edit className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Items - Desktop table */}
      <Card className="hidden sm:block">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Artículo</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Aviso stock bajo en</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
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
                      {item.stock_actual}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {item.stock_minimo > 0 ? item.stock_minimo : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600" title="+1"
                          onClick={() => handleQuickMovement(item, 'entrada')}>
                          <Plus className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" title="-1"
                          onClick={() => handleQuickMovement(item, 'salida')} disabled={item.stock_actual <= 0}>
                          <Minus className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Editar"
                          onClick={() => setEditItem({ ...item })}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        {canManage && (
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

      {/* Items - Mobile cards */}
      <div className="sm:hidden space-y-2">
        {filteredItems.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground">No hay artículos</CardContent></Card>
        ) : filteredItems.map(item => (
          <Card key={item.id}>
            <CardContent className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{item.nombre}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">{item.categoria_nombre}</Badge>
                    {item.stock_minimo > 0 && item.stock_actual <= item.stock_minimo && (
                      <AlertTriangle className="w-3 h-3 text-amber-500" />
                    )}
                  </div>
                  {item.notas && <p className="text-xs text-muted-foreground mt-1 truncate">{item.notas}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-sm font-semibold ${stockColor(item)}`}>{item.stock_actual}</p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-1 mt-2 border-t border-border pt-2">
                <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-600"
                  onClick={() => handleQuickMovement(item, 'entrada')}>
                  <Plus className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600"
                  onClick={() => handleQuickMovement(item, 'salida')} disabled={item.stock_actual <= 0}>
                  <Minus className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7"
                  onClick={() => setEditItem({ ...item })}>
                  <Edit className="w-3.5 h-3.5" />
                </Button>
                {canManage && (
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                    onClick={() => handleDeleteItem(item.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Category manager dialog */}
      <Dialog open={showCategoryManager} onOpenChange={v => { setShowCategoryManager(v); if (!v) { setEditCategory(null); setNewCategoryName(''); } }}>
        <DialogContent className="max-w-md" aria-describedby={undefined}>
          <DialogHeader><DialogTitle>Gestionar categorías</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={newCategoryName}
                onChange={e => setNewCategoryName(e.target.value)}
                placeholder="Nueva categoría..."
                onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
              />
              <Button size="sm" onClick={handleAddCategory} disabled={!newCategoryName.trim()} className="shrink-0">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-1 max-h-[50vh] overflow-y-auto">
              {categories.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No hay categorías</p>
              ) : categories.map(c => (
                <div key={c.id} className="flex items-center gap-2 p-2 rounded-md hover:bg-muted group">
                  {editCategory?.id === c.id ? (
                    <>
                      <Input
                        value={editCategory.nombre}
                        onChange={e => setEditCategory({ ...editCategory, nombre: e.target.value })}
                        className="h-8 text-sm flex-1"
                        autoFocus
                        onKeyDown={e => { if (e.key === 'Enter') handleEditCategory(); if (e.key === 'Escape') setEditCategory(null); }}
                      />
                      <Button size="sm" variant="ghost" className="h-8 shrink-0 px-2" onClick={handleEditCategory}>OK</Button>
                      <Button size="sm" variant="ghost" className="h-8 shrink-0 px-2" onClick={() => setEditCategory(null)}>✕</Button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-sm">{c.nombre}</span>
                      <Badge variant="secondary" className="text-[10px]">{items.filter(i => i.categoria_id === c.id).length}</Badge>
                      <Button variant="ghost" size="icon" className="h-7 w-7 opacity-60 sm:opacity-0 sm:group-hover:opacity-100"
                        onClick={() => setEditCategory({ ...c })}>
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive opacity-60 sm:opacity-0 sm:group-hover:opacity-100"
                        onClick={() => handleDeleteCategory(c.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
            <div className="space-y-1">
              <Label>Stock</Label>
              <Input type="number" min={0} value={newItem.stock_actual} onChange={e => setNewItem(p => ({ ...p, stock_actual: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div className="space-y-1">
              <Label>Aviso stock bajo en</Label>
              <Input type="number" min={0} value={newItem.stock_minimo} onChange={e => setNewItem(p => ({ ...p, stock_minimo: parseFloat(e.target.value) || 0 }))} placeholder="0 = sin aviso" />
            </div>
            <div className="space-y-1">
              <Label>Notas</Label>
              <Input value={newItem.notas} onChange={e => setNewItem(p => ({ ...p, notas: e.target.value }))} placeholder="Opcional" />
            </div>
            <Button onClick={handleAddItem} className="w-full">Añadir artículo</Button>
          </div>
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
                  <Label>Stock</Label>
                  <Input type="number" min={0} value={editItem.stock_actual} onChange={e => setEditItem({ ...editItem, stock_actual: parseFloat(e.target.value) || 0 })} />
                </div>
                <div className="space-y-1">
                  <Label>Aviso stock bajo en</Label>
                  <Input type="number" min={0} value={editItem.stock_minimo} onChange={e => setEditItem({ ...editItem, stock_minimo: parseFloat(e.target.value) || 0 })} placeholder="0 = sin aviso" />
                </div>
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

      {/* Monthly consumption collapsible */}
      <Collapsible open={statsOpen} onOpenChange={setStatsOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Gasto mensual de productos
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform ${statsOpen ? 'rotate-180' : ''}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3">
          <Card>
            <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  Consumo mensual (salidas)
                </CardTitle>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-[140px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMonths.map(m => (
                      <SelectItem key={m} value={m}>
                        {new Date(m + '-01').toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              {consumoMes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay movimientos registrados en este mes. Usa los botones +/- para registrar entradas y salidas.
                </p>
              ) : (
                <div className="space-y-6">
                  {/* Bar chart - consumption by category */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Consumo por categoría</p>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={consumoMes.map(c => ({ name: c.categoria.length > 12 ? c.categoria.slice(0, 12) + '…' : c.categoria, salidas: c.totalSalidas }))} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                        <Tooltip formatter={(value: number) => [`${value} uds.`, 'Consumo']} />
                        <Bar dataKey="salidas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Pie chart - distribution */}
                  {consumoMes.length > 1 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Distribución del gasto</p>
                      <div className="flex items-center gap-4">
                        <ResponsiveContainer width="50%" height={180}>
                          <PieChart>
                            <Pie
                              data={consumoMes.map(c => ({ name: c.categoria, value: c.totalSalidas }))}
                              cx="50%" cy="50%" innerRadius={40} outerRadius={70}
                              dataKey="value" paddingAngle={2}
                            >
                              {consumoMes.map((_, idx) => (
                                <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value: number) => [`${value} uds.`]} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="flex-1 space-y-1.5">
                          {consumoMes.map((cat, idx) => (
                            <div key={cat.categoria} className="flex items-center gap-2 text-xs">
                              <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                              <span className="truncate">{cat.categoria}</span>
                              <span className="ml-auto font-medium">{cat.totalSalidas}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Category breakdown list */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Detalle por categoría</p>
                    {consumoMes.map(cat => (
                      <div key={cat.categoria}>
                        <button
                          onClick={() => toggleCatExpand(cat.categoria)}
                          className="w-full flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <ChevronDown className={`w-4 h-4 transition-transform ${expandedCats.has(cat.categoria) ? 'rotate-180' : ''}`} />
                            <span className="font-medium text-sm">{cat.categoria}</span>
                            <Badge variant="secondary" className="text-[10px]">{cat.items.length} producto{cat.items.length !== 1 ? 's' : ''}</Badge>
                          </div>
                          <span className="text-sm font-semibold text-red-600 dark:text-red-400">-{cat.totalSalidas}</span>
                        </button>
                        {expandedCats.has(cat.categoria) && (
                          <div className="ml-6 mt-1 space-y-1 mb-2">
                            {cat.items.sort((a, b) => b.salidas - a.salidas).map(item => (
                              <div key={item.nombre} className="flex items-center justify-between p-2 rounded-md bg-muted/30 text-sm">
                                <span>{item.nombre}</span>
                                <div className="flex items-center gap-3">
                                  {item.entradas > 0 && (
                                    <span className="text-emerald-600 dark:text-emerald-400 text-xs">+{item.entradas}</span>
                                  )}
                                  {item.salidas > 0 && (
                                    <span className="text-red-600 dark:text-red-400 font-medium">-{item.salidas}</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-border pt-3 flex justify-between text-sm font-medium">
                    <span>Total consumido este mes</span>
                    <span className="text-red-600 dark:text-red-400">{totalSalidasMes} unidades</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

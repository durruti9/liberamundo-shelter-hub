import { HelpCircle, Lightbulb, MousePointerClick, ArrowRight, Info, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { LayoutDashboard, BedDouble, History, CalendarPlus, UtensilsCrossed, FileWarning, ListChecks, Clock, Package, Mailbox, StickyNote } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

function Tip({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2 p-2.5 rounded-md bg-primary/5 border border-primary/10 mt-2">
      <Lightbulb className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
      <span className="text-xs leading-relaxed">{children}</span>
    </div>
  );
}

function Step({ n, children }: { n: number; children: ReactNode }) {
  return (
    <div className="flex items-start gap-2 mt-1.5">
      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold shrink-0 mt-0.5">{n}</span>
      <span className="text-xs leading-relaxed">{children}</span>
    </div>
  );
}

function RoleBadges({ roles }: { roles: string[] }) {
  return (
    <div className="flex gap-1 flex-wrap mt-2">
      {roles.map(r => (
        <Badge key={r} variant="outline" className="text-[10px] px-1.5 py-0">{r}</Badge>
      ))}
    </div>
  );
}

interface Section {
  id: string;
  icon: typeof LayoutDashboard;
  title: string;
  roles: string[];
  description: string;
  howTo: ReactNode;
  tips: string[];
}

const SECTIONS: Section[] = [
  {
    id: 'dashboard',
    icon: LayoutDashboard,
    title: 'Dashboard',
    roles: ['Admin', 'Gestor', 'Personal'],
    description: 'Panel principal con resumen en tiempo real del estado del albergue.',
    howTo: (
      <>
        <p className="text-xs text-muted-foreground mb-2">El dashboard muestra de un vistazo:</p>
        <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
          <li><strong>Ocupación actual</strong> — camas libres y ocupadas con porcentaje</li>
          <li><strong>Llegadas de hoy</strong> — huéspedes previstos para hoy</li>
          <li><strong>Incidencias abiertas</strong> — número de incidencias sin resolver</li>
          <li><strong>Accesos rápidos</strong> — botones directos a las secciones más usadas</li>
        </ul>
      </>
    ),
    tips: ['Pulsa en cualquier tarjeta para ir directamente a esa sección.'],
  },
  {
    id: 'habitaciones',
    icon: BedDouble,
    title: 'Habitaciones',
    roles: ['Admin', 'Gestor', 'Personal'],
    description: 'Gestión visual de habitaciones y camas con vista de mapa interactivo.',
    howTo: (
      <>
        <p className="text-xs text-muted-foreground font-medium mb-1">Registrar un check-in:</p>
        <Step n={1}>Localiza la cama libre (color verde) en la habitación deseada.</Step>
        <Step n={2}>Pulsa sobre la cama para abrir el formulario de check-in.</Step>
        <Step n={3}>Rellena los datos del huésped: nombre, nacionalidad, fechas, etc.</Step>
        <Step n={4}>Pulsa "Registrar" para confirmar la entrada.</Step>
        <Separator className="my-3" />
        <p className="text-xs text-muted-foreground font-medium mb-1">Realizar un check-out:</p>
        <Step n={1}>Pulsa sobre una cama ocupada (color rojo/naranja).</Step>
        <Step n={2}>Confirma la salida del huésped pulsando "Check-out".</Step>
        <Separator className="my-3" />
        <p className="text-xs text-muted-foreground font-medium mb-1">Bloquear una cama:</p>
        <Step n={1}>Pulsa sobre una cama libre.</Step>
        <Step n={2}>Selecciona "Bloquear" e indica el motivo (mantenimiento, reserva, etc.).</Step>
      </>
    ),
    tips: [
      'Los colores indican el estado: verde = libre, rojo = ocupada, gris = bloqueada.',
      'Puedes arrastrar huéspedes entre camas para cambiar la asignación.',
    ],
  },
  {
    id: 'historial',
    icon: History,
    title: 'Historial',
    roles: ['Admin', 'Gestor'],
    description: 'Registro completo de todos los huéspedes que han pasado por el albergue.',
    howTo: (
      <>
        <p className="text-xs text-muted-foreground font-medium mb-1">Buscar un huésped:</p>
        <Step n={1}>Usa el campo de búsqueda para filtrar por nombre o nacionalidad.</Step>
        <Step n={2}>Filtra por rango de fechas si necesitas un período concreto.</Step>
        <Step n={3}>Los resultados se actualizan en tiempo real.</Step>
        <Separator className="my-3" />
        <p className="text-xs text-muted-foreground font-medium mb-1">Exportar datos:</p>
        <Step n={1}>Pulsa el botón de exportación (PDF o Excel).</Step>
        <Step n={2}>Se descargará un archivo con los registros visibles según los filtros aplicados.</Step>
      </>
    ),
    tips: [
      'La exportación respeta los filtros activos: si filtras por fechas, solo se exportarán esos registros.',
      'Usa la búsqueda global (Ctrl+K) para encontrar huéspedes desde cualquier sección.',
    ],
  },
  {
    id: 'llegadas',
    icon: CalendarPlus,
    title: 'Llegadas previstas',
    roles: ['Admin', 'Gestor', 'Personal'],
    description: 'Calendario de reservas y llegadas programadas al albergue.',
    howTo: (
      <>
        <p className="text-xs text-muted-foreground font-medium mb-1">Registrar una llegada:</p>
        <Step n={1}>Pulsa "Nueva llegada" o haz clic en el día del calendario.</Step>
        <Step n={2}>Introduce los datos: nombre, nacionalidad, fecha de llegada y salida.</Step>
        <Step n={3}>Opcionalmente, asigna una cama específica.</Step>
        <Step n={4}>Guarda la reserva. Aparecerá en el calendario.</Step>
        <Separator className="my-3" />
        <p className="text-xs text-muted-foreground font-medium mb-1">Convertir llegada en check-in:</p>
        <Step n={1}>Cuando el huésped llegue, pulsa sobre su reserva.</Step>
        <Step n={2}>Confirma el check-in para moverlo automáticamente a Habitaciones.</Step>
      </>
    ),
    tips: [
      'Las llegadas de hoy se destacan automáticamente en el dashboard.',
      'Puedes registrar llegadas para fechas futuras para planificar la ocupación.',
    ],
  },
  {
    id: 'comedor',
    icon: UtensilsCrossed,
    title: 'Comedor',
    roles: ['Admin', 'Gestor', 'Personal'],
    description: 'Control diario de comidas servidas por turno: desayuno, almuerzo y cena.',
    howTo: (
      <>
        <p className="text-xs text-muted-foreground font-medium mb-1">Registrar comensales:</p>
        <Step n={1}>Selecciona el día (por defecto se muestra hoy).</Step>
        <Step n={2}>Introduce el número de comensales para cada turno: desayuno, almuerzo, cena.</Step>
        <Step n={3}>Los datos se guardan automáticamente.</Step>
      </>
    ),
    tips: [
      'El resumen mensual te permite ver la evolución del uso del comedor.',
      'Estos datos se incluyen en los informes exportables.',
    ],
  },
  {
    id: 'incidencias',
    icon: FileWarning,
    title: 'Incidencias',
    roles: ['Admin', 'Gestor', 'Personal'],
    description: 'Registro y seguimiento de incidencias, eventos o problemas en el albergue.',
    howTo: (
      <>
        <p className="text-xs text-muted-foreground font-medium mb-1">Crear una incidencia:</p>
        <Step n={1}>Pulsa "Nueva incidencia".</Step>
        <Step n={2}>Selecciona el tipo (convivencia, mantenimiento, sanitaria, etc.).</Step>
        <Step n={3}>Describe la situación y selecciona la prioridad.</Step>
        <Step n={4}>Opcionalmente: adjunta archivos, selecciona huéspedes implicados y configura la visibilidad.</Step>
        <Step n={5}>Guarda la incidencia.</Step>
        <Separator className="my-3" />
        <p className="text-xs text-muted-foreground font-medium mb-1">Gestionar incidencias:</p>
        <Step n={1}>Cambia el estado: abierta → en proceso → resuelta.</Step>
        <Step n={2}>Añade comentarios para documentar el seguimiento.</Step>
      </>
    ),
    tips: [
      'Usa la "visibilidad" para controlar qué roles pueden ver cada incidencia (ej: solo admin).',
      'Las incidencias abiertas aparecen como alerta en el dashboard.',
      'Puedes adjuntar fotos o documentos como evidencia.',
    ],
  },
  {
    id: 'tareas',
    icon: ListChecks,
    title: 'Tareas de empleados',
    roles: ['Admin', 'Personal'],
    description: 'Sistema de tareas diarias con calendario, asignación y estadísticas de cumplimiento.',
    howTo: (
      <>
        <p className="text-xs text-muted-foreground font-medium mb-1">Crear tareas:</p>
        <Step n={1}>Selecciona un día en el calendario.</Step>
        <Step n={2}>Pulsa "Añadir tarea" e introduce la descripción.</Step>
        <Step n={3}>Asigna la tarea a uno o más trabajadores.</Step>
        <Separator className="my-3" />
        <p className="text-xs text-muted-foreground font-medium mb-1">Completar tareas (trabajador):</p>
        <Step n={1}>Abre el día actual en el calendario.</Step>
        <Step n={2}>Marca cada tarea como "Hecha" o "No procede".</Step>
        <Separator className="my-3" />
        <p className="text-xs text-muted-foreground font-medium mb-1">Ver estadísticas:</p>
        <Step n={1}>Despliega la sección "Estadísticas mensuales" debajo del calendario.</Step>
        <Step n={2}>Consulta el porcentaje de cumplimiento por trabajador.</Step>
        <Step n={3}>Exporta los datos en PDF o Excel.</Step>
      </>
    ),
    tips: [
      'Las tareas se pueden duplicar entre días para rutinas recurrentes.',
      'Las estadísticas muestran el rendimiento mensual de cada trabajador.',
    ],
  },
  {
    id: 'registro_horario',
    icon: Clock,
    title: 'Registro horario',
    roles: ['Admin', 'Personal'],
    description: 'Fichaje de jornada laboral con cálculo automático de horas ordinarias y extras.',
    howTo: (
      <>
        <p className="text-xs text-muted-foreground font-medium mb-1">Fichar (trabajador):</p>
        <Step n={1}>Selecciona el día en el calendario.</Step>
        <Step n={2}>Introduce hora de entrada y hora de salida.</Step>
        <Step n={3}>Si aplica, añade la pausa (inicio y fin).</Step>
        <Step n={4}>Selecciona el tipo de día (laboral, festivo, baja, vacaciones…).</Step>
        <Step n={5}>Firma digitalmente con el dedo o ratón.</Step>
        <Step n={6}>El sistema calcula automáticamente las horas totales, ordinarias y extras.</Step>
        <Separator className="my-3" />
        <p className="text-xs text-muted-foreground font-medium mb-1">Consultar registros (admin):</p>
        <Step n={1}>Selecciona un trabajador en el desplegable.</Step>
        <Step n={2}>Pulsa sobre cualquier día para ver el detalle en modo lectura.</Step>
        <Step n={3}>Los datos incluyen horarios, firma y desglose de horas.</Step>
      </>
    ),
    tips: [
      'El cálculo de horas se muestra en vivo mientras introduces los horarios.',
      'Los días festivos o de baja no computan horas extras.',
      'El admin no puede modificar los registros, solo consultarlos.',
    ],
  },
  {
    id: 'inventario',
    icon: Package,
    title: 'Inventario',
    roles: ['Admin', 'Personal'],
    description: 'Gestión de productos y materiales del albergue con alertas de stock bajo.',
    howTo: (
      <>
        <p className="text-xs text-muted-foreground font-medium mb-1">Añadir un producto:</p>
        <Step n={1}>Pulsa "Nuevo producto".</Step>
        <Step n={2}>Introduce nombre, categoría, cantidad actual y stock mínimo.</Step>
        <Step n={3}>Guarda el producto.</Step>
        <Separator className="my-3" />
        <p className="text-xs text-muted-foreground font-medium mb-1">Registrar movimiento:</p>
        <Step n={1}>Pulsa sobre un producto existente.</Step>
        <Step n={2}>Selecciona "Entrada" o "Salida" y la cantidad.</Step>
        <Step n={3}>El stock se actualiza automáticamente.</Step>
      </>
    ),
    tips: [
      'Los productos con stock por debajo del mínimo se destacan en rojo.',
      'Puedes exportar el inventario completo a Excel para pedidos.',
    ],
  },
  {
    id: 'sugerencias',
    icon: Mailbox,
    title: 'Buzón de sugerencias',
    roles: ['Admin'],
    description: 'Buzón público para que huéspedes envíen sugerencias anónimas via enlace o QR.',
    howTo: (
      <>
        <p className="text-xs text-muted-foreground font-medium mb-1">Compartir el buzón:</p>
        <Step n={1}>Copia el enlace público o descarga el código QR.</Step>
        <Step n={2}>Compártelo con los huéspedes (impreso en el albergue, por ejemplo).</Step>
        <Separator className="my-3" />
        <p className="text-xs text-muted-foreground font-medium mb-1">Gestionar sugerencias:</p>
        <Step n={1}>Las sugerencias aparecen automáticamente en la lista.</Step>
        <Step n={2}>Puedes marcarlas como leídas, responderlas o archivarlas.</Step>
      </>
    ),
    tips: [
      'Las sugerencias son anónimas: los huéspedes no necesitan identificarse.',
      'Imprime el QR y colócalo en zonas comunes para facilitar el acceso.',
    ],
  },
  {
    id: 'notas',
    icon: StickyNote,
    title: 'Notas',
    roles: ['Admin'],
    description: 'Bloc de notas interno para recordatorios, anotaciones e información importante.',
    howTo: (
      <>
        <Step n={1}>Pulsa "Nueva nota".</Step>
        <Step n={2}>Escribe un título y el contenido.</Step>
        <Step n={3}>Opcionalmente, elige un color para categorizar visualmente.</Step>
        <Step n={4}>La nota se guarda automáticamente.</Step>
      </>
    ),
    tips: [
      'Usa colores diferentes para distinguir temas (ej: rojo = urgente, verde = resuelto).',
      'Las notas son privadas y solo visibles para el administrador.',
    ],
  },
];

export default function HelpDialog() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)} title="Ayuda">
        <HelpCircle className="w-4 h-4" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] p-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-primary" />
              Guía de la aplicación
            </DialogTitle>
            <DialogDescription>
              Manual de uso con instrucciones paso a paso para cada sección.
            </DialogDescription>
          </DialogHeader>

          {/* Quick legend */}
          <div className="px-6 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1"><MousePointerClick className="w-3 h-3" /> Pasos interactivos</span>
            <span className="flex items-center gap-1"><Lightbulb className="w-3 h-3 text-primary" /> Consejos</span>
            <span className="flex items-center gap-1"><Info className="w-3 h-3" /> Roles con acceso</span>
          </div>

          <ScrollArea className="px-6 pb-6 max-h-[62vh]">
            <Accordion type="single" collapsible className="w-full">
              {SECTIONS.map(s => (
                <AccordionItem key={s.id} value={s.id}>
                  <AccordionTrigger className="text-sm hover:no-underline">
                    <span className="flex items-center gap-2">
                      <s.icon className="w-4 h-4 text-primary shrink-0" />
                      {s.title}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm leading-relaxed space-y-3">
                    {/* Description */}
                    <p className="text-xs">{s.description}</p>

                    {/* Roles */}
                    <RoleBadges roles={s.roles} />

                    <Separator />

                    {/* How to */}
                    <div>
                      <p className="text-xs font-semibold text-foreground flex items-center gap-1 mb-2">
                        <MousePointerClick className="w-3.5 h-3.5" /> Cómo se usa
                      </p>
                      {s.howTo}
                    </div>

                    {/* Tips */}
                    {s.tips.length > 0 && (
                      <div className="space-y-1.5">
                        {s.tips.map((tip, i) => (
                          <Tip key={i}>{tip}</Tip>
                        ))}
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            {/* Footer tips */}
            <div className="mt-4 p-3 rounded-lg border border-dashed border-muted-foreground/20 text-center space-y-1">
              <p className="text-xs font-medium text-foreground flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> Atajos útiles
              </p>
              <p className="text-[11px] text-muted-foreground"><kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono">Ctrl + K</kbd> — Búsqueda global desde cualquier sección</p>
              <p className="text-[11px] text-muted-foreground">🔔 Las notificaciones te avisan de incidencias, llegadas y tareas pendientes</p>
              <p className="text-[11px] text-muted-foreground">📤 Casi todas las secciones permiten exportar datos en PDF o Excel</p>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}

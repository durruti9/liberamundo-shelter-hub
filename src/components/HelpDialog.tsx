import { HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { LayoutDashboard, BedDouble, History, CalendarPlus, UtensilsCrossed, FileWarning, ListChecks, Clock, Package, Mailbox, StickyNote } from 'lucide-react';
import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';

const SECTIONS = [
  {
    id: 'dashboard',
    icon: LayoutDashboard,
    title: 'Dashboard',
    description: 'Panel principal con resumen del estado del albergue: ocupación actual, llegadas previstas, incidencias abiertas y accesos rápidos a las secciones más utilizadas.',
  },
  {
    id: 'habitaciones',
    icon: BedDouble,
    title: 'Habitaciones',
    description: 'Gestión visual de habitaciones y camas. Puedes ver el estado de cada cama (libre, ocupada, bloqueada), asignar huéspedes, registrar check-in/check-out y gestionar bloqueos por mantenimiento.',
  },
  {
    id: 'historial',
    icon: History,
    title: 'Historial',
    description: 'Registro completo de todos los huéspedes que han pasado por el albergue. Permite buscar por nombre, nacionalidad o fechas, y exportar los datos en PDF o Excel.',
  },
  {
    id: 'llegadas',
    icon: CalendarPlus,
    title: 'Llegadas previstas',
    description: 'Calendario de reservas y llegadas programadas. Registra nuevas llegadas con datos del huésped, fechas de entrada/salida y asignación de cama.',
  },
  {
    id: 'comedor',
    icon: UtensilsCrossed,
    title: 'Comedor',
    description: 'Control de comidas servidas (desayuno, almuerzo, cena). Registra cuántos comensales hay por turno y lleva un seguimiento diario y mensual del uso del comedor.',
  },
  {
    id: 'incidencias',
    icon: FileWarning,
    title: 'Incidencias',
    description: 'Registro de incidencias y eventos relevantes del albergue. Se pueden clasificar por tipo, asignar prioridad, añadir adjuntos y comentarios, y controlar la visibilidad por rol.',
  },
  {
    id: 'tareas',
    icon: ListChecks,
    title: 'Tareas de empleados',
    description: 'Sistema de tareas diarias asignables a trabajadores. Incluye un calendario para ver y gestionar las tareas de cada día, con estadísticas mensuales de cumplimiento por empleado.',
  },
  {
    id: 'registro_horario',
    icon: Clock,
    title: 'Registro horario',
    description: 'Fichaje de jornada laboral. Los trabajadores registran entrada, salida y pausas con firma digital. El sistema calcula automáticamente las horas ordinarias y extras. Los administradores pueden consultar los registros en modo lectura.',
  },
  {
    id: 'inventario',
    icon: Package,
    title: 'Inventario',
    description: 'Gestión del inventario del albergue: productos, cantidades, umbrales de alerta por stock bajo. Permite registrar entradas y salidas de material y exportar el listado.',
  },
  {
    id: 'sugerencias',
    icon: Mailbox,
    title: 'Buzón de sugerencias',
    description: 'Buzón público donde los huéspedes pueden enviar sugerencias anónimas mediante un enlace o código QR. Los administradores revisan, responden y gestionan las sugerencias recibidas.',
  },
  {
    id: 'notas',
    icon: StickyNote,
    title: 'Notas',
    description: 'Bloc de notas interno para el administrador. Permite crear notas rápidas con título, contenido y color, útil para recordatorios o información importante.',
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
        <DialogContent className="max-w-lg max-h-[85vh] p-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-primary" />
              Guía de la aplicación
            </DialogTitle>
            <DialogDescription>
              Descripción de cada sección y cómo utilizarla.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="px-6 pb-6 max-h-[65vh]">
            <Accordion type="single" collapsible className="w-full">
              {SECTIONS.map(s => (
                <AccordionItem key={s.id} value={s.id}>
                  <AccordionTrigger className="text-sm">
                    <span className="flex items-center gap-2">
                      <s.icon className="w-4 h-4 text-primary shrink-0" />
                      {s.title}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm leading-relaxed">
                    {s.description}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}

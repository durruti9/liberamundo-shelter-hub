import { HelpCircle, Lightbulb, MousePointerClick, Info, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { LayoutDashboard, BedDouble, History, CalendarPlus, UtensilsCrossed, FileWarning, ListChecks, Clock, Package, Mailbox, StickyNote } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useI18n } from '@/i18n/I18nContext';
import { helpContent } from '@/i18n/helpContent';

const ICON_MAP: Record<string, typeof LayoutDashboard> = {
  dashboard: LayoutDashboard,
  habitaciones: BedDouble,
  historial: History,
  llegadas: CalendarPlus,
  comedor: UtensilsCrossed,
  incidencias: FileWarning,
  tareas: ListChecks,
  registro_horario: Clock,
  inventario: Package,
  sugerencias: Mailbox,
  notas: StickyNote,
};

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

export default function HelpDialog() {
  const [open, setOpen] = useState(false);
  const { lang } = useI18n();
  const h = helpContent[lang];

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)} title={h.dialogTitle}>
        <HelpCircle className="w-4 h-4" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] p-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-primary" />
              {h.dialogTitle}
            </DialogTitle>
            <DialogDescription>
              {h.dialogDescription}
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1"><MousePointerClick className="w-3 h-3" /> {h.legendSteps}</span>
            <span className="flex items-center gap-1"><Lightbulb className="w-3 h-3 text-primary" /> {h.legendTips}</span>
            <span className="flex items-center gap-1"><Info className="w-3 h-3" /> {h.legendRoles}</span>
          </div>

          <ScrollArea className="px-6 pb-6 max-h-[62vh]">
            <Accordion type="single" collapsible className="w-full">
              {h.sections.map(s => {
                const IconComp = ICON_MAP[s.id] || HelpCircle;
                return (
                  <AccordionItem key={s.id} value={s.id}>
                    <AccordionTrigger className="text-sm hover:no-underline">
                      <span className="flex items-center gap-2">
                        <IconComp className="w-4 h-4 text-primary shrink-0" />
                        {s.title}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground text-sm leading-relaxed space-y-3">
                      <p className="text-xs">{s.description}</p>
                      <RoleBadges roles={s.roles} />
                      <Separator />

                      <div>
                        <p className="text-xs font-semibold text-foreground flex items-center gap-1 mb-2">
                          <MousePointerClick className="w-3.5 h-3.5" /> {h.howToUse}
                        </p>
                        {s.steps.map((step, si) => (
                          <div key={si} className={si > 0 ? 'mt-3' : ''}>
                            <p className="text-xs text-muted-foreground font-medium mb-1">{step.label}</p>
                            {step.items.map((item, ii) => (
                              <Step key={ii} n={ii + 1}>{item}</Step>
                            ))}
                            {si < s.steps.length - 1 && <Separator className="my-3" />}
                          </div>
                        ))}
                      </div>

                      {s.tips.length > 0 && (
                        <div className="space-y-1.5">
                          {s.tips.map((tip, i) => (
                            <Tip key={i}>{tip}</Tip>
                          ))}
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>

            <div className="mt-4 p-3 rounded-lg border border-dashed border-muted-foreground/20 text-center space-y-1">
              <p className="text-xs font-medium text-foreground flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> {h.shortcutsTitle}
              </p>
              <p className="text-[11px] text-muted-foreground"><kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono">Ctrl + K</kbd> — {h.shortcutSearch}</p>
              <p className="text-[11px] text-muted-foreground">🔔 {h.shortcutNotifications}</p>
              <p className="text-[11px] text-muted-foreground">📤 {h.shortcutExport}</p>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}

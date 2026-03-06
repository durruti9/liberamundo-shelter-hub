import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Smartphone, Share, MoreVertical, Plus, CheckCircle2 } from 'lucide-react';
import logo from '@/assets/Logo2Liberamundo.png';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallApp() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua));

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => setIsInstalled(true));

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setIsInstalled(true);
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-4">
          <img src={logo} alt="Libera Mundo" className="h-16 mx-auto" />
          <CardTitle className="text-xl">Instalar Libera Mundo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {isInstalled ? (
            <div className="text-center space-y-3">
              <CheckCircle2 className="w-16 h-16 text-[hsl(var(--success))] mx-auto" />
              <p className="text-lg font-semibold">¡App instalada!</p>
              <p className="text-sm text-muted-foreground">
                Ya puedes usar Libera Mundo desde tu pantalla de inicio.
              </p>
              <Button className="w-full" onClick={() => window.location.href = '/'}>
                Abrir la app
              </Button>
            </div>
          ) : deferredPrompt ? (
            <div className="text-center space-y-4">
              <Smartphone className="w-12 h-12 text-primary mx-auto" />
              <p className="text-sm text-muted-foreground">
                Instala la app en tu dispositivo para un acceso rápido sin necesidad de abrir el navegador.
              </p>
              <Button className="w-full gap-2" size="lg" onClick={handleInstall}>
                <Download className="w-5 h-5" /> Instalar App
              </Button>
            </div>
          ) : isIOS ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Para instalar en iPhone/iPad, sigue estos pasos:
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Share className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">1. Toca el botón Compartir</p>
                    <p className="text-xs text-muted-foreground">El icono de cuadrado con flecha hacia arriba en Safari</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Plus className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">2. Selecciona "Añadir a pantalla de inicio"</p>
                    <p className="text-xs text-muted-foreground">Desplázate hacia abajo en el menú si es necesario</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">3. Toca "Añadir"</p>
                    <p className="text-xs text-muted-foreground">La app aparecerá en tu pantalla de inicio</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Para instalar en Android, sigue estos pasos:
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <MoreVertical className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">1. Toca el menú del navegador</p>
                    <p className="text-xs text-muted-foreground">Los tres puntos en la esquina superior derecha</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Download className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">2. Selecciona "Instalar app" o "Añadir a pantalla de inicio"</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="pt-2 border-t">
            <Button variant="ghost" className="w-full text-sm" onClick={() => window.location.href = '/'}>
              ← Volver a la app
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

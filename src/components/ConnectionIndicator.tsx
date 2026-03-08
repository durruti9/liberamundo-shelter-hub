import { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { isApiAvailable } from '@/lib/api';

export default function ConnectionIndicator() {
  const [connected, setConnected] = useState(true);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    // Only check if we have a token (API mode)
    const token = localStorage.getItem('authToken');
    if (!token) return;

    const check = async () => {
      setChecking(true);
      const available = await isApiAvailable();
      setConnected(available);
      setChecking(false);
    };

    check();
    const interval = setInterval(check, 60000); // Check every 60s
    return () => clearInterval(interval);
  }, []);

  // Don't show if no token (not in API mode)
  if (!localStorage.getItem('authToken')) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={`flex items-center justify-center w-8 h-8 rounded-md transition-colors ${
          connected 
            ? 'text-[hsl(142,60%,40%)] hover:bg-muted' 
            : 'text-destructive hover:bg-destructive/10 animate-pulse'
        }`}>
          {connected ? (
            <Wifi className="w-4 h-4" />
          ) : (
            <WifiOff className="w-4 h-4" />
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        {checking ? 'Verificando conexión...' : connected ? 'Servidor conectado' : 'Sin conexión al servidor'}
      </TooltipContent>
    </Tooltip>
  );
}

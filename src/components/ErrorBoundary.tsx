import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[200px] gap-4 p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-destructive" />
          <p className="text-lg font-medium text-foreground">
            {this.props.fallbackMessage || 'Ha ocurrido un error inesperado'}
          </p>
          <p className="text-sm text-muted-foreground max-w-md">
            {this.state.error?.message}
          </p>
          <Button onClick={() => this.setState({ hasError: false, error: undefined })}>
            Reintentar
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

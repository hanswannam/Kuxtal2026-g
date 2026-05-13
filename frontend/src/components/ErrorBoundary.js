import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const errMessage = this.state.error?.message || String(this.state.error || '');
      return (
        <div className="min-h-[400px] flex items-center justify-center p-8" data-testid="error-boundary">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="font-heading text-xl font-semibold mb-2">Algo salió mal</h2>
            <p className="text-sm text-muted-foreground mb-3">
              Ocurrió un error inesperado. Por favor intenta recargar la página.
            </p>
            {errMessage && (
              <details className="mb-4 text-left">
                <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">Ver detalle técnico</summary>
                <pre className="mt-2 text-[10px] bg-muted rounded-lg p-3 overflow-auto max-h-40 whitespace-pre-wrap break-words text-left">{errMessage}</pre>
              </details>
            )}
            <Button
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
              className="rounded-full bg-primary hover:bg-primary/90"
              data-testid="error-boundary-reload"
            >
              <RefreshCw className="w-4 h-4 mr-2" /> Recargar página
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

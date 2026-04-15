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
      return (
        <div className="min-h-[400px] flex items-center justify-center p-8" data-testid="error-boundary">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="font-heading text-xl font-semibold mb-2">Algo salio mal</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Ocurrio un error inesperado. Por favor intenta recargar la pagina.
            </p>
            <Button
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
              className="rounded-full bg-primary hover:bg-primary/90"
              data-testid="error-boundary-reload"
            >
              <RefreshCw className="w-4 h-4 mr-2" /> Recargar Pagina
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
  }

  private handleReload = () => {
    if (this.props.onReset) {
      this.props.onReset();
    }
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleTryAgain = () => {
    if (this.props.onReset) {
      this.props.onReset();
    }
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="bg-background text-foreground flex h-screen w-full flex-col items-center justify-center p-6 text-center">
          <div className="bg-destructive/10 text-destructive mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h2 className="mb-2 text-2xl font-bold tracking-tight">{this.props.fallbackTitle || 'Something went wrong'}</h2>
          <p className="text-muted-foreground mb-6 max-w-md text-sm">
            An unexpected application error occurred. You can attempt to retry or refresh the page.
          </p>
          {this.state.error && (
            <pre className="bg-muted text-muted-foreground mb-6 max-h-40 max-w-lg overflow-auto rounded border p-4 text-start font-mono text-xs">
              {this.state.error.message}
            </pre>
          )}
          <div className="flex gap-3">
            <Button variant="outline" onClick={this.handleTryAgain}>
              Try again
            </Button>
            <Button onClick={this.handleReload} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Reload page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

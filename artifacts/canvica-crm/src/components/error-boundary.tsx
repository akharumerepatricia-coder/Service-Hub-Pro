import { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Catches any unhandled render error in the subtree and shows a visible
 * error screen instead of a silent blank page.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ error: null });
    window.location.reload();
  };

  render() {
    const { error } = this.state;

    if (error) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-display mb-2">Something went wrong</h1>
              <p className="text-muted-foreground text-sm mb-4">
                The page crashed before it could render. This is usually caused by the
                API server being unreachable or missing environment variables on Vercel.
              </p>
              <details className="text-left bg-muted rounded-lg p-3 mb-4">
                <summary className="text-xs font-mono cursor-pointer text-muted-foreground hover:text-foreground">
                  Error details
                </summary>
                <pre className="text-xs font-mono mt-2 whitespace-pre-wrap break-all text-destructive">
                  {error.message}
                  {"\n"}
                  {error.stack?.split("\n").slice(0, 5).join("\n")}
                </pre>
              </details>
              <p className="text-xs text-muted-foreground">
                Make sure <code className="bg-muted px-1 rounded">DATABASE_URL</code> and{" "}
                <code className="bg-muted px-1 rounded">SESSION_SECRET</code> are set in
                your Vercel environment variables.
              </p>
            </div>
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Reload page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

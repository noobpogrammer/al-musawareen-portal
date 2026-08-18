import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
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
    console.error('Uncaught error in Al Musawareen Portal:', error, errorInfo);
  }

  private handleReset = () => {
    localStorage.clear();
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FDFAF3] flex items-center justify-center p-6 text-center font-sans">
          <div className="max-w-md w-full bg-white border-2 border-[#5C130F] p-8 shadow-2xl space-y-4">
            <h2 className="font-serif text-2xl font-bold text-[#5C130F] uppercase tracking-wider">
              Al Musawareen Portal
            </h2>
            <p className="text-xs text-[#3A1A14]/80 font-serif">
              An unexpected state issue occurred. Click below to restore full portal view.
            </p>
            <div className="p-3 bg-red-50 border border-red-200 text-left font-mono text-[10px] text-red-700 overflow-x-auto max-h-32">
              {this.state.error?.toString()}
            </div>
            <button
              onClick={this.handleReset}
              className="w-full py-3 bg-[#BA8332] hover:bg-[#a06e28] text-white font-mono text-xs font-bold uppercase tracking-widest cursor-pointer shadow-sm"
            >
              Reset Session & Restore App
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

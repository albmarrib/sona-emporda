import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { FiAlertTriangle, FiRefreshCw, FiHome } from 'react-icons/fi';

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
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] h-full p-6 text-center bg-zinc-950 border border-white/10 rounded-2xl m-4 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-4 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
            <FiAlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl md:text-2xl font-serif text-white font-bold mb-2">
            {this.props.fallbackTitle || 'Ha ocurrido un problema al cargar esta sección'}
          </h2>
          <p className="text-white/60 text-sm max-w-md mb-6 leading-relaxed">
            Se ha producido un error inesperado al renderizar el contenido. Puedes intentar recargar la sección o volver al inicio.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={this.handleReset}
              className="px-5 py-2.5 bg-gold text-black font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-yellow-500 transition-colors flex items-center gap-2 active:scale-95 cursor-pointer shadow-lg shadow-gold/20"
            >
              <FiRefreshCw className="w-4 h-4" /> Reintentar
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="px-5 py-2.5 bg-white/5 border border-white/10 text-white/80 hover:text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-white/10 transition-colors flex items-center gap-2 active:scale-95 cursor-pointer"
            >
              <FiHome className="w-4 h-4" /> Volver al Inicio
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Volume2, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetAndReload = () => {
    try {
      localStorage.removeItem('benjamin_ai_monetization_v1');
      localStorage.removeItem('benjamin_tts_clips_v1');
    } catch (e) {
      console.warn('Could not clear localStorage:', e);
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      const isQuotaError =
        this.state.error?.message?.toLowerCase().includes('quota') ||
        this.state.error?.message?.toLowerCase().includes('resource_exhausted');

      return (
        <div className="min-h-screen bg-[#0a0b0d] text-slate-200 flex flex-col items-center justify-center p-6 selection:bg-emerald-500/30 selection:text-emerald-200">
          <div className="max-w-lg w-full bg-[#0e1013] border border-white/10 rounded-2xl p-8 shadow-2xl space-y-6 text-center">
            {/* Header / Brand */}
            <div className="flex justify-center">
              <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center text-emerald-400">
                <Volume2 className="w-7 h-7" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {isQuotaError ? 'AI Service Limit Reached' : 'Studio Recovery Mode'}
                </h2>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                {isQuotaError
                  ? 'The AI model quota has been temporarily reached. The client has fallen back to offline Web Speech synthesis and cached previews.'
                  : 'An unexpected application state occurred. You can easily reload or reset local studio preferences below.'}
              </p>
            </div>

            {/* Error detail for transparency */}
            {this.state.error && (
              <div className="bg-[#14171c] p-3 rounded-xl border border-white/5 text-left overflow-auto max-h-32 text-xs font-mono text-slate-400">
                <span className="text-red-400 font-semibold">{this.state.error.name}:</span>{' '}
                {this.state.error.message}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-3 justify-center pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full sm:w-auto px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Studio
              </button>

              <button
                type="button"
                onClick={this.handleResetAndReload}
                className="w-full sm:w-auto px-5 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-medium text-sm rounded-xl border border-white/10 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Home className="w-4 h-4" />
                Reset Cache & Reload
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, RotateCcw, Trash2, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
  copied: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
    copied: false
  };

  constructor(props: Props) {
    super(props);
  }

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 [ErrorBoundary] Uncaught React exception caught:', error, errorInfo);
    this.setState({ errorInfo });

    // Detect dynamic chunk loading / network delivery failure
    const errorMsg = error?.message || String(error);
    const isChunkFailure = 
      errorMsg.includes('Failed to fetch dynamically imported module') ||
      errorMsg.includes('Loading chunk') ||
      errorMsg.includes('error loading dynamically imported module');

    if (isChunkFailure && typeof window !== 'undefined' && window.sessionStorage) {
      const lastAutoReload = sessionStorage.getItem('chunk_auto_reload_ts');
      const now = Date.now();
      // Allow only 1 auto-reload per 15 seconds to prevent reload loops
      if (!lastAutoReload || now - Number(lastAutoReload) > 15000) {
        sessionStorage.setItem('chunk_auto_reload_ts', String(now));
        console.warn('🔄 [ErrorBoundary] Dynamic import chunk failed. Auto-recovering via clean reload...');
        window.location.reload();
      }
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleClearCacheAndReload = () => {
    try {
      if (typeof window !== 'undefined') {
        if (window.sessionStorage) sessionStorage.clear();
        // Clear non-essential temp items from localStorage while preserving auth
        if (window.localStorage) {
          const authUser = localStorage.getItem('currentUser');
          const authToken = localStorage.getItem('authToken');
          const isAuth = localStorage.getItem('IS_AUTHENTICATED');
          
          for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            if (key && (key.startsWith('temp_') || key.startsWith('draft_') || key.includes('CACHE') || key.includes('NAV'))) {
              localStorage.removeItem(key);
            }
          }

          if (authUser) localStorage.setItem('currentUser', authUser);
          if (authToken) localStorage.setItem('authToken', authToken);
          if (isAuth) localStorage.setItem('IS_AUTHENTICATED', isAuth);
        }
      }
    } catch (e) {
      console.warn('Cache clearing notice:', e);
    }
    window.location.reload();
  };

  private handleCopyDiagnostics = () => {
    const errorReport = {
      message: this.state.error?.message,
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      url: typeof window !== 'undefined' ? window.location.href : '',
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : ''
    };

    navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2))
      .then(() => {
        this.setState({ copied: true });
        setTimeout(() => this.setState({ copied: false }), 3000);
      })
      .catch(() => {});
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const errorMsg = this.state.error?.message || 'خطأ غير معروف';
      const isChunkError = 
        errorMsg.includes('Failed to fetch dynamically imported module') ||
        errorMsg.includes('Loading chunk') ||
        errorMsg.includes('error loading dynamically imported module');

      return (
        <div className="min-h-screen bg-slate-900/50 flex items-center justify-center p-4 font-sans backdrop-blur-sm" dir="rtl">
          <div className="max-w-lg w-full bg-white rounded-3xl shadow-2xl p-8 border border-slate-200 text-center animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-rose-100 shadow-inner">
              <AlertTriangle className="w-10 h-10 text-rose-600" />
            </div>
            
            <h1 className="text-2xl font-black text-slate-900 mb-2">
              {isChunkError ? 'تحديث متوفر في المنصة' : 'عذراً، حدث استثناء تقني غير متوقع'}
            </h1>
            <p className="text-slate-600 text-sm mb-6 leading-relaxed">
              {isChunkError 
                ? 'تم نشر تحديث جديد للمنصة أو حدث انقطاع مؤقت أثناء تحميل حزمة الصفحة. يرجى الضغط على زر التحديث للمتابعة.'
                : 'واجهت واجهة التطبيق خطأ أثناء المعالجة. بياناتك محمية تماماً ويمكنك إعادة المحاولة أو العودة للرئيسية.'}
            </p>

            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 mb-6 text-right">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500">رمز الخطأ التشغيلي:</span>
                <button
                  type="button"
                  onClick={() => this.setState(prev => ({ showDetails: !prev.showDetails }))}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1"
                >
                  {this.state.showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  {this.state.showDetails ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}
                </button>
              </div>
              <p className="text-xs text-rose-600 font-mono break-words line-clamp-2">
                {errorMsg}
              </p>

              {this.state.showDetails && (
                <div className="mt-3 pt-3 border-t border-slate-200 text-left" dir="ltr">
                  <pre className="text-[10px] text-slate-700 font-mono max-h-40 overflow-auto whitespace-pre-wrap p-2 bg-slate-100 rounded-lg">
                    {this.state.error?.stack || 'No stack trace available'}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                  <div className="mt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={this.handleCopyDiagnostics}
                      className="text-xs text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1.5 py-1 px-2.5 bg-white border border-slate-200 rounded-lg shadow-sm"
                    >
                      {this.state.copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : null}
                      {this.state.copied ? 'تم نسخ التقرير' : 'نسخ تقرير الخطأ'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <button 
                type="button"
                onClick={() => window.location.reload()}
                className="flex items-center justify-center gap-2 py-3.5 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-md active:scale-95 text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                إعادة التحميل
              </button>
              <button 
                type="button"
                onClick={this.handleReset}
                className="flex items-center justify-center gap-2 py-3.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-2xl font-bold hover:bg-indigo-100 transition-all active:scale-95 text-sm"
              >
                <RotateCcw className="w-4 h-4" />
                إعادة المحاولة
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button 
                type="button"
                onClick={this.handleClearCacheAndReload}
                className="flex items-center justify-center gap-2 py-3 bg-slate-100 text-slate-700 rounded-2xl font-bold hover:bg-slate-200 transition-all text-xs"
              >
                <Trash2 className="w-3.5 h-3.5 text-slate-500" />
                تحديث الكاش
              </button>
              <button 
                type="button"
                onClick={() => window.location.href = '/'}
                className="flex items-center justify-center gap-2 py-3 bg-slate-100 text-slate-700 rounded-2xl font-bold hover:bg-slate-200 transition-all text-xs"
              >
                <Home className="w-3.5 h-3.5 text-slate-500" />
                الرئيسية
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;


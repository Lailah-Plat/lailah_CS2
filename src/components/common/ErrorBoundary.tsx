import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    error: null
  };

  constructor(props: Props) {
    super(props);
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans" dir="rtl">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 border border-slate-200 text-center animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-10 h-10 text-red-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-slate-900 mb-2">عذراً، حدث خطأ غير متوقع</h1>
            <p className="text-slate-500 mb-8 leading-relaxed">
              واجه التطبيق مشكلة تقنية غير متوقعة. لا تقلق، لم تفقد بياناتك، يمكنك محاولة إعادة تحميل الصفحة.
            </p>

            <div className="bg-slate-50 rounded-2xl p-4 mb-8 text-right overflow-hidden">
              <p className="text-xs font-bold text-slate-400 uppercase mb-2">تفاصيل الخطأ التقني:</p>
              <p className="text-sm text-red-500 font-mono break-words line-clamp-3">
                {this.state.error?.message || 'خطأ مجهول'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => window.location.reload()}
                className="flex items-center justify-center gap-2 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <RefreshCw className="w-5 h-5" />
                إعادة تحميل
              </button>
              <button 
                onClick={() => window.location.href = '/'}
                className="flex items-center justify-center gap-2 py-4 bg-slate-100 text-slate-700 rounded-2xl font-bold hover:bg-slate-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Home className="w-5 h-5" />
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

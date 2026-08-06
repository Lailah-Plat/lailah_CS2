import React from 'react';
import { Trash2 } from 'lucide-react';

interface DeleteConfirmationModalProps {
  deleteData: any;
  setDeleteData: (data: any) => void;
  handleDelete: () => void;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  deleteData,
  setDeleteData,
  handleDelete,
}) => {
  if (!deleteData) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden text-center p-8 animate-in zoom-in-95 duration-200 relative">
        <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">تأكيد الحذف</h3>
        <p className="text-slate-500 mb-8">
          هل أنت متأكد من رغبتك في حذف <span className="font-bold text-slate-700">{deleteData.name}</span>؟ لا يمكن التراجع عن هذا الإجراء.
        </p>
        <div className="flex gap-3">
          <button 
            onClick={() => setDeleteData(null)} 
            className="flex-1 py-3 rounded-xl font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
          >
            إلغاء
          </button>
          <button 
            onClick={handleDelete} 
            className="flex-1 py-3 rounded-xl font-bold bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30"
          >
            حذف نهائياً
          </button>
        </div>
      </div>
    </div>
  );
};

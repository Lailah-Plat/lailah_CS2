import React from 'react';
import { X } from 'lucide-react';

interface PledgeDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PledgeDetailsModal: React.FC<PledgeDetailsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] relative">
        <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
          <h3 className="text-xl font-bold text-slate-800">تفاصيل الإقرار والتعهد</h3>
          <button 
            onClick={onClose} 
            className="absolute top-4 xl:top-6 left-4 xl:left-6 z-[60] bg-white text-slate-400 hover:text-red-500 hover:bg-red-50 border border-slate-100 shadow-sm p-2 rounded-full transition-all duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto space-y-4 text-slate-700 leading-relaxed text-sm">
          <p className="font-bold mb-4">إن قبولك وموافقتك على إضافة بياناتك في منصة ليلة يعد موافقة على جميع بنود هذا التعهد وإقرار بتحمل كامل المسؤولية.</p>
          <p className="font-bold">إقرار وتعهد بصحة البيانات والمعلومات وتحمل المسؤولية النظامية</p>
          <p>بكامل أهليتي المعتبرة شرعاً ونظاماً، وبصفتي المستفيد أو المفوض بالتسجيل وتقديم الخدمات عبر المنصة (مثل: منصة ليلة)، أقر وأتعهد بما يلي:</p>
          <ol className="list-decimal list-inside space-y-3 mt-4">
            <li><span className="font-bold">صحة وموثوقية البيانات:</span> أن جميع البيانات، والمعلومات، والمستندات، والوثائق التي قمت بتقديمها أو إدخالها أو إرفاقها صحيحة ودقيقة ومطابقة للواقع، وتعود لي أو للجهة التي أمثلها بموجب تفويض رسمي معتمد.</li>
            <li><span className="font-bold">الالتزام بالتحديث:</span> ألتزم التزاماً تاماً بتحديث كافة بياناتي ومعلوماتي فور حدوث أي تغيير أو تعديل عليها، وأتحمل مسؤولية أي تبعات ناتجة عن التأخير أو الإهمال في تحديثها.</li>
            <li><span className="font-bold">المسؤولية النظامية:</span> أتحمل كافة المسؤوليات النظامية، والقانونية، والمالية المترتبة على ثبوت عدم صحة، أو تزوير، أو إخفاء، أو تضليل في أيٍّ من البيانات أو المستندات المقدمة. وأقر بعلمي التام بأن تقديم معلومات غير صحيحة يعرضني للمساءلة والعقوبات وفقاً للأنظمة والقوانين المعمول بها في المملكة العربية السعودية (بما في ذلك نظام مكافحة جرائم المعلوماتية، ونظام التجارة الإلكترونية، والأنظمة ذات العلاقة).</li>
            <li><span className="font-bold">الإجراءات وحق الإلغاء:</span> يحق لإدارة المنصة أو الجهة المعنية في حال اكتشاف أي تلاعب أو عدم مطابقة للواقع في المعلومات، اتخاذ كافة الإجراءات التي تراها مناسبة، بما في ذلك إيقاف الحساب مؤقتاً أو نهائياً، أو إلغاء التعاملات، والرجوع عليّ بالتعويضات عن أية أضرار مادية أو معنوية لحقت بالمنصة أو بأطراف أخرى.</li>
            <li><span className="font-bold">سرية الحساب والتعاملات:</span> أتحمل المسؤولية المطلقة عن سرية بيانات الدخول الخاصة بحسابي، وعن أي أنشطة، أو عمليات مالية، أو حجوزات، أو رسائل ومراسلات تتم من خلاله.</li>
            <li><span className="font-bold">الامتثال المالي:</span> أقر بمسؤوليتي عن صحة البيانات البنكية والمالية المدخلة لأغراض الدفع والتحصيل، وأتحمل أي تأخير أو خطأ في التحويلات ينتج عن تقديم بيانات بنكية خاطئة.</li>
          </ol>
          <p className="mt-4">وهذا إقرار وتعهد مني بذلك، وأصادق عليه.</p>
          <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-xs mt-6">
            <span className="font-bold text-amber-800">ملاحظة:</span> قد تطلب إدارة المنصة ختم هذا الإقرار والتعهد، وهو يعتبر حق للمنصة في حال تم طلب ذلك لأي سبب من الأسباب، وليس من حق طالب الانضمام للمنصة (مزود الخدمة سواء منشأة أو فرد) الاعتراض على ذلك، واعتراضه يعد عدم موافقة بالإنضمام ويحق للمنصة حال الرفض إلغاء العضوية أو ايقافها دون أي التزامات أو تبعات مادية أو نظامية.
          </div>
        </div>
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
          <button 
            onClick={onClose} 
            className="px-6 py-3 rounded-xl font-bold bg-amber-500 text-slate-900 hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/30"
          >
            موافق ومغادرة
          </button>
        </div>
      </div>
    </div>
  );
};

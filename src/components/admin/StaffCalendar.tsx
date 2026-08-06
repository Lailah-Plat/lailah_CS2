import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronRight, ChevronLeft, Plus, Clock, User, CheckCircle2, AlertCircle, X, Briefcase, Palmtree, Home } from 'lucide-react';
import { useCalendar } from '../../context/CalendarContext';
import { motion, AnimatePresence } from 'motion/react';
import { getFullDateInfo } from '../../utils/dateUtils';

interface StaffTask {
  id: number;
  staffId: number;
  staffName: string;
  title: string;
  date: string;
  time: string;
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
}

interface StaffCalendarProps {
  staffList: any[];
  tasks: StaffTask[];
  leaveRequests?: any[];
  onAddTask: (task: Omit<StaffTask, 'id'>) => void;
  onUpdateTaskStatus: (taskId: number, status: StaffTask['status']) => void;
  onUpdateTaskDate?: (taskId: number, newDate: string) => void;
}

const StaffCalendar: React.FC<StaffCalendarProps> = ({ 
  staffList, 
  tasks, 
  leaveRequests = [], 
  onAddTask, 
  onUpdateTaskStatus,
  onUpdateTaskDate
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const { calendarType, toggleCalendarType } = useCalendar();
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [newTaskForm, setNewTaskForm] = useState({
    staffId: '',
    title: '',
    time: '12:00',
    priority: 'medium' as const
  });

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const monthNames = [
    "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
    "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
  ];

  // Drag & Drop handlers
  const handleDragStart = (e: React.DragEvent, taskId: number) => {
    e.dataTransfer.setData('text/plain', taskId.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dateStr: string) => {
    e.preventDefault();
    const taskIdStr = e.dataTransfer.getData('text/plain');
    if (taskIdStr && onUpdateTaskDate) {
      const taskId = parseInt(taskIdStr, 10);
      onUpdateTaskDate(taskId, dateStr);
    }
  };

  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="h-32 border border-slate-100 bg-slate-50/30"></div>);
  }

  for (let i = 1; i <= daysInMonth; i++) {
    const loopDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
    const dateStr = `${loopDate.getFullYear()}-${String(loopDate.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    
    // Filter tasks for this day
    const dayTasks = tasks.filter(t => t.date === dateStr);
    
    // Filter approved leave requests on this day
    const dayLeaves = leaveRequests.filter(l => {
      if (l.status !== 'approved') return false;
      return dateStr >= l.startDate && dateStr <= l.endDate;
    });

    // Scheduled work timings for active staff
    const activeStaff = staffList.filter(s => s.status === 'نشط' || s.status === 'active');
    
    const isSelected = selectedDate && selectedDate.getDate() === i && selectedDate.getMonth() === currentDate.getMonth() && selectedDate.getFullYear() === currentDate.getFullYear();
    const isToday = new Date().getDate() === i && new Date().getMonth() === currentDate.getMonth() && new Date().getFullYear() === currentDate.getFullYear();
    
    const dInfo = getFullDateInfo(loopDate);

    days.push(
      <div
        key={i}
        onClick={() => setSelectedDate(loopDate)}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, dateStr)}
        className={`h-32 border border-slate-100 p-2 cursor-pointer transition-all hover:bg-slate-50 relative overflow-hidden flex flex-col justify-between ${
          isSelected ? 'bg-amber-50/40 ring-2 ring-amber-500 ring-inset' : 'bg-white'
        }`}
      >
        <div>
          <div className="flex justify-between items-center mb-1">
            <div className="flex flex-col items-center">
              <span className={`text-sm font-bold ${isToday ? 'bg-amber-500 text-slate-900 w-6 h-6 rounded-full flex items-center justify-center' : 'text-slate-700'}`}>
                {calendarType === 'gregorian' ? dInfo.gregorian.day : dInfo.hijri.day}
              </span>
              <span className="text-[9px] text-slate-400 font-medium">
                {calendarType === 'gregorian' ? dInfo.hijri.day : dInfo.gregorian.day}
              </span>
            </div>
            <div className="flex gap-1">
              {dayTasks.length > 0 && (
                <span className="text-[8px] bg-amber-100 text-amber-800 px-1 rounded font-bold">
                  {dayTasks.length} مهام
                </span>
              )}
              {dayLeaves.length > 0 && (
                <span className="text-[8px] bg-rose-100 text-rose-800 px-1 rounded font-bold">
                  {dayLeaves.length} إجازة
                </span>
              )}
            </div>
          </div>

          <div className="space-y-1 overflow-y-auto max-h-[72px] custom-scrollbar">
            {/* Display Daily Tasks (Draggable) */}
            {dayTasks.slice(0, 2).map((task) => (
              <div 
                key={`task-${task.id}`}
                draggable
                onDragStart={(e) => handleDragStart(e, task.id)}
                className={`text-[8px] p-1 rounded border truncate flex items-center gap-1 cursor-grab active:cursor-grabbing hover:shadow-xs transition-shadow ${
                  task.status === 'completed' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                  task.status === 'in-progress' ? 'bg-blue-50 border-blue-100 text-blue-700' :
                  'bg-amber-50 border-amber-100 text-amber-700'
                }`}
                title="اضغط مع السحب لنقل المهمة ليوم آخر"
              >
                📋 {task.title}
              </div>
            ))}

            {/* Display Leaves */}
            {dayLeaves.slice(0, 1).map((leave) => {
              const emp = staffList.find(s => s.id === leave.employeeId);
              const typeAr = leave.type === 'annual' ? 'سنوية' : leave.type === 'sick' ? 'مرضية' : leave.type === 'emergency' ? 'اضطرارية' : 'إجازة';
              return (
                <div 
                  key={`leave-${leave.id}`} 
                  className="text-[8px] p-1 rounded border border-rose-100 bg-rose-50 text-rose-700 truncate"
                  title={`${emp?.name || 'موظف'} في إجازة ${typeAr}`}
                >
                  🏖️ {emp?.name?.split(' ')[0] || 'إجازة'}: {typeAr}
                </div>
              );
            })}

            {/* Display Shifts */}
            {dayTasks.length === 0 && dayLeaves.length === 0 && activeStaff.slice(0, 1).map((staff) => {
              const isOnLeave = dayLeaves.some(l => l.employeeId === staff.id);
              if (isOnLeave) return null;
              
              const isRemote = staff.workType === 'remote';
              const workText = isRemote ? 'عن بُعد' : (staff.workType === 'fixed' ? 'ثابت' : 'مرن');
              return (
                <div 
                  key={`shift-${staff.id}`} 
                  className="text-[8px] text-slate-400 font-medium truncate flex items-center gap-0.5"
                >
                  🕒 {staff.name?.split(' ')[0]}: {workText}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const dCurrentInfo = getFullDateInfo(currentDate);
  const selectedDateStr = selectedDate 
    ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}` 
    : '';

  // Filter items for sidebar detailed view
  const selectedDateTasks = tasks.filter(t => t.date === selectedDateStr);
  
  const selectedDateLeaves = leaveRequests.filter(l => {
    if (l.status !== 'approved') return false;
    return selectedDateStr >= l.startDate && selectedDateStr <= l.endDate;
  });

  const activeEmployees = staffList.filter(s => s.status === 'نشط' || s.status === 'active');
  const selectedDateShifts = activeEmployees.map(emp => {
    const leave = selectedDateLeaves.find(l => l.employeeId === emp.id);
    return {
      emp,
      leave,
      isOnLeave: !!leave
    };
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar Grid */}
      <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-white rounded-2xl shadow-sm">
                <CalendarIcon className="w-6 h-6 text-amber-500" />
             </div>
             <div>
                <h3 className="text-xl font-bold text-slate-800">
                  {calendarType === 'gregorian' ? `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}` : `${dCurrentInfo.hijri.monthName} ${dCurrentInfo.hijri.year}`}
                </h3>
                <p className="text-sm text-slate-500">تقويم المهام، الدوام المجدول، والإجازات</p>
             </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={toggleCalendarType}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors ml-4"
            >
              {calendarType === 'gregorian' ? 'هجري' : 'ميلادي'}
            </button>
            <button onClick={prevMonth} className="p-2 hover:bg-slate-200 rounded-xl transition-colors"><ChevronRight className="w-5 h-5"/></button>
            <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors">اليوم</button>
            <button onClick={nextMonth} className="p-2 hover:bg-slate-200 rounded-xl transition-colors"><ChevronLeft className="w-5 h-5"/></button>
          </div>
        </div>

        <div className="bg-amber-50/50 border-b border-amber-100 p-2.5 text-center text-[11px] font-bold text-amber-800">
          💡 يمكنك سحب أي مهمة 📋 وإفلاتها في أي يوم بالتقويم لإعادة جدولتها فورياً!
        </div>
        
        <div className="grid grid-cols-7 text-center bg-slate-50 border-b border-slate-100 py-3">
          {['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'].map(d => (
            <div key={d} className="text-xs font-bold text-slate-500">{d}</div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 flex-1">
          {days}
        </div>
      </div>

      {/* Selected Day View & Task List */}
      <div className="space-y-6">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col h-full min-h-[500px]">
          <div className="flex justify-between items-center mb-6 border-b border-slate-150 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800">تفاصيل اليوم المختار</h4>
                <p className="text-xs text-slate-500">
                  {selectedDate ? (calendarType === 'gregorian' ? getFullDateInfo(selectedDate).gregorian.full : getFullDateInfo(selectedDate).hijri.full) : 'اختر تاريخاً'}
                </p>
              </div>
            </div>
            <button 
              onClick={() => setIsTaskModalOpen(true)}
              className="p-2 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-xl shadow-lg shadow-amber-500/20 transition-all hover:scale-110"
              title="إضافة مهمة جديدة"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 space-y-6 overflow-y-auto custom-scrollbar pr-2">
            
            {/* SECTION 1: TASKS */}
            <div className="space-y-3">
              <h5 className="text-xs font-black text-amber-600 flex items-center gap-1.5">
                <span>📋 المهام اليومية للموظفين</span>
                <span className="bg-amber-100 text-amber-800 text-[9px] px-1.5 py-0.5 rounded-full font-sans">{selectedDateTasks.length}</span>
              </h5>
              
              {selectedDateTasks.length > 0 ? (
                <div className="space-y-2">
                  {selectedDateTasks.map((task) => (
                    <div 
                      key={task.id} 
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      className="group bg-slate-50 rounded-2xl p-4 border border-slate-100 hover:border-amber-200 transition-all cursor-grab active:cursor-grabbing"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 text-sm">{task.title}</span>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center gap-1 text-[10px] text-slate-500">
                              <User className="w-3 h-3" /> {task.staffName}
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-slate-500 font-sans">
                              <Clock className="w-3 h-3" /> {task.time}
                            </div>
                          </div>
                        </div>
                        <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          task.priority === 'high' ? 'bg-red-100 text-red-600' :
                          task.priority === 'medium' ? 'bg-amber-100 text-amber-600' :
                          'bg-blue-100 text-blue-600'
                        }`}>
                          {task.priority === 'high' ? 'عالية' : task.priority === 'medium' ? 'متوسطة' : 'منخفضة'}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-4 border-t border-slate-100 pt-2.5">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => onUpdateTaskStatus(task.id, 'completed')}
                            className={`p-1.5 rounded-lg transition-colors ${task.status === 'completed' ? 'bg-emerald-500 text-white' : 'bg-white text-slate-400 hover:text-emerald-500 border border-slate-200'}`}
                            title="تعليم كمكتملة"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => onUpdateTaskStatus(task.id, 'in-progress')}
                            className={`p-1.5 rounded-lg transition-colors ${task.status === 'in-progress' ? 'bg-blue-500 text-white' : 'bg-white text-slate-400 hover:text-blue-500 border border-slate-200'}`}
                            title="تعليم كقيد التنفيذ"
                          >
                            <Clock className="w-4 h-4" />
                          </button>
                        </div>
                        <span className={`text-[10px] font-bold ${
                          task.status === 'completed' ? 'text-emerald-600' :
                          task.status === 'in-progress' ? 'text-blue-600' :
                          'text-slate-400'
                        }`}>
                          {task.status === 'completed' ? 'مكتملة' : task.status === 'in-progress' ? 'قيد التنفيذ' : 'انتظار'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-xs text-slate-500">لا توجد مهام مجدولة لهذا اليوم</p>
                  <button onClick={() => setIsTaskModalOpen(true)} className="mt-1 text-amber-600 font-bold text-xs hover:underline">أضف مهمة جديدة</button>
                </div>
              )}
            </div>

            {/* SECTION 2: SHIFTS */}
            <div className="space-y-3">
              <h5 className="text-xs font-black text-emerald-600 flex items-center gap-1.5">
                <span>🕒 مواعيد الحضور المجدولة (الورديات)</span>
                <span className="bg-emerald-100 text-emerald-800 text-[9px] px-1.5 py-0.5 rounded-full font-sans">{selectedDateShifts.filter(s => !s.isOnLeave).length}</span>
              </h5>
              
              <div className="space-y-2 bg-slate-50/50 p-3.5 rounded-2xl border border-slate-100">
                {selectedDateShifts.map(({ emp, isOnLeave, leave }) => {
                  const isRemote = emp.workType === 'remote';
                  return (
                    <div key={`shift-det-${emp.id}`} className="flex justify-between items-center text-xs pb-2 border-b border-slate-100 last:border-0 last:pb-0">
                      <div>
                        <span className="font-bold text-slate-800">{emp.name}</span>
                        <span className="text-[10px] text-slate-400 block">{emp.jobTitle || 'موظف'}</span>
                      </div>
                      
                      {isOnLeave ? (
                        <span className="text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-bold">
                          🏖️ إجازة ({leave?.type === 'annual' ? 'سنوية' : 'مرضية'})
                        </span>
                      ) : (
                        <div className="text-left font-mono">
                          {isRemote ? (
                            <span className="text-[10px] bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full font-bold font-sans">
                              🏠 دوام عن بعد ({emp.requiredHours || 8} س)
                            </span>
                          ) : emp.workType === 'flexible_free' ? (
                            <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full font-bold font-sans">
                              🕒 مرن حر ({emp.requiredHours || 8} س)
                            </span>
                          ) : emp.workType === 'flexible_window' ? (
                            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg font-bold">
                              مرن: {emp.flexibleStartWindowStart} - {emp.flexibleStartWindowEnd}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg font-bold">
                              ثابت: {emp.shiftStart} - {emp.shiftEnd}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                {selectedDateShifts.length === 0 && (
                  <p className="text-xs text-slate-400 text-center">لا يوجد موظفون مضافون بالنظام</p>
                )}
              </div>
            </div>

            {/* SECTION 3: LEAVES */}
            <div className="space-y-3">
              <h5 className="text-xs font-black text-rose-600 flex items-center gap-1.5">
                <span>🏖️ الإجازات المسجلة</span>
                <span className="bg-rose-100 text-rose-800 text-[9px] px-1.5 py-0.5 rounded-full font-sans">{selectedDateLeaves.length}</span>
              </h5>
              
              {selectedDateLeaves.length > 0 ? (
                <div className="space-y-2">
                  {selectedDateLeaves.map((leave) => {
                    const emp = staffList.find(s => s.id === leave.employeeId);
                    return (
                      <div key={`leave-det-${leave.id}`} className="bg-rose-50/40 p-3 rounded-xl border border-rose-100 text-xs flex justify-between items-center">
                        <div>
                          <p className="font-bold text-rose-950">{emp?.name || 'موظف'}</p>
                          <p className="text-[10px] text-rose-700 mt-0.5">السبب: {leave.reason || 'إجازة رسمية معتمدة'}</p>
                        </div>
                        <span className="text-[10px] bg-rose-500 text-white px-2 py-0.5 rounded-full font-bold font-sans">
                          {leave.type === 'annual' ? 'سنوية' : leave.type === 'sick' ? 'مرضية' : 'طارئة'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 text-center bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-xs text-slate-400">لا توجد إجازات معتمدة لهذا اليوم</p>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Add Task Modal */}
      <AnimatePresence>
        {isTaskModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4" dir="rtl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-bold text-slate-800">إضافة مهمة جديدة</h3>
                <button onClick={() => setIsTaskModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">اسم المهمة</label>
                  <input 
                    type="text" 
                    className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:border-amber-500" 
                    placeholder="مثال: مراجعة عروض الصيانة الصباحية"
                    value={newTaskForm.title}
                    onChange={e => setNewTaskForm({...newTaskForm, title: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">الموظف المسؤول</label>
                  <select 
                    className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:border-amber-500"
                    value={newTaskForm.staffId}
                    onChange={e => setNewTaskForm({...newTaskForm, staffId: e.target.value})}
                  >
                    <option value="">اختر الموظف</option>
                    {staffList.map(s => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">الوقت</label>
                    <input 
                      type="time" 
                      className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:border-amber-500"
                      value={newTaskForm.time}
                      onChange={e => setNewTaskForm({...newTaskForm, time: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">الأولوية</label>
                    <select 
                      className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:border-amber-500"
                      value={newTaskForm.priority}
                      onChange={e => setNewTaskForm({...newTaskForm, priority: e.target.value as any})}
                    >
                      <option value="low">منخفضة</option>
                      <option value="medium">متوسطة</option>
                      <option value="high">عالية</option>
                    </select>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    if (!newTaskForm.title || !newTaskForm.staffId) {
                      alert('الرجاء تعبئة اسم المهمة واختيار الموظف');
                      return;
                    }
                    const staff = staffList.find(s => s.id.toString() === newTaskForm.staffId);
                    const formattedDate = selectedDate 
                      ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}` 
                      : '';
                    onAddTask({
                      staffId: parseInt(newTaskForm.staffId),
                      staffName: staff?.name || 'غير محدد',
                      title: newTaskForm.title,
                      date: formattedDate,
                      time: newTaskForm.time,
                      status: 'pending',
                      priority: newTaskForm.priority
                    });
                    setIsTaskModalOpen(false);
                    setNewTaskForm({ staffId: '', title: '', time: '12:00', priority: 'medium' });
                  }}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-2xl shadow-lg shadow-amber-500/20 transition-all mt-4"
                >
                  إضافة المهمة
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StaffCalendar;

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserCheck, Users, PieChart, GraduationCap, CheckCircle2, AlertCircle, AlertTriangle, Trash2 } from 'lucide-react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Student, AttendanceRecord, TabType, StudentGrade } from './types';

// Tabs
import AttendanceTab from './components/AttendanceTab';
import StudentsTab from './components/StudentsTab';
import ReportsTab from './components/ReportsTab';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('attendance');
  const [students, setStudents] = useLocalStorage<Student[]>('stu_attendance_students', []);
  const [records, setRecords] = useLocalStorage<AttendanceRecord[]>('stu_attendance_records', []);
  const [grades, setGrades] = useLocalStorage<StudentGrade[]>('stu_attendance_grades', []);

  // UI state for custom safe notifications and modals
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [appAlert, setAppAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAppAlert({ type, message });
    setTimeout(() => {
      setAppAlert(null);
    }, 4000);
  };

  const handleAddStudent = (name: string, code: string, level?: string, phone?: string) => {
    if (students.some(s => s.code.toUpperCase() === code.toUpperCase())) {
      showAlert('error', 'هذا الكود مستخدم بالفعل لطالب آخر!');
      return;
    }
    const newStudent: Student = {
      id: crypto.randomUUID(),
      name,
      code: code.toUpperCase(),
      level,
      phone,
      createdAt: new Date().toISOString()
    };
    setStudents([newStudent, ...students]);
    showAlert('success', `تمت إضافة الطالب ${name} بنجاح!`);
  };

  const confirmDeleteStudent = () => {
    if (!studentToDelete) return;
    const { id, code } = studentToDelete;
    setStudents(students.filter(s => s.id !== id));
    setRecords(records.filter(r => r.studentCode !== code));
    setGrades(grades.filter(g => g.studentCode !== code)); // Also delete grades of deleted student
    showAlert('success', `تم حذف الطالب وحذف جميع سجلات حضوره ودرجاته.`);
    setStudentToDelete(null);
  };

  const handleAddGrade = (studentId: string, type: 'امتحان' | 'واجب' | 'نشاط', title: string, score: number, maxScore: number) => {
    const student = students.find(s => s.id === studentId);
    if (!student) {
      showAlert('error', 'الطالب غير موجود!');
      return;
    }
    const newGrade: StudentGrade = {
      id: crypto.randomUUID(),
      studentId,
      studentName: student.name,
      studentCode: student.code,
      type,
      title,
      score,
      maxScore,
      date: new Date().toISOString().split('T')[0]
    };
    setGrades([newGrade, ...grades]);
    showAlert('success', `تم تسجيل درجة "${title}" للطالب ${student.name}`);
  };

  const handleDeleteGrade = (gradeId: string) => {
    setGrades(grades.filter(g => g.id !== gradeId));
    showAlert('success', 'تم حذف درجة التقييم المحددة بنجاح.');
  };

  const handleClearAllGrades = () => {
    setGrades([]);
    showAlert('success', 'تم تفريغ كشف درجات الطلاب بالكامل بنجاح.');
  };

  const handleRecordAttendance = (student: Student, method: 'يدوي' | 'QR كاميرا') => {
    const today = new Date().toISOString().split('T')[0];
    const isAlreadyAttended = records.some(r => r.studentCode === student.code && r.date === today);
    
    if (isAlreadyAttended) {
      showAlert('error', `الطالب ${student.name} مسجل حضوره بالفعل لهذا اليوم!`);
      return;
    }

    const newRecord: AttendanceRecord = {
      id: crypto.randomUUID(),
      studentId: student.id,
      studentName: student.name,
      studentCode: student.code,
      date: today,
      time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      method
    };

    setRecords([newRecord, ...records]);
    showAlert('success', `تم تسجيل حضور ${student.name} بنجاح.`);
  };

  const navItems = [
    { id: 'attendance', label: 'الحضور والغياب', icon: UserCheck },
    { id: 'students', label: 'إدارة الطلاب', icon: Users },
    { id: 'reports', label: 'التقارير والإحصائيات', icon: PieChart },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans flex flex-col">
      {/* Header Navigation */}
      <header className="flex items-center justify-between px-8 py-4 bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-100">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">نظام إدارة الحضور</h1>
        </div>
        
        <nav className="hidden md:flex gap-1 bg-slate-100 p-1 rounded-xl">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as TabType)}
              className={`px-6 py-2 rounded-lg transition-all cursor-pointer font-bold text-sm ${
                activeTab === item.id 
                ? 'bg-white shadow-sm text-indigo-600' 
                : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="md:hidden">
          <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg">
            <div className="w-6 h-0.5 bg-slate-800 mb-1 rounded-full"></div>
            <div className="w-6 h-0.5 bg-slate-800 mb-1 rounded-full"></div>
            <div className="w-6 h-0.5 bg-slate-800 rounded-full"></div>
          </button>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="flex-1 p-6 max-w-[1400px] mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'attendance' && (
              <AttendanceTab 
                students={students} 
                records={records}
                onRecordAttendance={handleRecordAttendance} 
              />
            )}
            {activeTab === 'students' && (
              <StudentsTab 
                students={students} 
                onAddStudent={handleAddStudent} 
                onDeleteStudent={(id) => {
                  const student = students.find(s => s.id === id);
                  if (student) setStudentToDelete(student);
                }} 
              />
            )}
            {activeTab === 'reports' && (
              <ReportsTab 
                records={records} 
                students={students} 
                grades={grades}
                onAddGrade={handleAddGrade}
                onDeleteGrade={handleDeleteGrade}
                onClearAllGrades={handleClearAllGrades}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Global Toast Alert Toaster */}
      <AnimatePresence>
        {appAlert && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 p-4 rounded-xl shadow-2xl flex items-center gap-3 min-w-[320px] max-w-[90%] border text-sm font-bold ${
              appAlert.type === 'success' 
                ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
                : 'bg-rose-50 border-rose-100 text-rose-800'
            }`}
          >
            {appAlert.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{appAlert.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Dialog: Confirm Delete Modal */}
      <AnimatePresence>
        {studentToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setStudentToDelete(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            {/* Dialog Content */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl max-w-md w-full p-6 text-right relative z-10"
            >
              <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6" />
              </div>
              
              <h3 className="text-lg font-black text-slate-900 mb-2">تأكيد حذف الطالب</h3>
              <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                هل أنت متأكد من حذف الطالب <strong className="text-slate-900 font-extrabold">{studentToDelete.name}</strong>؟ 
                سيؤدي هذا الإجراء إلى إزالة الطالب بشكل نهائي من النظام مع حذف جميع سجلات حضوره السابقة تلقائياً. لقرب اتصال الحذف، لا يمكن التراجع عن هذا القرار.
              </p>

              <div className="flex gap-3 justify-start">
                <button
                  onClick={confirmDeleteStudent}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-5 py-2.5 rounded-xl transition text-sm shadow-lg shadow-rose-100 active:scale-95"
                >
                  حذف نهائي
                </button>
                <button
                  onClick={() => setStudentToDelete(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-5 py-2.5 rounded-xl transition text-sm active:scale-95"
                >
                  إلغاء التراجع
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Status Footer */}
      <footer className="px-8 py-3 bg-white border-t border-slate-200 text-xs text-slate-400 flex justify-between items-center mt-auto">
        <div className="flex gap-6">
          <span>المزود: 192.168.1.1</span>
          <span>النسخة: v2.4.0</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>اتصال البيانات مستقر</span>
        </div>
      </footer>

      {/* Mobile Nav Overlay */}
      <nav className="md:hidden fixed bottom-6 left-4 right-4 bg-white/90 backdrop-blur-md border border-slate-200 shadow-2xl rounded-2xl p-1 z-50 flex">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as TabType)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl transition-all ${
              activeTab === item.id 
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
              : 'text-slate-400'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-bold">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}


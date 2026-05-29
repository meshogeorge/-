import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AttendanceRecord, Student, StudentGrade } from '../types';
import { FileText, Search, Calendar, Download, Award, BookOpen, Activity, User, Plus, Trash2, CheckSquare, PlusCircle, Filter, AlertTriangle } from 'lucide-react';

interface ReportsTabProps {
  records: AttendanceRecord[];
  students: Student[];
  grades: StudentGrade[];
  onAddGrade: (studentId: string, type: 'امتحان' | 'واجب' | 'نشاط', title: string, score: number, maxScore: number) => void;
  onDeleteGrade: (gradeId: string) => void;
  onClearAllGrades: () => void;
}

export default function ReportsTab({ records, students, grades = [], onAddGrade, onDeleteGrade, onClearAllGrades }: ReportsTabProps) {
  // Localized Modal States
  const [gradeToDelete, setGradeToDelete] = useState<StudentGrade | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Navigation inside the reports tab: 'attendance' | 'grades'
  const [reportSubTab, setReportSubTab] = useState<'attendance' | 'grades'>('attendance');

  // Filters for Attendance
  const [attendanceDateFilter, setAttendanceDateFilter] = useState('');
  const [attendanceSearch, setAttendanceSearch] = useState('');

  // Filters & State for Grades
  const [gradeSearch, setGradeSearch] = useState('');
  const [gradeTypeFilter, setGradeTypeFilter] = useState<string>('all');
  
  // Grade form fields
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [gradeType, setGradeType] = useState<'امتحان' | 'واجب' | 'نشاط'>('امتحان');
  const [gradeTitle, setGradeTitle] = useState('');
  const [gradeScore, setGradeScore] = useState('');
  const [gradeMaxScore, setGradeMaxScore] = useState('');

  // Filter attendance records
  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      const matchesDate = !attendanceDateFilter || record.date === attendanceDateFilter;
      const matchesSearch = !attendanceSearch || 
        record.studentName.toLowerCase().includes(attendanceSearch.toLowerCase()) ||
        record.studentCode.toLowerCase().includes(attendanceSearch.toLowerCase());
      return matchesDate && matchesSearch;
    });
  }, [records, attendanceDateFilter, attendanceSearch]);

  // Filter grades list
  const filteredGrades = useMemo(() => {
    return grades.filter(g => {
      const matchesType = gradeTypeFilter === 'all' || g.type === gradeTypeFilter;
      const matchesSearch = !gradeSearch ||
        g.studentName.toLowerCase().includes(gradeSearch.toLowerCase()) ||
        g.studentCode.toLowerCase().includes(gradeSearch.toLowerCase()) ||
        g.title.toLowerCase().includes(gradeSearch.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [grades, gradeTypeFilter, gradeSearch]);

  // Attendance stats constants
  const today = new Date().toISOString().split('T')[0];
  const todayCount = records.filter(r => r.date === today).length;

  // Grade performance calculations
  const totalEvaluations = grades.length;
  const averageSuccessRate = useMemo(() => {
    if (grades.length === 0) return 0;
    const totalPercentage = grades.reduce((acc, g) => acc + (g.score / g.maxScore), 0);
    return Math.round((totalPercentage / grades.length) * 100);
  }, [grades]);

  const examCount = grades.filter(g => g.type === 'امتحان').length;
  const hwCount = grades.filter(g => g.type === 'واجب').length;
  const activityCount = grades.filter(g => g.type === 'نشاط').length;

  // CSV exports
  const exportAttendanceCSV = () => {
    const headers = ['الاسم', 'الكود', 'التاريخ', 'الوقت', 'الطريقة'];
    const rows = filteredRecords.map(r => [
      r.studentName,
      r.studentCode,
      r.date,
      r.time,
      r.method
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `تقارير_الحضور_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportGradesCSV = () => {
    const headers = ['اسم الطالب', 'الكود', 'النوع', 'عنوان التقييم', 'الدرجة والتقييم', 'الحد الأقصى', 'النسبة المئوية', 'التاريخ'];
    const rows = filteredGrades.map(g => [
      g.studentName,
      g.studentCode,
      g.type,
      g.title,
      g.score,
      g.maxScore,
      `${Math.round((g.score / g.maxScore) * 100)}%`,
      g.date
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `تقرير_درجات_الطلاب_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGradeFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !gradeType || !gradeTitle.trim() || !gradeScore || !gradeMaxScore) return;

    const scoreNum = parseFloat(gradeScore);
    const maxScoreNum = parseFloat(gradeMaxScore);

    if (isNaN(scoreNum) || isNaN(maxScoreNum) || maxScoreNum <= 0) {
      alert('الرجاء إدخال أرقام صحيحة للدرجات.');
      return;
    }

    if (scoreNum > maxScoreNum) {
      if (!window.confirm('ملاحظة: الدرجة المدخلة أكبر من الدرجة القصوى. هل تود الاستمرار على أي حال؟')) {
        return;
      }
    }

    onAddGrade(selectedStudentId, gradeType, gradeTitle.trim(), scoreNum, maxScoreNum);
    
    // Clear fields
    setGradeTitle('');
    setGradeScore('');
    setGradeMaxScore('');
  };

  return (
    <div className="space-y-6">
      {/* Tab Switcher: Attendance vs Grades */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setReportSubTab('attendance')}
          className={`px-6 py-3.5 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
            reportSubTab === 'attendance'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          سجل الحضور والغياب اليومي
        </button>
        <button
          onClick={() => setReportSubTab('grades')}
          className={`px-6 py-3.5 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
            reportSubTab === 'grades'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Award className="w-4 h-4 text-amber-500" />
          دفتر الدرجات والتقييمات
        </button>
      </div>

      {reportSubTab === 'attendance' ? (
        <div className="space-y-6">
          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-indigo-100">
              <p className="text-indigo-100 text-sm mb-1 font-medium">إجمالي الحضور اليوم</p>
              <h3 className="text-4xl font-black">{todayCount}</h3>
              <p className="text-xs mt-2 text-indigo-200">سجل نشط اليوم</p>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <p className="text-slate-500 text-sm mb-1 font-medium">إجمالي الطلاب</p>
              <h3 className="text-4xl font-black text-slate-800">{students.length}</h3>
              <p className="text-xs mt-2 text-emerald-500">تم تسجيلهم بالنظام</p>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <p className="text-slate-500 text-sm mb-1 font-medium">كفاءة الحضور</p>
              <h3 className="text-4xl font-black text-slate-800">
                {students.length > 0 ? Math.round((todayCount / students.length) * 100) : 0}%
              </h3>
              <p className="text-xs mt-2 text-indigo-500">معدل المشاركة اليومية</p>
            </div>
          </div>

          {/* Main Table Container */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
              <h2 className="text-lg font-bold">آخر المسجلين حضوراً</h2>
              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-48">
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Search className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="بحث..."
                    value={attendanceSearch}
                    onChange={(e) => setAttendanceSearch(e.target.value)}
                    className="w-full pr-10 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-right"
                  />
                </div>
                <input
                  type="date"
                  value={attendanceDateFilter}
                  onChange={(e) => setAttendanceDateFilter(e.target.value)}
                  className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm cursor-pointer"
                />
                <button
                   onClick={exportAttendanceCSV}
                   className="text-xs font-bold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-lg hover:bg-indigo-100 transition-colors flex items-center gap-2 cursor-pointer"
                >
                   <Download className="w-3 h-3" />
                   تصدير الحضور (CSV)
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 font-bold">الطالب</th>
                    <th className="px-6 py-4 font-bold text-center">الكود</th>
                    <th className="px-6 py-4 font-bold text-center">الوقت والتاريخ</th>
                    <th className="px-6 py-4 font-bold text-center">بواسطة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRecords.length > 0 ? (
                    filteredRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs select-none">
                              {record.studentName.substring(0, 2)}
                            </div>
                            <span className="font-bold text-slate-700">{record.studentName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center font-mono text-xs text-slate-500 uppercase">{record.studentCode}</td>
                        <td className="px-6 py-4 text-center text-sm text-slate-600 whitespace-nowrap">
                          {record.time} 
                          <span className="text-slate-400 mr-1.5 text-xs">({record.date})</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            record.method === 'يدوي' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {record.method}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-sm">
                        لا توجد سجلات مطابقة للبحث
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Score Tab Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-amber-500 rounded-2xl p-6 text-white shadow-lg shadow-amber-100">
              <p className="text-amber-100 text-sm mb-1 font-medium">إجمالي التقييمات المسجلة</p>
              <h3 className="text-4xl font-black">{totalEvaluations}</h3>
              <p className="text-xs mt-2 text-amber-100/90">امتحانات، واجبات، ونشاطات</p>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <p className="text-slate-500 text-sm mb-1 font-medium">متوسط نسبة النجاح</p>
              <h3 className="text-4xl font-black text-slate-800">{averageSuccessRate}%</h3>
              <p className="text-xs mt-2 text-emerald-600 font-bold">بمجموع جميع الدرجات</p>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <p className="text-slate-500 text-sm mb-1 font-medium">الامتحانات والواجبات</p>
              <h3 className="text-xl font-black text-slate-800 flex items-center justify-between mt-2.5">
                <span>📝 امتحانات: {examCount}</span>
                <span>🏠 واجبات: {hwCount}</span>
              </h3>
              <p className="text-xs mt-2 text-indigo-500 font-medium">سجلات رصد مستمرة</p>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <p className="text-slate-500 text-sm mb-1 font-medium">النشاط الطلابي</p>
              <h3 className="text-4xl font-black text-indigo-600">{activityCount}</h3>
              <p className="text-xs mt-2 text-slate-400">نشاطات صفية ولاصفية</p>
            </div>
          </div>

          {/* Form to insert grades */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-base font-black text-slate-800 mb-4 flex items-center gap-2">
              <PlusCircle className="text-indigo-600 w-5 h-5" />
              رصد درجة جديدة لطالب
            </h3>
            
            {students.length === 0 ? (
              <p className="text-sm text-slate-400 italic">الرجاء إضافة بعض الطلاب في صفحة "إدارة الطلاب" أولاً لتتمكن من رصد درجاتهم.</p>
            ) : (
              <form onSubmit={handleGradeFormSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                {/* Select student */}
                <div className="md:col-span-3 space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 pr-1 block">اختر الطالب</label>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs text-right cursor-pointer"
                  >
                    <option value="">اختر من القائمة...</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code}) {s.level ? `- ${s.level}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Evaluation type */}
                <div className="md:col-span-2 space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 pr-1 block">نوع التقييم</label>
                  <select
                    value={gradeType}
                    onChange={(e) => setGradeType(e.target.value as any)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs text-right cursor-pointer font-bold"
                  >
                    <option value="امتحان">امتحان 📝</option>
                    <option value="واجب">واجب منزلي 🏠</option>
                    <option value="نشاط">نشاط/مشاركة 🎨</option>
                  </select>
                </div>

                {/* Evaluation Title */}
                <div className="md:col-span-3 space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 pr-1 block">عنوان أو مسمى التقييم</label>
                  <input
                    type="text"
                    required
                    maxLength={50}
                    placeholder="مثال: الشهر الأول، واجب 1"
                    value={gradeTitle}
                    onChange={(e) => setGradeTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs text-right placeholder:text-slate-300"
                  />
                </div>

                {/* Score */}
                <div className="md:col-span-2 grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 pr-1 block">الدرجة</label>
                    <input
                      type="number"
                      required
                      min={0}
                      step="any"
                      placeholder="8"
                      value={gradeScore}
                      onChange={(e) => setGradeScore(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs text-center placeholder:text-slate-300"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 pr-1 block">القصوى</label>
                    <input
                      type="number"
                      required
                      min={1}
                      step="any"
                      placeholder="10"
                      value={gradeMaxScore}
                      onChange={(e) => setGradeMaxScore(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs text-center placeholder:text-slate-300"
                    />
                  </div>
                </div>

                {/* Submit button */}
                <div className="md:col-span-2">
                  <button
                    type="submit"
                    className="w-full bg-indigo-600 text-white py-2 rounded-xl text-xs font-bold hover:bg-indigo-700 transition shadow-md shadow-indigo-100 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <Plus className="w-4 h-4 cursor-pointer" />
                    رصد الدرجة
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Grades Ledger */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
              <h2 className="text-lg font-bold">دفتر رصد وتحليل الدرجات</h2>
              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                {/* Search */}
                <div className="relative flex-1 md:w-48">
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Search className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="بحث باسم الطالب أو الكود أو الامتحان..."
                    value={gradeSearch}
                    onChange={(e) => setGradeSearch(e.target.value)}
                    className="w-full pr-10 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-right"
                  />
                </div>

                {/* Filter type */}
                <select
                  value={gradeTypeFilter}
                  onChange={(e) => setGradeTypeFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-right cursor-pointer"
                >
                  <option value="all">كل التقييمات 📋</option>
                  <option value="امتحان">امتحان فقط 📝</option>
                  <option value="واجب">واجب منزلي فقط 🏠</option>
                  <option value="نشاط">نشاط/مشاركة فقط 🎨</option>
                </select>

                {/* Export CSV button */}
                <button
                   type="button"
                   onClick={exportGradesCSV}
                   className="text-xs font-bold text-amber-700 bg-amber-50 px-4 py-2 rounded-lg hover:bg-amber-100 transition-colors flex items-center gap-2 cursor-pointer border border-amber-100"
                >
                   <Download className="w-3 h-3 text-amber-500" />
                   تصدير كشف الدرجات (CSV)
                </button>

                {/* Clear All Grades Button */}
                {grades.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(true)}
                    className="text-xs font-bold text-rose-700 bg-rose-50 px-4 py-2 rounded-lg hover:bg-rose-100 transition-colors flex items-center gap-2 cursor-pointer border border-rose-100"
                  >
                    <Trash2 className="w-3 h-3 text-rose-500" />
                    مسح الكشف بالكامل
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 font-bold">الطالب</th>
                    <th className="px-6 py-4 font-bold text-center">النوع والتقييم</th>
                    <th className="px-6 py-4 font-bold text-center">الدرجة المرصودة</th>
                    <th className="px-6 py-4 font-bold text-center">النسبة والإنجاز</th>
                    <th className="px-6 py-4 font-bold text-center">التاريخ</th>
                    <th className="px-6 py-4 font-bold text-center">إجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredGrades.length > 0 ? (
                    filteredGrades.map((grade) => {
                      const pct = Math.round((grade.score / grade.maxScore) * 100);
                      const isExam = grade.type === 'امتحان';
                      const passThreshold = isExam ? 70 : 60;
                      const goodThreshold = isExam ? 80 : 75;
                      const excellentThreshold = 85;

                      let badgeColor = "bg-rose-50 text-rose-700 border-rose-100";
                      let ratingText = "يحتاج متابعة ⚠️";

                      if (pct >= excellentThreshold) {
                        badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-100";
                        ratingText = "ممتاز ⭐";
                      } else if (pct >= goodThreshold) {
                        badgeColor = "bg-indigo-50 text-indigo-700 border-indigo-100";
                        ratingText = "جيد جداً 👍";
                      } else if (pct >= passThreshold) {
                        badgeColor = "bg-amber-50 text-amber-700 border-amber-100";
                        ratingText = "ناجح ✔️";
                      }

                      return (
                        <tr key={grade.id} className="hover:bg-slate-50 transition-colors group">
                          {/* Student Details */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs uppercase">
                                {grade.studentName.substring(0, 1)}
                              </div>
                              <div>
                                <span className="font-bold text-slate-800 text-sm block">{grade.studentName}</span>
                                <span className="text-[10px] font-mono text-slate-400 uppercase">كود: {grade.studentCode}</span>
                              </div>
                            </div>
                          </td>

                          {/* Evaluation Title and Indicator */}
                          <td className="px-6 py-4 text-center">
                            <div className="inline-flex items-center gap-1 bg-slate-50 border border-slate-100 rounded px-2 py-0.5 text-xs text-slate-600 font-medium">
                              <span>
                                {grade.type === 'امتحان' ? '📝' : grade.type === 'واجب' ? '🏠' : '🎨'}
                              </span>
                              <span className="font-bold">{grade.title}</span>
                            </div>
                          </td>

                          {/* Numeric Scores */}
                          <td className="px-6 py-4 text-center col-span-1">
                            <span className="font-mono text-sm font-black text-slate-800">{grade.score}</span>
                            <span className="text-slate-400 text-xs mx-1">/</span>
                            <span className="font-mono text-xs text-slate-500">{grade.maxScore}</span>
                          </td>

                          {/* Percentage Progress badge */}
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-block px-2.5 py-1 text-[10px] font-black tracking-tight rounded-md border ${badgeColor}`}>
                              {pct}% {ratingText}
                            </span>
                          </td>

                          {/* Date recorded */}
                          <td className="px-6 py-4 text-center text-xs text-slate-500 whitespace-nowrap">
                            {grade.date}
                          </td>

                          {/* Double Delete Button */}
                          <td className="px-6 py-4 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                setGradeToDelete(grade);
                              }}
                              className="text-slate-200 hover:text-rose-500 hover:bg-rose-50 p-1.5 rounded transition cursor-pointer"
                              title="حذف درجة الطالب"
                            >
                              <Trash2 className="w-4 h-4 cursor-pointer" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm">
                        لا توجد درجات مرصودة للمنتجات المحددة
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Custom Dialog: Confirm Delete Single Grade */}
      <AnimatePresence>
        {gradeToDelete && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 text-right">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setGradeToDelete(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            {/* Dialog Content */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl max-w-md w-full p-6 text-right relative z-[70]"
            >
              <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6" />
              </div>
              
              <h3 className="text-lg font-black text-slate-900 mb-2">تأكيد حذف درجة الطالب</h3>
              <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                هل أنت متأكد من حذف درجة <strong className="text-slate-900 font-extrabold">{gradeToDelete.title}</strong> للطالب <strong className="text-slate-900 font-extrabold">{gradeToDelete.studentName}</strong>؟ 
                سيتم إزالة هذه الدرجة نهائياً من دفتر رصد الدرجات والتقارير.
              </p>

              <div className="flex gap-3 justify-start">
                <button
                  type="button"
                  onClick={() => {
                    onDeleteGrade(gradeToDelete.id);
                    setGradeToDelete(null);
                  }}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-5 py-2.5 rounded-xl transition text-sm shadow-lg shadow-rose-100 active:scale-95 cursor-pointer"
                >
                  حذف نهائي
                </button>
                <button
                  type="button"
                  onClick={() => setGradeToDelete(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-5 py-2.5 rounded-xl transition text-sm active:scale-95 cursor-pointer"
                >
                  إلغاء التراجع
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Dialog: Confirm Clear All Grades */}
      <AnimatePresence>
        {showClearConfirm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 text-right">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowClearConfirm(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            {/* Dialog Content */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl border border-rose-200 shadow-2xl max-w-md w-full p-6 text-right relative z-[70]"
            >
              <div className="w-12 h-12 rounded-full bg-rose-100 border border-rose-200 text-rose-600 flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              
              <h3 className="text-lg font-black text-slate-900 mb-2">تأكيد مسح كشف الدرجات بالكامل</h3>
              <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                هل أنت متأكد تماماً من <strong className="text-rose-600 font-extrabold">حذف كشف الدرجات بالكامل</strong>؟ 
                سيقوم هذا الإجراء بإزالة جميع درجات الامتحانات والواجبات المنزلية والأنشطة لجميع الطلاب بلا استثناء. لقرب اتصال الحذف، لا يمكن التراجع عن هذا القرار.
              </p>

              <div className="flex gap-3 justify-start">
                <button
                  type="button"
                  onClick={() => {
                    onClearAllGrades();
                    setShowClearConfirm(false);
                  }}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-5 py-2.5 rounded-xl transition text-sm shadow-lg shadow-rose-100 active:scale-95 cursor-pointer"
                >
                  نعم، امسح الكشف بالكامل
                </button>
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-5 py-2.5 rounded-xl transition text-sm active:scale-95 cursor-pointer"
                >
                  تراجع
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

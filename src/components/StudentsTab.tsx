import React, { useState, useMemo } from 'react';
import { Student } from '../types';
import { UserPlus, Search, Trash2, QrCode, User, Users } from 'lucide-react';

interface StudentsTabProps {
  students: Student[];
  onAddStudent: (name: string, code: string, level?: string, phone?: string) => void;
  onDeleteStudent: (id: string) => void;
}

export default function StudentsTab({ students, onAddStudent, onDeleteStudent }: StudentsTabProps) {
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newLevel, setNewLevel] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [search, setSearch] = useState('');

  const filteredStudents = useMemo(() => {
    return students.filter(s => 
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase()) ||
      (s.level && s.level.toLowerCase().includes(search.toLowerCase())) ||
      (s.phone && s.phone.includes(search))
    );
  }, [students, search]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newCode.trim()) return;
    onAddStudent(newName.trim(), newCode.trim(), newLevel.trim() || undefined, newPhone.trim() || undefined);
    setNewName('');
    setNewCode('');
    setNewLevel('');
    setNewPhone('');
  };

  const getQRUrl = (code: string) => `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(code)}`;

  return (
    <div className="space-y-6">
      {/* Search and Action Bar */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <Users className="text-indigo-600 w-5 h-5" />
            إدارة الطلاب ({students.length})
        </h2>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="بحث بالاسم أو الكود..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pr-10 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-right"
            />
          </div>
          <button 
             onClick={() => document.getElementById('add-form')?.scrollIntoView({ behavior: 'smooth' })}
             className="bg-indigo-600 text-white p-2 rounded-xl"
          >
            <UserPlus className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Add Student Card - Styled as a sticky or first card */}
        <div id="add-form" className="bg-indigo-50 rounded-2xl border-2 border-dashed border-indigo-200 p-6 flex flex-col justify-center shadow-sm">
          <h3 className="font-black text-indigo-700 mb-4 flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            إضافة طالب جديد
          </h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="text"
              placeholder="اسم الطالب بالكامل"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-indigo-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-right"
              required
            />
            <input
              type="text"
              placeholder="الكود (مثال: STU-100)"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-indigo-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm uppercase text-right"
              required
            />
            <input
              type="text"
              placeholder="المستوى (مثال: الصف الأول)"
              value={newLevel}
              onChange={(e) => setNewLevel(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-indigo-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-right"
            />
            <input
              type="tel"
              placeholder="رقم تليفون ولي الأمر / الطالب"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-indigo-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-right"
            />
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white font-black py-2.5 rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-100 active:scale-95 text-sm"
            >
              حفظ الطالب
            </button>
          </form>
        </div>

        {filteredStudents.length > 0 ? (
          filteredStudents.map(student => (
            <div key={student.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between min-h-[180px]">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center font-black group-hover:bg-indigo-600 group-hover:text-white transition-colors uppercase select-none shrink-0">
                      {student.name.substring(0, 1)}
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-bold text-slate-800 text-sm leading-tight">{student.name}</h3>
                      <p className="text-[10px] text-slate-400 font-mono uppercase tracking-tighter">الكود: {student.code}</p>
                      
                      {/* Level and Phone section */}
                      {(student.level || student.phone) && (
                        <div className="mt-2 pt-1 space-y-1 text-right border-t border-slate-50">
                          {student.level && (
                            <p className="text-xs text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-md inline-block">
                              📚 {student.level}
                            </p>
                          )}
                          {student.phone && (
                            <p className="text-xs text-slate-500 font-medium block">
                              📞 <a href={`tel:${student.phone}`} className="hover:underline hover:text-indigo-600 text-slate-600 font-semibold">{student.phone}</a>
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                </div>
                <button
                  onClick={() => onDeleteStudent(student.id)}
                  className="text-slate-300 hover:text-rose-500 transition-colors p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                  <span className="text-[10px] text-slate-400 font-medium">مضاف بتاريخ {new Date(student.createdAt).toLocaleDateString('ar-EG')}</span>
                  <a
                    href={getQRUrl(student.code)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors"
                  >
                    <QrCode className="w-3 h-3" />
                    عرض الكود
                  </a>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-slate-200 border-dashed">
            <Users className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-medium">لا توجد سجلات طلاب حالياً</p>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useEffect, useMemo, useState } from 'react';
import { Link2, Plus, Search } from 'lucide-react';
import { api } from '../lib/api';
import type { Student } from '../types';
import { Modal } from '../components/Modal';

const emptyStudent: Student = {
  id: '', studentCode: '', name: '', gradeId: 'G1', gradeName: 'الصف الأول الثانوي', classroomId: '1/1', classroomName: '1/1', status: 'Active', parentName: '', parentPhone: '',
};

export function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<Student | null>(null);
  const [accessStudent, setAccessStudent] = useState<Student | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = () => api<Student[]>('listStudents').then(setStudents).catch(e=>setError(e.message));
  useEffect(() => { void load(); }, []);
  const filtered = useMemo(() => students.filter(s => !query || `${s.name} ${s.studentCode} ${s.classroomName}`.toLowerCase().includes(query.toLowerCase())), [students, query]);
  const save = async (student: Student) => {
    try { await api('saveStudent', { student }); setEditing(null); load(); } catch(e) { setError(e instanceof Error ? e.message : 'تعذر الحفظ'); }
  };
  return (
    <>
      <div className="page-header"><div><h1>الطلاب والقيد</h1><p>سجل موحد للطلاب والفصول وبيانات التواصل الأساسية.</p></div><button className="btn btn-primary" onClick={()=>setEditing({...emptyStudent})}><Plus size={16}/> إضافة طالب</button></div>
      {error && <div className="alert alert-danger" style={{marginBottom:12}}>{error}</div>}
      <div className="card panel">
        <div className="toolbar"><div className="field"><label>بحث سريع</label><div style={{position:'relative'}}><Search size={16} style={{position:'absolute',right:11,top:12,color:'#94a3b8'}}/><input className="input" style={{paddingRight:34}} placeholder="الاسم، كود الطالب، الفصل..." value={query} onChange={e=>setQuery(e.target.value)}/></div></div></div>
        <div className="table-wrap"><table><thead><tr><th>الكود</th><th>الطالب</th><th>الصف</th><th>الفصل</th><th>ولي الأمر</th><th>الحالة</th><th></th></tr></thead><tbody>{filtered.map(s=><tr key={s.id}><td>{s.studentCode}</td><td><strong>{s.name}</strong></td><td>{s.gradeName}</td><td>{s.classroomName}</td><td>{s.parentName || '—'}<div className="small muted">{s.parentPhone || ''}</div></td><td><span className={`badge ${s.status==='Active'?'badge-success':'badge-muted'}`}>{s.status==='Active'?'نشط':s.status}</span></td><td><div className="actions"><button className="btn btn-light btn-sm" onClick={()=>setEditing({...s})}>تعديل</button><button className="btn btn-success btn-sm" onClick={()=>setAccessStudent(s)}><Link2 size={13}/> رابط الطالب</button></div></td></tr>)}</tbody></table></div>
      </div>
      {editing && <StudentForm student={editing} onClose={()=>setEditing(null)} onSave={save}/>} {accessStudent&&<StudentAccess student={accessStudent} onClose={()=>setAccessStudent(null)}/>} 
    </>
  );
}

function StudentForm({ student, onClose, onSave }: { student: Student; onClose:()=>void; onSave:(s:Student)=>void }) {
  const [form, setForm] = useState<Student>(student);
  return <Modal title={form.id ? 'تعديل بيانات الطالب' : 'إضافة طالب جديد'} onClose={onClose}><div className="form-grid grid grid-2">
    <div className="field"><label>اسم الطالب</label><input className="input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></div>
    <div className="field"><label>كود الطالب</label><input className="input" value={form.studentCode} onChange={e=>setForm({...form,studentCode:e.target.value})}/></div>
    <div className="field"><label>الصف</label><select className="select" value={form.gradeId} onChange={e=>{const map:any={G1:'الصف الأول الثانوي',G2:'الصف الثاني الثانوي',G3:'الصف الثالث الثانوي'};setForm({...form,gradeId:e.target.value,gradeName:map[e.target.value]})}}><option value="G1">الصف الأول</option><option value="G2">الصف الثاني</option><option value="G3">الصف الثالث</option></select></div>
    <div className="field"><label>الفصل</label><input className="input" value={form.classroomName} onChange={e=>setForm({...form,classroomName:e.target.value,classroomId:e.target.value})}/></div>
    <div className="field"><label>اسم ولي الأمر</label><input className="input" value={form.parentName||''} onChange={e=>setForm({...form,parentName:e.target.value})}/></div>
    <div className="field"><label>هاتف ولي الأمر</label><input className="input" value={form.parentPhone||''} onChange={e=>setForm({...form,parentPhone:e.target.value})}/></div>
  </div><div className="actions" style={{marginTop:18,justifyContent:'flex-start'}}><button className="btn btn-primary" onClick={()=>onSave({...form,id:form.id||`STU-${Date.now()}`})}>حفظ</button><button className="btn btn-light" onClick={onClose}>إلغاء</button></div></Modal>;
}

function StudentAccess({student,onClose}:{student:Student;onClose:()=>void}){const[token,setToken]=useState('');const[msg,setMsg]=useState('');const create=async()=>{try{const r=await api<{token:string}>('createStudentAccessToken',{studentId:student.id});setToken(r.token);setMsg('تم إنشاء رمز جديد وإلغاء أي رمز سابق نشط.')}catch(e){setMsg(e instanceof Error?e.message:'تعذر الإنشاء')}};const link=token?`${window.location.origin}${window.location.pathname}#student?token=${encodeURIComponent(token)}`:'';return <Modal title={`رابط الطالب — ${student.name}`} onClose={onClose}><div className="alert alert-warning">الرابط للقراءة فقط. لا يحتوي على الرقم القومي أو بيانات ولي الأمر.</div><button className="btn btn-primary" style={{marginTop:12}} onClick={create}>إنشاء / تدوير رمز الوصول</button>{msg&&<div className="small muted" style={{marginTop:10}}>{msg}</div>}{token&&<div className="field" style={{marginTop:14}}><label>الرابط</label><textarea className="textarea" dir="ltr" rows={3} readOnly value={link}/><button className="btn btn-light btn-sm" onClick={()=>navigator.clipboard.writeText(link)}>نسخ الرابط</button></div>}</Modal>}

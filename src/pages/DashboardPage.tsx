import React, { useEffect, useState } from 'react';
import { AlertTriangle, CalendarDays, GraduationCap, UserCheck, Users } from 'lucide-react';
import { api } from '../lib/api';
import type { DashboardData } from '../types';

export function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { api<DashboardData>('dashboard').then(setData).catch(e=>setError(e.message)); }, []);
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!data) return <div className="card panel">جارِ تحميل لوحة المتابعة...</div>;
  const cards = [
    ['إجمالي الطلاب', data.students, GraduationCap],
    ['إجمالي العاملين', data.employees, Users],
    ['المعلمون', data.teachers, UserCheck],
    ['احتياطي هذا الأسبوع', data.reserveAssignmentsThisWeek, CalendarDays],
  ] as const;
  return (
    <>
      <div className="page-header"><div><h1>لوحة المتابعة</h1><p>أهم مؤشرات التشغيل اليومية في شاشة واحدة.</p></div></div>
      <div className="grid grid-4">
        {cards.map(([label,value,Icon]) => <div className="card kpi" key={label}><Icon size={20} color="#0f766e"/><div className="value">{value}</div><div className="label">{label}</div></div>)}
      </div>
      <div className="grid grid-2" style={{marginTop:16}}>
        <div className="card panel"><div className="panel-header"><h3>الحضور اليوم</h3></div><div className="grid grid-2"><div><div className="value" style={{fontSize:28,fontWeight:900,color:'#dc2626'}}>{data.absentStudentsToday}</div><div className="small muted">غياب طلاب</div></div><div><div className="value" style={{fontSize:28,fontWeight:900,color:'#d97706'}}>{data.lateStudentsToday}</div><div className="small muted">تأخير طلاب</div></div></div></div>
        <div className="card panel"><div className="panel-header"><h3>سلامة الجدول</h3></div><div style={{display:'flex',alignItems:'center',gap:12}}><AlertTriangle size={28} color={data.timetableConflicts ? '#dc2626' : '#059669'}/><div><strong style={{fontSize:24}}>{data.timetableConflicts}</strong><div className="small muted">تعارضات تحتاج مراجعة</div></div></div></div>
      </div>
    </>
  );
}

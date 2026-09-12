import React, { useState } from 'react';
import {
  BarChart3,
  CalendarDays,
  ClipboardCheck,
  FileClock,
  GraduationCap,
  LogOut,
  Menu,
  School,
  Settings,
  ShieldCheck,
  Users,
  UserRoundCog,
  X,
} from 'lucide-react';
import type { SessionUser, StaffRole } from '../types';

export type StaffPage = 'dashboard' | 'students' | 'attendance' | 'behavior' | 'employees' | 'staff_ops' | 'timetable' | 'audit' | 'settings';

const roleLabels: Record<string, string> = {
  Admin: 'مدير النظام',
  SchoolDirector: 'مدير المدرسة',
  StudentAffairs: 'شؤون الطلاب',
  TeacherAffairs: 'شؤون المعلمين',
  HR: 'الموارد البشرية',
  SocialSpecialist: 'الأخصائي الاجتماعي',
  QualityOfficer: 'مسؤول الجودة',
  Viewer: 'مشاهد',
};

function allowed(role: StaffRole, page: StaffPage): boolean {
  if (role === 'Admin') return true;
  if (role === 'SchoolDirector') return page !== 'settings';
  if (page === 'dashboard') return true;
  if (role === 'StudentAffairs') return ['students', 'attendance', 'behavior', 'timetable'].includes(page);
  if (role === 'TeacherAffairs') return ['employees', 'staff_ops', 'timetable'].includes(page);
  if (role === 'HR') return ['employees', 'staff_ops'].includes(page);
  if (role === 'SocialSpecialist') return page === 'behavior';
  if (role === 'QualityOfficer') return page === 'timetable';
  if (role === 'Viewer') return page === 'timetable';
  return false;
}

export function AppShell({
  user,
  page,
  onPage,
  onLogout,
  children,
}: {
  user: SessionUser;
  page: StaffPage;
  onPage: (p: StaffPage) => void;
  onLogout: () => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const role = user.role as StaffRole;
  const items: Array<{ id: StaffPage; label: string; icon: React.ComponentType<{ size?: number }> }> = [
    { id: 'dashboard', label: 'لوحة المتابعة', icon: BarChart3 },
    { id: 'students', label: 'الطلاب والقيد', icon: GraduationCap },
    { id: 'attendance', label: 'حضور الطلاب', icon: ClipboardCheck },
    { id: 'behavior', label: 'السلوك والتواصل', icon: ShieldCheck },
    { id: 'employees', label: 'الموظفون والمعلمون', icon: Users },
    { id: 'staff_ops', label: 'دوام العاملين والإجازات', icon: FileClock },
    { id: 'timetable', label: 'الجدول المدرسي', icon: CalendarDays },
    { id: 'audit', label: 'سجل التدقيق', icon: ShieldCheck },
    { id: 'settings', label: 'إعدادات المدرسة', icon: Settings },
  ];

  return (
    <div className="shell">
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-mark">إ</div>
          <div><strong>إبدأ التعليمية</strong><span>School ERP</span></div>
          <button className="link-btn mobile-menu-btn" style={{marginRight:'auto',color:'#fff'}} onClick={() => setOpen(false)}><X size={18}/></button>
        </div>
        <nav className="nav">
          <div className="nav-section">الإدارة والتشغيل</div>
          {items.filter(i => allowed(role, i.id)).map(item => {
            const Icon = item.icon;
            return (
              <button key={item.id} className={`nav-btn ${page === item.id ? 'active' : ''}`} onClick={() => { onPage(item.id); setOpen(false); }}>
                <Icon size={17}/><span>{item.label}</span>
              </button>
            );
          })}
          <div className="nav-section">بوابات مستقلة</div>
          <a className="nav-btn" href="#teacher"><UserRoundCog size={17}/><span>بوابة المعلم</span></a>
          <a className="nav-btn" href="#student"><School size={17}/><span>بوابة الطالب</span></a>
        </nav>
        <div className="sidebar-footer">
          <div className="user-box">
            <strong style={{fontSize:12,color:'#fff'}}>{user.fullName}</strong>
            <div className="small" style={{color:'#94a3b8',marginTop:3}}>{roleLabels[user.role] || user.role}</div>
          </div>
          <button className="nav-btn" onClick={onLogout} style={{marginTop:8,color:'#fecaca'}}><LogOut size={17}/>تسجيل الخروج</button>
        </div>
      </aside>
      <section className="main">
        <header className="topbar">
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <button className="btn btn-light btn-sm mobile-menu-btn" onClick={() => setOpen(true)}><Menu size={17}/></button>
            <div className="topbar-title"><strong>{items.find(i => i.id === page)?.label}</strong><span>نظام إدارة المدرسة — RTL</span></div>
          </div>
          <div className="small muted">{new Intl.DateTimeFormat('ar-EG',{dateStyle:'full',timeZone:'Africa/Cairo'}).format(new Date())}</div>
        </header>
        <main className="content">{children}</main>
      </section>
    </div>
  );
}

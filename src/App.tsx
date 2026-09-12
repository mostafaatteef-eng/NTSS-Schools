import React, { useEffect, useState } from 'react';
import { AppShell, type StaffPage } from './components/AppShell';
import { DashboardPage } from './pages/DashboardPage';
import { StudentsPage } from './pages/StudentsPage';
import { AttendancePage } from './pages/AttendancePage';
import { EmployeesPage } from './pages/EmployeesPage';
import { BehaviorPage } from './pages/BehaviorPage';
import { StaffOpsPage } from './pages/StaffOpsPage';
import { AuditPage } from './pages/AuditPage';
import { TimetablePage } from './pages/TimetablePage';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';
import { TeacherPortalPage } from './pages/TeacherPortalPage';
import { StudentPortalPage } from './pages/StudentPortalPage';
import { api } from './lib/api';
import { loadSession, saveSession } from './lib/session';
import type { SessionState } from './types';

export default function App(){const[hash,setHash]=useState(window.location.hash);const[session,setSession]=useState<SessionState|null>(loadSession());const[page,setPage]=useState<StaffPage>('dashboard');
useEffect(()=>{const fn=()=>setHash(window.location.hash);window.addEventListener('hashchange',fn);return()=>window.removeEventListener('hashchange',fn)},[]);
useEffect(()=>{if(!session)return;api<SessionState>('me').then(s=>{saveSession(s);setSession(s)}).catch(()=>{saveSession(null);setSession(null)})},[]);
if(hash.startsWith('#teacher'))return <TeacherPortalPage/>;if(hash.startsWith('#student'))return <StudentPortalPage/>;if(!session)return <LoginPage onLogin={setSession}/>;
const logout=async()=>{try{await api('logout')}catch{}saveSession(null);setSession(null)};
let content:React.ReactNode=<DashboardPage/>;if(page==='students')content=<StudentsPage/>;else if(page==='attendance')content=<AttendancePage/>;else if(page==='behavior')content=<BehaviorPage/>;else if(page==='employees')content=<EmployeesPage/>;else if(page==='staff_ops')content=<StaffOpsPage/>;else if(page==='audit')content=<AuditPage/>;else if(page==='timetable')content=<TimetablePage user={session.user}/>;else if(page==='settings')content=<SettingsPage/>;
return <AppShell user={session.user} page={page} onPage={setPage} onLogout={logout}>{content}</AppShell>}

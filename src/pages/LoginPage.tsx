import React, { useState } from 'react';
import { CheckCircle2, Cloud, GraduationCap, KeyRound, School, Settings2, Users } from 'lucide-react';
import { api, pingApi } from '../lib/api';
import { getApiUrl, saveApiUrl, saveSession } from '../lib/session';
import type { SessionState } from '../types';

export function LoginPage({ onLogin }: { onLogin: (session: SessionState) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [apiUrl, setApiUrl] = useState(getApiUrl());
  const [showApi, setShowApi] = useState(!getApiUrl());
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [apiOk, setApiOk] = useState<boolean | null>(null);

  const testConnection = async () => {
    saveApiUrl(apiUrl);
    setApiOk(null);
    const ok = await pingApi();
    setApiOk(ok);
    setMessage(ok ? 'تم الاتصال بالخادم بنجاح.' : 'تعذر الاتصال. راجع رابط Web App.');
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      if (apiUrl.trim()) saveApiUrl(apiUrl);
      const session = await api<SessionState>('loginStaff', { username: username.trim(), password }, null);
      saveSession(session);
      onLogin(session);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'فشل تسجيل الدخول');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-page">
      <section className="login-hero">
        <div className="brand-mark">إ</div>
        <div>
          <h1>نظام إدارة المدرسة<br/>بسيط، واضح، وآمن</h1>
          <p>إدارة الطلاب والعاملين والحضور والجدول المدرسي والاحتياطي والإشراف من مكان واحد، مع بوابة معلم محدودة ووصول طالب للقراءة فقط.</p>
        </div>
        <div className="feature-chips">
          <span className="chip"><Users size={14}/> بيانات مركزية</span>
          <span className="chip"><GraduationCap size={14}/> جدول 39 حصة</span>
          <span className="chip"><KeyRound size={14}/> صلاحيات Server-side</span>
          <span className="chip"><Cloud size={14}/> Google Sheets Backend</span>
        </div>
      </section>
      <section className="login-panel">
        <form className="card login-card" onSubmit={submit}>
          <div className="logo-row">
            <div className="brand-mark">إ</div>
            <div><h2>دخول الإدارة</h2><div className="small muted">لا يوجد دخول محلي بديل. المصادقة من الخادم فقط.</div></div>
          </div>
          {message && <div className={`alert ${apiOk === true ? 'alert-success' : 'alert-danger'}`}>{message}</div>}
          <div className="form-grid" style={{marginTop:14}}>
            <div className="field"><label>اسم المستخدم</label><input className="input" value={username} onChange={e=>setUsername(e.target.value)} autoComplete="username" required/></div>
            <div className="field"><label>كلمة المرور</label><input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" required/></div>
            <button className="btn btn-primary" disabled={busy}>{busy ? 'جارِ الدخول...' : 'تسجيل الدخول'}</button>
            <div style={{display:'flex',gap:8}}>
              <a href="#teacher" className="btn btn-light" style={{flex:1,textDecoration:'none'}}><GraduationCap size={16}/>بوابة المعلم</a>
              <a href="#student" className="btn btn-light" style={{flex:1,textDecoration:'none'}}><School size={16}/>بوابة الطالب</a>
            </div>
            <button type="button" className="link-btn" onClick={()=>setShowApi(v=>!v)}><Settings2 size={14}/> إعداد رابط الخادم</button>
            {showApi && (
              <div className="card" style={{padding:13,boxShadow:'none'}}>
                <div className="field"><label>Google Apps Script Web App URL</label><input className="input" dir="ltr" value={apiUrl} onChange={e=>setApiUrl(e.target.value)} placeholder="https://script.google.com/macros/s/.../exec"/></div>
                <button type="button" className="btn btn-light btn-sm" style={{marginTop:8}} onClick={testConnection}><CheckCircle2 size={14}/> اختبار الاتصال</button>
              </div>
            )}
          </div>
        </form>
      </section>
    </div>
  );
}

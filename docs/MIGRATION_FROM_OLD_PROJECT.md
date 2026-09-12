# Migration from the old NTSS project

هذه النسخة Clean Rebuild ولا تعتمد على LocalStorage القديم كمصدر بيانات.

## انقل البيانات فقط، لا تنقل الـLegacy code

يفضل نقل البيانات بهذا الترتيب إلى Sheets التي ينشئها `setupSystem()`:

1. Employees
2. Students
3. Users عبر شاشة الإدارة وليس نسخ password fields القديمة
4. Student_Attendance
5. Staff_Attendance / Leaves
6. Behavior_Violations / Parent_Communications
7. Schedule بعد تنظيف Teacher Codes

## لا تنقل

- Parent Portal sessions/accounts.
- Payroll data إلى التطبيق الجديد؛ احتفظ بها في Archive منفصل إذا لزم.
- SAMAT.
- Class-period attendance القديم.
- Teacher PINs/Passwords القديمة.
- Local session tokens.
- بيانات `Schedule` قديمة قبل التأكد من Teacher Code / Classroom / Subject mapping.

## بعد النقل

- شغّل فحص الجدول من الواجهة.
- راجع 39 حصة Week A / Week B لكل فصل.
- راجع Teacher Load 30/30.
- عيّن PIN جديد لكل معلم مطلوب له Portal.
- ولّد Student Access Tokens جديدة فقط من النظام الجديد.

# EBDA School ERP — Clean GitHub Edition

نسخة نظيفة ومبسطة من نظام إدارة المدرسة، مبنية لتعمل كواجهة React/TypeScript على GitHub Pages مع Google Sheets + Google Apps Script كـ backend مركزي.

## ما الذي يشمله النظام؟

- تسجيل دخول موظفي النظام من الخادم فقط، بدون Local Login أو Default Admin داخل الكود.
- الطلاب والقيد + إنشاء رابط طالب آمن للقراءة فقط.
- حضور وغياب وتأخير الطلاب يوميًا.
- السلوك وتسجيل التواصل مع ولي الأمر، بدون Parent Portal.
- الموظفون والمعلمون + Teacher Code + ضبط PIN من الخادم.
- دوام العاملين والإجازات.
- الجدول المدرسي: Week A/B، تعارضات المعلم/الفصل/القاعة، أكثر من فسحة، أوقات حصص قابلة للتعديل.
- نصاب المعلم: 25 ساعة = 1500 دقيقة = 30 حصة افتراضيًا.
- الاحتياطي: يتصفر حسابيًا أسبوعيًا، ولا يتم حذف التاريخ، ولا يسمح بتجاوز 30.
- إتاحة المعلمين، الإشراف ومواقع الإشراف.
- مطابقة الخطة الدراسية 39 حصة لكل من Week A وWeek B.
- استيراد Excel/CSV للجدول باستخدام Teacher Code كمرجع أساسي.
- الامتحانات.
- بوابة معلم مستقلة بكود المعلم + PIN وجلسة Server-side.
- واجبات وموارد/تحضير/عرض تقديمي للمعلم، مع تقييدها بالفصول والمواد المسندة له.
- بوابة طالب Read-only بتوكن عشوائي مخزن كـ hash في الخادم.
- مستخدمو الإدارة وسجل Audit server-side.

## 1) إعداد Google Sheets / Apps Script

1. أنشئ Google Sheet جديدًا.
2. افتح `Extensions > Apps Script`.
3. انسخ محتوى `google-apps-script/Code.gs` إلى ملف `Code.gs`.
4. تأكد أن Time Zone للمشروع هي `Africa/Cairo`.
5. من `Project Settings > Script Properties` أضف:
   - `BOOTSTRAP_ADMIN_USERNAME` = اسم مستخدم أول مدير.
   - `BOOTSTRAP_ADMIN_PASSWORD` = كلمة مرور قوية مؤقتة، لا تضعها في GitHub.
6. من Apps Script Editor شغّل الدالة `setupSystem()` مرة واحدة ووافق على الصلاحيات.
7. الدالة تنشئ الشيتات الأساسية والـCurriculum والفسح ومواقع الإشراف، وتُنشئ أول Admin إذا كانت Users فارغة، ثم تحذف `BOOTSTRAP_ADMIN_PASSWORD` من Script Properties.
8. Deploy > New deployment > Web app:
   - Execute as: **Me**
   - Who has access: **Anyone**
9. انسخ رابط `/exec`.

> كون الـWeb App متاحًا لـAnyone لا يعني أن البيانات Public؛ كل البيانات الحساسة محمية بجلسة Server-side، والـStudent Public endpoint يحتاج توكن طويل صالح وغير ملغي.

## 2) التشغيل محليًا

```bash
npm install
npm run dev
```

يمكن وضع رابط Apps Script في `.env.local`:

```env
VITE_API_URL=https://script.google.com/macros/s/DEPLOYMENT_ID/exec
```

أو تركه فارغًا ولصقه من شاشة تسجيل الدخول. رابط الـAPI ليس Secret.

## 3) الرفع على GitHub Pages

1. أنشئ Repository جديدًا على GitHub.
2. ارفع كل محتويات هذا المجلد إلى الفرع `main`.
3. افتح `Settings > Pages`.
4. اختر `Source: GitHub Actions`.
5. Workflow الموجود في `.github/workflows/deploy.yml` سيبني المشروع وينشره تلقائيًا.
6. افتح رابط Pages، الصق رابط Apps Script أول مرة، ثم سجل الدخول.

`vite.config.ts` يستخدم `base: './'` لذلك يعمل المشروع حتى لو كان داخل Repo sub-path.

## 4) بوابة المعلم

- أضف الموظف كمعلم من شاشة الموظفين.
- النظام ينشئ Teacher Code إذا لم يوجد.
- اضغط `PIN` من شاشة الموظفين وحدد PIN لا يقل عن 6 خانات.
- افتح `#teacher` أو زر بوابة المعلم.
- لا يوجد PIN افتراضي ولا زر Demo bypass.

## 5) بوابة الطالب

- من سجل الطلاب اضغط `رابط الطالب`.
- أنشئ/دوّر التوكن ثم انسخ الرابط.
- إنشاء توكن جديد يلغي التوكن النشط السابق.
- الخادم يخزن `tokenHash` فقط، وليس التوكن الخام.
- الطالب يرى فقط الجدول المنشور والواجبات والامتحانات والموارد المنشورة.

## 6) قواعد الجدول المهمة

- `weeklyMinutesLimit = 1500`
- `defaultPeriodMinutes = 50`
- `weeklyPeriodLimit = 30`
- الاحتياطي يدخل في النصاب افتراضيًا.
- الإشراف منفصل افتراضيًا، ويمكن إدخاله في النصاب من الإعدادات.
- الاحتياطي الأسبوعي مشتق من تاريخ التكليف؛ لا توجد عملية Delete/Reset أسبوعية.
- Week A/B يتحدد من `cycleAnchorDate` في إعدادات الجدول.
- الجدول العام للفصل يجب أن يحقق 39 حصة في Week A و39 حصة في Week B.

## 7) استيراد الجدول

الأعمدة المدعومة عربيًا أو إنجليزيًا:

- اليوم / Day
- الحصة / Period
- الصف / Grade
- الفصل / Classroom
- المادة / Subject
- كود المعلم / TeacherCode
- اسم المعلم / TeacherName
- القاعة / Room
- أسبوع الخطة / CycleWeek (`ALL`, `A`, `B`)

الاستيراد يرفض المعلم أو الفصل أو المادة غير المعروفة، ولا ينشئ Fake Employee. إعادة رفع صف موجود تُتخطى بدل تكراره.

## 8) ملاحظات الأمان

- لا توجد كلمة مرور افتراضية في الـRepository.
- لا يوجد Offline Authentication أو Client-generated trusted session.
- Session Token في `sessionStorage` فقط.
- Teacher PIN وStaff Password يتم التحقق منهما على Apps Script فقط.
- Student token مخزن كـHash ويملك Expiry وRevocation.
- الـBackend يعيد فحص Conflict وTeacher Load عند حفظ الاحتياطي.
- لا توجد Parent Portal ولا Payroll engine ولا Class-period attendance في هذه النسخة.

## 9) اختبار المشروع

```bash
npm run lint
npm run build
```

وفي Apps Script يمكن تشغيل `setupSystem()` على Sheet تجريبي قبل نشر الإنتاج.

## بنية المشروع

```text
src/
  components/
  lib/
  modules/timetable/
  pages/
  App.tsx
  types.ts
google-apps-script/
  Code.gs
.github/workflows/
  deploy.yml
```

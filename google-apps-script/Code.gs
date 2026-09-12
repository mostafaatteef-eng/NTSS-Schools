/**
 * EBDA SCHOOL ERP — Google Apps Script Backend
 * Version 5.0.0 — Timetable Enabled / Server Authoritative
 *
 * Security model:
 * - No GET data API. doGet() only returns health text.
 * - All mutations and reads use POST.
 * - Staff/teacher identity comes from validated server session.
 * - No default admin credentials in source code.
 * - Student public access uses a hashed, revocable token.
 */

var VERSION = '5.0.0-TIMETABLE-ENABLED';
var TZ = 'Africa/Cairo';
var SESSION_HOURS = 12;
var HASH_ROUNDS = 5000;

var SHEETS = {
  USERS: 'Users', SESSIONS: 'Sessions', EMPLOYEES: 'Employees', TEACHER_CREDENTIALS: 'Teacher_Credentials',
  STUDENTS: 'Students', STUDENT_ATTENDANCE: 'Student_Attendance', SETTINGS: 'Settings',
  CLASSROOMS: 'Classrooms', SUBJECTS: 'Subjects', SCHEDULE: 'Schedule', TEACHER_ASSIGNMENTS: 'Teacher_Assignments', TEACHER_AVAILABILITY: 'Teacher_Availability',
  RESERVE: 'Reserve_Assignments', SUPERVISION_LOCATIONS: 'Supervision_Locations', SUPERVISION: 'Supervision_Assignments',
  EXAMS: 'Exam_Schedule', HOMEWORK: 'Homework', RESOURCES: 'Teacher_Resources', STUDENT_TOKENS: 'Student_Access_Tokens',
  CURRICULUM: 'Curriculum_Requirements', BEHAVIOR: 'Behavior_Violations', PARENT_COMMS: 'Parent_Communications', STAFF_ATTENDANCE: 'Staff_Attendance', LEAVES: 'Leaves', AUDIT: 'Audit_Log'
};

var HEADERS = {};
HEADERS[SHEETS.USERS] = ['id','username','fullName','role','status','passwordSalt','passwordHash','createdAt','updatedAt'];
HEADERS[SHEETS.SESSIONS] = ['id','tokenHash','userId','role','employeeId','createdAt','expiresAt','revokedAt'];
HEADERS[SHEETS.EMPLOYEES] = ['id','employeeCode','name','jobTitle','department','status','isTeacher','teacherCode','phone','email'];
HEADERS[SHEETS.TEACHER_CREDENTIALS] = ['id','employeeId','teacherCode','pinSalt','pinHash','status','updatedAt'];
HEADERS[SHEETS.STUDENTS] = ['id','studentCode','name','gradeId','gradeName','classroomId','classroomName','status','parentName','parentPhone','nationalId'];
HEADERS[SHEETS.STUDENT_ATTENDANCE] = ['id','studentId','date','status','lateMinutes','notes','recordedBy','updatedAt'];
HEADERS[SHEETS.SETTINGS] = ['key','value','updatedAt'];
HEADERS[SHEETS.CLASSROOMS] = ['id','name','gradeId','gradeName','isActive'];
HEADERS[SHEETS.SUBJECTS] = ['id','name','shortName','isActive'];
HEADERS[SHEETS.SCHEDULE] = ['id','academicYearId','academicYearName','termId','termName','dayOfWeek','periodNumber','startTime','endTime','gradeId','gradeName','classroomId','classroomName','subjectId','subjectName','teacherId','teacherName','teacherCode','roomId','roomName','cycleWeek','status','isLocked','createdAt','updatedAt'];
HEADERS[SHEETS.TEACHER_ASSIGNMENTS] = ['id','academicYearId','academicYearName','termId','termName','teacherId','teacherCode','teacherName','subjectId','subjectName','gradeId','gradeName','classroomId','classroomName','requiredPeriodsPerWeek','isActive','createdAt','updatedAt'];
HEADERS[SHEETS.TEACHER_AVAILABILITY] = ['id','teacherId','dayOfWeek','periodNumber','status'];
HEADERS[SHEETS.RESERVE] = ['id','academicYearId','academicYearName','termId','termName','date','dayOfWeek','periodNumber','classroomId','classroomName','subjectId','subjectName','originalTeacherId','originalTeacherName','substituteTeacherId','substituteTeacherName','reason','status','createdAt','updatedAt'];
HEADERS[SHEETS.SUPERVISION_LOCATIONS] = ['id','name','code','description','isActive','sortOrder'];
HEADERS[SHEETS.SUPERVISION] = ['id','academicYearId','academicYearName','termId','termName','date','dayOfWeek','periodNumber','timeSlot','locationId','locationName','teacherId','teacherName','teacherCode','shift','status','createdAt','updatedAt'];
HEADERS[SHEETS.EXAMS] = ['id','academicYearId','academicYearName','termId','termName','examType','subjectId','subjectName','gradeId','gradeName','classroomId','classroomName','examDate','startTime','durationMinutes','roomName','instructions','status','createdAt','updatedAt'];
HEADERS[SHEETS.HOMEWORK] = ['id','academicYearId','academicYearName','termId','termName','teacherId','subjectId','subjectName','gradeId','gradeName','classroomId','classroomName','title','description','assignedDate','dueDate','resourceUrl','status','createdAt','updatedAt'];
HEADERS[SHEETS.RESOURCES] = ['id','academicYearId','academicYearName','termId','termName','teacherId','subjectId','subjectName','classroomId','classroomName','title','preparationUrl','presentationUrl','studentResourceUrl','visibility','createdAt','updatedAt'];
HEADERS[SHEETS.STUDENT_TOKENS] = ['id','studentId','tokenHash','createdAt','expiresAt','revokedAt','createdBy'];
HEADERS[SHEETS.CURRICULUM] = ['id','curriculumVersionId','academicYearId','academicYearName','termId','termName','gradeId','gradeName','subjectId','subjectName','requiredPeriodsPerWeek','cycleWeek','cycleLengthWeeks','isActive'];
HEADERS[SHEETS.BEHAVIOR] = ['id','studentId','studentName','date','type','severity','points','notes','status','createdBy','createdAt','updatedAt'];
HEADERS[SHEETS.PARENT_COMMS] = ['id','studentId','studentName','date','type','reason','details','result','recordedBy','createdAt'];
HEADERS[SHEETS.STAFF_ATTENDANCE] = ['id','employeeId','date','status','checkIn','checkOut','lateMinutes','notes','recordedBy','updatedAt'];
HEADERS[SHEETS.LEAVES] = ['id','employeeId','startDate','endDate','type','status','notes','createdBy','createdAt','updatedAt'];
HEADERS[SHEETS.AUDIT] = ['id','timestamp','actorId','actorRole','action','entity','entityId','details'];

function doGet() {
  return ContentService.createTextOutput(JSON.stringify({ ok: true, data: { version: VERSION } })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    var action = String(body.action || '');
    if (!action) return jsonError('ACTION_REQUIRED', 'الإجراء مطلوب.');

    if (action === 'ping') return jsonOk({ version: VERSION });
    if (action === 'loginStaff') return jsonOk(loginStaff(body.username, body.password));
    if (action === 'loginTeacher') return jsonOk(loginTeacher(body.teacherCode, body.pin));
    if (action === 'studentPublicData') return jsonOk(studentPublicData(body.token));

    var session = requireSession(body.sessionToken);
    if (action === 'me') return jsonOk({ token: body.sessionToken, user: session.user });
    if (action === 'logout') { revokeSession(body.sessionToken); return jsonOk({ loggedOut: true }); }

    var result = dispatchAuthenticated(action, body, session);
    return jsonOk(result);
  } catch (err) {
    console.error(err && err.stack ? err.stack : err);
    return jsonError(err.code || 'SERVER_ERROR', err.message || String(err));
  }
}

function dispatchAuthenticated(action, body, session) {
  if (action === 'dashboard') { requireStaff(session); return dashboardData(); }
  if (action === 'listStudents') { requireRoles(session, ['Admin','SchoolDirector','StudentAffairs','SocialSpecialist']); return listRows(SHEETS.STUDENTS); }
  if (action === 'saveStudent') { requireRoles(session, ['Admin','SchoolDirector','StudentAffairs']); return saveStudent(body.student, session); }
  if (action === 'createStudentAccessToken') { requireRoles(session, ['Admin','SchoolDirector','StudentAffairs']); return createStudentAccessToken(body.studentId, session); }
  if (action === 'listStudentAttendance') { requireRoles(session, ['Admin','SchoolDirector','StudentAffairs']); return listRows(SHEETS.STUDENT_ATTENDANCE).filter(function(x){return !body.date || x.date === body.date;}); }
  if (action === 'saveStudentAttendanceBulk') { requireRoles(session, ['Admin','SchoolDirector','StudentAffairs']); return saveStudentAttendanceBulk(body.records || [], session); }
  if (action === 'listBehaviorViolations') { requireRoles(session, ['Admin','SchoolDirector','StudentAffairs','SocialSpecialist']); return listRows(SHEETS.BEHAVIOR); }
  if (action === 'saveBehaviorViolation') { requireRoles(session, ['Admin','SchoolDirector','StudentAffairs','SocialSpecialist']); return saveBehaviorViolation(body.violation, session); }
  if (action === 'listParentCommunications') { requireRoles(session, ['Admin','SchoolDirector','StudentAffairs','SocialSpecialist']); return listRows(SHEETS.PARENT_COMMS); }
  if (action === 'saveParentCommunication') { requireRoles(session, ['Admin','SchoolDirector','StudentAffairs','SocialSpecialist']); return saveParentCommunication(body.communication, session); }

  if (action === 'listEmployees') { requireRoles(session, ['Admin','SchoolDirector','TeacherAffairs','HR']); return listRows(SHEETS.EMPLOYEES); }
  if (action === 'saveEmployee') { requireRoles(session, ['Admin','SchoolDirector','TeacherAffairs','HR']); return saveEmployee(body.employee, session); }
  if (action === 'setTeacherPin') { requireRoles(session, ['Admin','SchoolDirector','TeacherAffairs']); return setTeacherPin(body.employeeId, body.pin, session); }
  if (action === 'listStaffAttendance') { requireRoles(session, ['Admin','SchoolDirector','TeacherAffairs','HR']); return listRows(SHEETS.STAFF_ATTENDANCE).filter(function(x){return !body.date || x.date===body.date;}); }
  if (action === 'saveStaffAttendance') { requireRoles(session, ['Admin','SchoolDirector','TeacherAffairs','HR']); return saveStaffAttendance(body.record, session); }
  if (action === 'listLeaves') { requireRoles(session, ['Admin','SchoolDirector','TeacherAffairs','HR']); return listRows(SHEETS.LEAVES); }
  if (action === 'saveLeave') { requireRoles(session, ['Admin','SchoolDirector','TeacherAffairs','HR']); return saveLeave(body.leave, session); }

  if (action === 'listUsers') { requireRoles(session, ['Admin']); return listUsersSanitized(); }
  if (action === 'saveUser') { requireRoles(session, ['Admin']); return saveUser(body.user, session); }
  if (action === 'listAuditLogs') { requireRoles(session, ['Admin','SchoolDirector']); return listRows(SHEETS.AUDIT).slice(-500).reverse(); }

  if (action === 'timetableBootstrap') { requireRoles(session, ['Admin','SchoolDirector','TeacherAffairs','StudentAffairs','QualityOfficer','Viewer']); return timetableBootstrap(); }
  if (action === 'saveScheduleItem') { requireRoles(session, ['Admin','SchoolDirector','TeacherAffairs']); return saveScheduleItem(body.item, session); }
  if (action === 'deleteScheduleItem') { requireRoles(session, ['Admin','SchoolDirector','TeacherAffairs']); return deleteScheduleItem(body.id, session); }
  if (action === 'saveTeacherAvailability') { requireRoles(session, ['Admin','SchoolDirector','TeacherAffairs']); return saveTeacherAvailability(body.availability, session); }
  if (action === 'reserveCandidates') { requireRoles(session, ['Admin','SchoolDirector','TeacherAffairs']); return reserveCandidates(body); }
  if (action === 'saveReserve') { requireRoles(session, ['Admin','SchoolDirector','TeacherAffairs']); return saveReserve(body.assignment, session); }
  if (action === 'cancelReserve') { requireRoles(session, ['Admin','SchoolDirector','TeacherAffairs']); return cancelById(SHEETS.RESERVE, body.id, session); }
  if (action === 'saveSupervision') { requireRoles(session, ['Admin','SchoolDirector','TeacherAffairs']); return saveSupervision(body.assignment, session); }
  if (action === 'saveSupervisionLocation') { requireRoles(session, ['Admin','SchoolDirector','TeacherAffairs']); return saveSupervisionLocation(body.location, session); }
  if (action === 'deleteSupervision') { requireRoles(session, ['Admin','SchoolDirector','TeacherAffairs']); return cancelById(SHEETS.SUPERVISION, body.id, session); }
  if (action === 'saveExam') { requireRoles(session, ['Admin','SchoolDirector','TeacherAffairs']); return saveExam(body.exam, session); }
  if (action === 'saveScheduleConfig') { requireRoles(session, ['Admin','SchoolDirector','TeacherAffairs']); return saveScheduleConfig(body.config, session); }
  if (action === 'validateScheduleImport') { requireRoles(session, ['Admin','SchoolDirector','TeacherAffairs']); return validateScheduleImport(body.rows || []); }
  if (action === 'commitScheduleImport') { requireRoles(session, ['Admin','SchoolDirector','TeacherAffairs']); return commitScheduleImport(body.rows || [], session); }

  if (action === 'teacherPortalData') { requireTeacherPortal(session); return teacherPortalData(session); }
  if (action === 'teacherSaveHomework') { requireTeacherPortal(session); return teacherSaveHomework(body.homework, session); }
  if (action === 'teacherSaveResource') { requireTeacherPortal(session); return teacherSaveResource(body.resource, session); }

  throw apiError('UNKNOWN_ACTION', 'الإجراء غير معروف: ' + action);
}

// -----------------------------------------------------------------------------
// Setup
// -----------------------------------------------------------------------------
function setupSystem() {
  var ss = SpreadsheetApp.getActive();
  Object.keys(HEADERS).forEach(function(name){ ensureSheet(name, HEADERS[name]); });
  seedSettings(); seedMasterData(); seedCurriculum(); seedSupervisionLocations();

  var props = PropertiesService.getScriptProperties();
  var username = props.getProperty('BOOTSTRAP_ADMIN_USERNAME');
  var password = props.getProperty('BOOTSTRAP_ADMIN_PASSWORD');
  if (username && password && listRows(SHEETS.USERS).length === 0) {
    createStaffUser({ username: username, fullName: 'مدير النظام', role: 'Admin', password: password }, null);
    props.deleteProperty('BOOTSTRAP_ADMIN_PASSWORD');
  }
  return 'Setup complete. Version ' + VERSION;
}

function seedSettings() {
  if (getSetting('scheduleConfig')) return;
  var periods = [
    {periodNumber:1,startTime:'07:30',endTime:'08:20'}, {periodNumber:2,startTime:'08:20',endTime:'09:10'},
    {periodNumber:3,startTime:'09:10',endTime:'10:00'}, {periodNumber:4,startTime:'10:20',endTime:'11:10'},
    {periodNumber:5,startTime:'11:10',endTime:'12:00'}, {periodNumber:6,startTime:'12:20',endTime:'13:10'},
    {periodNumber:7,startTime:'13:10',endTime:'14:00'}, {periodNumber:8,startTime:'14:00',endTime:'14:50'}
  ];
  var config = {
    academicYearId:'AY-2026-2027', academicYearName:'2026/2027', termId:'TERM-1', termName:'الفصل الدراسي الأول',
    studyDays:['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس'], periods:periods,
    breaks:[{id:'BRK-1',name:'الفسحة الأولى',startTime:'10:00',endTime:'10:20',isActive:true,sortOrder:1},{id:'BRK-2',name:'الفسحة الثانية',startTime:'12:00',endTime:'12:20',isActive:true,sortOrder:2}],
    teacherLoadPolicy:{weeklyMinutesLimit:1500,defaultPeriodMinutes:50,weeklyPeriodLimit:30,weekStartsOn:0,reserveCountsTowardLoad:true,supervisionCountsTowardLoad:false},
    cycleAnchorDate:'2026-09-06'
  };
  setSetting('scheduleConfig', config);
}

function seedMasterData() {
  if (listRows(SHEETS.CLASSROOMS).length === 0) {
    [['1/1','G1','الصف الأول الثانوي'],['1/2','G1','الصف الأول الثانوي'],['2/1','G2','الصف الثاني الثانوي'],['2/2','G2','الصف الثاني الثانوي'],['3/1','G3','الصف الثالث الثانوي'],['3/2','G3','الصف الثالث الثانوي']].forEach(function(x){ appendObject(SHEETS.CLASSROOMS,{id:x[0],name:x[0],gradeId:x[1],gradeName:x[2],isActive:true}); });
  }
  if (listRows(SHEETS.SUBJECTS).length === 0) {
    ['اللغة العربية','اللغة الإنجليزية المتقدمة','الرياضيات المتقدمة','الفيزياء المتقدمة','الدراسات الاجتماعية','الاقتصاد','التربية الدينية','التربية الوطنية','التحول الرقمي','التربية الرياضية','التوجيه والإرشاد المهني','ريادة الأعمال والابتكار','الدراسات التقنية التخصصية نظري','الدراسات التقنية التخصصية عملي','التدريب الميداني'].forEach(function(n,i){appendObject(SHEETS.SUBJECTS,{id:'SUB-'+(i+1),name:n,shortName:n,isActive:true});});
  }
}

function seedSupervisionLocations() {
  if (listRows(SHEETS.SUPERVISION_LOCATIONS).length) return;
  ['البوابة الرئيسية','الفناء','الدور الأول','الدور الثاني','المعامل','الورش','الكافتيريا','الباصات'].forEach(function(n,i){appendObject(SHEETS.SUPERVISION_LOCATIONS,{id:'SUPLOC-'+(i+1),name:n,code:'L'+(i+1),description:'',isActive:true,sortOrder:i+1});});
}

function seedCurriculum() {
  if (listRows(SHEETS.CURRICULUM).length) return;
  var ctx = getScheduleConfig();
  var subjects = indexBy(listRows(SHEETS.SUBJECTS), 'name');
  var plans = {
    G1:[['اللغة العربية',2],['اللغة الإنجليزية المتقدمة',3],['الرياضيات المتقدمة',2],['الفيزياء المتقدمة',2],['التربية الدينية',1],['التربية الوطنية',1],['التحول الرقمي',1],['التربية الرياضية',1],['التوجيه والإرشاد المهني',1,'A',2],['ريادة الأعمال والابتكار',1,'B',2],['الدراسات التقنية التخصصية نظري',5],['الدراسات التقنية التخصصية عملي',6],['التدريب الميداني',14]],
    G2:[['اللغة العربية',2],['اللغة الإنجليزية المتقدمة',2],['الرياضيات المتقدمة',2],['الفيزياء المتقدمة',2],['الدراسات الاجتماعية',2],['التربية الدينية',1],['التحول الرقمي',1],['التربية الرياضية',1],['التوجيه والإرشاد المهني',1,'A',2],['ريادة الأعمال والابتكار',1,'B',2],['الدراسات التقنية التخصصية نظري',5],['الدراسات التقنية التخصصية عملي',6],['التدريب الميداني',14]],
    G3:[['اللغة العربية',2],['اللغة الإنجليزية المتقدمة',2],['الرياضيات المتقدمة',2],['الفيزياء المتقدمة',2],['الدراسات الاجتماعية',1],['الاقتصاد',1],['التربية الدينية',1],['التحول الرقمي',1],['التربية الرياضية',1],['التوجيه والإرشاد المهني',1,'A',2],['ريادة الأعمال والابتكار',1,'B',2],['الدراسات التقنية التخصصية نظري',5],['الدراسات التقنية التخصصية عملي',6],['التدريب الميداني',14]]
  };
  var gradeNames={G1:'الصف الأول الثانوي',G2:'الصف الثاني الثانوي',G3:'الصف الثالث الثانوي'};
  Object.keys(plans).forEach(function(g){plans[g].forEach(function(x,i){var s=subjects[x[0]]||{id:'SUB-X-'+i,name:x[0]};appendObject(SHEETS.CURRICULUM,{id:'CUR-'+g+'-'+i,curriculumVersionId:'ICT-2026-V1',academicYearId:ctx.academicYearId,academicYearName:ctx.academicYearName,termId:ctx.termId,termName:ctx.termName,gradeId:g,gradeName:gradeNames[g],subjectId:s.id,subjectName:s.name,requiredPeriodsPerWeek:x[1],cycleWeek:x[2]||'ALL',cycleLengthWeeks:x[3]||1,isActive:true});});});
}

// -----------------------------------------------------------------------------
// Auth
// -----------------------------------------------------------------------------
function loginStaff(username, password) {
  rateLimit('staff:' + String(username).toLowerCase());
  var user = listRows(SHEETS.USERS).filter(function(u){return String(u.username).toLowerCase()===String(username||'').trim().toLowerCase();})[0];
  if (!user || user.status !== 'Active' || hashSecret(String(password||''), user.passwordSalt) !== user.passwordHash) throw apiError('INVALID_CREDENTIALS','بيانات الدخول غير صحيحة.');
  clearRateLimit('staff:' + String(username).toLowerCase());
  return createSession({id:user.id,username:user.username,fullName:user.fullName,role:user.role});
}

function loginTeacher(teacherCode, pin) {
  rateLimit('teacher:' + String(teacherCode).toUpperCase());
  var cred = listRows(SHEETS.TEACHER_CREDENTIALS).filter(function(c){return String(c.teacherCode).toUpperCase()===String(teacherCode||'').trim().toUpperCase() && c.status==='Active';})[0];
  if (!cred || hashSecret(String(pin||''), cred.pinSalt) !== cred.pinHash) throw apiError('INVALID_CREDENTIALS','كود المعلم أو PIN غير صحيح.');
  var emp = findById(SHEETS.EMPLOYEES, cred.employeeId);
  if (!emp || emp.status !== 'Active' || !truthy(emp.isTeacher)) throw apiError('TEACHER_INACTIVE','حساب المعلم غير نشط.');
  clearRateLimit('teacher:' + String(teacherCode).toUpperCase());
  return createSession({id:'TEACHER-'+emp.id,fullName:emp.name,role:'TeacherPortal',employeeId:emp.id,teacherCode:emp.teacherCode});
}

function createSession(user) {
  var token = randomToken(); var now = new Date(); var exp = new Date(now.getTime()+SESSION_HOURS*3600000);
  appendObject(SHEETS.SESSIONS,{id:'SES-'+Utilities.getUuid(),tokenHash:sha256(token),userId:user.id,role:user.role,employeeId:user.employeeId||'',createdAt:iso(now),expiresAt:iso(exp),revokedAt:''});
  return { token:token, user:user };
}

function requireSession(token) {
  if (!token) throw apiError('UNAUTHENTICATED','الجلسة غير موجودة.');
  var hash=sha256(String(token)); var row=listRows(SHEETS.SESSIONS).filter(function(s){return s.tokenHash===hash && !s.revokedAt;})[0];
  if (!row || new Date(row.expiresAt).getTime() < Date.now()) throw apiError('SESSION_EXPIRED','انتهت الجلسة. سجل الدخول مرة أخرى.');
  if (row.role === 'TeacherPortal') {
    var emp=findById(SHEETS.EMPLOYEES,row.employeeId); if(!emp) throw apiError('UNAUTHENTICATED','المعلم غير موجود.');
    return {row:row,user:{id:row.userId,fullName:emp.name,role:'TeacherPortal',employeeId:emp.id,teacherCode:emp.teacherCode}};
  }
  var u=findById(SHEETS.USERS,row.userId); if(!u||u.status!=='Active') throw apiError('UNAUTHENTICATED','المستخدم غير نشط.');
  return {row:row,user:{id:u.id,username:u.username,fullName:u.fullName,role:u.role}};
}
function revokeSession(token){var h=sha256(String(token||''));updateFirst(SHEETS.SESSIONS,function(x){return x.tokenHash===h&&!x.revokedAt;},{revokedAt:iso(new Date())});}
function requireStaff(session){if(session.user.role==='TeacherPortal')throw apiError('FORBIDDEN','غير مصرح.');}
function requireTeacherPortal(session){if(session.user.role!=='TeacherPortal')throw apiError('FORBIDDEN','بوابة المعلم فقط.');}
function requireRoles(session,roles){if(roles.indexOf(session.user.role)<0)throw apiError('FORBIDDEN','لا تملك صلاحية تنفيذ هذا الإجراء.');}

// -----------------------------------------------------------------------------
// Staff / students / employees
// -----------------------------------------------------------------------------
function dashboardData(){var today=dateOnly(new Date());var att=listRows(SHEETS.STUDENT_ATTENDANCE).filter(function(x){return x.date===today;});return{students:listRows(SHEETS.STUDENTS).filter(function(x){return x.status==='Active';}).length,employees:listRows(SHEETS.EMPLOYEES).filter(function(x){return x.status==='Active';}).length,teachers:listRows(SHEETS.EMPLOYEES).filter(function(x){return x.status==='Active'&&truthy(x.isTeacher);}).length,absentStudentsToday:att.filter(function(x){return x.status==='AbsentExcused'||x.status==='AbsentUnexcused';}).length,lateStudentsToday:att.filter(function(x){return x.status==='Late';}).length,timetableConflicts:detectAllConflicts().length,reserveAssignmentsThisWeek:reserveInWeek().length};}
function saveStudent(student,session){if(!student||!student.id||!student.name)throw apiError('VALIDATION','بيانات الطالب غير مكتملة.');upsertObject(SHEETS.STUDENTS,student);audit(session,'SAVE','Student',student.id,student.name);return student;}
function saveEmployee(emp,session){if(!emp||!emp.id||!emp.name)throw apiError('VALIDATION','بيانات الموظف غير مكتملة.');if(truthy(emp.isTeacher)&&!emp.teacherCode)emp.teacherCode=nextTeacherCode();if(emp.teacherCode){var d=listRows(SHEETS.EMPLOYEES).filter(function(x){return x.id!==emp.id&&String(x.teacherCode).toUpperCase()===String(emp.teacherCode).toUpperCase();});if(d.length)throw apiError('DUPLICATE_TEACHER_CODE','كود المعلم مستخدم بالفعل.');}upsertObject(SHEETS.EMPLOYEES,emp);audit(session,'SAVE','Employee',emp.id,emp.name);return emp;}
function saveStudentAttendanceBulk(records,session){(records||[]).forEach(function(r){r.recordedBy=session.user.fullName;r.updatedAt=iso(new Date());upsertObject(SHEETS.STUDENT_ATTENDANCE,r);});audit(session,'BULK_SAVE','StudentAttendance','',String(records.length));return{saved:records.length};}
function saveBehaviorViolation(v,session){if(!v||!v.studentId||!v.type)throw apiError('VALIDATION','بيانات المخالفة غير مكتملة.');v.id=v.id||'BV-'+Utilities.getUuid();v.createdBy=session.user.fullName;v.createdAt=v.createdAt||iso(new Date());v.updatedAt=iso(new Date());upsertObject(SHEETS.BEHAVIOR,v);audit(session,'SAVE','BehaviorViolation',v.id,v.studentName+' - '+v.type);return v;}
function saveParentCommunication(c,session){if(!c||!c.studentId||!c.details)throw apiError('VALIDATION','بيانات التواصل غير مكتملة.');c.id=c.id||'PC-'+Utilities.getUuid();c.recordedBy=session.user.fullName;c.createdAt=c.createdAt||iso(new Date());upsertObject(SHEETS.PARENT_COMMS,c);audit(session,'SAVE','ParentCommunication',c.id,c.studentName+' - '+c.reason);return c;}
function setTeacherPin(employeeId,pin,session){if(!pin||String(pin).length<6)throw apiError('WEAK_PIN','PIN يجب ألا يقل عن 6 أرقام/حروف.');var emp=findById(SHEETS.EMPLOYEES,employeeId);if(!emp||!truthy(emp.isTeacher))throw apiError('NOT_TEACHER','الموظف ليس معلماً.');var salt=randomSalt();listRows(SHEETS.SESSIONS).filter(function(x){return x.employeeId===employeeId&&!x.revokedAt;}).forEach(function(x){updateById(SHEETS.SESSIONS,x.id,{revokedAt:iso(new Date())});});upsertObject(SHEETS.TEACHER_CREDENTIALS,{id:'TC-'+employeeId,employeeId:employeeId,teacherCode:emp.teacherCode,pinSalt:salt,pinHash:hashSecret(String(pin),salt),status:'Active',updatedAt:iso(new Date())});audit(session,'ROTATE_PIN','TeacherCredential',employeeId,'');return{saved:true};}
function saveStaffAttendance(r,session){if(!r||!r.employeeId||!r.date)throw apiError('VALIDATION','بيانات الدوام غير مكتملة.');r.id=r.id||('SA-'+r.employeeId+'-'+r.date);r.recordedBy=session.user.fullName;r.updatedAt=iso(new Date());upsertObject(SHEETS.STAFF_ATTENDANCE,r);audit(session,'SAVE','StaffAttendance',r.id,r.status);return r;}
function saveLeave(l,session){if(!l||!l.employeeId||!l.startDate||!l.endDate)throw apiError('VALIDATION','بيانات الإجازة غير مكتملة.');l.id=l.id||'LV-'+Utilities.getUuid();l.status=l.status||'Pending';l.createdBy=session.user.fullName;l.createdAt=l.createdAt||iso(new Date());l.updatedAt=iso(new Date());upsertObject(SHEETS.LEAVES,l);audit(session,'SAVE','Leave',l.id,l.type);return l;}
function listUsersSanitized(){return listRows(SHEETS.USERS).map(function(u){return{id:u.id,username:u.username,fullName:u.fullName,role:u.role,status:u.status};});}
function saveUser(user,session){if(!user||!user.username||!user.fullName||!user.role)throw apiError('VALIDATION','بيانات المستخدم غير مكتملة.');return createStaffUser(user,session);}
function createStaffUser(user,session){var allowed=['Admin','SchoolDirector','StudentAffairs','TeacherAffairs','HR','SocialSpecialist','QualityOfficer','Viewer'];if(allowed.indexOf(user.role)<0)throw apiError('INVALID_ROLE','الدور غير معتمد.');var existing=listRows(SHEETS.USERS).filter(function(u){return String(u.username).toLowerCase()===String(user.username).toLowerCase();})[0];var id=existing?existing.id:'USR-'+Utilities.getUuid();var salt=existing?existing.passwordSalt:randomSalt();var hash=existing?existing.passwordHash:'';if(user.password){salt=randomSalt();hash=hashSecret(String(user.password),salt);if(existing){listRows(SHEETS.SESSIONS).filter(function(x){return x.userId===existing.id&&!x.revokedAt;}).forEach(function(x){updateById(SHEETS.SESSIONS,x.id,{revokedAt:iso(new Date())});});}}if(!hash)throw apiError('PASSWORD_REQUIRED','كلمة المرور مطلوبة.');var row={id:id,username:String(user.username).trim().toLowerCase(),fullName:user.fullName,role:user.role,status:user.status||'Active',passwordSalt:salt,passwordHash:hash,createdAt:existing?existing.createdAt:iso(new Date()),updatedAt:iso(new Date())};upsertObject(SHEETS.USERS,row);if(session)audit(session,'SAVE','User',id,row.username);return{id:id,username:row.username,fullName:row.fullName,role:row.role,status:row.status};}

// -----------------------------------------------------------------------------
// Timetable
// -----------------------------------------------------------------------------
function timetableBootstrap(){var config=getScheduleConfig();return{config:config,schedule:currentRows(SHEETS.SCHEDULE,config),employees:listRows(SHEETS.EMPLOYEES),assignments:currentRows(SHEETS.TEACHER_ASSIGNMENTS,config).filter(function(x){return truthy(x.isActive);}),availability:listRows(SHEETS.TEACHER_AVAILABILITY),teacherLoads:getTeacherLoads(config),reserves:currentRows(SHEETS.RESERVE,config),supervisionLocations:listRows(SHEETS.SUPERVISION_LOCATIONS),supervisions:currentRows(SHEETS.SUPERVISION,config),exams:currentRows(SHEETS.EXAMS,config),curriculumCoverage:getCurriculumCoverage(config)};}
function saveScheduleItem(item,session){var config=getScheduleConfig();fillContext(item,config);if(item.id){var existing=findById(SHEETS.SCHEDULE,item.id);if(existing&&truthy(existing.isLocked)&&['Admin','SchoolDirector'].indexOf(session.user.role)<0)throw apiError('LOCKED','الحصة مقفلة ولا يمكن تعديلها إلا بواسطة الإدارة.');}if(!item.id)item.id='SCH-'+Utilities.getUuid();validateScheduleItem(item);item.createdAt=item.createdAt||iso(new Date());item.updatedAt=iso(new Date());upsertObject(SHEETS.SCHEDULE,item);syncTeacherAssignmentsFromSchedule(config);audit(session,'SAVE','Schedule',item.id,item.classroomName+' '+item.dayOfWeek+' '+item.periodNumber);return item;}
function validateScheduleItem(item){var config=getScheduleConfig();if(config.studyDays.indexOf(item.dayOfWeek)<0)throw apiError('INVALID_DAY','اليوم خارج أيام الدراسة.');if(!config.periods.some(function(p){return Number(p.periodNumber)===Number(item.periodNumber);}))throw apiError('INVALID_PERIOD','رقم الحصة غير صحيح.');if(!findById(SHEETS.EMPLOYEES,item.teacherId))throw apiError('UNKNOWN_TEACHER','المعلم غير موجود.');var rows=currentRows(SHEETS.SCHEDULE,config).filter(function(x){return x.id!==item.id&&x.status!=='Archived'&&cycleOverlap(x.cycleWeek,item.cycleWeek)&&x.dayOfWeek===item.dayOfWeek&&Number(x.periodNumber)===Number(item.periodNumber);});if(rows.some(function(x){return x.teacherId===item.teacherId;}))throw apiError('TEACHER_CONFLICT','المعلم لديه حصة أخرى في نفس الوقت.');if(rows.some(function(x){return x.classroomId===item.classroomId;}))throw apiError('CLASSROOM_CONFLICT','الفصل لديه حصة أخرى في نفس الوقت.');if(item.roomName&&rows.some(function(x){return x.roomName&&x.roomName===item.roomName;}))throw apiError('ROOM_CONFLICT','القاعة مستخدمة في نفس الوقت.');if(overlapsBreak(item.startTime,item.endTime,config.breaks))throw apiError('BREAK_CONFLICT','الحصة تتداخل مع فسحة مدرسية.');}
function syncTeacherAssignmentsFromSchedule(config){var schedule=currentRows(SHEETS.SCHEDULE,config).filter(function(x){return x.status!=='Archived';});var groups={};schedule.forEach(function(s){var k=[s.teacherId,s.subjectId,s.classroomId].join('|');if(!groups[k])groups[k]=[];groups[k].push(s);});var existing=currentRows(SHEETS.TEACHER_ASSIGNMENTS,config);Object.keys(groups).forEach(function(k){var items=groups[k],first=items[0];var all=items.filter(function(x){return x.cycleWeek==='ALL';}).length;var a=items.filter(function(x){return x.cycleWeek==='A';}).length;var b=items.filter(function(x){return x.cycleWeek==='B';}).length;var required=all+Math.max(a,b);var row=existing.filter(function(x){return x.teacherId===first.teacherId&&x.subjectId===first.subjectId&&x.classroomId===first.classroomId;})[0]||{};upsertObject(SHEETS.TEACHER_ASSIGNMENTS,{id:row.id||'TTA-'+Utilities.getUuid(),academicYearId:config.academicYearId,academicYearName:config.academicYearName,termId:config.termId,termName:config.termName,teacherId:first.teacherId,teacherCode:first.teacherCode,teacherName:first.teacherName,subjectId:first.subjectId,subjectName:first.subjectName,gradeId:first.gradeId,gradeName:first.gradeName,classroomId:first.classroomId,classroomName:first.classroomName,requiredPeriodsPerWeek:required,isActive:true,createdAt:row.createdAt||iso(new Date()),updatedAt:iso(new Date())});});existing.forEach(function(x){var k=[x.teacherId,x.subjectId,x.classroomId].join('|');if(!groups[k]&&truthy(x.isActive))updateById(SHEETS.TEACHER_ASSIGNMENTS,x.id,{isActive:false,updatedAt:iso(new Date())});});}
function deleteScheduleItem(id,session){var res=deleteById(SHEETS.SCHEDULE,id,session,'Schedule');syncTeacherAssignmentsFromSchedule(getScheduleConfig());return res;}
function getTeacherLoads(config){return listRows(SHEETS.EMPLOYEES).filter(function(e){return e.status==='Active'&&truthy(e.isTeacher);}).map(function(e){return teacherLoad(e.id,config);});}
function teacherLoad(teacherId,config,referenceDate){var assignments=currentRows(SHEETS.TEACHER_ASSIGNMENTS,config).filter(function(x){return x.teacherId===teacherId&&truthy(x.isActive);});var cycle=cycleForDate(referenceDate||dateOnly(new Date()),config);var schedule=currentRows(SHEETS.SCHEDULE,config).filter(function(x){return x.teacherId===teacherId&&x.status!=='Archived'&&(x.cycleWeek==='ALL'||x.cycleWeek===cycle);});var wb=weekBounds(referenceDate||dateOnly(new Date()),config.teacherLoadPolicy.weekStartsOn);var reserve=currentRows(SHEETS.RESERVE,config).filter(function(x){return x.substituteTeacherId===teacherId&&x.status!=='Cancelled'&&x.date>=wb.start&&x.date<=wb.end;});var allReserve=currentRows(SHEETS.RESERVE,config).filter(function(x){return x.substituteTeacherId===teacherId&&x.status!=='Cancelled';});var sup=currentRows(SHEETS.SUPERVISION,config).filter(function(x){return x.teacherId===teacherId&&x.status!=='Cancelled'&&x.date>=wb.start&&x.date<=wb.end;});var assigned=assignments.reduce(function(a,x){return a+Number(x.requiredPeriodsPerWeek||0);},0);var counted=schedule.length+(config.teacherLoadPolicy.reserveCountsTowardLoad?reserve.length:0)+(config.teacherLoadPolicy.supervisionCountsTowardLoad?sup.length:0);var max=Number(config.teacherLoadPolicy.weeklyPeriodLimit||30);var emp=findById(SHEETS.EMPLOYEES,teacherId)||{};return{teacherId:teacherId,teacherCode:emp.teacherCode||'',teacherName:emp.name||'',assignedPeriods:assigned,scheduledBasePeriods:schedule.length,reservePeriodsThisWeek:reserve.length,countedWeeklyPeriods:counted,supervisionCount:sup.length,remainingCapacity:Math.max(0,max-counted),historicalReserveCount:allReserve.length,status:counted>max?'OVERLOAD':counted===max?'FULL':counted>=max-2?'NEAR_LIMIT':'AVAILABLE'};}
function saveTeacherAvailability(a,session){if(!a||!a.teacherId||!a.dayOfWeek||!a.periodNumber)throw apiError('VALIDATION','بيانات الإتاحة غير مكتملة.');a.id=a.id||('AV-'+a.teacherId+'-'+a.dayOfWeek+'-'+a.periodNumber);upsertObject(SHEETS.TEACHER_AVAILABILITY,a);audit(session,'SAVE','TeacherAvailability',a.id,a.status);return a;}
function reserveCandidates(body){var config=getScheduleConfig();var teachers=listRows(SHEETS.EMPLOYEES).filter(function(e){return e.status==='Active'&&truthy(e.isTeacher)&&e.id!==body.absentTeacherId;});var assignments=currentRows(SHEETS.TEACHER_ASSIGNMENTS,config);return teachers.map(function(t){var load=teacherLoad(t.id,config,body.date);var conflict=reserveConflict(t.id,body.date,body.periodNumber,body.dayOfWeek||dayName(body.date),config);var same=assignments.some(function(a){return a.teacherId===t.id&&a.subjectName===body.subjectName&&truthy(a.isActive);});var eligible=!conflict&&load.remainingCapacity>0;var score=(same?100:0)+(load.remainingCapacity*5)-(load.reservePeriodsThisWeek*10)-(load.historicalReserveCount*.2);return{teacherId:t.id,teacherCode:t.teacherCode||'',teacherName:t.name,sameSubject:same,scheduledBasePeriods:load.scheduledBasePeriods,reserveThisWeek:load.reservePeriodsThisWeek,countedWeeklyPeriods:load.countedWeeklyPeriods,remainingCapacity:load.remainingCapacity,historicalReserveCount:load.historicalReserveCount,score:score,eligible:eligible,reason:conflict||(!load.remainingCapacity?'وصل للنصاب الأسبوعي':'')};}).sort(function(a,b){return Number(b.eligible)-Number(a.eligible)||b.score-a.score;});}
function reserveConflict(teacherId,date,period,day,config){var schedule=currentRows(SHEETS.SCHEDULE,config);var cycle=cycleForDate(date,config);if(schedule.some(function(x){return x.teacherId===teacherId&&x.dayOfWeek===day&&Number(x.periodNumber)===Number(period)&&x.status!=='Archived'&&(x.cycleWeek==='ALL'||x.cycleWeek===cycle);}))return 'لديه حصة في نفس الوقت';if(currentRows(SHEETS.RESERVE,config).some(function(x){return x.substituteTeacherId===teacherId&&x.date===date&&Number(x.periodNumber)===Number(period)&&x.status!=='Cancelled';}))return 'لديه احتياطي آخر';if(currentRows(SHEETS.SUPERVISION,config).some(function(x){return x.teacherId===teacherId&&x.date===date&&Number(x.periodNumber||-1)===Number(period)&&x.status!=='Cancelled';}))return 'لديه إشراف في نفس الحصة';if(listRows(SHEETS.TEACHER_AVAILABILITY).some(function(x){return x.teacherId===teacherId&&x.dayOfWeek===day&&Number(x.periodNumber)===Number(period)&&x.status==='Unavailable';}))return 'المعلم غير متاح في هذه الحصة';if(listRows(SHEETS.LEAVES).some(function(x){return x.employeeId===teacherId&&x.status==='Approved'&&x.startDate<=date&&x.endDate>=date;}))return 'المعلم في إجازة معتمدة';return '';}
function saveReserve(a,session){var config=getScheduleConfig();fillContext(a,config);var c=reserveConflict(a.substituteTeacherId,a.date,a.periodNumber,a.dayOfWeek,config);if(c)throw apiError('RESERVE_CONFLICT',c);var load=teacherLoad(a.substituteTeacherId,config,a.date);if(load.remainingCapacity<1)throw apiError('LOAD_LIMIT','لا يمكن تجاوز 30 حصة أسبوعياً.');a.id=a.id||'RES-'+Utilities.getUuid();a.status=a.status||'Scheduled';a.createdAt=a.createdAt||iso(new Date());a.updatedAt=iso(new Date());upsertObject(SHEETS.RESERVE,a);audit(session,'SAVE','Reserve',a.id,a.substituteTeacherName);return a;}
function saveSupervisionLocation(loc,session){if(!loc||!loc.name)throw apiError('VALIDATION','اسم موقع الإشراف مطلوب.');loc.id=loc.id||'SUPLOC-'+Utilities.getUuid();loc.code=loc.code||('L-'+String(Date.now()).slice(-4));loc.isActive=loc.isActive!==false;loc.sortOrder=Number(loc.sortOrder||99);upsertObject(SHEETS.SUPERVISION_LOCATIONS,loc);audit(session,'SAVE','SupervisionLocation',loc.id,loc.name);return loc;}
function saveSupervision(a,session){var config=getScheduleConfig();fillContext(a,config);if(a.periodNumber){var c=reserveConflict(a.teacherId,a.date,a.periodNumber,a.dayOfWeek,config);if(c)throw apiError('SUPERVISION_CONFLICT',c);}var duplicate=currentRows(SHEETS.SUPERVISION,config).some(function(x){return x.id!==a.id&&x.teacherId===a.teacherId&&x.date===a.date&&x.shift===a.shift&&x.status!=='Cancelled';});if(duplicate)throw apiError('SUPERVISION_CONFLICT','المعلم لديه إشراف آخر في نفس الفترة.');a.id=a.id||'SUP-'+Utilities.getUuid();a.status=a.status||'Scheduled';a.createdAt=a.createdAt||iso(new Date());a.updatedAt=iso(new Date());upsertObject(SHEETS.SUPERVISION,a);audit(session,'SAVE','Supervision',a.id,a.teacherName);return a;}
function saveExam(e,session){var c=getScheduleConfig();fillContext(e,c);e.id=e.id||'EXM-'+Utilities.getUuid();e.createdAt=e.createdAt||iso(new Date());e.updatedAt=iso(new Date());upsertObject(SHEETS.EXAMS,e);audit(session,'SAVE','Exam',e.id,e.subjectName);return e;}
function saveScheduleConfig(config,session){if(!config||!config.teacherLoadPolicy)throw apiError('VALIDATION','إعدادات الجدول غير صالحة.');setSetting('scheduleConfig',config);audit(session,'SAVE','ScheduleConfig','scheduleConfig','');return config;}
function getCurriculumCoverage(config){var req=currentRows(SHEETS.CURRICULUM,config).filter(function(x){return truthy(x.isActive);});var sch=currentRows(SHEETS.SCHEDULE,config).filter(function(x){return x.status!=='Archived';});return listRows(SHEETS.CLASSROOMS).filter(function(c){return truthy(c.isActive);}).map(function(cls){var rr=req.filter(function(x){return x.gradeId===cls.gradeId;});var rows=rr.map(function(r){var count=sch.filter(function(s){return s.classroomId===cls.id&&s.subjectId===r.subjectId&&(r.cycleWeek==='ALL'?s.cycleWeek==='ALL':(s.cycleWeek==='ALL'||s.cycleWeek===r.cycleWeek));}).length;var required=Number(r.requiredPeriodsPerWeek||0);return{subjectId:r.subjectId,subjectName:r.subjectName,required:required,scheduled:count,difference:count-required,status:count===required?'COMPLETE':count<required?'DEFICIT':'SURPLUS',cycleWeek:r.cycleWeek};});var weekA=sch.filter(function(s){return s.classroomId===cls.id&&(s.cycleWeek==='ALL'||s.cycleWeek==='A');}).length;var weekB=sch.filter(function(s){return s.classroomId===cls.id&&(s.cycleWeek==='ALL'||s.cycleWeek==='B');}).length;var totalReq=39;var diff=Math.min(weekA,weekB)-totalReq;var complete=weekA===39&&weekB===39&&rows.every(function(x){return x.status==='COMPLETE';});return{classroomId:cls.id,classroomName:cls.name,gradeId:cls.gradeId,gradeName:cls.gradeName,totalRequired:totalReq,totalScheduled:Math.min(weekA,weekB),weekAScheduled:weekA,weekBScheduled:weekB,difference:diff,status:complete?'COMPLETE':(weekA<39||weekB<39?'DEFICIT':'SURPLUS'),rows:rows};});}
function detectAllConflicts(){var config=getScheduleConfig();var rows=currentRows(SHEETS.SCHEDULE,config).filter(function(x){return x.status!=='Archived';});var out=[];rows.forEach(function(a,i){rows.slice(i+1).forEach(function(b){if(a.dayOfWeek===b.dayOfWeek&&Number(a.periodNumber)===Number(b.periodNumber)&&cycleOverlap(a.cycleWeek,b.cycleWeek)){if(a.teacherId===b.teacherId||a.classroomId===b.classroomId||(a.roomName&&b.roomName&&a.roomName===b.roomName))out.push(a.id+'|'+b.id);}});});return out;}

// Import
function validateScheduleImport(rows){var config=getScheduleConfig();var teachers=indexBy(listRows(SHEETS.EMPLOYEES).filter(function(e){return truthy(e.isTeacher);}).map(function(e){return{key:String(e.teacherCode).toUpperCase(),value:e};}),'key',true);var classrooms=indexBy(listRows(SHEETS.CLASSROOMS),'name');var subjects=indexBy(listRows(SHEETS.SUBJECTS),'name');var existing=currentRows(SHEETS.SCHEDULE,config);var result=(rows||[]).map(function(r){var errors=[];var warnings=[];if(config.studyDays.indexOf(r.dayOfWeek)<0)errors.push('يوم غير معتمد');if(!config.periods.some(function(p){return Number(p.periodNumber)===Number(r.periodNumber);}))errors.push('رقم حصة غير معتمد');if(!teachers[String(r.teacherCode||'').toUpperCase()])errors.push('كود المعلم غير معروف');if(!classrooms[r.classroomName])errors.push('الفصل غير معروف');if(!subjects[r.subjectName])errors.push('المادة غير معروفة');var dup=existing.some(function(x){return x.dayOfWeek===r.dayOfWeek&&Number(x.periodNumber)===Number(r.periodNumber)&&x.classroomName===r.classroomName&&cycleOverlap(x.cycleWeek,r.cycleWeek);});if(dup)warnings.push('يوجد صف مماثل وسيتم تخطيه عند الاعتماد');return merge(r,{valid:errors.length===0,errors:errors,warnings:warnings});});return{totalRows:result.length,validRows:result.filter(function(x){return x.valid;}).length,invalidRows:result.filter(function(x){return !x.valid;}).length,rows:result};}
function commitScheduleImport(rows,session){var v=validateScheduleImport(rows);if(v.invalidRows)throw apiError('IMPORT_INVALID','يوجد صفوف غير صالحة.');var config=getScheduleConfig();var teachers={};listRows(SHEETS.EMPLOYEES).forEach(function(e){teachers[String(e.teacherCode).toUpperCase()]=e;});var classrooms=indexBy(listRows(SHEETS.CLASSROOMS),'name');var subjects=indexBy(listRows(SHEETS.SUBJECTS),'name');var saved=0,skipped=0;v.rows.forEach(function(r){var exists=currentRows(SHEETS.SCHEDULE,config).some(function(x){return x.dayOfWeek===r.dayOfWeek&&Number(x.periodNumber)===Number(r.periodNumber)&&x.classroomName===r.classroomName&&cycleOverlap(x.cycleWeek,r.cycleWeek);});if(exists){skipped++;return;}var t=teachers[String(r.teacherCode).toUpperCase()],c=classrooms[r.classroomName],s=subjects[r.subjectName],p=config.periods.filter(function(x){return Number(x.periodNumber)===Number(r.periodNumber);})[0];saveScheduleItem({id:'SCH-'+Utilities.getUuid(),dayOfWeek:r.dayOfWeek,periodNumber:r.periodNumber,startTime:p.startTime,endTime:p.endTime,gradeId:c.gradeId,gradeName:c.gradeName,classroomId:c.id,classroomName:c.name,subjectId:s.id,subjectName:s.name,teacherId:t.id,teacherName:t.name,teacherCode:t.teacherCode,roomName:r.roomName||'',cycleWeek:r.cycleWeek||'ALL',status:'Draft',isLocked:false},session);saved++;});audit(session,'IMPORT','Schedule','',saved+' saved, '+skipped+' skipped');return{saved:saved,skipped:skipped};}

// -----------------------------------------------------------------------------
// Teacher portal
// -----------------------------------------------------------------------------
function teacherPortalData(session){var config=getScheduleConfig();var tid=session.user.employeeId;var assignments=currentRows(SHEETS.TEACHER_ASSIGNMENTS,config).filter(function(x){return x.teacherId===tid&&truthy(x.isActive);});var scope={};assignments.forEach(function(a){scope[a.subjectId+'|'+a.classroomId]=true;});return{teacher:findById(SHEETS.EMPLOYEES,tid),schedule:currentRows(SHEETS.SCHEDULE,config).filter(function(x){var cy=cycleForDate(dateOnly(new Date()),config);return x.teacherId===tid&&x.status==='Published'&&(x.cycleWeek==='ALL'||x.cycleWeek===cy);}),assignments:assignments,load:teacherLoad(tid,config),homework:currentRows(SHEETS.HOMEWORK,config).filter(function(x){return x.teacherId===tid;}),resources:currentRows(SHEETS.RESOURCES,config).filter(function(x){return x.teacherId===tid;}),exams:currentRows(SHEETS.EXAMS,config).filter(function(x){return x.status==='Published'&&(!x.classroomId||scope[x.subjectId+'|'+x.classroomId]);})};}
function teacherSaveHomework(hw,session){var config=getScheduleConfig();var tid=session.user.employeeId;verifyTeacherScope(tid,hw.subjectId,hw.classroomId,config);fillContext(hw,config);hw.id=hw.id||'HW-'+Utilities.getUuid();hw.teacherId=tid;hw.assignedDate=hw.assignedDate||dateOnly(new Date());hw.status=hw.status==='Published'?'Published':'Draft';hw.createdAt=hw.createdAt||iso(new Date());hw.updatedAt=iso(new Date());upsertObject(SHEETS.HOMEWORK,hw);audit(session,'SAVE','Homework',hw.id,hw.title);return hw;}
function teacherSaveResource(r,session){var config=getScheduleConfig();var tid=session.user.employeeId;verifyTeacherScope(tid,r.subjectId,r.classroomId,config);fillContext(r,config);r.id=r.id||'RES-'+Utilities.getUuid();r.teacherId=tid;r.visibility=r.visibility==='Published'?'Published':'Draft';r.createdAt=r.createdAt||iso(new Date());r.updatedAt=iso(new Date());upsertObject(SHEETS.RESOURCES,r);audit(session,'SAVE','Resource',r.id,r.title);return r;}
function verifyTeacherScope(tid,subjectId,classroomId,config){var ok=currentRows(SHEETS.TEACHER_ASSIGNMENTS,config).some(function(a){return a.teacherId===tid&&a.subjectId===subjectId&&a.classroomId===classroomId&&truthy(a.isActive);});if(!ok)throw apiError('TEACHER_SCOPE','المعلم غير مسند لهذه المادة والفصل.');}

// -----------------------------------------------------------------------------
// Student public token
// -----------------------------------------------------------------------------
function createStudentAccessToken(studentId,session){var student=findById(SHEETS.STUDENTS,studentId);if(!student)throw apiError('NOT_FOUND','الطالب غير موجود.');listRows(SHEETS.STUDENT_TOKENS).filter(function(x){return x.studentId===studentId&&!x.revokedAt;}).forEach(function(x){updateById(SHEETS.STUDENT_TOKENS,x.id,{revokedAt:iso(new Date())});});var token='STK-'+randomToken();var exp=new Date(Date.now()+180*24*3600000);appendObject(SHEETS.STUDENT_TOKENS,{id:'STKREC-'+Utilities.getUuid(),studentId:studentId,tokenHash:sha256(token),createdAt:iso(new Date()),expiresAt:iso(exp),revokedAt:'',createdBy:session.user.id});audit(session,'ROTATE_TOKEN','Student',studentId,'');return{token:token,expiresAt:iso(exp)};}
function studentPublicData(token){if(!token)throw apiError('TOKEN_REQUIRED','رمز الوصول مطلوب.');var h=sha256(String(token));var rec=listRows(SHEETS.STUDENT_TOKENS).filter(function(x){return x.tokenHash===h&&!x.revokedAt;})[0];if(!rec||new Date(rec.expiresAt).getTime()<Date.now())throw apiError('TOKEN_INVALID','الرابط غير صالح أو منتهي.');var s=findById(SHEETS.STUDENTS,rec.studentId);if(!s||s.status!=='Active')throw apiError('STUDENT_INACTIVE','الطالب غير نشط.');var config=getScheduleConfig();return{student:{id:s.id,studentCode:s.studentCode,name:s.name,gradeName:s.gradeName,classroomName:s.classroomName},schedule:currentRows(SHEETS.SCHEDULE,config).filter(function(x){var cy=cycleForDate(dateOnly(new Date()),config);return x.classroomId===s.classroomId&&x.status==='Published'&&(x.cycleWeek==='ALL'||x.cycleWeek===cy);}),homework:currentRows(SHEETS.HOMEWORK,config).filter(function(x){return x.classroomId===s.classroomId&&x.status==='Published';}),resources:currentRows(SHEETS.RESOURCES,config).filter(function(x){return x.classroomId===s.classroomId&&x.visibility==='Published';}).map(function(x){return{id:x.id,academicYearId:x.academicYearId,academicYearName:x.academicYearName,termId:x.termId,termName:x.termName,teacherId:'',subjectId:x.subjectId,subjectName:x.subjectName,classroomId:x.classroomId,classroomName:x.classroomName,title:x.title,presentationUrl:x.presentationUrl||'',studentResourceUrl:x.studentResourceUrl||'',visibility:'Published'};}),exams:currentRows(SHEETS.EXAMS,config).filter(function(x){return x.status==='Published'&&(!x.classroomId||x.classroomId===s.classroomId)&&x.gradeId===s.gradeId;})};}

// -----------------------------------------------------------------------------
// Sheet helpers / security helpers
// -----------------------------------------------------------------------------
function getScheduleConfig(){return getSetting('scheduleConfig');}
function getSetting(key){var r=listRows(SHEETS.SETTINGS).filter(function(x){return x.key===key;})[0];if(!r)return null;try{return JSON.parse(r.value);}catch(e){return r.value;}}
function setSetting(key,value){upsertObjectByKey(SHEETS.SETTINGS,'key',{key:key,value:JSON.stringify(value),updatedAt:iso(new Date())});}
function fillContext(obj,config){obj.academicYearId=config.academicYearId;obj.academicYearName=config.academicYearName;obj.termId=config.termId;obj.termName=config.termName;}
function currentRows(sheet,config){return listRows(sheet).filter(function(x){return (!x.academicYearId||x.academicYearId===config.academicYearId)&&(!x.termId||x.termId===config.termId);});}
function ensureSheet(name,headers){var ss=SpreadsheetApp.getActive();var sh=ss.getSheetByName(name);if(!sh)sh=ss.insertSheet(name);if(sh.getLastRow()===0)sh.appendRow(headers);else{var current=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];if(current.join('|')!==headers.join('|')){sh.getRange(1,1,1,headers.length).setValues([headers]);}}return sh;}
function sheet(name){return ensureSheet(name,HEADERS[name]);}
function listRows(name){var sh=sheet(name),last=sh.getLastRow();if(last<2)return[];var headers=HEADERS[name],values=sh.getRange(2,1,last-1,headers.length).getValues();return values.map(function(row){var o={};headers.forEach(function(h,i){o[h]=normalizeCell(row[i]);});return o;});}
function appendObject(name,obj){var headers=HEADERS[name],row=headers.map(function(h){return cellValue(obj[h]);});sheet(name).appendRow(row);}
function upsertObject(name,obj){return upsertObjectByKey(name,'id',obj);}
function upsertObjectByKey(name,key,obj){var sh=sheet(name),headers=HEADERS[name],idx=headers.indexOf(key),last=sh.getLastRow();if(last>=2){var vals=sh.getRange(2,idx+1,last-1,1).getValues();for(var i=0;i<vals.length;i++){if(String(vals[i][0])===String(obj[key])){var existing={};headers.forEach(function(h,j){existing[h]=normalizeCell(sh.getRange(i+2,j+1).getValue());});var merged=merge(existing,obj);sh.getRange(i+2,1,1,headers.length).setValues([headers.map(function(h){return cellValue(merged[h]);})]);return merged;}}}appendObject(name,obj);return obj;}
function updateById(name,id,patch){return updateFirst(name,function(x){return String(x.id)===String(id);},patch);}
function updateFirst(name,predicate,patch){var sh=sheet(name),headers=HEADERS[name],rows=listRows(name);for(var i=0;i<rows.length;i++){if(predicate(rows[i])){var m=merge(rows[i],patch);sh.getRange(i+2,1,1,headers.length).setValues([headers.map(function(h){return cellValue(m[h]);})]);return m;}}return null;}
function deleteById(name,id,session,entity){var sh=sheet(name),rows=listRows(name);for(var i=0;i<rows.length;i++){if(String(rows[i].id)===String(id)){sh.deleteRow(i+2);audit(session,'DELETE',entity||name,id,'');return{deleted:true};}}return{deleted:false};}
function cancelById(name,id,session){var r=updateById(name,id,{status:'Cancelled',updatedAt:iso(new Date())});if(r)audit(session,'CANCEL',name,id,'');return r||{cancelled:false};}
function findById(name,id){return listRows(name).filter(function(x){return String(x.id)===String(id);})[0]||null;}
function indexBy(rows,key,alreadyKeyed){var o={};rows.forEach(function(r){if(alreadyKeyed)o[r.key]=r.value;else o[r[key]]=r;});return o;}
function merge(a,b){var o={};Object.keys(a||{}).forEach(function(k){o[k]=a[k];});Object.keys(b||{}).forEach(function(k){if(b[k]!==undefined)o[k]=b[k];});return o;}
function normalizeCell(v){if(v instanceof Date)return iso(v);return v;}
function cellValue(v){if(v===undefined||v===null)return'';if(typeof v==='boolean')return v;if(typeof v==='object')return JSON.stringify(v);return v;}
function truthy(v){return v===true||String(v).toLowerCase()==='true'||String(v)==='1';}
function audit(session,action,entity,id,details){appendObject(SHEETS.AUDIT,{id:'AUD-'+Utilities.getUuid(),timestamp:iso(new Date()),actorId:session&&session.user?session.user.id:'SYSTEM',actorRole:session&&session.user?session.user.role:'SYSTEM',action:action,entity:entity,entityId:id||'',details:details||''});}
function nextTeacherCode(){var max=0;listRows(SHEETS.EMPLOYEES).forEach(function(e){var m=String(e.teacherCode||'').match(/^T-(\d+)$/);if(m)max=Math.max(max,Number(m[1]));});return'T-'+String(max+1).padStart(3,'0');}
function hashSecret(secret,salt){var v=String(secret)+'|'+String(salt);for(var i=0;i<HASH_ROUNDS;i++)v=sha256(v);return v;}
function sha256(text){var bytes=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,String(text),Utilities.Charset.UTF_8);return bytes.map(function(b){var x=b<0?b+256:b;return('0'+x.toString(16)).slice(-2);}).join('');}
function randomSalt(){return Utilities.getUuid().replace(/-/g,'');}
function randomToken(){return Utilities.getUuid().replace(/-/g,'')+Utilities.getUuid().replace(/-/g,'');}
function iso(d){return Utilities.formatDate(d,TZ,"yyyy-MM-dd'T'HH:mm:ssXXX");}
function dateOnly(d){return Utilities.formatDate(d,TZ,'yyyy-MM-dd');}
function dayName(dateIso){var d=new Date(dateIso+'T12:00:00');return ['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'][d.getDay()];}
function weekBounds(dateIso,startDay){var d=new Date(dateIso+'T12:00:00'),diff=(d.getDay()-Number(startDay||0)+7)%7;d.setDate(d.getDate()-diff);var e=new Date(d);e.setDate(d.getDate()+6);return{start:dateOnly(d),end:dateOnly(e)};}
function reserveInWeek(){var c=getScheduleConfig(),b=weekBounds(dateOnly(new Date()),c.teacherLoadPolicy.weekStartsOn);return currentRows(SHEETS.RESERVE,c).filter(function(x){return x.status!=='Cancelled'&&x.date>=b.start&&x.date<=b.end;});}
function cycleOverlap(a,b){a=a||'ALL';b=b||'ALL';return a==='ALL'||b==='ALL'||a===b;}
function overlapsBreak(start,end,breaks){return (breaks||[]).filter(function(b){return truthy(b.isActive);}).some(function(b){return start<b.endTime&&end>b.startTime;});}
function cycleForDate(dateIso,config){var anchor=new Date((config.cycleAnchorDate||dateIso)+'T12:00:00');var d=new Date(dateIso+'T12:00:00');var weeks=Math.floor((d.getTime()-anchor.getTime())/(7*24*3600000));return ((weeks%2)+2)%2===0?'A':'B';}
function apiError(code,message){var e=new Error(message);e.code=code;return e;}
function jsonOk(data){return ContentService.createTextOutput(JSON.stringify({ok:true,data:data})).setMimeType(ContentService.MimeType.JSON);}
function jsonError(code,message){return ContentService.createTextOutput(JSON.stringify({ok:false,code:code,message:message})).setMimeType(ContentService.MimeType.JSON);}
function rateLimit(key){var c=CacheService.getScriptCache(),raw=c.get('rl:'+key),n=raw?Number(raw):0;if(n>=5)throw apiError('RATE_LIMIT','محاولات كثيرة. حاول بعد 10 دقائق.');c.put('rl:'+key,String(n+1),600);}
function clearRateLimit(key){CacheService.getScriptCache().remove('rl:'+key);}

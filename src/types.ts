export type StaffRole =
  | 'Admin'
  | 'SchoolDirector'
  | 'StudentAffairs'
  | 'TeacherAffairs'
  | 'HR'
  | 'SocialSpecialist'
  | 'QualityOfficer'
  | 'Viewer';

export type SessionRole = StaffRole | 'TeacherPortal';

export interface SessionUser {
  id: string;
  username?: string;
  fullName: string;
  role: SessionRole;
  employeeId?: string;
  teacherCode?: string;
}

export interface SessionState {
  token: string;
  user: SessionUser;
}

export interface ApiResponse<T = unknown> {
  ok: boolean;
  data?: T;
  message?: string;
  code?: string;
}

export interface Student {
  id: string;
  studentCode: string;
  name: string;
  gradeId: string;
  gradeName: string;
  classroomId: string;
  classroomName: string;
  status: 'Active' | 'Inactive' | 'Graduated' | 'Transferred';
  parentName?: string;
  parentPhone?: string;
  nationalId?: string;
}

export interface Employee {
  id: string;
  employeeCode: string;
  name: string;
  jobTitle: string;
  department: string;
  status: 'Active' | 'Inactive';
  isTeacher: boolean;
  teacherCode?: string;
  phone?: string;
  email?: string;
}

export type AttendanceStatus = 'Present' | 'Late' | 'AbsentExcused' | 'AbsentUnexcused' | 'Permission';

export interface StudentAttendanceRecord {
  id: string;
  studentId: string;
  date: string;
  status: AttendanceStatus;
  lateMinutes?: number;
  notes?: string;
}

export interface AcademicContext {
  academicYearId: string;
  academicYearName: string;
  termId: string;
  termName: string;
}

export interface PeriodSlot {
  periodNumber: number;
  startTime: string;
  endTime: string;
}

export interface ScheduleBreak {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  sortOrder: number;
}

export interface TeacherLoadPolicy {
  weeklyMinutesLimit: number;
  defaultPeriodMinutes: number;
  weeklyPeriodLimit: number;
  weekStartsOn: number;
  reserveCountsTowardLoad: boolean;
  supervisionCountsTowardLoad: boolean;
}

export interface ScheduleConfig extends AcademicContext {
  studyDays: string[];
  periods: PeriodSlot[];
  breaks: ScheduleBreak[];
  teacherLoadPolicy: TeacherLoadPolicy;
  cycleAnchorDate: string;
}

export type CycleWeek = 'ALL' | 'A' | 'B';
export type TimetableStatus = 'Draft' | 'UnderReview' | 'Approved' | 'Published' | 'Archived';

export interface ScheduleItem extends AcademicContext {
  id: string;
  dayOfWeek: string;
  periodNumber: number;
  startTime: string;
  endTime: string;
  gradeId: string;
  gradeName: string;
  classroomId: string;
  classroomName: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  teacherCode: string;
  roomId?: string;
  roomName?: string;
  cycleWeek: CycleWeek;
  status: TimetableStatus;
  isLocked: boolean;
}


export interface TeacherAvailability {
  id: string;
  teacherId: string;
  dayOfWeek: string;
  periodNumber: number;
  status: 'Available' | 'Unavailable' | 'Preferred';
}

export interface TeacherTeachingAssignment extends AcademicContext {
  id: string;
  teacherId: string;
  teacherCode: string;
  teacherName: string;
  subjectId: string;
  subjectName: string;
  gradeId: string;
  gradeName: string;
  classroomId: string;
  classroomName: string;
  requiredPeriodsPerWeek: number;
  isActive: boolean;
}

export interface TeacherLoadSummary {
  teacherId: string;
  teacherCode: string;
  teacherName: string;
  assignedPeriods: number;
  scheduledBasePeriods: number;
  reservePeriodsThisWeek: number;
  countedWeeklyPeriods: number;
  supervisionCount: number;
  remainingCapacity: number;
  historicalReserveCount: number;
  status: 'AVAILABLE' | 'NEAR_LIMIT' | 'FULL' | 'OVERLOAD';
}

export interface ReserveCandidate {
  teacherId: string;
  teacherCode: string;
  teacherName: string;
  sameSubject: boolean;
  scheduledBasePeriods: number;
  reserveThisWeek: number;
  countedWeeklyPeriods: number;
  remainingCapacity: number;
  historicalReserveCount: number;
  score: number;
  eligible: boolean;
  reason?: string;
}

export type ReserveStatus = 'Scheduled' | 'Completed' | 'Cancelled';

export interface ReserveAssignment extends AcademicContext {
  id: string;
  date: string;
  dayOfWeek: string;
  periodNumber: number;
  classroomId: string;
  classroomName: string;
  subjectId: string;
  subjectName: string;
  originalTeacherId: string;
  originalTeacherName: string;
  substituteTeacherId: string;
  substituteTeacherName: string;
  reason: string;
  status: ReserveStatus;
}

export interface SupervisionLocation {
  id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
}

export type SupervisionStatus = 'Scheduled' | 'Completed' | 'Cancelled';

export interface SupervisionAssignment extends AcademicContext {
  id: string;
  date: string;
  dayOfWeek: string;
  periodNumber?: number;
  timeSlot?: string;
  locationId: string;
  locationName: string;
  teacherId: string;
  teacherName: string;
  teacherCode: string;
  shift: string;
  status: SupervisionStatus;
}

export interface ExamSchedule extends AcademicContext {
  id: string;
  examType: 'Quiz' | 'Midterm' | 'Final' | 'Practical' | 'Oral';
  subjectId: string;
  subjectName: string;
  gradeId: string;
  gradeName: string;
  classroomId?: string;
  classroomName?: string;
  examDate: string;
  startTime: string;
  durationMinutes: number;
  roomName?: string;
  instructions?: string;
  status: 'Draft' | 'Approved' | 'Published' | 'Cancelled';
}

export interface Homework extends AcademicContext {
  id: string;
  teacherId: string;
  subjectId: string;
  subjectName: string;
  gradeId: string;
  gradeName: string;
  classroomId: string;
  classroomName: string;
  title: string;
  description?: string;
  assignedDate: string;
  dueDate: string;
  resourceUrl?: string;
  status: 'Draft' | 'Published' | 'Archived';
}

export interface TeacherLessonResource extends AcademicContext {
  id: string;
  teacherId: string;
  subjectId: string;
  subjectName: string;
  classroomId: string;
  classroomName: string;
  title: string;
  preparationUrl?: string;
  presentationUrl?: string;
  studentResourceUrl?: string;
  visibility: 'Draft' | 'Published';
}

export interface CurriculumRequirement extends AcademicContext {
  id: string;
  curriculumVersionId: string;
  gradeId: string;
  gradeName: string;
  subjectId: string;
  subjectName: string;
  requiredPeriodsPerWeek: number;
  cycleWeek: CycleWeek;
  cycleLengthWeeks: 1 | 2;
  isActive: boolean;
}

export interface CurriculumCoverageRow {
  subjectId: string;
  subjectName: string;
  required: number;
  scheduled: number;
  difference: number;
  status: 'COMPLETE' | 'DEFICIT' | 'SURPLUS';
  cycleWeek: CycleWeek;
}

export interface CurriculumCoverageReport {
  classroomId: string;
  classroomName: string;
  gradeId: string;
  gradeName: string;
  totalRequired: number;
  totalScheduled: number;
  weekAScheduled?: number;
  weekBScheduled?: number;
  difference: number;
  status: 'COMPLETE' | 'DEFICIT' | 'SURPLUS';
  rows: CurriculumCoverageRow[];
}

export interface TimetableBootstrap {
  config: ScheduleConfig;
  schedule: ScheduleItem[];
  employees: Employee[];
  assignments: TeacherTeachingAssignment[];
  availability: TeacherAvailability[];
  teacherLoads: TeacherLoadSummary[];
  reserves: ReserveAssignment[];
  supervisionLocations: SupervisionLocation[];
  supervisions: SupervisionAssignment[];
  exams: ExamSchedule[];
  curriculumCoverage: CurriculumCoverageReport[];
}


export interface BehaviorViolation {
  id: string;
  studentId: string;
  studentName: string;
  date: string;
  type: string;
  severity: 'Low' | 'Medium' | 'High';
  points: number;
  notes?: string;
  status: 'Open' | 'Closed';
  createdBy?: string;
}

export interface ParentCommunication {
  id: string;
  studentId: string;
  studentName: string;
  date: string;
  type: 'Call' | 'WhatsApp' | 'Meeting' | 'Email' | 'Other';
  reason: string;
  details: string;
  result?: string;
  recordedBy?: string;
}

export interface StaffAttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  status: 'Present' | 'Late' | 'Absent' | 'Leave' | 'Permission';
  checkIn?: string;
  checkOut?: string;
  lateMinutes?: number;
  notes?: string;
}

export interface LeaveRecord {
  id: string;
  employeeId: string;
  startDate: string;
  endDate: string;
  type: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
  notes?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actorId: string;
  actorRole: string;
  action: string;
  entity: string;
  entityId: string;
  details?: string;
}

export interface DashboardData {
  students: number;
  employees: number;
  teachers: number;
  absentStudentsToday: number;
  lateStudentsToday: number;
  timetableConflicts: number;
  reserveAssignmentsThisWeek: number;
}

export interface TeacherPortalData {
  teacher: Employee;
  schedule: ScheduleItem[];
  assignments: TeacherTeachingAssignment[];
  load: TeacherLoadSummary;
  homework: Homework[];
  resources: TeacherLessonResource[];
  exams: ExamSchedule[];
}

export interface StudentPublicData {
  student: Pick<Student, 'id' | 'studentCode' | 'name' | 'gradeName' | 'classroomName'>;
  schedule: ScheduleItem[];
  homework: Homework[];
  resources: TeacherLessonResource[];
  exams: ExamSchedule[];
}

export interface ScheduleImportRow {
  rowNumber: number;
  dayOfWeek: string;
  periodNumber: number;
  gradeName: string;
  classroomName: string;
  subjectName: string;
  teacherCode: string;
  teacherName?: string;
  roomName?: string;
  cycleWeek: CycleWeek;
}

export interface ScheduleImportValidationRow extends ScheduleImportRow {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ScheduleImportValidation {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  rows: ScheduleImportValidationRow[];
}

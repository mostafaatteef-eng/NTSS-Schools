export const SCHOOL_DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];

export function todayCairo(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Cairo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const map = Object.fromEntries(parts.map(p => [p.type, p.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

export function arabicDayName(dateIso: string): string {
  const date = new Date(`${dateIso}T12:00:00+03:00`);
  return new Intl.DateTimeFormat('ar-EG', { weekday: 'long', timeZone: 'Africa/Cairo' }).format(date);
}

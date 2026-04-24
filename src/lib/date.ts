import { DEFAULT_WORK_END, DEFAULT_WORK_START, SHORT_WEEKDAY_LABELS, WEEKDAY_LABELS } from '../types';

const MINUTES_PER_DAY = 24 * 60;

export function createLocalDate(dateInput: string): Date {
  const [year, month, day] = dateInput.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function toTimeInputValue(minutes: number): string {
  const normalized = Math.max(0, Math.min(MINUTES_PER_DAY - 1, Math.round(minutes)));
  const hour = String(Math.floor(normalized / 60)).padStart(2, '0');
  const minute = String(normalized % 60).padStart(2, '0');
  return `${hour}:${minute}`;
}

export function timeStringToMinutes(value: string): number {
  const [hour, minute] = value.split(':').map(Number);
  return hour * 60 + minute;
}

export function minutesToTimeLabel(minutes: number): string {
  const normalized = ((minutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const hour24 = Math.floor(normalized / 60);
  const minute = normalized % 60;
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  const suffix = hour24 >= 12 ? 'PM' : 'AM';
  return `${hour12}:${String(minute).padStart(2, '0')} ${suffix}`;
}

export function formatDateLabel(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  }).format(date);
}

export function formatWeekRange(weekDates: Date[]): string {
  if (weekDates.length === 0) {
    return '';
  }

  const first = weekDates[0];
  const last = weekDates[weekDates.length - 1];
  const firstMonth = first.toLocaleDateString('en-US', { month: 'short' });
  const lastMonth = last.toLocaleDateString('en-US', { month: 'short' });

  if (first.getMonth() === last.getMonth()) {
    return `${firstMonth} ${first.getDate()} - ${last.getDate()}, ${last.getFullYear()}`;
  }

  return `${firstMonth} ${first.getDate()} - ${lastMonth} ${last.getDate()}, ${last.getFullYear()}`;
}

export function startOfWeek(date: Date): Date {
  const copy = new Date(date);
  const day = copy.getDay();
  const mondayOffset = day === 0 ? 6 : day - 1;
  copy.setDate(copy.getDate() - mondayOffset);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function enumerateWeekDates(date: Date): Date[] {
  const firstDay = startOfWeek(date);
  return Array.from({ length: 7 }, (_, index) => addDays(firstDay, index));
}

export function sameCalendarDate(left: Date, right: Date): boolean {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate();
}

export function differenceInCalendarDays(left: Date, right: Date): number {
  const utcLeft = Date.UTC(left.getFullYear(), left.getMonth(), left.getDate());
  const utcRight = Date.UTC(right.getFullYear(), right.getMonth(), right.getDate());
  return Math.floor((utcRight - utcLeft) / (1000 * 60 * 60 * 24));
}

export function formatWeekday(date: Date): string {
  return WEEKDAY_LABELS[date.getDay()];
}

export function formatShortWeekday(date: Date): string {
  return SHORT_WEEKDAY_LABELS[date.getDay()];
}

export function clampMinutes(minutes: number): number {
  return Math.max(DEFAULT_WORK_START, Math.min(DEFAULT_WORK_END, minutes));
}

export function minutesToSegmentLabel(start: number, end: number): string {
  return `${minutesToTimeLabel(start)} – ${minutesToTimeLabel(end)}`;
}

export function isValidDateInput(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function createTodayInputValue(): string {
  return toDateInputValue(new Date());
}
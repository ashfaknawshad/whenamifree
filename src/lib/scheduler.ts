import {
  DEFAULT_WORK_END,
  DEFAULT_WORK_START,
  DayAvailability,
  ScheduleEvent,
  TimeInterval
} from '../types';
import {
  addDays,
  clampMinutes,
  createLocalDate,
  differenceInCalendarDays,
  enumerateWeekDates,
  formatDateLabel,
  sameCalendarDate,
  timeStringToMinutes,
  toDateInputValue
} from './date';

type EventOccurrence = {
  id: string;
  title: string;
  label: string;
  date: string;
  start: number;
  end: number;
};

export function calculateDayAvailability(date: Date, events: ScheduleEvent[]): DayAvailability {
  const busy = eventsToOccurrencesForDate(date, events)
    .map(({ start, end }) => ({ start: clampMinutes(start), end: clampMinutes(end) }))
    .filter((interval) => interval.end > interval.start)
    .sort((left, right) => left.start - right.start);

  const mergedBusy = mergeIntervals(busy);
  const free = buildFreeIntervals(mergedBusy);

  return {
    date: toDateInputValue(date),
    label: formatDateLabel(date),
    busy: mergedBusy,
    free
  };
}

export function calculateWeekAvailability(date: Date, events: ScheduleEvent[]): DayAvailability[] {
  return enumerateWeekDates(date).map((day) => calculateDayAvailability(day, events));
}

export function buildFreeTimeText(weekAvailability: DayAvailability[]): string {
  const lines = weekAvailability.map((day) => {
    const slots = day.free.length
      ? day.free.map((interval) => `${formatMinutes(interval.start)} - ${formatMinutes(interval.end)}`).join(', ')
      : 'No free time';

    return `${day.label}: ${slots}`;
  });

  return ['My free time slots:', ...lines].join('\n');
}

export function buildWeeklyGridSvg(weekDates: Date[], weekAvailability: DayAvailability[]): string {
  const dayColumnWidth = 150;
  const hourRowHeight = 34;
  const headerHeight = 110;
  const leftGutter = 80;
  const gridWidth = leftGutter + weekDates.length * dayColumnWidth + 32;
  const gridHeight = headerHeight + ((DEFAULT_WORK_END - DEFAULT_WORK_START) / 60) * hourRowHeight + 48;
  const title = `Free Schedule - ${weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} to ${weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  const cells: string[] = [];

  for (let columnIndex = 0; columnIndex < weekDates.length; columnIndex += 1) {
    const day = weekDates[columnIndex];
    const availability = weekAvailability[columnIndex];
    const x = leftGutter + columnIndex * dayColumnWidth;

    cells.push(`<text x="${x + 12}" y="84" fill="#0f172a" font-size="18" font-weight="700">${shortWeekdayLabel(day)}</text>`);
    cells.push(`<text x="${x + 12}" y="104" fill="#475569" font-size="12">${day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</text>`);

    for (let rowIndex = 0; rowIndex < 15; rowIndex += 1) {
      const startMinutes = DEFAULT_WORK_START + rowIndex * 60;
      const endMinutes = startMinutes + 60;
      const y = headerHeight + rowIndex * hourRowHeight;
      const isBusy = availability.busy.some((interval) => interval.start < endMinutes && interval.end > startMinutes);
      const fill = isBusy ? '#ef4444' : '#22c55e';

      cells.push(
        `<rect x="${x}" y="${y}" width="${dayColumnWidth - 10}" height="${hourRowHeight - 4}" rx="10" fill="${fill}" opacity="0.92" />`
      );
      if (rowIndex === 0 || rowIndex % 3 === 0) {
        cells.push(
          `<text x="${x - 54}" y="${y + 22}" fill="#64748b" font-size="11">${formatMinutes(startMinutes)}</text>`
        );
      }
    }
  }

  const rows = Array.from({ length: 15 }, (_, rowIndex) => {
    const minutes = DEFAULT_WORK_START + rowIndex * 60;
    const y = headerHeight + rowIndex * hourRowHeight;
    return `<text x="20" y="${y + 22}" fill="#64748b" font-size="11">${formatMinutes(minutes)}</text>`;
  }).join('');

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${gridWidth}" height="${gridHeight}" viewBox="0 0 ${gridWidth} ${gridHeight}">
      <rect width="100%" height="100%" rx="28" fill="#f8fafc" />
      <text x="32" y="42" fill="#0f172a" font-size="24" font-weight="800">${escapeXml(title)}</text>
      <text x="32" y="66" fill="#64748b" font-size="13">Green = free time, red = busy blocks, local storage only.</text>
      ${rows}
      ${cells.join('')}
    </svg>
  `.trim();
}

export function getDailySlots(date: Date, events: ScheduleEvent[]): DayAvailability {
  return calculateDayAvailability(date, events);
}

export function buildWeekDates(date: Date): Date[] {
  return enumerateWeekDates(date);
}

function eventsToOccurrencesForDate(date: Date, events: ScheduleEvent[]): EventOccurrence[] {
  const occurrences: EventOccurrence[] = [];

  for (const event of events) {
    const startDate = createLocalDate(event.date);
    if (date < startDate) {
      continue;
    }

    const untilDate = event.recurrence.until ? createLocalDate(event.recurrence.until) : null;
    if (untilDate && date > untilDate) {
      continue;
    }

    if (!matchesRecurrence(event, date, startDate)) {
      continue;
    }

    const occurrenceIndex = countPriorOccurrences(event, date);
    if (event.recurrence.count && occurrenceIndex >= event.recurrence.count) {
      continue;
    }

    occurrences.push({
      id: event.id,
      title: event.title,
      label: event.label,
      date: toDateInputValue(date),
      start: timeStringToMinutes(event.startTime),
      end: timeStringToMinutes(event.endTime)
    });
  }

  return occurrences;
}

function matchesRecurrence(event: ScheduleEvent, date: Date, startDate: Date): boolean {
  if (sameCalendarDate(date, startDate)) {
    return true;
  }

  const diffDays = differenceInCalendarDays(startDate, date);
  if (diffDays < 0) {
    return false;
  }

  const interval = Math.max(1, event.recurrence.interval || 1);

  if (event.recurrence.type === 'none') {
    return false;
  }

  if (event.recurrence.type === 'daily') {
    return diffDays % interval === 0;
  }

  const selectedDays = event.recurrence.daysOfWeek.length > 0 ? event.recurrence.daysOfWeek : [startDate.getDay()];
  const sameSelectedDay = selectedDays.includes(date.getDay());
  if (!sameSelectedDay) {
    return false;
  }

  const weekOffset = Math.floor(diffDays / 7);
  return weekOffset % interval === 0;
}

function countPriorOccurrences(event: ScheduleEvent, date: Date): number {
  const startDate = createLocalDate(event.date);
  let count = 0;
  let cursor = new Date(startDate);

  while (cursor <= date) {
    const untilDate = event.recurrence.until ? createLocalDate(event.recurrence.until) : null;
    if (untilDate && cursor > untilDate) {
      break;
    }

    if (matchesRecurrence(event, cursor, startDate)) {
      count += 1;
    }

    cursor = addDays(cursor, 1);
  }

  return count - 1;
}

function mergeIntervals(intervals: TimeInterval[]): TimeInterval[] {
  if (intervals.length === 0) {
    return [];
  }

  const merged: TimeInterval[] = [intervals[0]];

  for (let index = 1; index < intervals.length; index += 1) {
    const previous = merged[merged.length - 1];
    const current = intervals[index];

    if (current.start <= previous.end) {
      previous.end = Math.max(previous.end, current.end);
      continue;
    }

    merged.push({ ...current });
  }

  return merged;
}

function buildFreeIntervals(busy: TimeInterval[]): TimeInterval[] {
  const free: TimeInterval[] = [];
  let cursor = DEFAULT_WORK_START;

  for (const interval of busy) {
    if (interval.start > cursor) {
      free.push({ start: cursor, end: interval.start });
    }

    cursor = Math.max(cursor, interval.end);
  }

  if (cursor < DEFAULT_WORK_END) {
    free.push({ start: cursor, end: DEFAULT_WORK_END });
  }

  return free;
}

function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHour}:${String(mins).padStart(2, '0')} ${suffix}`;
}

function shortWeekdayLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}
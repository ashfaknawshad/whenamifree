import { buildFreeTimeText, buildWeeklyGridSvg, buildWeekDates } from './scheduler';
import { DayAvailability } from '../types';

export function createExportBundle(selectedDate: Date, weekAvailability: DayAvailability[]) {
  const weekDates = buildWeekDates(selectedDate);
  const text = buildFreeTimeText(weekAvailability);
  const svg = buildWeeklyGridSvg(weekDates, weekAvailability);

  return {
    text,
    svg,
    filenameBase: `free-schedule-${selectedDate.toISOString().slice(0, 10)}`
  };
}

export function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
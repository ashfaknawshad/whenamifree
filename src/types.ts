export type ViewMode = 'week' | 'day';

export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'custom';

export type ScheduleEvent = {
  id: string;
  title: string;
  label: string;
  date: string;
  startTime: string;
  endTime: string;
  recurrence: {
    type: RecurrenceType;
    interval: number;
    daysOfWeek: number[];
    until: string;
    count: number | null;
  };
  createdAt: string;
  updatedAt: string;
};

export type ScheduleEventInput = Omit<ScheduleEvent, 'id' | 'createdAt' | 'updatedAt'>;

export type TimeInterval = {
  start: number;
  end: number;
};

export type DayAvailability = {
  date: string;
  label: string;
  busy: TimeInterval[];
  free: TimeInterval[];
};

export type ExportPayload = {
  weekDates: Date[];
  dailyAvailability: DayAvailability[];
};

export const WEEKDAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const SHORT_WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const DEFAULT_WORK_START = 7 * 60;
export const DEFAULT_WORK_END = 21 * 60;
import { ReactNode, useEffect, useMemo, useState } from 'react';
import { DayTimeline } from './components/DayTimeline';
import { EventForm } from './components/EventForm';
import { EventList } from './components/EventList';
import { ExportPanel } from './components/ExportPanel';
import { usePersistentState } from './hooks/usePersistentState';
import { createTodayInputValue, createLocalDate, enumerateWeekDates } from './lib/date';
import { calculateDayAvailability, calculateWeekAvailability } from './lib/scheduler';
import { ScheduleEvent, ScheduleEventInput, ViewMode } from './types';

type ThemeMode = 'light' | 'dark';

const STORAGE_KEYS = {
  events: 'waif.events.v1',
  selectedDate: 'waif.selectedDate.v1',
  viewMode: 'waif.viewMode.v1',
  theme: 'waif.theme.v1'
} as const;

export default function App() {
  const [events, setEvents] = usePersistentState<ScheduleEvent[]>(STORAGE_KEYS.events, []);
  const [selectedDate, setSelectedDate] = usePersistentState<string>(STORAGE_KEYS.selectedDate, createTodayInputValue());
  const [viewMode, setViewMode] = usePersistentState<ViewMode>(STORAGE_KEYS.viewMode, 'week');
  const [theme, setTheme] = usePersistentState<ThemeMode>(STORAGE_KEYS.theme, 'light');
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const selectedDateObject = useMemo(() => createLocalDate(selectedDate), [selectedDate]);
  const weekAvailability = useMemo(() => calculateWeekAvailability(selectedDateObject, events), [events, selectedDateObject]);
  const dayAvailability = useMemo(() => calculateDayAvailability(selectedDateObject, events), [events, selectedDateObject]);
  const weekDates = useMemo(() => enumerateWeekDates(selectedDateObject), [selectedDateObject]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      return;
    }

    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Offline install still works without registration if the browser blocks it.
    });
  }, []);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeout = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  function handleSaveEvent(input: ScheduleEventInput, editingId: string | null) {
    const now = new Date().toISOString();

    if (editingId) {
      setEvents((current) =>
        current.map((event) =>
          event.id === editingId
            ? {
                ...event,
                ...input,
                updatedAt: now
              }
            : event
        )
      );
      setToast('Busy slot updated.');
      setEditingEvent(null);
      return;
    }

    const nextEvent: ScheduleEvent = {
      id: crypto.randomUUID(),
      ...input,
      createdAt: now,
      updatedAt: now
    };

    setEvents((current) => [...current, nextEvent]);
    setToast('Busy slot saved locally.');
    setEditingEvent(null);
  }

  function handleDeleteEvent(eventId: string) {
    if (!window.confirm('Delete this busy slot?')) {
      return;
    }

    setEvents((current) => current.filter((event) => event.id !== eventId));
    setEditingEvent(null);
    setToast('Busy slot deleted.');
  }

  const activeCount = events.length;
  const todayFreeMinutes = dayAvailability.free.reduce((total, interval) => total + (interval.end - interval.start), 0);
  const todaySummary = todayFreeMinutes > 0 ? `${formatDuration(todayFreeMinutes)} free today` : 'No free time today';

  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-100">
      <main className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <header className="mb-5 rounded-[2rem] border border-white/60 bg-white/75 p-4 shadow-soft backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/70 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.34em] text-teal-700 dark:text-teal-300">WAIF</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                Smart Schedule Lite
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">
                Plan tutoring and study time locally, see free gaps from 7:00 AM to 9:00 PM, and export a clean weekly summary without a backend.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <ControlGroup label="Date">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(event) => setSelectedDate(event.target.value)}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 outline-none transition focus:border-teal-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                />
              </ControlGroup>
              <ControlGroup label="View">
                <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
                  {(['week', 'day'] as ViewMode[]).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setViewMode(mode)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        viewMode === mode
                          ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950'
                          : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                      }`}
                    >
                      {mode === 'week' ? 'Weekly' : 'Daily'}
                    </button>
                  ))}
                </div>
              </ControlGroup>
              <button
                type="button"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {theme === 'dark' ? 'Light mode' : 'Dark mode'}
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <StatCard label="Busy slots" value={String(activeCount)} tone="rose" />
            <StatCard label="Today" value={todaySummary} tone="emerald" />
            <StatCard label="Week" value={`${weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`} tone="slate" />
          </div>

          {toast ? (
            <div className="mt-4 rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-medium text-teal-800 dark:border-teal-500/30 dark:bg-teal-500/10 dark:text-teal-200">
              {toast}
            </div>
          ) : null}
        </header>

        <div className="space-y-5">
          <ExportPanel selectedDate={selectedDateObject} weekAvailability={weekAvailability} onToast={setToast} />

          <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-5">
              {viewMode === 'week' ? (
                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {weekAvailability.map((availability) => (
                    <DayTimeline key={availability.date} availability={availability} dense showFullLabels />
                  ))}
                </section>
              ) : (
                <section className="space-y-4">
                  <DayTimeline availability={dayAvailability} showFullLabels />
                  <div className="rounded-[1.75rem] border border-slate-200/80 bg-white/90 p-4 shadow-soft backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/80">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Free time</p>
                        <h2 className="mt-1 text-xl font-semibold text-slate-950 dark:text-white">{dayAvailability.label}</h2>
                      </div>
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200">
                        {formatDuration(dayAvailability.free.reduce((total, interval) => total + (interval.end - interval.start), 0))} free
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {dayAvailability.free.length > 0 ? (
                        dayAvailability.free.map((interval) => (
                          <div key={`${interval.start}-${interval.end}`} className="rounded-2xl bg-emerald-50 px-4 py-3 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200">
                            {intervalLabel(interval.start, interval.end)}
                          </div>
                        ))
                      ) : (
                        <div className="rounded-2xl bg-slate-100 px-4 py-3 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                          No free blocks during working hours.
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              )}
            </div>

            <div className="space-y-5">
              <EventForm editingEvent={editingEvent} defaultDate={selectedDate} onSave={handleSaveEvent} onCancel={() => setEditingEvent(null)} />
              <EventList events={events} onEdit={setEditingEvent} onDelete={handleDeleteEvent} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function ControlGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900">
      <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">{label}</span>
      {children}
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: string; tone: 'rose' | 'emerald' | 'slate' }) {
  const toneClasses =
    tone === 'rose'
      ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-200'
      : tone === 'emerald'
        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200'
        : 'bg-slate-50 text-slate-700 dark:bg-slate-900 dark:text-slate-200';

  return (
    <div className={`rounded-[1.5rem] border border-slate-200/80 px-4 py-4 ${toneClasses} dark:border-slate-800`}>
      <p className="text-xs font-semibold uppercase tracking-[0.24em] opacity-75">{label}</p>
      <p className="mt-2 text-lg font-semibold">{value}</p>
    </div>
  );
}

function intervalLabel(start: number, end: number) {
  const startHour = Math.floor(start / 60);
  const startMinute = start % 60;
  const endHour = Math.floor(end / 60);
  const endMinute = end % 60;
  const format = (hour: number, minute: number) => {
    const suffix = hour >= 12 ? 'PM' : 'AM';
    const normalizedHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${normalizedHour}:${String(minute).padStart(2, '0')} ${suffix}`;
  };

  return `${format(startHour, startMinute)} - ${format(endHour, endMinute)}`;
}

function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  if (hours === 0) {
    return `${remainder}m`;
  }

  if (remainder === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainder}m`;
}
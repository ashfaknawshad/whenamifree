import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';
import { ScheduleEvent, ScheduleEventInput, RecurrenceType, WEEKDAY_LABELS } from '../types';
import { createTodayInputValue, isValidDateInput } from '../lib/date';

type EventFormProps = {
  editingEvent: ScheduleEvent | null;
  defaultDate: string;
  onSave: (value: ScheduleEventInput, editingId: string | null) => void;
  onCancel: () => void;
};

type FormState = {
  title: string;
  label: string;
  date: string;
  startTime: string;
  endTime: string;
  recurrenceType: RecurrenceType;
  interval: number;
  daysOfWeek: number[];
  until: string;
  count: string;
};

const DAY_OPTIONS = WEEKDAY_LABELS.map((label, index) => ({ label, value: index }));

export function EventForm({ editingEvent, defaultDate, onSave, onCancel }: EventFormProps) {
  const initialState = useMemo<FormState>(
    () => getInitialState(editingEvent, defaultDate),
    [defaultDate, editingEvent]
  );
  const [state, setState] = useState<FormState>(initialState);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setState(initialState);
    setError(null);
  }, [initialState]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!state.title.trim()) {
      setError('Add a short title for this slot.');
      return;
    }

    if (!isValidDateInput(state.date)) {
      setError('Pick a valid date.');
      return;
    }

    if (state.startTime >= state.endTime) {
      setError('End time must be after start time.');
      return;
    }

    const selectedDays = state.daysOfWeek.length > 0 ? state.daysOfWeek : [new Date(`${state.date}T00:00:00`).getDay()];

    onSave(
      {
        title: state.title.trim(),
        label: state.label.trim(),
        date: state.date,
        startTime: state.startTime,
        endTime: state.endTime,
        recurrence: {
          type: state.recurrenceType,
          interval: Math.max(1, Math.floor(state.interval)),
          daysOfWeek: state.recurrenceType === 'none' ? [] : selectedDays,
          until: state.until,
          count: state.count ? Math.max(1, Math.floor(Number(state.count))) : null
        }
      },
      editingEvent?.id ?? null
    );
  }

  return (
    <section className="rounded-[1.75rem] border border-slate-200/80 bg-white/90 p-4 shadow-soft backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Schedule</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950 dark:text-white">
            {editingEvent ? 'Edit busy slot' : 'Add busy slot'}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setState(getInitialState(null, defaultDate))}
          className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"
        >
          Reset
        </button>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Title" required>
            <input
              value={state.title}
              onChange={(event) => setState((current) => ({ ...current, title: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:bg-slate-950"
              placeholder="Private tutoring"
            />
          </Field>

          <Field label="Short label">
            <input
              value={state.label}
              onChange={(event) => setState((current) => ({ ...current, label: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:bg-slate-950"
              placeholder="Math prep"
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Date">
            <input
              type="date"
              value={state.date}
              onChange={(event) => setState((current) => ({ ...current, date: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition focus:border-teal-500 focus:bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:bg-slate-950"
            />
          </Field>
          <Field label="Start time">
            <input
              type="time"
              value={state.startTime}
              onChange={(event) => setState((current) => ({ ...current, startTime: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition focus:border-teal-500 focus:bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:bg-slate-950"
            />
          </Field>
          <Field label="End time">
            <input
              type="time"
              value={state.endTime}
              onChange={(event) => setState((current) => ({ ...current, endTime: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition focus:border-teal-500 focus:bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:bg-slate-950"
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Field label="Repeat pattern">
            <select
              value={state.recurrenceType}
              onChange={(event) =>
                setState((current) => ({
                  ...current,
                  recurrenceType: event.target.value as RecurrenceType
                }))
              }
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition focus:border-teal-500 focus:bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:bg-slate-950"
            >
              <option value="none">One time</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="custom">Custom days</option>
            </select>
          </Field>

          <Field label="Repeat every">
            <input
              type="number"
              min="1"
              value={state.interval}
              onChange={(event) => setState((current) => ({ ...current, interval: Number(event.target.value) || 1 }))}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition focus:border-teal-500 focus:bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:bg-slate-950"
            />
          </Field>

          <Field label="Repeat until">
            <input
              type="date"
              value={state.until}
              onChange={(event) => setState((current) => ({ ...current, until: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition focus:border-teal-500 focus:bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:bg-slate-950"
            />
          </Field>

          <Field label="Repeat count">
            <input
              type="number"
              min="1"
              placeholder="Unlimited"
              value={state.count}
              onChange={(event) => setState((current) => ({ ...current, count: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:bg-slate-950"
            />
          </Field>
        </div>

        {state.recurrenceType !== 'none' ? (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Repeat on</p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7">
              {DAY_OPTIONS.map((option) => {
                const active = state.daysOfWeek.includes(option.value);

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      setState((current) => ({
                        ...current,
                        daysOfWeek: current.daysOfWeek.includes(option.value)
                          ? current.daysOfWeek.filter((day) => day !== option.value)
                          : [...current.daysOfWeek, option.value].sort((left, right) => left - right)
                      }))
                    }
                    className={`rounded-2xl border px-3 py-2 text-sm font-semibold transition ${
                      active
                        ? 'border-teal-500 bg-teal-500 text-white shadow-lg shadow-teal-500/25'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300'
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {error ? (
          <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
          >
            {editingEvent ? 'Update slot' : 'Save slot'}
          </button>
          {editingEvent ? (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"
            >
              Cancel edit
            </button>
          ) : null}
        </div>
      </form>
    </section>
  );
}

function Field({ label, required = false, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
        {label}
        {required ? <span className="ml-1 text-rose-500">*</span> : null}
      </span>
      {children}
    </label>
  );
}

function getInitialState(editingEvent: ScheduleEvent | null, defaultDate: string): FormState {
  if (!editingEvent) {
    return {
      title: '',
      label: '',
      date: isValidDateInput(defaultDate) ? defaultDate : createTodayInputValue(),
      startTime: '09:00',
      endTime: '10:00',
      recurrenceType: 'none',
      interval: 1,
      daysOfWeek: [],
      until: '',
      count: ''
    };
  }

  return {
    title: editingEvent.title,
    label: editingEvent.label,
    date: editingEvent.date,
    startTime: editingEvent.startTime,
    endTime: editingEvent.endTime,
    recurrenceType: editingEvent.recurrence.type,
    interval: editingEvent.recurrence.interval,
    daysOfWeek: editingEvent.recurrence.daysOfWeek,
    until: editingEvent.recurrence.until,
    count: editingEvent.recurrence.count ? String(editingEvent.recurrence.count) : ''
  };
}
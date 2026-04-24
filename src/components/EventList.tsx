import { ScheduleEvent } from '../types';
import { createLocalDate, formatDateLabel, minutesToSegmentLabel, timeStringToMinutes } from '../lib/date';

type EventListProps = {
  events: ScheduleEvent[];
  onEdit: (event: ScheduleEvent) => void;
  onDelete: (eventId: string) => void;
};

export function EventList({ events, onEdit, onDelete }: EventListProps) {
  const sortedEvents = [...events].sort((left, right) => {
    const dateCompare = left.date.localeCompare(right.date);
    if (dateCompare !== 0) {
      return dateCompare;
    }

    return left.startTime.localeCompare(right.startTime);
  });

  return (
    <section className="rounded-[1.75rem] border border-slate-200/80 bg-white/90 p-4 shadow-soft backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Saved slots</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950 dark:text-white">Busy blocks</h2>
        </div>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          {sortedEvents.length} total
        </span>
      </div>

      {sortedEvents.length === 0 ? (
        <div className="rounded-[1.25rem] border border-dashed border-slate-300 bg-slate-50/70 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400">
          No busy slots yet. Add your class, study, or tutor blocks above.
        </div>
      ) : (
        <div className="space-y-3">
          {sortedEvents.map((event) => (
            <article
              key={event.id}
              className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-base font-semibold text-slate-950 dark:text-white">{event.title}</h3>
                    {event.label ? (
                      <span className="rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-rose-700 dark:bg-rose-500/15 dark:text-rose-200">
                        {event.label}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{formatDateLabel(createLocalDate(event.date))}</p>
                  <p className="mt-1 text-sm font-semibold text-rose-600 dark:text-rose-300">
                    {minutesToSegmentLabel(timeStringToMinutes(event.startTime), timeStringToMinutes(event.endTime))}
                  </p>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{describeRecurrence(event)}</p>
                </div>

                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit(event)}
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-white dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-950"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(event.id)}
                    className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-100 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200 dark:hover:bg-rose-500/20"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function describeRecurrence(event: ScheduleEvent): string {
  const intervalText = event.recurrence.interval > 1 ? ` every ${event.recurrence.interval}` : ' every';

  const pattern =
    event.recurrence.type === 'none'
      ? 'One-time slot'
      : event.recurrence.type === 'daily'
        ? `Repeats daily${event.recurrence.interval > 1 ? ` every ${event.recurrence.interval} days` : ''}`
        : event.recurrence.type === 'weekly'
          ? `Repeats weekly${event.recurrence.interval > 1 ? ` every ${event.recurrence.interval} weeks` : ''}`
          : `Repeats on ${formatSelectedDays(event.recurrence.daysOfWeek)}${intervalText} weeks`;

  const endText = event.recurrence.count
    ? `for ${event.recurrence.count} occurrence${event.recurrence.count > 1 ? 's' : ''}`
    : event.recurrence.until
      ? `until ${formatDateLabel(createLocalDate(event.recurrence.until))}`
      : 'until you remove it';

  return `${pattern}, ${endText}`;
}

function formatSelectedDays(daysOfWeek: number[]): string {
  const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  if (daysOfWeek.length === 0) {
    return 'the selected days';
  }

  return daysOfWeek.map((day) => labels[day]).join(', ');
}
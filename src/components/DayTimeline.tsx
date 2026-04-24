import { DayAvailability, DEFAULT_WORK_END, DEFAULT_WORK_START } from '../types';
import { minutesToSegmentLabel, minutesToTimeLabel } from '../lib/date';

type DayTimelineProps = {
  availability: DayAvailability;
  dense?: boolean;
  showFullLabels?: boolean;
};

export function DayTimeline({ availability, dense = false, showFullLabels = true }: DayTimelineProps) {
  const segments = [
    ...availability.free.map((interval) => ({ ...interval, kind: 'free' as const })),
    ...availability.busy.map((interval) => ({ ...interval, kind: 'busy' as const }))
  ].sort((left, right) => left.start - right.start);

  const freeMinutes = availability.free.reduce((total, interval) => total + (interval.end - interval.start), 0);
  const busyMinutes = availability.busy.reduce((total, interval) => total + (interval.end - interval.start), 0);

  return (
    <article className="rounded-[1.75rem] border border-slate-200/80 bg-white/90 p-4 shadow-soft backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">{showFullLabels ? availability.label : availability.label.slice(0, 3)}</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">{availability.label}</h3>
        </div>
        <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          {minutesToTimeLabel(DEFAULT_WORK_START)} - {minutesToTimeLabel(DEFAULT_WORK_END)}
        </div>
      </div>

      <div className={`rounded-[1.5rem] bg-slate-100 p-1.5 dark:bg-slate-900 ${dense ? 'space-y-0' : ''}`}>
        <div className="flex overflow-hidden rounded-[1.25rem] border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
          {segments.map((segment) => {
            const duration = segment.end - segment.start;
            const percentage = (duration / (DEFAULT_WORK_END - DEFAULT_WORK_START)) * 100;
            const isBusy = segment.kind === 'busy';

            return (
              <div
                key={`${availability.date}-${segment.kind}-${segment.start}-${segment.end}`}
                className={`relative flex min-h-[64px] flex-col justify-between border-r border-white/40 px-2 py-2 transition-transform duration-200 hover:scale-[1.01] ${
                  isBusy ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'
                }`}
                style={{ flexBasis: `${percentage}%` }}
              >
                <div className="flex items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/85">
                  <span>{isBusy ? 'Busy' : 'Free'}</span>
                  {dense ? null : <span>{Math.round(duration / 60)}h</span>}
                </div>
                <div className="space-y-0.5 text-left">
                  <p className="text-sm font-semibold leading-tight">{minutesToSegmentLabel(segment.start, segment.end)}</p>
                  {showFullLabels && !dense ? (
                    <p className="text-[11px] leading-tight text-white/80">
                      {isBusy ? 'Blocked time' : 'Available time'}
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-rose-50 p-3 text-rose-700 dark:bg-rose-500/10 dark:text-rose-200">
          <p className="text-xs font-semibold uppercase tracking-[0.24em]">Busy</p>
          <p className="mt-1 text-lg font-semibold">{formatDuration(busyMinutes)}</p>
        </div>
        <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200">
          <p className="text-xs font-semibold uppercase tracking-[0.24em]">Free</p>
          <p className="mt-1 text-lg font-semibold">{formatDuration(freeMinutes)}</p>
        </div>
      </div>
    </article>
  );
}

function formatDuration(minutes: number): string {
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
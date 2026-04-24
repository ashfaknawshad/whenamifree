import { useMemo, useState } from 'react';
import { DayAvailability } from '../types';
import { createExportBundle } from '../lib/export';

type ExportPanelProps = {
  selectedDate: Date;
  weekAvailability: DayAvailability[];
  onToast: (message: string) => void;
};

export function ExportPanel({ selectedDate, weekAvailability, onToast }: ExportPanelProps) {
  const [busy, setBusy] = useState(false);

  const bundle = useMemo(() => createExportBundle(selectedDate, weekAvailability), [selectedDate, weekAvailability]);

  async function handleTextExport() {
    setBusy(true);
    try {
      await navigator.clipboard.writeText(bundle.text);
      downloadFile(bundle.filenameBase, bundle.text, 'txt', 'text/plain;charset=utf-8');
      onToast('Free time text copied and downloaded.');
    } catch {
      downloadFile(bundle.filenameBase, bundle.text, 'txt', 'text/plain;charset=utf-8');
      onToast('Text file downloaded.');
    } finally {
      setBusy(false);
    }
  }

  async function handleImageExport() {
    setBusy(true);
    try {
      const pngBlob = await renderSvgToPng(bundle.svg);
      downloadBlob(bundle.filenameBase, pngBlob, 'png');
      onToast('Weekly PNG image downloaded.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-[1.75rem] border border-slate-200/80 bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 p-4 text-white shadow-soft">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-200/80">Export</p>
          <h2 className="mt-1 text-xl font-semibold">Share your free time</h2>
          <p className="mt-1 max-w-xl text-sm text-slate-300">
            Export a text summary for students or download a clean weekly SVG grid with green free blocks and red busy blocks.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleTextExport}
            disabled={busy}
            className="rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
          >
            Export Free Time
          </button>
          <button
            type="button"
            onClick={handleImageExport}
            disabled={busy}
            className="rounded-full border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-70"
          >
            Download PNG
          </button>
        </div>
      </div>

      <pre className="mt-4 overflow-x-auto rounded-[1.25rem] border border-white/10 bg-black/20 p-4 text-xs leading-6 text-teal-50">
        {bundle.text}
      </pre>
    </section>
  );
}

function downloadFile(baseName: string, content: string, extension: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  downloadBlob(baseName, blob, extension);
}

function downloadBlob(baseName: string, blob: Blob, extension: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${baseName}.${extension}`;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

async function renderSvgToPng(svg: string): Promise<Blob> {
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const objectUrl = URL.createObjectURL(blob);

  try {
    const image = await loadImage(objectUrl);
    const canvas = document.createElement('canvas');
    const width = Math.max(1, image.naturalWidth || image.width || 1200);
    const height = Math.max(1, image.naturalHeight || image.height || 900);

    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Canvas is not available');
    }

    context.drawImage(image, 0, 0, width, height);

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((result) => {
        if (!result) {
          reject(new Error('PNG export failed'));
          return;
        }

        resolve(result);
      }, 'image/png');
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Image load failed'));
    image.src = src;
  });
}
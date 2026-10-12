/**
 * DoIT — House modul: datumi, rotacije, formatiranje (sr-Latn-RS).
 * Portano iz Project BetterMe/src/lib/dates.ts
 */
import type { HouseRepeat, HouseTask } from './types';

export const DAN = [
  'nedelja',
  'ponedeljak',
  'utorak',
  'sreda',
  'četvrtak',
  'petak',
  'subota',
];

export const DAN_KRATKO = ['pon', 'uto', 'sre', 'čet', 'pet', 'sub', 'ned'];

/** lokalni yyyy-mm-dd */
export function iso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseISO(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function today(): Date {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}

/** ponedeljak te nedelje */
export function weekStart(d: Date): Date {
  const w = d.getDay() === 0 ? 6 : d.getDay() - 1;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - w);
}

export function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

const EPOCH = Date.UTC(2024, 0, 1); // ponedeljak

function daysSinceEpoch(d: Date): number {
  return Math.round((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - EPOCH) / 86400000);
}

export function occursOn(task: HouseTask, d: Date): boolean {
  if (!task.active) return false;
  if (task.repeat === 'daily') return true;
  const wd = d.getDay() === 0 ? 6 : d.getDay() - 1; // 0 = ponedeljak
  if (wd !== task.weekday) return false;
  if (task.repeat === 'biweekly') {
    return Math.floor(daysSinceEpoch(weekStart(d)) / 7) % 2 === 0;
  }
  return true;
}

/** indeks perioda — određuje mesto u rotaciji */
function periodIndex(task: HouseTask, d: Date): number {
  if (task.repeat === 'daily') return daysSinceEpoch(d);
  const weeks = Math.floor(daysSinceEpoch(weekStart(d)) / 7);
  return task.repeat === 'biweekly' ? Math.floor(weeks / 2) : weeks;
}

export function periodKey(task: HouseTask, d: Date): string {
  return task.repeat === 'daily' ? iso(d) : iso(weekStart(d));
}

export function rangeFor(task: HouseTask, d: Date): { from: Date; to: Date } {
  if (task.repeat === 'daily') return { from: d, to: d };
  const s = weekStart(d);
  return { from: s, to: addDays(s, 6) };
}

/** kome je zadatak dodeljen tog dana (rotacija + preskakanje tokom pasusa) */
export function assigneeOn(
  task: HouseTask,
  d: Date,
  isUnavailable: (memberId: string, from: Date, to: Date) => boolean,
): string | null {
  const rot = task.rotation;
  if (rot.length === 0) return null;
  const base = ((periodIndex(task, d) % rot.length) + rot.length) % rot.length;
  const { from, to } = rangeFor(task, d);
  for (let i = 0; i < rot.length; i++) {
    const id = rot[(base + i) % rot.length];
    if (!isUnavailable(id, from, to)) return id;
  }
  return null; // svi na pasusu
}

export function fmtDate(d: Date): string {
  return new Intl.DateTimeFormat('sr-Latn-RS', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(d);
}

export function fmtShort(d: Date): string {
  return new Intl.DateTimeFormat('sr-Latn-RS', { day: 'numeric', month: 'short' }).format(d);
}

export function fmtDinars(n: number): string {
  return `${new Intl.NumberFormat('sr-Latn-RS').format(n)} RSD`;
}

export function repeatLabel(t: HouseRepeat): string {
  return t === 'daily' ? 'svaki dan' : t === 'weekly' ? 'nedeljno' : 'dvonedeljno';
}

export function weekdayLabel(task: HouseTask): string | null {
  if (task.repeat === 'daily') return null;
  return task.weekday != null ? DAN[task.weekday] : null;
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

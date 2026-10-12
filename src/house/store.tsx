/**
 * DoIT — House modul: React context stanje (kuća, zadaci, lista, troškovi, bodovi).
 * Portano iz Project BetterMe/src/lib/store.tsx, prilagođeno DoIT aplikaciji:
 *  - localStorage per-user ključ (podaci odvojeni po nalogu)
 *  - "u kupovini sam" status automatski istekne posle 2h (po speku)
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  addDays,
  assigneeOn,
  iso,
  occursOn,
  parseISO,
  periodKey,
  rangeFor,
  today,
  uid,
} from './dates';
import { seedHouseState } from './seed';
import type { HouseAvailability, HouseMember, HouseRepeat, HouseShift, HouseState, HouseTask } from './types';

const STORAGE_KEY_PREFIX = 'doit_house_v1';

/** "u kupovini sam" traje 2 sata, pa se automatski oslobađa */
const SHOPPING_STATUS_TTL_MS = 2 * 60 * 60 * 1000;

export type HouseAssignment = {
  task: HouseTask;
  key: string;
  assigneeId: string | null;
  status: 'open' | 'done' | 'skipped';
  completedBy: string | null;
};

type HouseCtx = {
  s: HouseState;
  me: HouseMember;
  memberById: (id: string) => HouseMember | undefined;
  isUnavailable: (memberId: string, from: Date, to: Date) => boolean;
  assignmentsFor: (d: Date) => HouseAssignment[];
  switchUser: (id: string) => void;
  completeShift: (taskId: string, key: string) => void;
  uncompleteShift: (taskId: string, key: string) => void;
  addTask: (input: { name: string; repeat: HouseRepeat; weekday: number | null; time: string | null }) => void;
  addAvailability: (input: { from: string; to: string; reason: string | null }) => void;
  removeAvailability: (id: string) => void;
  addListItem: (name: string) => void;
  buyItem: (id: string) => void;
  returnItem: (id: string) => void;
  toggleInShopping: () => void;
  addExpense: (input: { description: string; amount: number; paidBy: string }) => void;
  settleDebt: (fromId: string, toId: string, amount: number) => void;
  resetHouse: () => void;
};

const HouseContext = createContext<HouseCtx | null>(null);

function storageKey(userId?: string): string {
  return userId ? `${STORAGE_KEY_PREFIX}_${userId}` : STORAGE_KEY_PREFIX;
}

function loadState(userId?: string): HouseState {
  let initial = seedHouseState();
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (raw) initial = { ...initial, ...JSON.parse(raw) } as HouseState;
  } catch {
    // ako je storage pokvaren — startuj sa seed-om
  }
  return initial;
}

/** pairwise dugovanja: "a duguje b" */
export function pairwiseDebts(s: HouseState): Map<string, number> {
  const map = new Map<string, number>();
  const key = (a: string, b: string) => `${a}|${b}`;
  const add = (a: string, b: string, v: number) => {
    if (a === b || v <= 0) return;
    map.set(key(a, b), (map.get(key(a, b)) ?? 0) + v);
  };
  const n = s.members.length;
  for (const e of s.expenses) {
    const share = Math.round(e.amount / n);
    for (const m of s.members) add(m.id, e.paidBy, share);
  }
  for (const st of s.settlements) add(st.fromId, st.toId, st.amount);
  // čisti parove: ko duguje obostrano, umanjuje se
  const out: Array<[string, string, number]> = [];
  for (const [k, v] of map) {
    const [a, b] = k.split('|');
    const rev = map.get(key(b, a)) ?? 0;
    const net = v - rev;
    if (net > 0 && a < b) out.push([a, b, net]);
    if (net < 0 && a < b) out.push([b, a, -net]);
  }
  return new Map(out.map(([a, b, v]) => [key(a, b), v]));
}

/** bodovi u tekućem mesecu: završen zadatak = 10 */
export function monthlyScores(s: HouseState): Map<string, number> {
  const mPrefix = iso(today()).slice(0, 7);
  const scores = new Map<string, number>();
  for (const m of s.members) scores.set(m.id, 0);
  for (const sh of s.shifts) {
    if (sh.status !== 'done' || !sh.completedBy || !sh.completedAt) continue;
    if (!sh.completedAt.slice(0, 10).startsWith(mPrefix)) continue;
    scores.set(sh.completedBy, (scores.get(sh.completedBy) ?? 0) + 10);
  }
  return scores;
}

export function HouseProvider({ userId, children }: { userId?: string; children: ReactNode }) {
  const [s, setS] = useState<HouseState>(() => loadState(userId));

  // Čuvanje u localStorage, odvojeno po korisniku
  const persist = useCallback(
    (state: HouseState) => {
      try {
        localStorage.setItem(storageKey(userId), JSON.stringify(state));
      } catch {
        // storage pun — ignoriši
      }
    },
    [userId],
  );

  // istek "u kupovini sam" statusa (2h) — proverava se pri mount-u i pri promeni
  useEffect(() => {
    if (s.inShoppingBy && s.inShoppingAt) {
      const age = Date.now() - new Date(s.inShoppingAt).getTime();
      if (age > SHOPPING_STATUS_TTL_MS) {
        setS((prev) => {
          const cleared = { ...prev, inShoppingBy: null, inShoppingAt: null };
          persist(cleared);
          return cleared;
        });
      }
    }
  }, [s.inShoppingBy, s.inShoppingAt, persist]);

  const memberById = useCallback(
    (id: string) => s.members.find((m) => m.id === id),
    [s.members],
  );
  const isUnavailable = useCallback(
    (memberId: string, from: Date, to: Date) =>
      s.availability.some(
        (a) =>
          a.memberId === memberId &&
          parseISO(a.from) <= to &&
          parseISO(a.to) >= from,
      ),
    [s.availability],
  );

  const assignmentsFor = useCallback(
    (d: Date): HouseAssignment[] => {
      const out: HouseAssignment[] = [];
      for (const task of s.tasks) {
        if (!occursOn(task, d)) continue;
        const key = periodKey(task, d);
        const assigneeId = assigneeOn(task, d, isUnavailable);
        const sh = s.shifts.find((x) => x.taskId === task.id && x.key === key);
        const status = sh?.status ?? (assigneeId ? 'open' : 'skipped');
        out.push({
          task,
          key,
          assigneeId,
          status,
          completedBy: sh?.completedBy ?? null,
        });
      }
      return out;
    },
    [s.tasks, s.shifts, isUnavailable],
  );

  const update = useCallback(
    (fn: (prev: HouseState) => HouseState) =>
      setS((prev) => {
        const next = fn(prev);
        persist(next);
        return next;
      }),
    [persist],
  );

  const patchShift = useCallback(
    (taskId: string, key: string, patch: Partial<HouseShift>) => {
      update((prev) => {
        const idx = prev.shifts.findIndex((x) => x.taskId === taskId && x.key === key);
        if (idx === -1) {
          return {
            ...prev,
            shifts: [
              ...prev.shifts,
              { taskId, key, status: 'open' as const, completedBy: null, completedAt: null, ...patch },
            ],
          };
        }
        const shifts = [...prev.shifts];
        shifts[idx] = { ...shifts[idx], ...patch };
        return { ...prev, shifts };
      });
    },
    [update],
  );

  const value = useMemo<HouseCtx>(() => ({
    s,
    me: s.members.find((m) => m.id === s.currentUserId) ?? s.members[0],
    memberById,
    isUnavailable,
    assignmentsFor,
    switchUser: (id) => update((p) => ({ ...p, currentUserId: id })),
    completeShift: (taskId, key) =>
      patchShift(taskId, key, {
        status: 'done',
        completedBy: s.currentUserId,
        completedAt: new Date().toISOString(),
      }),
    uncompleteShift: (taskId, key) =>
      patchShift(taskId, key, { status: 'open', completedBy: null, completedAt: null }),
    addTask: (input) =>
      update((p) => ({
        ...p,
        tasks: [
          ...p.tasks,
          {
            id: uid(),
            name: input.name.trim(),
            repeat: input.repeat,
            weekday: input.repeat === 'daily' ? null : input.weekday,
            time: input.time || null,
            rotation: p.members.map((m) => m.id),
            active: true,
          },
        ],
      })),
    addAvailability: (input) =>
      update((p) => ({
        ...p,
        availability: [
          ...p.availability,
          { id: uid(), memberId: p.currentUserId, ...input },
        ],
      })),
    removeAvailability: (id) =>
      update((p) => ({ ...p, availability: p.availability.filter((a) => a.id !== id) })),
    addListItem: (name) =>
      update((p) => ({
        ...p,
        list: [
          ...p.list,
          { id: uid(), name: name.trim(), status: 'needed', addedBy: p.currentUserId, boughtBy: null, boughtAt: null },
        ],
      })),
    buyItem: (id) =>
      update((p) => ({
        ...p,
        list: p.list.map((it) =>
          it.id === id
            ? { ...it, status: 'bought' as const, boughtBy: p.currentUserId, boughtAt: iso(today()) }
            : it,
        ),
      })),
    returnItem: (id) =>
      update((p) => ({
        ...p,
        list: p.list.map((it) =>
          it.id === id ? { ...it, status: 'needed' as const, boughtBy: null, boughtAt: null } : it,
        ),
      })),
    toggleInShopping: () =>
      update((p) => ({
        ...p,
        inShoppingBy: p.inShoppingBy === p.currentUserId ? null : p.currentUserId,
        inShoppingAt: p.inShoppingBy === p.currentUserId ? null : new Date().toISOString(),
      })),
    addExpense: (input) =>
      update((p) => ({
        ...p,
        expenses: [{ id: uid(), createdAt: iso(today()), ...input, description: input.description.trim() }, ...p.expenses],
      })),
    settleDebt: (fromId, toId, amount) =>
      update((p) => ({
        ...p,
        settlements: [
          ...p.settlements,
          { id: uid(), fromId, toId, amount, createdAt: iso(today()) },
        ],
      })),
    resetHouse: () => {
      const fresh = seedHouseState();
      setS(fresh);
      persist(fresh);
    },
  }), [s, memberById, isUnavailable, assignmentsFor, update, patchShift, persist]);

  return <HouseContext.Provider value={value}>{children}</HouseContext.Provider>;
}

export function useHouse(): HouseCtx {
  const ctx = useContext(HouseContext);
  if (!ctx) throw new Error('useHouse mora biti unutar HouseProvider-a');
  return ctx;
}

/** da li je "pasus" aktivan — za badge na Zadacima */
export function myActivePasus(s: HouseState): HouseAvailability | undefined {
  const t = today();
  return s.availability.find(
    (a) => a.memberId === s.currentUserId && parseISO(a.from) <= addDays(t, 30) && parseISO(a.to) >= t,
  );
}

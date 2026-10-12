/**
 * DoIT — House modul: React context stanje (kuća, zadaci, lista, troškovi, bodovi).
 *
 * V1 lokalno: localStorage per-user ključ + demo seed (radi i kao guest).
 * Faza 1 cloud: kada je korisnik prijavljen — kuća živi u Firestore kolekciji
 * `houses` (realtime pretplata + debounce upis), pozivni kod za pridruživanje.
 *
 * Pravila:
 *  - currentUserId je UREĐAJSKI (svaki uređaj "gleda" sebe) — na svaki cloud
 *    snapshot se nameće na identitet uređaja ako je član kuće.
 *  - Upis celog dokumenta (LWW) — dovoljno za kuću od 3-5 ljudi (v1).
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
import {
  createCloudHouse,
  findCloudHousesForUser,
  joinCloudHouse,
  leaveCloudHouse,
  pushHouseState,
  subscribeHouseDoc,
  type HouseIdentity,
} from './cloud';
import type { HouseAvailability, HouseMember, HouseRepeat, HouseShift, HouseState, HouseTask } from './types';

const STORAGE_KEY_PREFIX = 'doit_house_v1';
const META_KEY_PREFIX = 'doit_house_meta_v1';
const BACKUP_KEY_PREFIX = 'doit_house_backup_v1';

/** "u kupovini sam" traje 2 sata, pa se automatski oslobađa */
const SHOPPING_STATUS_TTL_MS = 2 * 60 * 60 * 1000;

/** debounce pre cloud upisa */
const PUSH_DEBOUNCE_MS = 600;

export type HouseSyncStatus = 'local' | 'connecting' | 'live' | 'error';
export type JoinResult = 'joined' | 'not-found' | 'error';

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

  // Cloud (Faza 1)
  identity: HouseIdentity | null;
  setIdentity: (id: HouseIdentity | null) => void;
  houseId: string | null;
  syncStatus: HouseSyncStatus;
  cloudBusy: boolean;
  cloudError: string | null;
  createHouse: (name: string) => Promise<boolean>;
  joinHouse: (code: string) => Promise<JoinResult>;
  leaveHouse: () => Promise<void>;
};

const HouseContext = createContext<HouseCtx | null>(null);

/* ===== storage pomoćne ===== */

function storageKey(userId?: string): string {
  return userId ? `${STORAGE_KEY_PREFIX}_${userId}` : STORAGE_KEY_PREFIX;
}

function metaKey(userId?: string): string {
  return userId ? `${META_KEY_PREFIX}_${userId}` : META_KEY_PREFIX;
}

function backupKey(userId: string): string {
  return `${BACKUP_KEY_PREFIX}_${userId}`;
}

function loadState(userId?: string): HouseState {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && parsed.house) return parsed as HouseState;
    }
  } catch {
    // pokvaren storage — pad na seed
  }
  return seedHouseState();
}

function persistState(userId: string | undefined, state: HouseState): void {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(state));
  } catch {
    // storage pun — ignoriši
  }
}

function loadMetaHouseId(userId?: string): string | null {
  try {
    const raw = localStorage.getItem(metaKey(userId));
    if (raw) return (JSON.parse(raw) as { houseId?: string | null }).houseId ?? null;
  } catch {
    // ignore
  }
  return null;
}

function saveMetaHouseId(userId: string, houseId: string | null): void {
  try {
    localStorage.setItem(metaKey(userId), JSON.stringify({ houseId }));
  } catch {
    // ignore
  }
}

function backupLocal(userId: string, state: HouseState): void {
  try {
    localStorage.setItem(backupKey(userId), JSON.stringify(state));
  } catch {
    // ignore
  }
}

function restoreBackup(userId: string): HouseState {
  try {
    const raw = localStorage.getItem(backupKey(userId));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && parsed.house) return parsed as HouseState;
    }
  } catch {
    // ignore
  }
  return seedHouseState();
}

/* ===== izvedene funkcije ===== */

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

/* ===== provider ===== */

export function HouseProvider({ children }: { children: ReactNode }) {
  const [identity, setIdentityState] = useState<HouseIdentity | null>(null);
  const [s, setS] = useState<HouseState>(() => loadState(undefined));
  const [houseId, setHouseIdState] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<HouseSyncStatus>('local');
  const [cloudBusy, setCloudBusy] = useState(false);
  const [cloudError, setCloudError] = useState<string | null>(null);

  // ref-ovi za stable callback-e (debounce, push)
  const sRef = useRef(s);
  const houseIdRef = useRef<string | null>(houseId);
  const identityRef = useRef<HouseIdentity | null>(identity);
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { sRef.current = s; }, [s]);
  useEffect(() => { houseIdRef.current = houseId; }, [houseId]);
  useEffect(() => { identityRef.current = identity; }, [identity]);

  const activeUid = identity?.uid ?? null;

  /** jedinstvena tačka primene stanja (optimistično + ref) */
  const applyState = useCallback((next: HouseState) => {
    sRef.current = next;
    setS(next);
    persistState(identityRef.current?.uid, next);
  }, []);

  const applyHouseId = useCallback((id: string | null) => {
    houseIdRef.current = id;
    setHouseIdState(id);
  }, []);

  /* --- identitet (poziva App posle authReady) --- */
  const setIdentity = useCallback((id: HouseIdentity | null) => {
    setIdentityState(id);
  }, []);

  /* --- učitavanje stanja/metа pri promeni identiteta + otkrivanje postojeće kuće --- */
  useEffect(() => {
    const key = activeUid ?? undefined;
    const local = loadState(key);
    sRef.current = local;
    setS(local);
    const meta = loadMetaHouseId(key);
    houseIdRef.current = meta;
    setHouseIdState(meta);

    if (activeUid && !meta) {
      let stale = false;
      findCloudHousesForUser(activeUid)
        .then((houses) => {
          if (stale || houses.length === 0) return;
          const found = houses[0];
          saveMetaHouseId(activeUid, found.houseId);
          houseIdRef.current = found.houseId;
          setHouseIdState(found.houseId);
          sRef.current = found.state;
          setS(found.state);
        })
        .catch(() => {
          // offline / pravila — kuća ostaje lokalna
        });
      return () => { stale = true; };
    }
    return undefined;
  }, [activeUid]);

  /* --- realtime pretplata na cloud kuću --- */
  useEffect(() => {
    if (!activeUid || !houseId) {
      setSyncStatus('local');
      return undefined;
    }
    setSyncStatus('connecting');
    const unsub = subscribeHouseDoc(
      houseId,
      (remote) => {
        const isMember = remote.members.some((m) => m.id === activeUid);
        const next: HouseState = {
          ...remote,
          currentUserId: isMember ? activeUid : remote.currentUserId,
        };
        sRef.current = next;
        setS(next);
        persistState(activeUid, next);
        setSyncStatus('live');
      },
      (err) => {
        if (err.message === 'house-deleted') {
          saveMetaHouseId(activeUid, null);
          houseIdRef.current = null;
          setHouseIdState(null);
          setSyncStatus('local');
        } else {
          setSyncStatus('error');
        }
      },
    );
    return () => {
      unsub();
      if (pushTimer.current) {
        clearTimeout(pushTimer.current);
        pushTimer.current = null;
      }
    };
  }, [activeUid, houseId]);

  /* --- debounce cloud push --- */
  const schedulePush = useCallback((state: HouseState) => {
    const hid = houseIdRef.current;
    if (!hid) return;
    if (pushTimer.current) clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(() => {
      pushTimer.current = null;
      pushHouseState(hid, state).catch((err) => {
        console.warn('[House] Push failed:', err);
        setSyncStatus((prev) => (prev === 'live' ? 'error' : prev));
      });
    }, PUSH_DEBOUNCE_MS);
  }, []);

  /* --- istek "u kupovini sam" (2h) --- */
  useEffect(() => {
    if (s.inShoppingBy && s.inShoppingAt) {
      const age = Date.now() - new Date(s.inShoppingAt).getTime();
      if (age > SHOPPING_STATUS_TTL_MS) {
        const cleared = { ...s, inShoppingBy: null, inShoppingAt: null };
        sRef.current = cleared;
        setS(cleared);
        persistState(activeUid ?? undefined, cleared);
        schedulePush(cleared);
      }
    }
  }, [s, activeUid, schedulePush]);

  /* --- lokalna izmena: primeni + sačuvaj + (ako je cloud) odloži push --- */
  const update = useCallback(
    (fn: (prev: HouseState) => HouseState) => {
      const next = fn(sRef.current);
      applyState(next);
      schedulePush(next);
    },
    [applyState, schedulePush],
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

  /* --- cloud akcije --- */

  const createHouse = useCallback(
    async (name: string): Promise<boolean> => {
      const ident = identityRef.current;
      if (!ident) {
        setCloudError('Prijavi se da bi napravio/la kuću.');
        return false;
      }
      setCloudBusy(true);
      setCloudError(null);
      try {
        if (!houseIdRef.current) backupLocal(ident.uid, sRef.current);
        const created = await createCloudHouse(name, ident);
        saveMetaHouseId(ident.uid, created.houseId);
        applyHouseId(created.houseId);
        applyState(created.state);
        return true;
      } catch (err) {
        console.warn('[House] create failed:', err);
        setCloudError('Nije uspelo da se napravi kuća — proveri vezu i pokušaj ponovo.');
        return false;
      } finally {
        setCloudBusy(false);
      }
    },
    [applyHouseId, applyState],
  );

  const joinHouse = useCallback(
    async (code: string): Promise<JoinResult> => {
      const ident = identityRef.current;
      if (!ident) {
        setCloudError('Prijavi se da bi se pridružio/la kući.');
        return 'error';
      }
      if (!code.trim()) {
        setCloudError('Upiši pozivni kod.');
        return 'error';
      }
      setCloudBusy(true);
      setCloudError(null);
      try {
        const joined = await joinCloudHouse(code, ident);
        if (!joined) {
          setCloudError('Kuća sa tim kodom ne postoji. Proveri kod i pokušaj ponovo.');
          return 'not-found';
        }
        if (!houseIdRef.current) backupLocal(ident.uid, sRef.current);
        saveMetaHouseId(ident.uid, joined.houseId);
        applyHouseId(joined.houseId);
        applyState(joined.state);
        return 'joined';
      } catch (err) {
        console.warn('[House] join failed:', err);
        setCloudError('Nije uspelo pridruživanje — proveri vezu i pokušaj ponovo.');
        return 'error';
      } finally {
        setCloudBusy(false);
      }
    },
    [applyHouseId, applyState],
  );

  const leaveHouse = useCallback(async (): Promise<void> => {
    const ident = identityRef.current;
    const hid = houseIdRef.current;
    if (!ident || !hid) return;
    setCloudBusy(true);
    setCloudError(null);
    try {
      await leaveCloudHouse(hid, ident.uid);
    } catch (err) {
      console.warn('[House] leave failed:', err);
      setCloudError('Nije uspelo napuštanje kuće — proveri vezu.');
    } finally {
      setCloudBusy(false);
    }
    saveMetaHouseId(ident.uid, null);
    applyHouseId(null);
    const restored = restoreBackup(ident.uid);
    applyState(restored);
    setSyncStatus('local');
  }, [applyHouseId, applyState]);

  /* --- reads --- */

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
        completedBy: sRef.current.currentUserId,
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
      applyState(fresh);
      if (houseIdRef.current) schedulePush(fresh);
    },

    // Cloud
    identity,
    setIdentity,
    houseId,
    syncStatus,
    cloudBusy,
    cloudError,
    createHouse,
    joinHouse,
    leaveHouse,
  }), [
    s, memberById, isUnavailable, assignmentsFor, update, patchShift,
    applyState, schedulePush, identity, setIdentity, houseId, syncStatus,
    cloudBusy, cloudError, createHouse, joinHouse, leaveHouse,
  ]);

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

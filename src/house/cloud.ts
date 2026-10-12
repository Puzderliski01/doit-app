/**
 * DoIT — House modul: Firestore cloud sloj (Faza 1).
 *
 * Šema: kolekcija `houses` — jedan dokument = ceo HouseState + denormalizovana
 * polja `inviteCode` (pretraga po kodu) i `memberUids` (otkrivanje kuće po članu).
 * Obrađuje isto kao postojeće Groups funkcije u src/firebase.ts (createGroup/joinGroup).
 *
 * Napomena za rules (firestore.rules): match /houses/{id} — auth required (kao groups).
 */
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { HouseMember, HouseState } from './types';

export interface HouseIdentity {
  uid: string;
  displayName: string | null;
  email: string | null;
}

/** Dokument u Firestore = stanje kuće + polja za pretragu */
type HouseDoc = HouseState & {
  inviteCode: string;
  memberUids: string[];
  createdAt: string;
  updatedAt: string;
};

const EMOJI_POOL = ['🦩', '🐻', '🐱', '🦊', '🦉', '🐸', '🦁', '🐼', '🐧', '🐨', '🐯', '🐰'];

/** deterministički emoji iz uid-a — svaki član dobija svoj */
function emojiFor(uid: string): string {
  let h = 0;
  for (let i = 0; i < uid.length; i++) h = (h * 31 + uid.charCodeAt(i)) >>> 0;
  return EMOJI_POOL[h % EMOJI_POOL.length];
}

export function memberFromIdentity(identity: HouseIdentity, role: HouseMember['role']): HouseMember {
  return {
    id: identity.uid,
    name: identity.displayName || identity.email?.split('@')[0] || 'Korisnik',
    emoji: emojiFor(identity.uid),
    role,
  };
}

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // bez lako zamenjivih (0/O, 1/I)
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function toDoc(state: HouseState, createdAt?: string): HouseDoc {
  const now = new Date().toISOString();
  return {
    ...state,
    inviteCode: state.house.inviteCode,
    memberUids: state.members.map((m) => m.id),
    createdAt: createdAt ?? now,
    updatedAt: now,
  };
}

function fromDoc(id: string, data: HouseDoc): { houseId: string; state: HouseState } {
  const { inviteCode, memberUids, createdAt: _c, updatedAt: _u, ...state } = data;
  return { houseId: id, state: state as HouseState };
}

/** Napravi novu kuću u cloudu — kreator je jedini član (host). */
export async function createCloudHouse(
  name: string,
  identity: HouseIdentity,
): Promise<{ houseId: string; state: HouseState }> {
  const ref = doc(collection(db, 'houses'));
  const host = memberFromIdentity(identity, 'host');
  const state: HouseState = {
    house: { name: name.trim() || 'Naša kuća', inviteCode: generateInviteCode() },
    members: [host],
    currentUserId: identity.uid,
    tasks: [],
    shifts: [],
    availability: [],
    list: [],
    shoppingTurnMemberId: identity.uid,
    inShoppingBy: null,
    inShoppingAt: null,
    expenses: [],
    settlements: [],
  };
  await setDoc(ref, toDoc(state));
  return { houseId: ref.id, state };
}

/** Nađi kuću po pozivnom kodu i pridruži se (dodaj člana). null = nepostojeći kod. */
export async function joinCloudHouse(
  code: string,
  identity: HouseIdentity,
): Promise<{ houseId: string; state: HouseState } | null> {
  const normalized = code.trim().toUpperCase();
  const q = query(collection(db, 'houses'), where('inviteCode', '==', normalized));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  const { houseId, state } = fromDoc(d.id, d.data() as HouseDoc);

  const existing = state.members.find((m) => m.id === identity.uid);
  if (existing) return { houseId, state: { ...state, currentUserId: identity.uid } };

  const members = [...state.members, memberFromIdentity(identity, 'member')];
  const next: HouseState = { ...state, members, currentUserId: identity.uid };
  await updateDoc(doc(db, 'houses', houseId), {
    members,
    memberUids: members.map((m) => m.id),
    updatedAt: new Date().toISOString(),
  });
  return { houseId, state: next };
}

/** Napusti kuću — poslednji član briše dokument (i kuću). */
export async function leaveCloudHouse(houseId: string, uid: string): Promise<void> {
  const ref = doc(db, 'houses', houseId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const { state } = fromDoc(snap.id, snap.data() as HouseDoc);
  const members = state.members.filter((m) => m.id !== uid);
  if (members.length === 0) {
    await deleteDoc(ref);
    return;
  }
  await updateDoc(ref, {
    members,
    memberUids: members.map((m) => m.id),
    updatedAt: new Date().toISOString(),
  });
}

/** Otkrij kući kojima korisnik pripada (npr. login na drugom uređaju). */
export async function findCloudHousesForUser(uid: string): Promise<{ houseId: string; state: HouseState }[]> {
  const q = query(collection(db, 'houses'), where('memberUids', 'array-contains', uid));
  const snap = await getDocs(q);
  return snap.docs.map((d) => fromDoc(d.id, d.data() as HouseDoc));
}

/**
 * Realtime pretplata na kuću. Poziva onUpdate sa punim stanjem (uključujući
 * naš sopstveni echo — aplikacija mora biti idempotentna; currentUserId se
 * nameće na identitet uređaja prilikom primene).
 * Poziva onError ako dokument ne postoji (obrisan) ili je pretplata pala.
 */
export function subscribeHouseDoc(
  houseId: string,
  onUpdate: (state: HouseState) => void,
  onError?: (err: Error) => void,
): () => void {
  return onSnapshot(
    doc(db, 'houses', houseId),
    (snap) => {
      if (!snap.exists()) {
        onError?.(new Error('house-deleted'));
        return;
      }
      onUpdate(fromDoc(snap.id, snap.data() as HouseDoc).state);
    },
    (err) => {
      console.warn('[House] Subscription error:', err);
      onError?.(err instanceof Error ? err : new Error(String(err)));
    },
  );
}

/** Upis celog stanja u cloud (debounce radi u store-u; LWW po dokumentu). */
export async function pushHouseState(houseId: string, state: HouseState): Promise<void> {
  const ref = doc(db, 'houses', houseId);
  let createdAt: string | undefined;
  try {
    const prev = await getDoc(ref);
    createdAt = (prev.data() as { createdAt?: string } | undefined)?.createdAt;
  } catch {
    createdAt = undefined;
  }
  await setDoc(ref, toDoc(state, createdAt));
}

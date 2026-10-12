/**
 * DoIT — House (Kuća) modul
 * Deljeni dom: zadaci po smeni (rotacija), pasus, lista za kupovinu, troškovi, bodovi.
 * Portano iz "Project BetterMe" (Naša kuća) — vidi archive/Project BetterMe/SPEC-MVP.md
 */

export type HouseRepeat = 'daily' | 'weekly' | 'biweekly';

export interface HouseMember {
  id: string;
  name: string;
  emoji: string;
  role: 'host' | 'member';
}

export interface HouseTask {
  id: string;
  name: string;
  repeat: HouseRepeat;
  /** 0 = ponedeljak ... 6 = nedelja (samo za weekly/biweekly) */
  weekday: number | null;
  /** "18:00" — opcionalno */
  time: string | null;
  /** redosled rotacije (member ids) */
  rotation: string[];
  active: boolean;
}

export type ShiftStatus = 'open' | 'done' | 'skipped';

export interface HouseShift {
  taskId: string;
  /** period key: yyyy-mm-dd (daily) ili pocetak nedelje (weekly/biweekly) */
  key: string;
  status: ShiftStatus;
  completedBy: string | null;
  completedAt: string | null; // ISO
}

export interface HouseAvailability {
  id: string;
  memberId: string;
  from: string; // yyyy-mm-dd
  to: string; // yyyy-mm-dd
  reason: string | null;
}

export interface ShoppingListItem {
  id: string;
  name: string;
  status: 'needed' | 'bought';
  addedBy: string;
  boughtBy: string | null;
  boughtAt: string | null; // yyyy-mm-dd
}

export interface HouseExpense {
  id: string;
  description: string;
  /** ceo broj dinara */
  amount: number;
  paidBy: string;
  createdAt: string; // yyyy-mm-dd
}

export interface HouseSettlement {
  id: string;
  fromId: string;
  toId: string;
  amount: number;
  createdAt: string; // yyyy-mm-dd
}

export interface HouseState {
  house: { name: string; inviteCode: string };
  members: HouseMember[];
  currentUserId: string;
  tasks: HouseTask[];
  shifts: HouseShift[];
  availability: HouseAvailability[];
  list: ShoppingListItem[];
  /** ko je na redu za kupovinu ove nedelje + ko je trenutno u marketu */
  shoppingTurnMemberId: string;
  inShoppingBy: string | null;
  inShoppingAt: string | null; // ISO timestamp
  expenses: HouseExpense[];
  settlements: HouseSettlement[];
}

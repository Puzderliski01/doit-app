/**
 * DoIT — House modul: demo kuća (generiše se relativno u odnosu na danas).
 * Portano iz Project BetterMe/src/lib/seed.ts
 */
import { addDays, iso, uid, weekStart } from './dates';
import type { HouseShift, HouseState } from './types';

export function seedHouseState(): HouseState {
  const t = new Date();
  const monday = weekStart(t);

  const ana = 'ana';
  const marko = 'marko';
  const jelena = 'jelena';

  const tasks: HouseState['tasks'] = [
    {
      id: 't-smece',
      name: 'Iznošenje smeća',
      repeat: 'weekly',
      weekday: 0,
      time: '18:00',
      rotation: [ana, marko, jelena],
      active: true,
    },
    {
      id: 't-usis',
      name: 'Usisavanje',
      repeat: 'weekly',
      weekday: 2,
      time: null,
      rotation: [jelena, ana, marko],
      active: true,
    },
    {
      id: 't-sudovi',
      name: 'Pranje sudova',
      repeat: 'daily',
      weekday: null,
      time: '20:00',
      rotation: [marko, jelena, ana],
      active: true,
    },
    {
      id: 't-kupovina',
      name: 'Velika kupovina',
      repeat: 'biweekly',
      weekday: 5,
      time: null,
      rotation: [ana, marko, jelena],
      active: true,
    },
  ];

  // istorija: protekle 4 nedelje delimično završene smene, da bodovi deluju stvarno
  const shifts: HouseShift[] = [];
  for (let w = 1; w <= 4; w++) {
    const ws = addDays(monday, -7 * w);
    const push = (taskId: string, member: string, dayOffset: number, hour: number) => {
      shifts.push({
        taskId,
        key: iso(ws),
        status: 'done',
        completedBy: member,
        completedAt: addDays(ws, dayOffset).toISOString().replace('T00:00', `T${String(hour).padStart(2, '0')}:20`),
      });
    };
    push('t-smece', w % 3 === 1 ? marko : w % 3 === 2 ? jelena : ana, 0, 18);
    push('t-usis', w % 3 === 1 ? jelena : w % 3 === 2 ? ana : marko, 2, 11);
    push('t-sudovi', [marko, jelena, ana][w % 3], 4, 20);
    if (w === 2) push('t-kupovina', ana, 5, 13);
  }

  return {
    house: { name: 'Stan na Vračaru', inviteCode: 'K3H9XA' },
    members: [
      { id: ana, name: 'Ana', emoji: '🦩', role: 'host' },
      { id: marko, name: 'Marko', emoji: '🐻', role: 'member' },
      { id: jelena, name: 'Jelena', emoji: '🐱', role: 'member' },
    ],
    currentUserId: marko,
    tasks,
    shifts,
    availability: [],
    list: [
      { id: uid(), name: 'Mleko', status: 'needed', addedBy: jelena, boughtBy: null, boughtAt: null },
      { id: uid(), name: 'Hleb', status: 'needed', addedBy: ana, boughtBy: null, boughtAt: null },
      { id: uid(), name: 'Jaja', status: 'needed', addedBy: marko, boughtBy: null, boughtAt: null },
      { id: uid(), name: 'Kafa', status: 'needed', addedBy: jelena, boughtBy: null, boughtAt: null },
      {
        id: uid(),
        name: 'Jogurt',
        status: 'bought',
        addedBy: ana,
        boughtBy: marko,
        boughtAt: iso(t),
      },
    ],
    shoppingTurnMemberId: marko,
    inShoppingBy: null,
    inShoppingAt: null,
    expenses: [
      { id: uid(), description: 'Struja, prethodni mesec', amount: 4860, paidBy: ana, createdAt: iso(addDays(t, -9)) },
      { id: uid(), description: 'Internet', amount: 2400, paidBy: marko, createdAt: iso(addDays(t, -6)) },
      { id: uid(), description: 'Deterdžent i sredstva', amount: 1340, paidBy: jelena, createdAt: iso(addDays(t, -2)) },
    ],
    settlements: [],
  };
}

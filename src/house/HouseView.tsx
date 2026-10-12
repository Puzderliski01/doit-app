/**
 * DoIT — House (Kuća) modul: glavni pogled sa 4 pod-taba.
 * Danas · Zadaci · Lista · Kuća — portano iz Project BetterMe (Naša kuća),
 * prilagođeno DoIT dizajn sistemu (dark/light tema, neon akcenat).
 */
import React, { useState } from 'react';
import { Check, Copy, Crown, House, ListChecks, Plus, RotateCcw, ShoppingBag, ShoppingCart, X } from 'lucide-react';
import {
  DAN,
  DAN_KRATKO,
  addDays,
  assigneeOn,
  fmtDinars,
  fmtDate,
  fmtShort,
  iso,
  occursOn,
  repeatLabel,
  today,
  weekStart,
} from './dates';
import { monthlyScores, myActivePasus, pairwiseDebts, useHouse } from './store';
import type { HouseMember, HouseRepeat } from './types';
import { haptic } from '../utils/haptics';

interface HouseViewProps {
  theme: 'dark' | 'light';
}

/* ===== Mala UI pomoćna, u DoIT stilu ===== */

const HouseAvatar = ({ member, size = 36, isLight }: { member: HouseMember; size?: number; isLight: boolean }) => (
  <span
    className={`inline-flex shrink-0 items-center justify-center rounded-full ring-1 ${
      isLight ? 'bg-white ring-black/10' : 'bg-white/10 ring-white/10'
    }`}
    style={{ width: size, height: size, fontSize: size * 0.55 }}
    title={member.name}
  >
    {member.emoji}
  </span>
);

const HouseCard = ({
  title,
  children,
  action,
  isLight,
}: {
  title?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  isLight: boolean;
}) => (
  <section className={isLight ? 'card-light p-4' : 'card-dark p-4'}>
    {(title || action) && (
      <div className="mb-3 flex items-center justify-between">
        {title && (
          <h2 className={`text-[13px] font-semibold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
            {title}
          </h2>
        )}
        {action}
      </div>
    )}
    {children}
  </section>
);

const HouseEmpty = ({ children, isLight }: { children: React.ReactNode; isLight: boolean }) => (
  <p className={`py-2 text-sm ${isLight ? 'text-slate-400' : 'text-white/40'}`}>{children}</p>
);

const HousePill = ({
  children,
  tone = 'neutral',
  isLight,
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'done' | 'warn';
  isLight: boolean;
}) => {
  const tones = {
    neutral: isLight ? 'bg-slate-100 text-slate-500' : 'bg-white/5 text-white/50',
    done: isLight ? 'bg-green-50 text-green-600' : 'bg-[#c8ff00]/10 text-[#c8ff00]',
    warn: isLight ? 'bg-amber-50 text-amber-600' : 'bg-amber-500/10 text-amber-400',
  } as const;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
};

/* ===== Glavni pogled ===== */

type HouseTab = 'danas' | 'zadaci' | 'lista' | 'kuca';

export const HouseView: React.FC<HouseViewProps> = ({ theme }) => {
  const isLight = theme === 'light';
  const [tab, setTab] = useState<HouseTab>('danas');
  const {
    s,
    me,
    syncStatus,
    houseId,
    switchUser,
    addExpense,
    settleDebt,
    resetHouse,
  } = useHouse();

  const inputCls = isLight ? 'input-light' : 'input-dark';

  const syncBadge =
    syncStatus === 'live'
      ? { text: 'cloud ✅', cls: isLight ? 'bg-green-50 text-green-600' : 'bg-[#c8ff00]/10 text-[#c8ff00]' }
      : syncStatus === 'connecting'
        ? { text: 'povezujem…', cls: isLight ? 'bg-slate-100 text-slate-500' : 'bg-white/5 text-white/50' }
        : syncStatus === 'error'
          ? { text: 'greska ⚠️', cls: isLight ? 'bg-red-50 text-red-500' : 'bg-red-500/10 text-red-400' }
          : { text: 'lokalno 📱', cls: isLight ? 'bg-slate-100 text-slate-500' : 'bg-white/5 text-white/50' };

  return (
    <div className="space-y-4 pb-24">
      {/* Glava: ime kuće + tabovi */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <House className={`w-5 h-5 ${isLight ? 'text-slate-400' : 'text-white/40'}`} />
          <div>
            <h1 className={`text-xl font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>{s.house.name}</h1>
            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/40'}`}>
              {s.members.length} članova · ti si <span className="font-semibold">{me.name} {me.emoji}</span>
            </p>
          </div>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${syncBadge.cls}`}>{syncBadge.text}</span>
      </div>

      <div className="tab-group">
        {([
          { id: 'danas' as const, label: 'Danas', icon: <Check className="w-3.5 h-3.5" /> },
          { id: 'zadaci' as const, label: 'Zadaci', icon: <ListChecks className="w-3.5 h-3.5" /> },
          { id: 'lista' as const, label: 'Lista', icon: <ShoppingCart className="w-3.5 h-3.5" /> },
          { id: 'kuca' as const, label: 'Kuća', icon: <House className="w-3.5 h-3.5" /> },
        ]).map((tb) => (
          <button
            key={tb.id}
            onClick={() => {
              haptic.lightTap();
              setTab(tb.id);
            }}
            className={`tab-item ${tab === tb.id ? 'active' : ''}`}
          >
            {tb.icon}
            {tb.label}
          </button>
        ))}
      </div>

      {/* ===== DANAS ===== */}
      {tab === 'danas' && <DanasTab isLight={isLight} inputCls={inputCls} onOpenLista={() => setTab('lista')} />}

      {/* ===== ZADACI ===== */}
      {tab === 'zadaci' && <ZadaciTab isLight={isLight} inputCls={inputCls} />}

      {/* ===== LISTA ===== */}
      {tab === 'lista' && <ListaTab isLight={isLight} inputCls={inputCls} />}

      {/* ===== KUĆA ===== */}
      {tab === 'kuca' && (
        <KucaTab
          isLight={isLight}
          inputCls={inputCls}
          switchUser={switchUser}
          addExpense={addExpense}
          settleDebt={settleDebt}
          resetHouse={resetHouse}
        />
      )}
    </div>
  );
};

/* ===== Tab: Danas ===== */

const DanasTab = ({
  isLight,
  inputCls,
  onOpenLista,
}: {
  isLight: boolean;
  inputCls: string;
  onOpenLista: () => void;
}) => {
  const { s, me, memberById, assignmentsFor, completeShift, uncompleteShift, addListItem, buyItem } = useHouse();
  const [novi, setNovi] = useState('');

  const t = today();
  const all = assignmentsFor(t);
  const mine = all.filter((a) => a.assigneeId === me.id);
  const others = all.filter((a) => a.assigneeId !== me.id);
  const needed = s.list.filter((i) => i.status === 'needed');

  const datum = fmtDate(t);
  const kapitalizovano = datum.charAt(0).toUpperCase() + datum.slice(1);

  return (
    <>
      <div>
        <p className={`text-sm ${isLight ? 'text-slate-500' : 'text-white/40'}`}>{kapitalizovano}</p>
        <h2 className={`text-lg font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
          {mine.length === 0 ? 'Nemaš zadataka 🎉' : `Tvoji zadaci, ${me.name}`}
        </h2>
      </div>

      <HouseCard title="Moji zadaci" isLight={isLight}>
        {mine.length === 0 && <HouseEmpty isLight={isLight}>Danas si slobodan/na. Uživaj — ili baci pogled šta drugi rade.</HouseEmpty>}
        <ul className="space-y-2">
          {mine.map((a) => {
            const done = a.status === 'done';
            return (
              <li
                key={a.task.id}
                className={`flex items-center gap-3 rounded-xl border p-3 ${
                  isLight ? 'border-black/5 bg-slate-50/50' : 'border-white/5 bg-white/[0.02]'
                }`}
              >
                <button
                  onClick={() => {
                    haptic.mediumClick();
                    done ? uncompleteShift(a.task.id, a.key) : completeShift(a.task.id, a.key);
                  }}
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition ${
                    done
                      ? 'border-[#c8ff00] bg-[#c8ff00] text-[#0a0a0a]'
                      : isLight
                        ? 'border-slate-200 text-transparent hover:border-[#c8ff00]'
                        : 'border-white/15 text-transparent hover:border-[#c8ff00]'
                  }`}
                  aria-label={done ? 'Poništi' : 'Završi zadatak'}
                >
                  <Check size={18} strokeWidth={3} />
                </button>
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-sm font-semibold ${done ? (isLight ? 'text-slate-400 line-through' : 'text-white/40 line-through') : isLight ? 'text-slate-900' : 'text-white'}`}>
                    {a.task.name}
                  </p>
                  <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/40'}`}>
                    {a.task.time ? `u ${a.task.time}` : 'tokom dana'}
                    {done && a.completedBy === me.id ? ' · +10 bodova 🎉' : ''}
                  </p>
                </div>
                {done && <HousePill tone="done" isLight={isLight}>gotovo</HousePill>}
              </li>
            );
          })}
        </ul>
      </HouseCard>

      <HouseCard title="Ostali danas" isLight={isLight}>
        {others.length === 0 && <HouseEmpty isLight={isLight}>Niko drugi nema zadatak danas.</HouseEmpty>}
        <ul className="space-y-2">
          {others.map((a) => {
            const m = a.assigneeId ? memberById(a.assigneeId) : null;
            const done = a.status === 'done';
            return (
              <li
                key={a.task.id}
                className={`flex items-center gap-3 rounded-xl border p-3 ${
                  isLight ? 'border-black/5 bg-slate-50/50' : 'border-white/5 bg-white/[0.02]'
                }`}
              >
                {m ? <HouseAvatar member={m} size={30} isLight={isLight} /> : <span className="text-lg">🏖️</span>}
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-sm font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>{a.task.name}</p>
                  <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/40'}`}>{m ? m.name : 'svi na pasusu'}</p>
                </div>
                {done ? (
                  <HousePill tone="done" isLight={isLight}>
                    <Check size={12} /> završio/la
                  </HousePill>
                ) : m ? (
                  <HousePill isLight={isLight}>čeka</HousePill>
                ) : (
                  <HousePill tone="warn" isLight={isLight}>niko</HousePill>
                )}
              </li>
            );
          })}
        </ul>
      </HouseCard>

      <HouseCard
        title={`Lista za kupovinu · ${needed.length}`}
        isLight={isLight}
        action={
          <button onClick={onOpenLista} className="flex items-center gap-1 text-xs font-semibold text-[#c8ff00]">
            <ShoppingCart size={14} /> otvori
          </button>
        }
      >
        <form
          className="mb-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (novi.trim()) {
              addListItem(novi);
              setNovi('');
            }
          }}
        >
          <input
            className={inputCls}
            placeholder="Dodaj na listu… (npr. mleko)"
            value={novi}
            onChange={(e) => setNovi(e.target.value)}
          />
          <button type="submit" className="btn-primary px-3" aria-label="Dodaj">
            <Plus size={18} />
          </button>
        </form>
        <ul className="space-y-1.5">
          {needed.slice(0, 4).map((it) => (
            <li key={it.id} className="flex items-center gap-2.5 text-sm">
              <button
                onClick={() => buyItem(it.id)}
                className={`h-5 w-5 shrink-0 rounded-full border-2 transition hover:border-[#c8ff00] ${
                  isLight ? 'border-slate-200' : 'border-white/15'
                }`}
                aria-label={`Kupljeno: ${it.name}`}
              />
              <span className={`flex-1 truncate ${isLight ? 'text-slate-700' : 'text-white/80'}`}>{it.name}</span>
              <HouseAvatar member={memberById(it.addedBy) ?? s.members[0]} size={22} isLight={isLight} />
            </li>
          ))}
          {needed.length === 0 && <HouseEmpty isLight={isLight}>Prazna lista — ko kupuje danas? 🛒</HouseEmpty>}
        </ul>
      </HouseCard>
    </>
  );
};

/* ===== Tab: Zadaci ===== */

const ZadaciTab = ({ isLight, inputCls }: { isLight: boolean; inputCls: string }) => {
  const { s, me, memberById, assignmentsFor, completeShift, uncompleteShift, addTask, addAvailability, removeAvailability } =
    useHouse();
  const [selected, setSelected] = useState(() => today());
  const [showForm, setShowForm] = useState(false);
  const [showPasus, setShowPasus] = useState(false);

  const [ime, setIme] = useState('');
  const [repeat, setRepeat] = useState<HouseRepeat>('weekly');
  const [weekday, setWeekday] = useState(0);
  const [time, setTime] = useState('');

  const [from, setFrom] = useState(() => iso(today()));
  const [to, setTo] = useState(() => iso(addDays(today(), 3)));
  const [reason, setReason] = useState('');

  const monday = weekStart(today());
  const week = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  const rows = assignmentsFor(selected);
  const pasus = myActivePasus(s);

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className={`text-lg font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>Zadaci</h2>
        <button className="btn-primary" onClick={() => { haptic.lightTap(); setShowForm((v) => !v); }}>
          <Plus size={16} /> Novi zadatak
        </button>
      </div>

      {showForm && (
        <HouseCard title="Novi zadatak" isLight={isLight}>
          <form
            className="space-y-2.5"
            onSubmit={(e) => {
              e.preventDefault();
              if (!ime.trim()) return;
              addTask({ name: ime, repeat, weekday, time });
              setIme('');
              setTime('');
              setShowForm(false);
            }}
          >
            <input className={inputCls} placeholder="Šta se radi? (npr. iznošenje smeća)" value={ime} onChange={(e) => setIme(e.target.value)} />
            <div className="flex gap-2">
              <select className={inputCls} value={repeat} onChange={(e) => setRepeat(e.target.value as HouseRepeat)}>
                <option value="daily">svaki dan</option>
                <option value="weekly">nedeljno</option>
                <option value="biweekly">dvonedeljno</option>
              </select>
              {repeat !== 'daily' && (
                <select className={inputCls} value={weekday} onChange={(e) => setWeekday(Number(e.target.value))}>
                  {DAN.map((d, i) => (
                    <option key={d} value={i}>
                      {d}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <input className={inputCls} type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            <p className={`text-xs ${isLight ? 'text-slate-400' : 'text-white/30'}`}>
              Svi članovi kuće rotiraju se po krugu — app sam preskače one na pasusu.
            </p>
            <button type="submit" className="btn-primary w-full">
              Sačuvaj zadatak
            </button>
          </form>
        </HouseCard>
      )}

      <div className="flex gap-1.5">
        {week.map((d, i) => {
          const isToday = iso(d) === iso(today());
          const isSelected = iso(d) === iso(selected);
          const count = s.tasks.filter((task) => occursOn(task, d)).length;
          return (
            <button
              key={iso(d)}
              onClick={() => setSelected(d)}
              className={`flex flex-1 flex-col items-center rounded-xl border py-2 transition ${
                isSelected
                  ? 'border-[#c8ff00] bg-[#c8ff00] text-[#0a0a0a]'
                  : isLight
                    ? 'border-black/5 bg-white text-slate-900'
                    : 'border-white/5 bg-white/[0.03] text-white'
              }`}
            >
              <span className={`text-[10px] font-medium uppercase ${isSelected ? 'text-[#0a0a0a]/70' : isLight ? 'text-slate-400' : 'text-white/40'}`}>
                {DAN_KRATKO[i]}
              </span>
              <span className="text-sm font-bold">{d.getDate()}</span>
              <span className={`h-1 w-1 rounded-full ${count ? (isSelected ? 'bg-[#0a0a0a]' : 'bg-[#c8ff00]') : 'bg-transparent'}`} />
            </button>
          );
        })}
      </div>

      <HouseCard title={iso(selected) === iso(today()) ? 'Danas u kući' : fmtShort(selected)} isLight={isLight}>
        {rows.length === 0 && <HouseEmpty isLight={isLight}>Ovog dana nema zadataka.</HouseEmpty>}
        <ul className="space-y-2">
          {rows.map((a) => {
            const m = a.assigneeId ? memberById(a.assigneeId) : null;
            const mineRow = a.assigneeId === me.id;
            const done = a.status === 'done';
            return (
              <li
                key={a.task.id}
                className={`flex items-center gap-3 rounded-xl border p-3 ${
                  isLight ? 'border-black/5 bg-slate-50/50' : 'border-white/5 bg-white/[0.02]'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-sm font-semibold ${done ? (isLight ? 'text-slate-400 line-through' : 'text-white/40 line-through') : isLight ? 'text-slate-900' : 'text-white'}`}>
                    {a.task.name}
                  </p>
                  <p className={`flex items-center gap-1.5 text-xs ${isLight ? 'text-slate-500' : 'text-white/40'}`}>
                    {m ? (
                      <>
                        <HouseAvatar member={m} size={18} isLight={isLight} /> {m.name}
                      </>
                    ) : (
                      <>
                        <span>🏖️</span> svi na pasusu
                      </>
                    )}
                    {a.task.time && ` · u ${a.task.time}`}
                    {a.task.repeat !== 'daily' && ` · ${repeatLabel(a.task.repeat)}`}
                  </p>
                </div>
                {done ? (
                  <button
                    onClick={() => mineRow && uncompleteShift(a.task.id, a.key)}
                    className={`btn-secondary text-xs ${isLight ? 'text-green-600' : 'text-[#c8ff00]'}`}
                  >
                    <Check size={15} /> završeno
                  </button>
                ) : mineRow ? (
                  <button onClick={() => { haptic.mediumClick(); completeShift(a.task.id, a.key); }} className="btn-primary text-xs">
                    <Check size={15} /> Završi
                  </button>
                ) : (
                  <HousePill isLight={isLight}>čeka</HousePill>
                )}
              </li>
            );
          })}
        </ul>
      </HouseCard>

      <HouseCard
        title="Pasus (odmor)"
        isLight={isLight}
        action={
          <button onClick={() => setShowPasus((v) => !v)} className="text-xs font-semibold text-[#c8ff00]">
            {showPasus ? 'zatvori' : '+ dodaj'}
          </button>
        }
      >
        {pasus && (
          <HousePill tone="warn" isLight={isLight}>
            🏖️ {fmtShort(new Date(pasus.from + 'T00:00'))} – {fmtShort(new Date(pasus.to + 'T00:00'))}
            {pasus.reason ? ` · ${pasus.reason}` : ''}
          </HousePill>
        )}
        {!pasus && !showPasus && (
          <HouseEmpty isLight={isLight}>Odsutan/na? Dodaj pasus i smene će automatski preći na sledećeg.</HouseEmpty>
        )}
        {showPasus && (
          <form
            className="mt-3 space-y-2.5"
            onSubmit={(e) => {
              e.preventDefault();
              if (from > to) return;
              addAvailability({ from, to, reason: reason || null });
              setReason('');
              setShowPasus(false);
            }}
          >
            <div className="flex gap-2">
              <label className="flex-1">
                <span className={`mb-1 block text-xs ${isLight ? 'text-slate-400' : 'text-white/30'}`}>od</span>
                <input className={inputCls} type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              </label>
              <label className="flex-1">
                <span className={`mb-1 block text-xs ${isLight ? 'text-slate-400' : 'text-white/30'}`}>do</span>
                <input className={inputCls} type="date" value={to} onChange={(e) => setTo(e.target.value)} />
              </label>
            </div>
            <input className={inputCls} placeholder="Razlog (opciono) — npr. odmor" value={reason} onChange={(e) => setReason(e.target.value)} />
            <button type="submit" className="btn-primary w-full">
              Sačuvaj pasus
            </button>
          </form>
        )}
        {s.availability.length > 0 && (
          <ul className={`mt-3 divide-y ${isLight ? 'divide-black/5' : 'divide-white/5'}`}>
            {s.availability.map((a) => {
              const m = memberById(a.memberId);
              return (
                <li key={a.id} className="flex items-center gap-2 py-2 text-sm">
                  {m && <HouseAvatar member={m} size={22} isLight={isLight} />}
                  <span className={`flex-1 ${isLight ? 'text-slate-700' : 'text-white/70'}`}>
                    {m?.name} · {fmtShort(new Date(a.from + 'T00:00'))}–{fmtShort(new Date(a.to + 'T00:00'))}
                  </span>
                  <button onClick={() => removeAvailability(a.id)} className={`${isLight ? 'text-slate-400 hover:text-slate-600' : 'text-white/30 hover:text-white/60'}`} aria-label="Ukloni">
                    <X size={15} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </HouseCard>

      <p className={`px-1 text-center text-xs ${isLight ? 'text-slate-400' : 'text-white/25'}`}>
        Rotacija za sledeće nedelje:{' '}
        {s.tasks[0] &&
          Array.from({ length: 4 }, (_, i) => {
            const d = addDays(monday, 7 * i);
            const id = assigneeOn(s.tasks[0], d, () => false);
            return `${fmtShort(d)} ${memberById(id ?? '')?.emoji ?? '—'}`;
          }).join('  ')}
      </p>
    </>
  );
};

/* ===== Tab: Lista ===== */

const ListaTab = ({ isLight, inputCls }: { isLight: boolean; inputCls: string }) => {
  const { s, me, memberById, addListItem, buyItem, returnItem, toggleInShopping, syncStatus } = useHouse();
  const [novi, setNovi] = useState('');

  const needed = s.list.filter((i) => i.status === 'needed');
  const bought = s.list.filter((i) => i.status === 'bought');
  const boughtToday = bought.filter((i) => i.boughtAt === iso(today()));
  const jaSamUKupovini = s.inShoppingBy === me.id;
  const nekoDrugJe = s.inShoppingBy && s.inShoppingBy !== me.id ? memberById(s.inShoppingBy) : null;
  const turn = memberById(s.shoppingTurnMemberId);

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className={`text-lg font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>Lista</h2>
        <HousePill isLight={isLight}>{needed.length} stavki</HousePill>
      </div>

      <button
        onClick={() => {
          haptic.mediumClick();
          toggleInShopping();
        }}
        className={`flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-4 text-sm font-bold transition active:scale-[0.99] ${
          jaSamUKupovini
            ? 'bg-[#c8ff00] text-[#0a0a0a]'
            : isLight
              ? 'bg-slate-900 text-white'
              : 'bg-white/10 text-white'
        }`}
      >
        <ShoppingBag size={18} />
        {jaSamUKupovini ? 'Tu sam — kupujem 🛒' : 'U kupovini sam'}
      </button>

      {nekoDrugJe && (
        <div className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${isLight ? 'bg-slate-100 text-slate-600' : 'bg-white/5 text-white/60'}`}>
          <HouseAvatar member={nekoDrugJe} size={22} isLight={isLight} />
          <span className="font-medium">{nekoDrugJe.name} je trenutno u marketu</span>
        </div>
      )}
      {turn && !nekoDrugJe && (
        <p className={`px-1 text-xs ${isLight ? 'text-slate-400' : 'text-white/30'}`}>
          Ove nedelje na redu za kupovinu: <span className={`font-semibold ${isLight ? 'text-slate-700' : 'text-white/80'}`}>{turn.emoji} {turn.name}</span>
        </p>
      )}

      <HouseCard title="Na listi" isLight={isLight}>
        <form
          className="mb-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (novi.trim()) {
              addListItem(novi);
              setNovi('');
            }
          }}
        >
          <input className={inputCls} placeholder="Šta fali? (npr. mleko)" value={novi} onChange={(e) => setNovi(e.target.value)} />
          <button type="submit" className="btn-primary px-3" aria-label="Dodaj">
            <Plus size={18} />
          </button>
        </form>
        <ul className="space-y-1.5">
          {needed.map((it) => (
            <li key={it.id} className="flex items-center gap-2.5 rounded-lg py-1.5">
              <button
                onClick={() => buyItem(it.id)}
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-transparent transition hover:border-[#c8ff00] ${
                  isLight ? 'border-slate-200' : 'border-white/15'
                }`}
                aria-label={`Kupljeno: ${it.name}`}
              >
                <Check size={12} strokeWidth={3} />
              </button>
              <span className={`flex-1 truncate text-sm ${isLight ? 'text-slate-700' : 'text-white/80'}`}>{it.name}</span>
              <HouseAvatar member={memberById(it.addedBy) ?? s.members[0]} size={22} isLight={isLight} />
            </li>
          ))}
        </ul>
        {needed.length === 0 && <HouseEmpty isLight={isLight}>Sve kupljeno — lista je prazna 🎉</HouseEmpty>}
      </HouseCard>

      <HouseCard title={`Kupljeno · ${boughtToday.length}`} isLight={isLight}>
        <ul className="space-y-1.5">
          {boughtToday.map((it) => {
            const by = it.boughtBy ? memberById(it.boughtBy) : null;
            return (
              <li key={it.id} className={`flex items-center gap-2.5 py-1.5 text-sm ${isLight ? 'text-slate-400' : 'text-white/40'}`}>
                <Check size={16} className="text-[#c8ff00]" strokeWidth={3} />
                <span className="flex-1 truncate line-through">{it.name}</span>
                {by && <HouseAvatar member={by} size={22} isLight={isLight} />}
                <button onClick={() => returnItem(it.id)} className="text-xs font-semibold text-[#c8ff00]" aria-label="Vrati">
                  <RotateCcw size={14} />
                </button>
              </li>
            );
          })}
        </ul>
        {boughtToday.length === 0 && <HouseEmpty isLight={isLight}>Još ništa nije kupljeno danas.</HouseEmpty>}
      </HouseCard>

      <p className={`px-1 text-center text-xs ${isLight ? 'text-slate-400' : 'text-white/25'}`}>
        <ShoppingCart size={12} className="mr-1 inline" />
        {syncStatus === 'live'
          ? 'Lista se vidi svima u kući — u realnom vremenu.'
          : 'Lista je za sada samo na ovom uređaju — napravi cloud kuću da je deliš.'}
      </p>
    </>
  );
};

/* ===== Tab: Kuća ===== */

const KucaTab = ({
  isLight,
  inputCls,
  switchUser,
  addExpense,
  settleDebt,
  resetHouse,
}: {
  isLight: boolean;
  inputCls: string;
  switchUser: (id: string) => void;
  addExpense: (input: { description: string; amount: number; paidBy: string }) => void;
  settleDebt: (fromId: string, toId: string, amount: number) => void;
  resetHouse: () => void;
}) => {
  const { s, me, memberById, identity, houseId, cloudBusy, cloudError, createHouse, joinHouse, leaveHouse } = useHouse();
  const [kopirano, setKopirano] = useState(false);
  const [opis, setOpis] = useState('');
  const [iznos, setIznos] = useState('');
  const [platio, setPlatio] = useState(me.id);
  const [novaKucaIme, setNovaKucaIme] = useState('');
  const [joinKod, setJoinKod] = useState('');

  const debts = pairwiseDebts(s);
  const scores = monthlyScores(s);
  const jaDugujem = [...debts.entries()].filter(([k]) => k.startsWith(`${me.id}|`)).reduce((a, [, v]) => a + v, 0);
  const meniDuguju = [...debts.entries()].filter(([k]) => k.endsWith(`|${me.id}`)).reduce((a, [, v]) => a + v, 0);
  const rankirani = [...s.members].sort((a, b) => (scores.get(b.id) ?? 0) - (scores.get(a.id) ?? 0));
  const sef = rankirani[0];

  const kopiraj = async () => {
    try {
      await navigator.clipboard.writeText(`${location.origin}?kuca=${s.house.inviteCode}`);
      setKopirano(true);
      haptic.lightTap();
      setTimeout(() => setKopirano(false), 2000);
    } catch {
      // clipboard blokran
    }
  };

  return (
    <>
      {/* Cloud sinhronizacija */}
      <HouseCard title={houseId ? 'Kuća u cloudu' : 'Sync sa ukućanima'} isLight={isLight}>
        {!identity && (
          <p className={`text-sm ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
            Prijavi se na DoIT nalog da bi kuću delio/la sa ukućanima u realnom vremenu. Bez naloga, kuća radi samo na
            ovom uređaju.
          </p>
        )}

        {identity && houseId && (
          <div className="space-y-3">
            <p className={`text-sm ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
              Svi članovi vide izmene u realnom vremenu. Pošalji im pozivni kod:
            </p>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className={`text-xs ${isLight ? 'text-slate-400' : 'text-white/30'}`}>Pozivni kod</p>
                <p className={`font-mono text-lg font-bold tracking-widest ${isLight ? 'text-slate-900' : 'text-white'}`}>{s.house.inviteCode}</p>
              </div>
              <button onClick={kopiraj} className="btn-secondary">
                {kopirano ? <Check size={15} className="text-[#c8ff00]" /> : <Copy size={15} />}
                {kopirano ? 'Kopirano' : 'Kopiraj'}
              </button>
            </div>
            <button
              onClick={() => {
                if (confirm('Napustiti kuću? Podaci ostaju drugim članovima, a ti se vraćaš na lokalnu demo kuću.')) {
                  leaveHouse();
                }
              }}
              disabled={cloudBusy}
              className={`btn-secondary w-full text-xs ${isLight ? 'text-red-500' : 'text-red-400'} ${cloudBusy ? 'opacity-50' : ''}`}
            >
              Napusti kuću
            </button>
          </div>
        )}

        {identity && !houseId && (
          <div className="space-y-4">
            <form
              className="space-y-2"
              onSubmit={(e) => {
                e.preventDefault();
                createHouse(novaKucaIme || 'Naša kuća').then((ok) => {
                  if (ok) setNovaKucaIme('');
                });
              }}
            >
              <p className={`text-[13px] font-semibold ${isLight ? 'text-slate-700' : 'text-white/80'}`}>Napravi novu kuću</p>
              <div className="flex gap-2">
                <input
                  className={inputCls}
                  placeholder="Ime kuće (npr. Stan na Vračaru)"
                  value={novaKucaIme}
                  onChange={(e) => setNovaKucaIme(e.target.value)}
                />
                <button type="submit" disabled={cloudBusy} className={`btn-primary px-4 ${cloudBusy ? 'opacity-50' : ''}`}>
                  Napravi
                </button>
              </div>
            </form>

            <div className={`border-t pt-4 ${isLight ? 'border-black/5' : 'border-white/5'}`}>
              <form
                className="space-y-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  joinHouse(joinKod).then((res) => {
                    if (res === 'joined') setJoinKod('');
                  });
                }}
              >
                <p className={`text-[13px] font-semibold ${isLight ? 'text-slate-700' : 'text-white/80'}`}>Pridruži se postojećoj</p>
                <div className="flex gap-2">
                  <input
                    className={`${inputCls} font-mono uppercase tracking-widest`}
                    placeholder="POZIVNI KOD"
                    maxLength={6}
                    value={joinKod}
                    onChange={(e) => setJoinKod(e.target.value.toUpperCase())}
                  />
                  <button type="submit" disabled={cloudBusy} className={`btn-primary px-4 ${cloudBusy ? 'opacity-50' : ''}`}>
                    Uđi
                  </button>
                </div>
              </form>
            </div>

            {cloudError && (
              <p className={`text-xs font-medium ${isLight ? 'text-red-500' : 'text-red-400'}`}>{cloudError}</p>
            )}
          </div>
        )}
      </HouseCard>

      {/* Pozivni kod (samo lokalni demo — radi kao i do sada) */}
      {!houseId && (
        <HouseCard title="Pozivni kod (demo)" isLight={isLight}>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className={`text-xs ${isLight ? 'text-slate-400' : 'text-white/30'}`}>Demo kod — ne radi u cloudu</p>
              <p className={`font-mono text-lg font-bold tracking-widest ${isLight ? 'text-slate-900' : 'text-white'}`}>{s.house.inviteCode}</p>
            </div>
            <button onClick={kopiraj} className="btn-secondary">
              {kopirano ? <Check size={15} className="text-[#c8ff00]" /> : <Copy size={15} />}
              {kopirano ? 'Kopirano' : 'Kopiraj'}
            </button>
          </div>
        </HouseCard>
      )}

      {/* Članovi */}
      <HouseCard
        title={houseId ? 'Članovi kuće' : 'Članovi — dodirni da se prebaciš (demo)'}
        isLight={isLight}
      >
        <ul className={`divide-y ${isLight ? 'divide-black/5' : 'divide-white/5'}`}>
          {s.members.map((m) => {
            const aktivan = m.id === me.id;
            const naPasusu = s.availability.some((a) => a.memberId === m.id);
            return (
              <li key={m.id}>
                <button
                  onClick={() => { if (!houseId) switchUser(m.id); }}
                  disabled={!!houseId}
                  className={`flex w-full items-center gap-3 py-2.5 text-left ${houseId ? 'cursor-default' : ''}`}
                >
                  <HouseAvatar member={m} isLight={isLight} />
                  <span className={`flex-1 text-sm font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {m.name}
                    {aktivan && <span className="ml-2 text-xs font-normal text-[#c8ff00]">ti si ovaj</span>}
                  </span>
                  {naPasusu && <HousePill tone="warn" isLight={isLight}>🏖️ pasus</HousePill>}
                  {m.role === 'host' && <HousePill isLight={isLight}>domaćin</HousePill>}
                </button>
              </li>
            );
          })}
        </ul>
      </HouseCard>

      {/* Troškovi */}
      <HouseCard title="Dugovanja" isLight={isLight}>
        <div className="mb-3 grid grid-cols-2 gap-2">
          <div className={`rounded-xl p-3 text-center ${isLight ? 'bg-green-50' : 'bg-[#c8ff00]/5'}`}>
            <p className={`text-xs ${isLight ? 'text-green-600' : 'text-[#c8ff00]/70'}`}>tebi duguju</p>
            <p className={`text-sm font-bold ${isLight ? 'text-green-600' : 'text-[#c8ff00]'}`}>{fmtDinars(meniDuguju)}</p>
          </div>
          <div className={`rounded-xl p-3 text-center ${isLight ? 'bg-amber-50' : 'bg-amber-500/5'}`}>
            <p className={`text-xs ${isLight ? 'text-amber-600' : 'text-amber-400/70'}`}>ti duguješ</p>
            <p className={`text-sm font-bold ${isLight ? 'text-amber-600' : 'text-amber-400'}`}>{fmtDinars(jaDugujem)}</p>
          </div>
        </div>
        <ul className="space-y-2">
          {[...debts.entries()].map(([key, v]) => {
            const [fromId, toId] = key.split('|');
            const from = memberById(fromId);
            const to = memberById(toId);
            if (!from || !to) return null;
            return (
              <li
                key={key}
                className={`flex items-center gap-2 rounded-xl border p-2.5 text-sm ${
                  isLight ? 'border-black/5 bg-slate-50/50' : 'border-white/5 bg-white/[0.02]'
                }`}
              >
                <HouseAvatar member={from} size={24} isLight={isLight} />
                <span className={`flex-1 truncate ${isLight ? 'text-slate-700' : 'text-white/70'}`}>
                  <b>{from.name}</b> duguje <b>{to.name}</b> — {fmtDinars(v)}
                </span>
                <button onClick={() => settleDebt(fromId, toId, v)} className="btn-secondary px-2 py-1 text-xs">
                  Vraćeno
                </button>
              </li>
            );
          })}
        </ul>
        {debts.size === 0 && <HouseEmpty isLight={isLight}>Svi su se raskusurali. Mir u kući ☮️</HouseEmpty>}

        <form
          className="mt-4 space-y-2 border-t border-white/5 pt-4"
          onSubmit={(e) => {
            e.preventDefault();
            const iz = parseInt(iznos, 10);
            if (!opis.trim() || !iz || iz <= 0) return;
            addExpense({ description: opis, amount: iz, paidBy: platio });
            setOpis('');
            setIznos('');
          }}
        >
          <p className={`text-[13px] font-semibold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-white/50'}`}>Novi trošak</p>
          <input className={inputCls} placeholder="Opis (npr. struja)" value={opis} onChange={(e) => setOpis(e.target.value)} />
          <div className="flex gap-2">
            <input
              className={inputCls}
              type="number"
              inputMode="numeric"
              min={1}
              placeholder="Iznos (RSD)"
              value={iznos}
              onChange={(e) => setIznos(e.target.value)}
            />
            <select className={inputCls} value={platio} onChange={(e) => setPlatio(e.target.value)}>
              {s.members.map((m) => (
                <option key={m.id} value={m.id}>
                  platio: {m.name}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn-primary w-full">
            Upiši trošak (deli se jednako)
          </button>
        </form>

        <ul className={`mt-3 divide-y ${isLight ? 'divide-black/5' : 'divide-white/5'}`}>
          {s.expenses.slice(0, 6).map((e) => {
            const p = memberById(e.paidBy);
            return (
              <li key={e.id} className="flex items-center gap-2.5 py-2 text-sm">
                {p && <HouseAvatar member={p} size={24} isLight={isLight} />}
                <span className="min-w-0 flex-1">
                  <span className={`block truncate font-medium ${isLight ? 'text-slate-900' : 'text-white'}`}>{e.description}</span>
                  <span className={`text-xs ${isLight ? 'text-slate-400' : 'text-white/30'}`}>
                    platio {p?.name} · {fmtShort(new Date(e.createdAt + 'T00:00'))}
                  </span>
                </span>
                <span className={`font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>{fmtDinars(e.amount)}</span>
              </li>
            );
          })}
        </ul>
      </HouseCard>

      {/* Bodovi */}
      <HouseCard title="Bodovi · šef kuće" isLight={isLight}>
        <ul className="space-y-2">
          {rankirani.map((m, i) => (
            <li
              key={m.id}
              className={`flex items-center gap-3 rounded-xl border p-3 ${
                isLight ? 'border-black/5 bg-slate-50/50' : 'border-white/5 bg-white/[0.02]'
              }`}
            >
              <span className={`w-5 text-center text-sm font-bold ${isLight ? 'text-slate-400' : 'text-white/30'}`}>{i + 1}</span>
              <HouseAvatar member={m} isLight={isLight} />
              <span className={`flex-1 text-sm font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {m.name}
                {i === 0 && (scores.get(m.id) ?? 0) > 0 && (
                  <span className="ml-2 text-xs font-medium text-[#c8ff00]">
                    <Crown size={12} className="mr-0.5 inline" />
                    šef kuće
                  </span>
                )}
              </span>
              <span className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{scores.get(m.id) ?? 0} b.</span>
            </li>
          ))}
        </ul>
        {sef && (scores.get(sef.id) ?? 0) === 0 && (
          <p className={`mt-2 text-center text-xs ${isLight ? 'text-slate-400' : 'text-white/30'}`}>
            Ovog meseca još niko nije skupio bodove — prvi zadatak je +10.
          </p>
        )}
      </HouseCard>

      <div className="space-y-2 pt-2 text-center">
        <p className={`text-xs ${isLight ? 'text-slate-400' : 'text-white/30'}`}>
          {houseId
            ? 'Kuća je u cloudu — izmene se sinhronizuju sa svim članovima.'
            : 'Lokalna demo kuća — podaci se čuvaju samo u tvom pregledaču. Prijavi se i napravi kuću za sync.'}
        </p>
        {!houseId && (
          <button
            onClick={() => {
              if (confirm('Vrati demo kuću na početno stanje?')) resetHouse();
            }}
            className={`btn-secondary text-xs ${isLight ? 'text-slate-500' : 'text-white/40'}`}
          >
            <RotateCcw size={13} /> Resetuj demo
          </button>
        )}
      </div>
    </>
  );
};

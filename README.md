# DoIT — Task, Fitness & Home Suite

Jedna aplikacija za sve obaveze: **lični zadaci, fitnes, ishrana — i kuća** (zadaci po smeni, lista za kupovinu, deljeni troškovi, bodovi).

> Primarno: **prava aplikacija** (Android preko Capaccelitora). Web build postoji kao laka dostupna varijanta (vercel.json), ne kao pun PWA poduhvat.

## Pokretanje

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # produkcijski build (web)
npm run lint       # TypeScript provera
```

### Android (prava app)

```bash
npm run android:apk    # build + Cap sync + gradlew assembleDebug
```

## Struktura

```
src/
  App.tsx           — glavni pogledi (home, tasks, house, fitness, settings...)
  main.tsx          — tačka ulaska (ErrorBoundary → HouseProvider → App)
  types.ts          — glavni tipovi aplikacije
  i18n.ts           — 10 jezika
  firebase.ts       — auth + Firestore sinhronizacija
  house/            — NOVO: "Kuća" modul (deljeni dom)
    types.ts        — kuća, članovi, zadaci (rotacija), smene, pasus, lista, troškovi
    dates.ts        — nedelje, rotacije, dodeljivanje smena, formatiranje (sr-Latn-RS)
    seed.ts         — demo kuća "Stan na Vračaru"
    store.tsx       — HouseProvider (localStorage per-user + cloud sync, "u kupovini sam" istek 2h)
    cloud.ts        — Firestore sync: `houses` kolekcija, realtime pretplata, pozivni kod
    HouseView.tsx   — 4 pod-tab: Danas · Zadaci · Lista · Kuća
  components/       — UI komponente (Navbar, MobileNav, TaskCard, FitnessDashboard...)
  utils/            — pomoćne funkcije (storage, notifikacije, AI, PDF...)
```

## Kuća modul (porodica, cimeri, stan)

Deljena kuća za 3–5 ljudi: **zadaci po smeni, lista za kupovinu, deljeni troškovi i bodovi** — bez haosa u grupnom četu.

- **Danas** — tvoji zadaci za danas, šta rade ostali, brzo dodavanje na listu
- **Zadaci** — nedeljna rotacija (nedeljno / dvonedeljno / svaki dan), završavanje, **pasus** (odmor preskače smene), pregled rotacije
- **Lista** — deljena lista za kupovinu, "U kupovini sam" (traje 2h), kupljeno/vrati
- **Kuća** — pozivni kod, deljeni troškovi sa pairwise dugovanjima, bodovi i "šef kuće"

### Sinhronizacija (cloud)

Kao prijavljeni korisnik kuća živi u Firestore-u (`houses` kolekcija) — sve promene stižu u **realnom vremenu** svim članovima. U Kuća pod-tabu:

- **Napravi novu kuću** — dobijaš pozivni kod (6 znakova) koji pošalješ ukućanima
- **Pridruži se** — upiši njihov kod i automatski postaješ član
- **Napusti kuću** — poslednji član koji izađe briše kuću iz clouda

Bez naloga (guest mode) kuća radi lokalno (demo "Stan na Vračaru": Ana 🦩, Marko 🐻, Jelena 🐱) — localStorage samo na tom uređaju.

> Detaljan spec: `docs/HOUSE-SPEC.md` (izvornik: `archive/Project BetterMe/SPEC-MVP.md`)

## Napomene

- Iznosi se čuvaju kao **ceo broj dinara** (nikad float), formatiraju sa `Intl.NumberFormat('sr-Latn-RS')`
- Kuća modul: lokal je `sr-Latn-RS` (latinica)
- Git repo: ovaj projekat (ranije u podfolderu `DoIT/`) — remote: `github.com/Puzderliski01/doit-app`
- Stari Next.js prototip "Naša kuća" sačuvan je u `archive/` (ne kompajlija se, ne ulazi u build)

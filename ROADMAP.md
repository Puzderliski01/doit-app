# DoIT — Vizija i Roadmap

> **Vizija:** DoIT = lični operativni sistem za život. Zadaci, fitnes, ishrana i kuća — jedna aplikacija, jedan nalog, sve sinhronizovano.

## Gde smo danas (v3.0)

- **Zadaci** — kategorije, prioritetni matriks, kanban, kalendar, ponavljajući zadaci, grupe sa join kodom
- **Fitnes** — rutine, log vežbi, XP/rangovi, dostignuća, leaderboard
- **Ishrana** — meal plan, makroi
- **AI** — Gemini integracija (breakdown, uvidi)
- **Kuća (novo)** — zadaci po smeni sa rotacijom, pasus, deljena lista za kupovinu, deljeni troškovi (pairwise dugovanja), bodovi i "šef kuće"; **cloud sync gotov** (Firestore `houses`, realtime, pozivni kod)
- **Platforma** — Android (Capacitor) kao primarna app + laki web build (Vercel) kao dostupna varijanta
- **Sync** — Firebase Auth + Firestore, guest mode, 10 jezika, dark/light

---

## Faza 1 — Kuća v1.5: pravi cloud (2–3 nedelje)

1. ~~**Firestore kolekcija `houses`**~~ ✅ — ceo `HouseState` kao dokument, realtime `onSnapshot` (`src/house/cloud.ts` + `store.tsx`), debounce upis, LWW po dokumentu
2. ~~**Pravi članovi**~~ ✅ — pozivni kod (6 znakova, bez zamenjivih), pridruživanje sa DoIT naloga, ime/emoji iz profila; kuća se otkriva po `memberUids` nakon login-a na drugom uređaju; "napusti kuću" (poslednji član briše dokument). E2E testirano: 2 naloga, realtime sync kroz server.
3. **Notifikacije** (sledeće) — "tvoj red za iznošenje smeća", "Ana je na pasusu", "Marko je u marketu" (DoIT već ima notifikacioni sistem; kuća već ima realtime pretplatu kao okidač)
4. **Sklapanje sa grupama** — "kuća" = grupa sa tipom `house`; postojeći `Group`/`GroupTask` infrastruktura + rotacija iz Kuće
5. **Izveštaj troškova** — PDF export (već postoji PDF modul), mesečni pregled "ko je koliko platio"

**Kriterijum uspeha:** dva telefona, ista kuća, lista se menja u realnom vremenu. ✅ (ispunjeno — E2E test sa 2 naloga)

## Faza 2 — Povezivanje modula (2 nedelje)

DoIT moduli su sada ostrva. Vrednost dolazi iz spajanja.

- **Zadaci ↔ Kuća** — kućni zadatak se pojavljuje i na glavnom Tasks timeline-u (toggle "prikaži kućne")
- **Zadaci ↔ Fitnes** — "Usisavanje" donosi XP; kućni bodovi i fitnes XP u jedinstvenom profilu
- **Ishrana ↔ Lista** — meal plan automatski generiše stavke liste za kupovinu ("za ponedeljak treba: jaja, spanać...")
- **Kalendar** — svi izvori (lični zadaci, smene kuće, workout-i) na jednoj vremenskoj liniji
- **Jedinstveni achievement-i** — "7 dana bez izgubljene smene", "šef kuće meseca", "100 treninga"

## Faza 3 — Mobilni experience (2–3 nedelje)

Primarna app zaslužuje primarni tretman:

- **Push notifikacije** (Capacitor Push / FCM) — podsetnici za smene i rokove umesto samo in-app
- **Home screen widget** — današnji zadaci + "u kupovini sam" dugme
- **Brze akcije** — dugme na duže pritiskanje → novi zadatak / skeniranje liste
- **Offline-first** — trenutno guest mode čuva lokalno; formalizovati queue pa se sinhronizuje po povratku online
- **iOS build** (Capacitor) — isti codebase

## Faza 4 — AI koji zaista pomaže (3 nedelje)

Gemini je već integrisan — ovo je dublja upotreba:

- **Nedeljni plan** — AI predlaže raspored zadataka (lični + kućni) na osnovu istorije
- **Pametni prioriteti** — matrics se popunjava sam na osnovu rokova i navika
- **Kuća coach** — "Ove nedelje Marko nije završio ništa — pošalji podsetnik?"
- **Fitnes plan** — prilagođen napretku, ne generički
- **Chatty uvidi** — "Kako mi je prošla nedelja?" → odgovor sa brojkama

## Faza 5 — Rast i platforma (tekuće)

- **Web kao laka varijanta** — trenutni pristup zadržati (Vercel build, bez teškog PWA-a); landing stranica sa "Preuzmi app" + "Otvori na webu"
- **Beta krug** — 10–20 porodica/cimeristva koji aktivno koriste Kuću; njihov feedback diktira Fazu 1
- **Freemium** — besplatno: zadaci + fitnes + 1 kuća; Pro: AI, više kuća/grupa, napredni izveštaji, widget paket
- **Analytics** — privatno, bez oglasa: šta se koristi, gde se napušta

---

## Kvalitet i infrastruktura (paralelno, nikad gotovo)

- Testovi — bar `house/dates.ts` (rotacija je čista logika, idealna za unit testove)
- CI — GitHub Actions: `tsc --noEmit` + build na svaki push
- Error tracking (Sentry) — da znaš kad nešto pukne na tuđem telefonu
- Čišćenje `App.tsx` (~2900 linija) — izvući view-ove u zasebne komponente

## Metrike uspeha

| Metrika | Cilj |
|---|---|
| Dnevni aktivni korisnici (WAU/MAU) | > 30% |
| Kuća: članovi po kući | ≥ 3 |
| Zadržavanje posle 30 dana | > 50% |
| Crash-free sessions | > 99.5% |

## Čega se NE držati

- Ne praviti još jedan To-Do app — diferencijacija je **kuća + fitnes u jednom**
- Ne dodavati nove module dok Faza 1 (notifikacije/sklapanje) i Faza 2 (povezivanje) ne budu gotove
- Ne graditi iOS/Android paralelno — Android prvi, iOS kad web bude stabilan

# Naša kuća — Spec MVP-a (v1)

> Deljena kuća za 3–5 ljudi: zadaci po smeni, lista za kupovinu, deljeni troškovi i bodovi.
> Bez haosa u grupnom četu.

---

## 1. Cilj MVP-a

**Jedna hipoteza koju MVP testira:** *Da li kuća od 3–5 ljudi otvara aplikaciju svaki dan (radi zadataka i liste) ako su zadaci pravedno raspoređeni i vidljivi?*

Kriterijum uspeha posle 2–3 nedelje beta-testa sa 2–3 prave kuće:
- ≥ 60% članova kuće otvara app najmanje 4 dana u nedelji
- Lista za kupovinu se koristi najmanje 1× nedeljno
- Zadaci se označavaju kao završeni u roku od 24h od podsetnika

**Izvan opsega v1:** kalendar događaja, dostava namirnica, statistike/istorija, više kuća po korisniku, PWA push na iOS, App Store/Play distribucija, monetizacija.

---

## 2. Ličnosti (personas)

- **Ana (29), cimerka** — dosilo joj je čije je red da iznese smeće. Hoće pravdu i transparentnost.
- **Marko (34) i Jelena (31), par** — dele troškove, smoreni su da pamte ko je platio struju.
- **Porodica Petrović** — ćale, majka, dva tinejdžera. Deci trebaju zadaci "za pojas" (bodovi = džeparac vibe, ali u v1 samo bodovi).

Sve osobe očekuju: **"Otvorim i odmah znam šta je moj red."**

---

## 3. Koncepti i terminologija

| Termin | Značenje |
|---|---|
| **Kuća** | Grupa od 3–5 članova. Svaki korisnik pripada tačno **jednoj** kući u v1 |
| **Zadatak** | Ponavljajuća obaveza (kuvar, kafa, smeće, usisavanje...) sa rotacijom |
| **Smena** | Nedelja: ko je na redu za koji zadatak |
| **Lista** | Deljena lista za kupovinu (jedna aktivna lista po kući u v1) |
| **Stavka** | Jedna stavka u listi ("mleko") — status: potrebno / kupljeno |
| **Trošak** | Deljeni trošak sa podelom među članovima (prosto, jednako) |
| **Bodovi** | Poeni za završene zadatke; mesečni "šef kuće" |

---

## 4. Korisnički tokovi (flows)

### F1. Onboarding
1. Korisnik otvori web app → ekran dobrodošlice → dugme **Kreiraj kuću** ili **Pridruži se**.
2. **Kreiraj kuću:** unesi ime kuće (npr. "Stan na Vračaru") → dobija pozivni link (6-alfanumerički kod, npr. `K3H9XA`).
3. **Pridruži se:** otvori link ili unesi kod → vidi ime kuće i spisak članova (bez detalja) → potvrdi pridruživanje (auth preko toga).
4. Kreator kuće je automatski **domaćin** (jedina admin uloga u v1: brisanje kuće, uklanjanje člana).
5. Članovi vide: "Ana te je pozvala u kuću 'Stan na Vračaru' (3 člana)" → **Pridruži se**.

**Auth:** email + magic link (bez lozinke) — najbrži mogući put. (Supabase Auth.)

**Pravilo v1:** korisnik može biti u tačno jednoj kući; izlazak iz kuće = potvrda "Napusti kuću" (domaćin ne može napustiti dok ne prenese domaćinstvo ili ne obriše kuću).

### F2. Zadaci — kreiranje i rotacija
1. Bilo koji član kuće može **dodati zadatak**: ime ("Iznošenje smeća"), ponavljanje (`nedeljno` | `dvonedeljno` | `svakog dana`), spisak članova koji rotiraju (default: svi).
2. Sistem automatski pravi **smene**: svaka nedelja unapred, rotacija po krugu (Ana → Marko → Jelena → Ana...).
3. Domaćin (ili autor) može da menja smenu pojedinačne nedelje (npr. "Marko ove nedelje neće biti tu").
4. Zadaci su vidljivi na **dnevnom ekranu**: danas i sutra.

**Detalj:** ako zadatak ima termin ("smeće — utorkom u 18h"), prikazuje se kao vreme; inače samo dan. Vreme je opcionalno, bez notifikacija po satu u v1.

### F3. Zadaci — završavanje i "pauša"
1. Na ekranu **Danas** član vidi šta je na njegovom redu, plus šta je na redu ostalih.
2. Završi zadatak → dugme **Završio/la** (+ dugme dodaj napomenu, opcionalno) → +bodovi.
3. **Pasus (izostanak):** član unapred označi "Ja sam na odmoru 5–12. jula" → sistem automatski preskače njegove smene u tom periodu i rotacija ide na sledećeg.
4. Zadatak koji prođe nezavršen → ističe se crveno (ali ne kažnjava u v1 — pritisak bez kazni).

### F4. Lista za kupovinu
1. Jedna aktivna lista po kući: **"Lista"** tab.
2. Bilo koji član doda stavku → vidi se svima **u realnom vremenu**.
3. Ko je trenutno u marketu: dugme **U kupovini sam** (toggle, automatski istekne posle 2h) → vidi se banner "Marko je u marketu".
4. Član u kupovini označava stavke kao **kupljeno** → stavka nestaje sa aktivnog dela i ide u "Kupljeno (dana)", gde bilo ko može da je **vrati na listu** ako je zaboravljena.
5. **Ko je na redu za kupovinu:** rotacija isto kao zadaci (nedeljni red) — čisto informaciono, ne kazneno.

### F5. Deljeni troškovi
1. Član unese trošak: opis ("Struja, maj"), iznos, ko je platio.
2. Podela: **jednako među svim članovima** (u v1; nijedan drugi način).
3. Pregled "dugovanja": svako vidi "ti duguješ 1.250 RSD (Marku 800, Ani 450)".
4. **Raskusuraj** dugme → dva člana potvrde da je dug vraćen → dugovanje se zatvara (bez istorije u v1).
5. Bez pravih plaćanja — app samo vodi knjigu.

### F6. Bodovi i šef kuće
1. Bodovi: završen zadatak = **+10**, završen pre roka = +2 dodatna, izostanak = 0 (bez minusa).
2. **Ekipa tab:** tabela kuće za tekući mesec (bodovi, završeni zadaci), a na vrhu **"Šef kuće ovog meseca"** (avatar + ime).
3. Nedeljni izazov (zabavni detalj): ako *svi* članovi završe sve zadatke nedelje → kuća dobija **zajednički badge** ("Cela kuća — savršena nedelja"). Ovo je motivacija za međusobno podsećanje, ne za kažnjavanje.

---

## 5. Ekrani (IA — informaciona arhitektura)

Donja navigacija (4 taba) na telefonu; leva navigacija na desktopu.

| # | Ekran | Sadržaj |
|---|---|---|
| 1 | **Danas** (default) | Danas u kući: moji zadaci, zadaci ostalih, ko je u kupovini, mini-pregled lista |
| 2 | **Zadaci** | Nedeljna smena (kalendar 7 dana), dugmad za završavanje, dugme **+ Zadatak** |
| 3 | **Lista** | Aktivna lista za kupovinu, "U kupovini sam", sekcija "Kupljeno danas" |
| 4 | **Kuća** | Troškovi (unos + dugovanja), tabela bodova, članovi, podešavanja kuće |

**Podešavanja (meni):** profil (ime, boja/emoji avatara), notifikacije (on/off po tipu), napusti kuću, domaćin: ukloni člana / obriši kuću (uz potvrdu).

---

## 6. Model baze (Supabase / PostgreSQL)

```
profiles            id (uuid, FK auth.users), email, display_name, avatar_emoji, created_at

houses              id (uuid), name, invite_code (6 chars, unique), created_by (FK profiles), created_at
house_members       house_id (FK), profile_id (FK), role ('host' | 'member'),
                    status ('active' | 'left'), joined_at
                    PK (house_id, profile_id)

tasks               id, house_id, name, repeat ('daily' | 'weekly' | 'biweekly'),
                    time_of_day (nullable time), active (bool), created_by, created_at

task_shifts         id, task_id (FK), week_start (date, ponedeljak),
                    profile_id (FK, nullable ako je pasus), status ('open' | 'done' | 'skipped'),
                    completed_by (nullable), completed_at (nullable), note (text)
                    UNIQUE (task_id, week_start)

availability        id, house_id, profile_id, from_date, to_date, reason (nullable)
                    -- "pasus": preskače smene u periodu

list_items          id, house_id, name, status ('needed' | 'bought'),
                    added_by, bought_by (nullable), bought_at (nullable), created_at

shopping_turn       house_id, profile_id, week_start   -- ko je na redu za kupovinu

expenses            id, house_id, description, amount (int, dinari),
                    paid_by (FK), created_by, created_at
expense_splits      expense_id (FK), profile_id (FK), share (int), settled (bool)

scores              house_id, profile_id, month (YYYY-MM), points, tasks_done
-- (ili izvedeno upitom iz task_shifts; u v1 je izvedeno, bez posebne tabele)
```

**Pristup (RLS):** sve tabele vezane za `house_id`; korisnik čita/piše **samo ako je active član** te kuće (`house_members` provera u RLS policy).

**Realtime:** Supabase Realtime na `list_items` i `task_shifts` (da se lista menja pred očima).

---

## 7. Notifikacije (v1: samo email + in-app)

| Okidač | Primaoci |
|---|---|
| Poziv u kuću | pozvani (email sa linkom) |
| Podsetnik ujutru: "Danas ti je red: Iznošenje smeća" | članovi sa zadacima tog dana |
| "Marko je stavio 3 stavke na listu" | ostali člani (in-app badge; email digest dnevno, ne po stavci) |
| "Struja dospeva za 3 dana" | svi članovi (podsetnik roka: unosi se opcionalni datum dospeća uz trošak) |

Bez push-a u v1 (PWA push na iOS je komplikovan) — email + in-app pokriva beta.

---

## 8. Tehnički okvir

- **Frontend:** Next.js (App Router) + TypeScript + Tailwind CSS; PWA manifest (installable na telefonu, splash ekran, offline read-only cache lista)
- **Backend/DB:** Supabase — Auth (magic link), Postgres + RLS, Realtime, Edge Functions (slanje email podsetnika, scheduled — Supabase cron)
- **Hosting:** Vercel (web) + Supabase (baza) — besplatni planovi dovoljni za beta
- **Jezik interfejsa:** srpski (latinica) u v1; struktura lokalizacije spremna za kasnije (en)

**Napomena o dinarima:** iznose čuvati kao **ceo broj dinara** (int), nikad float. Formatirati sa `Intl.NumberFormat('sr-RS')`.

---

## 9. Redosled izrade (sprintovi)

**Sprint 1 — temelj (kuća + ljudi)**
- [ ] Supabase projekat, RLS policy-ji
- [ ] Auth (magic link), profil (ime + emoji avatar)
- [ ] Kreiraj kuću / pozivni link / pridruži se preko linka
- [ ] Prazni ekrani sa navigacijom (Danas/Zadaci/Lista/Kuća)

**Sprint 2 — zadaci (jezgro)**
- [ ] Kreiranje zadataka + automatske nedeljne smene (rotacija)
- [ ] Ekran Danas: moji + tuđi zadaci, završi zadatak
- [ ] Pasus (availability) i preskakanje smena
- [ ] Realtime na smenama

**Sprint 3 — lista + troškovi**
- [ ] Lista za kupovinu (dodaj, kupljeno, vrati, "U kupovini sam")
- [ ] Troškovi: unos, jednaka podela, dugovanja, raskusuravanje
- [ ] Email podsetnik za dugovanja koja traju > 7 dana

**Sprint 4 — život i zabava**
- [ ] Bodovi, tabela kuće, "šef kuće", nedeljni badge "savršena nedelja"
- [ ] In-app + email podsetnici (jutarnji podsetnik, rokovi)
- [ ] PWA manifest + osnovni offline

**Sprint 5 — beta**
- [ ] Landing stranica (jedna, jasna poruka)
- [ ] Posadi na Vercel, uključi 2–3 prave kuće
- [ ] Skupi povratne informacije (jedno pitanje u app: "Šta te iritira?")

---

## 10. Odluke koje treba doneti pre koda

1. **Ime** — "Naša kuća" je placeholder. Treba proveriti domene (.rs/.com) i dostupnost u store-ovima.
2. **Domaćin vs ravnopravnost** — da li domaćin ima moć da briše zadatke/troškove? (Predlog v1: da, ali sve akcije su vidljive svima.)
3. **Bodovi — da li ih menjati?** Alternativa bez gamifikacije (čistije, ali manje "zabavno"). Predlog: ostaviti, meriti tokom bete.
4. **Email umesto lozinke** — prihvatio korisnik magic link? (Za porodice sa starijim članovima ovo je najveći rizik — opciono dodati PIN pri ponovnom logovanju.)

---

*Verzija 0.1 — polazna tačka za razvoj.*

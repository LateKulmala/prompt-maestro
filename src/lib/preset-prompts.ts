export type PresetCategory =
  | "Koodaus"
  | "Rakentaminen"
  | "Supabase"
  | "n8n"
  | "Marketing"
  | "Myynti"
  | "Some"
  | "Sähköposti"
  | "Rekrytointi"
  | "Sisältö"
  | "Tuote"
  | "Analyysi";

export type Preset = {
  id: string;
  title: string;
  category: PresetCategory;
  description: string;
  template: string;
  suggestedMode?: string;
};

export const PRESETS: Preset[] = [

  // ── KOODAUS: Claude Code -patternit ─────────────────────────────────────
  {
    id: "code-spec-first",
    title: "Spec-First Contract",
    category: "Koodaus",
    description: "Määritä täsmällinen spec ennen koodia — Claude ei arvaa",
    suggestedMode: "react",
    template:
      "Ennen kuin kirjoitat yhtään koodia, kirjoita täsmällinen spec seuraavasta tehtävästä: [tehtävä]. Specin täytyy sisältää: (1) mitä funktio/komponentti tekee, (2) mitkä ovat syötteet ja paluuarvot TypeScript-tyyppeineen, (3) mitä reunatapauksia käsitellään, (4) mitä EI kuulu scopeen. Vasta kun hyväksyn specin, kirjoitat koodin.",
  },
  {
    id: "code-io-examples",
    title: "I/O Examples -pattern",
    category: "Koodaus",
    description: "Näytä esimerkit input→output ennen toteutusta",
    suggestedMode: "react",
    template:
      "Rakenna funktio/komponentti [kuvaus]. Ennen toteutusta anna 3 konkreettista esimerkkiä muodossa:\nINPUT: ...\nOUTPUT: ...\nSelitä lyhyesti logiikka. Sitten kirjoita toteutus TypeScriptillä joka vastaa täsmälleen näitä esimerkkejä.",
  },
  {
    id: "code-guardrails",
    title: "Guardrails & Constraints",
    category: "Koodaus",
    description: "Eksplisiittiset rajoitteet — mitä EI saa tehdä",
    suggestedMode: "react",
    template:
      "Toteuta [ominaisuus] seuraavilla guardrail-ehdoilla:\n\nSAAT tehdä:\n- [sallittu 1]\n- [sallittu 2]\n\nET SAA:\n- Lisätä uusia riippuvuuksia ilman lupaa\n- Muuttaa olemassa olevaa API-rajapintaa\n- Käyttää any-tyyppiä TypeScriptissä\n- Jättää TODO-kommentteja\n\nJos jokin vaatimus on epäselvä, kysy ENNEN kuin kirjoitat koodia.",
  },
  {
    id: "code-refactor-surgeon",
    title: "Refactor Surgeon",
    category: "Koodaus",
    description: "Kirurginen refaktorointi — vain määrätty muutos, ei muuta",
    suggestedMode: "react",
    template:
      "Olet kirurginen refaktoroija. Tehtäväsi on tehdä TÄSMÄLLEEN yksi muutos tähän koodiin: [muutos].\n\nSäännöt:\n- Muuta VAIN se mitä pyydetään\n- Säilytä kaikki muu identtisenä (nimet, rakenne, tyyli)\n- Älä optimoi muuta samalla\n- Näytä diff-muodossa mitä muuttui ja miksi\n\nKoodi:\n```\n[liitä koodi]\n```",
  },
  {
    id: "code-explain-before",
    title: "Explain-Before-Code",
    category: "Koodaus",
    description: "Selitä lähestymistapa ensin, koodi vasta hyväksynnän jälkeen",
    suggestedMode: "react",
    template:
      "Ennen kuin kirjoitat koodia ominaisuudelle [ominaisuus], selitä:\n1. Minkä arkkitehtuurin valitset ja miksi\n2. Mitä tiedostoja muutat/luot\n3. Mitkä ovat riskit tai tradeoffit\n4. Onko vaihtoehtoinen lähestymistapa?\n\nKirjoita koodi vasta kun olen hyväksynyt suunnitelman.",
  },
  {
    id: "code-complexity-budget",
    title: "Complexity Budget",
    category: "Koodaus",
    description: "Rajoita kompleksisuus — yksinkertaisin toimiva ratkaisu",
    suggestedMode: "react",
    template:
      "Toteuta [ominaisuus] käyttäen Complexity Budget -periaatetta:\n- Max [N] funktiota/komponenttia\n- Max [N] riviä per funktio\n- Ei abstraktioita joita käytetään alle 3 kertaa\n- Ei ennenaikaista optimointia\n- Selitä jokainen abstraktiotason valinta\n\nJos ratkaisu ylittää budjetin, kerro mitä voidaan poistaa.",
  },
  {
    id: "code-performance-coach",
    title: "Performance Coach",
    category: "Koodaus",
    description: "Optimoi suorituskyky mitattavilla tavoitteilla",
    suggestedMode: "react",
    template:
      "Analysoi ja optimoi tämä koodi suorituskyvyn näkökulmasta:\n\n```\n[liitä koodi]\n```\n\nTavoite: [esim. alle 100ms latausaika, alle 50KB bundle]\n\nTee analyysi:\n1. Nykyiset pullonkaulat\n2. Ehdotetut optimoinnit tärkeysjärjestyksessä\n3. Arvioitu vaikutus per optimointi\n4. Toteutus muutokselle #1",
  },
  {
    id: "code-failure-debugger",
    title: "Failure-First Debugger",
    category: "Koodaus",
    description: "Analysoi bugi systemaattisesti — root cause ennen fix",
    suggestedMode: "react",
    template:
      "Debuggaa tämä ongelma käyttäen Failure-First -metodia:\n\nVirhe/ongelma: [kuvaus]\nOdotettu käyttäytyminen: [mitä pitäisi tapahtua]\nTodellinen käyttäytyminen: [mitä tapahtuu]\nKonteksti: [stack trace / console / koodi]\n\nAnalyysi:\n1. Listaa kaikki mahdolliset syyt\n2. Järjestä todennäköisimmästä epätodennäköisimpään\n3. Kysy tarvittavat lisätiedot ENNEN kuin ehdotat fixiä\n4. Ehdota fix vasta kun root cause on selvä",
  },

  // ── RAKENTAMINEN: Konkreettiset build-tehtävät ──────────────────────────
  {
    id: "build-landing",
    title: "Rakenna landing page",
    category: "Rakentaminen",
    description: "Täydellinen landing page -spesifikaatio ja toteutus",
    suggestedMode: "react",
    template:
      "Rakenna uusi landing page [sivustosi nimelle] käyttäen React + Tailwind CSS + shadcn/ui.\n\nSivun rakenne:\n1. Hero-osio: otsikko, alaotsikko, CTA-painike\n2. Features-osio: 3 ominaisuutta ikonein\n3. Social proof: testimonialit tai logot\n4. Pricing-osio: [hinnoittelumalli]\n5. FAQ: 5 yleisintä kysymystä\n6. Footer CTA\n\nKohderyhmä: [kuvaile]\nSävy: [luottamusta rakentava / suoraviivaiseen toimintaan kannustava]\nVärimaailma: [värit]\n\nKirjoita täydellinen toimiva React-komponentti.",
  },
  {
    id: "build-dashboard",
    title: "Rakenna dashboard-näkymä",
    category: "Rakentaminen",
    description: "KPI-dashboard tilastoineen ja kaavioinen",
    suggestedMode: "react",
    template:
      "Rakenna dashboard-näkymä [tuotteelle/palvelulle] seuraavilla vaatimuksilla:\n\nMetriikkakortit: [metriikka 1], [metriikka 2], [metriikka 3]\nKaaviot: [kaaviotyyppi] [datalle]\nTaulukko: [mitä dataa]\nSuodattimet: [aikaväli / status / kategoria]\n\nTech stack: React + Recharts + shadcn/ui + Tailwind\nData tulee Supabasesta taulusta [taulun nimi]\n\nRakenna koko komponentti mock-datalla toimivaksi.",
  },
  {
    id: "build-form",
    title: "Rakenna lomake validoinnilla",
    category: "Rakentaminen",
    description: "React Hook Form + Zod validointi + Supabase submit",
    suggestedMode: "react",
    template:
      "Rakenna lomake [toimintoa varten] seuraavilla kentillä:\n[kenttä 1: tyyppi, validointi]\n[kenttä 2: tyyppi, validointi]\n[kenttä 3: tyyppi, validointi]\n\nTech stack: React Hook Form + Zod + shadcn/ui + Tailwind\nSubmit: tallenna Supabase-tauluun [taulun nimi]\nVirheenkäsittely: näytä toast-ilmoitukset\nLataustilanteen indikaattori submit-painikkeessa\n\nKirjoita täydellinen komponentti TypeScript-tyyppeineen.",
  },
  {
    id: "build-api-endpoint",
    title: "Rakenna API endpoint",
    category: "Rakentaminen",
    description: "TanStack Start server function autentikoinnilla",
    suggestedMode: "react",
    template:
      "Rakenna TanStack Start server function toiminnolle [kuvaus].\n\nInput: [kentät ja tyypit]\nOutput: [paluuarvo]\nAutentikointi: vaadi kirjautunut käyttäjä\nValidointi: Zod-skeema inputille\nVirheenkäsittely: selkeät error messaget\nSupabase-operaatiot: [mitä kantaan tehdään]\n\nLisäksi kirjoita React hook joka kutsuu tätä server functionia ja hallitsee loading/error-tilan.",
  },
  {
    id: "build-auth-flow",
    title: "Rakenna auth-flow",
    category: "Rakentaminen",
    description: "Supabase Auth: kirjautuminen, rekisteröityminen, salasanan palautus",
    suggestedMode: "supabase",
    template:
      "Rakenna täydellinen autentikointi-flow Supabase Auth -kirjastolla.\n\nNäkymät:\n1. Kirjautuminen (email + salasana)\n2. Rekisteröityminen (email + salasana + [lisäkentät])\n3. Salasanan palautus\n4. Email-vahvistus\n\nTech: React + TanStack Router + Supabase Auth\nRedirect kirjautumisen jälkeen: [reitti]\nSuojatut reitit: [reitit]\n\nKirjoita kaikki komponentit ja route guards.",
  },

  // ── SUPABASE ────────────────────────────────────────────────────────────
  {
    id: "supa-migration",
    title: "Kirjoita migraatio",
    category: "Supabase",
    description: "Supabase SQL-migraatio RLS-käytännöillä",
    suggestedMode: "supabase",
    template:
      "Kirjoita Supabase PostgreSQL -migraatio taululle [taulun nimi].\n\nKentät:\n- [kenttä]: [tyyppi] [nullable/not null] [default]\n- [kenttä]: [tyyppi]\n\nViittaukset: [foreign key -suhteet]\nIndexit: [tarvittavat indeksit]\n\nRLS-käytännöt:\n- SELECT: [kuka näkee]\n- INSERT: [kuka voi lisätä]\n- UPDATE: [kuka voi muokata]\n- DELETE: [kuka voi poistaa]\n\nLisää updated_at trigger. Käytä SECURITY DEFINER vain jos välttämätöntä.",
  },
  {
    id: "supa-rls-audit",
    title: "RLS-auditointi",
    category: "Supabase",
    description: "Tarkista RLS-käytännöt tietoturvan näkökulmasta",
    suggestedMode: "supabase",
    template:
      "Auditoi nämä Supabase RLS-käytännöt tietoturvan näkökulmasta:\n\n```sql\n[liitä RLS-käytännöt]\n```\n\nTarkistettavat asiat:\n1. Pääseekö anon-rooli dataan jota ei pitäisi?\n2. Voiko authenticated käyttäjä nähdä muiden dataa?\n3. SECURITY DEFINER -funktioiden tietoturvariskit\n4. Puuttuvatko indexit policy-lausekkeista?\n5. Voidaanko käytäntöjä yksinkertaistaa?\n\nAnna konkreettiset korjausehdotukset SQL:nä.",
  },
  {
    id: "supa-edge-function",
    title: "Rakenna Edge Function",
    category: "Supabase",
    description: "Supabase Edge Function Deno/TypeScript",
    suggestedMode: "supabase",
    template:
      "Rakenna Supabase Edge Function toiminnolle [kuvaus].\n\nTrigger: [HTTP POST / webhook / cron]\nInput: [payload-rakenne]\nLogiikka:\n1. [vaihe 1]\n2. [vaihe 2]\nOutput: [vastaus]\n\nKäytä Supabase service role -clienttiä suojattuihin operaatioihin.\nVirheenkäsittely: loggaa virheet, palauta selkeät HTTP-statukset.\nSisällytä CORS-headersit.\n\nKirjoita täydellinen Deno TypeScript -koodi.",
  },
  {
    id: "supa-query-optimize",
    title: "Optimoi Supabase-kysely",
    category: "Supabase",
    description: "Hidaan kyselyn analyysi ja optimointi",
    suggestedMode: "supabase",
    template:
      "Optimoi tämä Supabase-kysely joka on hidas:\n\n```\n[liitä kysely / Supabase client -koodi]\n```\n\nTaulun koko: ~[rivimäärä] riviä\nNykyinen vasteaika: ~[ms]\nTavoitevasteaika: alle [ms]\n\nAnalyysoi:\n1. Puuttuvatko indeksit?\n2. Voidaanko N+1-ongelma välttää?\n3. Onko parempi join-strategia?\n4. Kannattaako materialisoitu näkymä?\n\nAnna EXPLAIN ANALYZE -tulkinta ja optimoitu versio.",
  },

  // ── N8N ─────────────────────────────────────────────────────────────────
  {
    id: "n8n-workflow-build",
    title: "Rakenna n8n workflow",
    category: "n8n",
    description: "Täydellinen n8n workflow SDK:lla",
    suggestedMode: "n8n",
    template:
      "Rakenna n8n workflow seuraavalle automaatiolle:\n\nTrigger: [webhook / aikataulu / manuaalinen / app-trigger]\nLähdedata: [mistä data tulee]\nOperaatiot:\n1. [vaihe 1 — esim. hae data]\n2. [vaihe 2 — esim. käsittele]\n3. [vaihe 3 — esim. tallenna/lähetä]\nKohde: [minne lopputulos menee]\n\nVirheenkäsittely: ilmoita Slackiin/sähköpostiin epäonnistumisesta.\n\nKirjoita täydellinen n8n workflow SDK -koodi nodes ja connections mukaan.",
  },
  {
    id: "n8n-ai-agent",
    title: "Rakenna n8n AI Agent",
    category: "n8n",
    description: "n8n AI Agent -workflow Claude/OpenAI:lla",
    suggestedMode: "n8n",
    template:
      "Rakenna n8n AI Agent -workflow joka:\n\nTehtävä: [mitä agentin pitää tehdä]\nTrigger: [webhook / chat-viesti / sähköposti]\nAI-malli: Claude (claude-sonnet-4-5)\nTools agentilla:\n- [työkalu 1: esim. Supabase-haku]\n- [työkalu 2: esim. sähköpostin lähetys]\n- [työkalu 3]\n\nSystem prompt agentille: [ohjeet]\nOutput: [mitä agentti palauttaa]\n\nKirjoita workflow n8n SDK:lla täydellisine tool-definitioneineen.",
  },
  {
    id: "n8n-data-sync",
    title: "Data sync -automaatio",
    category: "n8n",
    description: "Kahden systeemin välinen datan synkronointi",
    suggestedMode: "n8n",
    template:
      "Rakenna n8n data sync -workflow joka synkronoi [lähde] → [kohde].\n\nSynkronointilogiikka:\n- Frekvenssi: [esim. joka tunti / reaaliajassa]\n- Mitä synkronoidaan: [kentät/taulut]\n- Konfliktinratkaisu: [uusin voittaa / lähde voittaa]\n- Deduplikaatio: [avainkenttä]\n\nVirheenkäsittely:\n- Epäonnistuneet rivit: [logi / retry / skip]\n- Ilmoitus: [milloin]\n\nKirjoita n8n workflow SDK:lla.",
  },

  // ── MARKETING ───────────────────────────────────────────────────────────
  {
    id: "mkt-landing",
    title: "Landing page -copy",
    category: "Marketing",
    description: "Konvertoiva hero + CTA SaaS-tuotteelle",
    template:
      "Kirjoita konvertoiva landing page -copy SaaS-tuotteelle [tuotteen nimi]. Kohderyhmä: [kuvaile]. Sisällytä: hero-otsikko (max 10 sanaa), alaotsikko (max 20 sanaa), 3 hyötypistettä (otsikko + 2 virkettä), sosiaalinen todiste ja CTA-painikkeen teksti. Sävy: [luottamusta rakentava/toimintaan kannustava].",
  },
  {
    id: "mkt-launch-campaign",
    title: "Product launch -kampanja",
    category: "Marketing",
    description: "Täydellinen lanseerauskampanja — kaikki kanavat",
    template:
      "Suunnittele täydellinen product launch -kampanja tuotteelle [tuote].\n\nKohderyhmä: [kuvaile]\nLanseerauspäivä: [päivämäärä]\nBudjetti: [budjetti tai rajaton]\n\nLuo:\n1. Launch-viikkoaikataulu\n2. Email-sekvenssi (3 viestiä: teaser, launch, follow-up)\n3. LinkedIn-postaukset (3 kpl)\n4. PR-julkaisutiedote\n5. Product Hunt -launch-teksti\n6. KPI-tavoitteet 30 päivälle",
  },
  {
    id: "mkt-ads",
    title: "Google/Meta Ads",
    category: "Marketing",
    description: "5 mainosvariaatiota A/B-testiin",
    template:
      "Luo 5 mainosvariaatiota A/B-testiin tuotteelle [tuote]. Kohderyhmä: [kuvaile]. Kanava: [Google/Meta/LinkedIn].\n\nJokaiselle:\n- Otsikko (max 30 merkkiä)\n- Alaotsikko (max 30 merkkiä)\n- Kuvaus (max 90 merkkiä)\n- Koukku/kulma (mitä psykologista triggerä käytetään)\n\nVariaatioiden tulee testata eri kulmia: hinta, pelko/kiireellisyys, hyöty, sosiaalinen todiste, uteliaisuus.",
  },
  {
    id: "mkt-positioning",
    title: "Brändin positiointi",
    category: "Marketing",
    description: "Positiointilauseke + erottuvuustekijät",
    template:
      "Auta minua määrittelemään brändin positiointi yritykselle [nimi], joka tekee [mitä]. Kilpailijat: [lista].\n\nLuo:\n1. Positioning statement (For [kohderyhmä] who [tarve], [tuote] is [kategoria] that [tärkein hyöty]. Unlike [kilpailija], [differentiator].)\n2. Tagline (3 vaihtoehtoa)\n3. 3 erottuvuustekijää perusteluineen\n4. Mitä emme ole / ketä emme palvele",
  },

  // ── MYYNTI ──────────────────────────────────────────────────────────────
  {
    id: "sales-outreach",
    title: "Kylmä outreach",
    category: "Myynti",
    description: "Personoitu LinkedIn/email-avaus",
    template:
      "Kirjoita personoitu kylmä outreach -viesti. Lähettäjä: [rooli ja yritys]. Vastaanottaja: [rooli, yritys, mitä tiedän heistä]. Tavoite: [tapaaminen/demo/arvolupaus].\n\nRakenne:\n- Henkilökohtainen koukku (heidän julkaisu/kasvu/uutinen)\n- Relevantti arvolupaus (1 virke)\n- Selkeä CTA\n\nMax 100 sanaa. Ei generic-mainontaa.",
  },
  {
    id: "sales-email-sequence",
    title: "5-osainen myyntisekvensssi",
    category: "Myynti",
    description: "Automaattinen follow-up sarja",
    template:
      "Kirjoita 5-osainen myyntisähköpostisekvenssi tuotteelle [tuote]. Kohderyhmä: [ICP]. Ongelma jota ratkaistaan: [ongelma].\n\nSekvenssi:\n1. Päivä 0: Ensikontakti + arvolupaus (100 sanaa)\n2. Päivä 3: Case study / sosiaalinen todiste (150 sanaa)\n3. Päivä 7: Vastaväitteen käsittely (100 sanaa)\n4. Päivä 14: Scarcity/urgency (80 sanaa)\n5. Päivä 21: Breakup-viesti (60 sanaa)\n\nJokaiselle: otsikkorivi, esiteksti, body.",
  },
  {
    id: "sales-objection",
    title: "Vastaväitteiden käsittely",
    category: "Myynti",
    description: "Skripti 5 yleisimpään vastaväitteeseen",
    template:
      "Anna myyntiskripti 5 yleisimmän vastaväitteen käsittelyyn tuotteelle [tuote].\n\nJokaiseen vastaväitteeseen:\n- Vastaväite (todellinen asiakkaan lause)\n- Empaattinen kuittaus\n- Reframing\n- Evidenssi/todiste\n- Siirtymä eteenpäin\n\nVastaväitteet: hinta on liian korkea, ei ole aikaa implementoida, meillä on jo ratkaisu, palaan myöhemmin, täytyy kysyä johdolta.",
  },

  // ── SOME ────────────────────────────────────────────────────────────────
  {
    id: "social-linkedin",
    title: "LinkedIn-postaus",
    category: "Some",
    description: "Sitouttava ammattilaispostaus",
    template:
      "Kirjoita sitouttava LinkedIn-postaus aiheesta [aihe].\n\nRakenne:\n- Koukku (1. rivi — pakottaa klikkaamaan 'Näytä lisää')\n- Tarina tai insight (3-5 lyhyttä kappaletta)\n- Opetus / takeaway\n- Kysymys kommenteille\n\nSävy: henkilökohtainen, rehellinen, ei korporaatiomainen.\nPituus: 150-300 sanaa.\nEi emojeja joka rivin alussa.",
  },
  {
    id: "social-content-calendar",
    title: "Somekalenteri (30 päivää)",
    category: "Some",
    description: "Kuukauden somesuunnitelma kanavittain",
    template:
      "Luo 30 päivän some-kalenteri yritykselle [nimi] / henkilöbrändille [nimi].\n\nKanavat: [LinkedIn / Instagram / Twitter / TikTok]\nTeema kuukaudelle: [teema]\nTavoite: [näkyvyys / liidigenerointi / brändinrakennus]\n\nJokaiselle päivälle:\n- Kanava\n- Postaustyyppi (teksti/kuva/video/carousel)\n- Otsikko / hook\n- Pääviesti\n\nSisällytä: 40% arvosisältö, 30% behind-the-scenes, 20% sosiaalinen todiste, 10% promootiota.",
  },

  // ── SÄHKÖPOSTI ──────────────────────────────────────────────────────────
  {
    id: "email-newsletter",
    title: "Uutiskirje",
    category: "Sähköposti",
    description: "Viikoittainen newsletter-muotti",
    template:
      "Kirjoita uutiskirje aiheesta [aihe] kohderyhmälle [kuvaile].\n\nRakenne:\n- Otsikkorivi: koukuttava, max 50 merkkiä\n- Esiteksti: täydentää otsikkoa, max 90 merkkiä\n- Avaus: henkilökohtainen 2-3 virkettä\n- Pääsisältö: 3 osiota otsikoin\n- CTA: yksi selkeä toimintakehotus\n- PS-rivi: bonus-tieto tai persoonallinen huomio",
  },
  {
    id: "email-onboarding",
    title: "Onboarding-sekvenssi",
    category: "Sähköposti",
    description: "5 email -sarja uusille käyttäjille",
    template:
      "Suunnittele 5-osainen onboarding-emailsekvenssi tuotteelle [tuote]. Uuden käyttäjän tavoite: [mitä heidän pitää saavuttaa ensimmäisen viikon aikana].\n\nJokaiselle emailille:\n- Lähetysajankohta\n- Otsikkorivi\n- Pääviesti (100-150 sanaa)\n- Yksi CTA\n- Miksi tämä email lähetetään juuri tässä vaiheessa\n\nFokus: aktivointi, ensimmäinen 'aha-moment', retention.",
  },

  // ── REKRYTOINTI ─────────────────────────────────────────────────────────
  {
    id: "recruit-jobad",
    title: "Työpaikkailmoitus",
    category: "Rekrytointi",
    description: "Houkutteleva ja inklusiivinen ilmoitus",
    template:
      "Kirjoita työpaikkailmoitus rooliin [rooli] yrityksessä [nimi].\n\nTiedot:\n- Roolin ydin: [päätehtävät]\n- Must-have: [3 vaatimusta]\n- Nice-to-have: [2-3 etua]\n- Mitä tarjoamme: [palkka/optiot/remote/kulttuuri]\n- Hakuohje\n\nSävy: innostava, inklusiivinen (ei sukupuolitettu kieli).\nVältä: jargon, ylimääräiset vaatimukset, 'rock star' / 'ninja'.",
  },

  // ── SISÄLTÖ ─────────────────────────────────────────────────────────────
  {
    id: "content-blog-full",
    title: "Blogiartikkeli (täydellinen)",
    category: "Sisältö",
    description: "SEO-optimoitu artikkeli alusta loppuun",
    template:
      "Kirjoita täydellinen SEO-optimoitu blogiartikkeli.\n\nAihe: [aihe]\nPääavainsana: [avainsana]\nKohderyhmä: [kuvaile]\nPituus: [1000/1500/2000+ sanaa]\n\nRakenne:\n- Title tag (max 60 merkkiä, avainsana alussa)\n- Meta-kuvaus (max 155 merkkiä, CTA)\n- H1 (=title tai mielenkiintoisempi versio)\n- Johdanto (koukku + lupaus + rakenne)\n- [5-7 H2-osiota sisältöineen]\n- Johtopäätös + CTA\n- FAQ (5 kysymystä schema-markuppia varten)",
  },
  {
    id: "content-case-study",
    title: "Case study",
    category: "Sisältö",
    description: "Asiakastarinan rakenne myyntiin ja markkinointiin",
    template:
      "Kirjoita case study asiakkaasta [asiakkaan nimi/tyyppi] joka käytti [tuote/palvelu].\n\nRakenne:\n1. Otsikko: [Asiakas] + [mitattava tulos] + [aikajänne]\n2. Tiivistelmä (100 sanaa)\n3. Haaste: mikä ongelma asiakkaalla oli\n4. Ratkaisu: miten toteutettiin\n5. Tulokset: konkreettiset luvut\n6. Asiakkaan sitaatti\n7. CTA\n\nTee versio sekä pitkään artikkeliin (800 sanaa) että lyhyeen one-pageriin.",
  },

  // ── TUOTE ───────────────────────────────────────────────────────────────
  {
    id: "product-prd",
    title: "PRD: Tuotemääritys",
    category: "Tuote",
    description: "Product Requirements Document",
    template:
      "Kirjoita PRD (Product Requirements Document) ominaisuudelle [ominaisuus] tuotteessa [tuote].\n\nSisällytä:\n1. Ongelma ja mahdollisuus\n2. Kohderyhmä ja käyttötapaukset\n3. Tavoitteet ja success metrics\n4. Toiminnalliset vaatimukset (user stories)\n5. Ei-toiminnalliset vaatimukset (suorituskyky, tietoturva)\n6. Out of scope\n7. Riippuvuudet\n8. Riskit\n9. Aikataulu-ehdotus",
  },
  {
    id: "product-user-story",
    title: "User stories sprintille",
    category: "Tuote",
    description: "Sprint-backlog acceptance criterioineen",
    template:
      "Kirjoita user stories sprintille, jonka teema on [teema] tuotteessa [tuote].\n\nJokaiselle storylle:\n- As a [käyttäjätyyppi], I want to [toiminto], so that [hyöty]\n- Acceptance criteria (Given/When/Then)\n- Story points -arvio (1/2/3/5/8)\n- Tekninen huomio\n\nLuo 5-8 storylistaa jotka voidaan toteuttaa 2-viikon sprintissä. Järjestä prioriteetin mukaan.",
  },

  // ── ANALYYSI ────────────────────────────────────────────────────────────
  {
    id: "analysis-competitor",
    title: "Kilpailija-analyysi",
    category: "Analyysi",
    description: "Strukturoitu vertailu kilpailijoihin",
    template:
      "Tee kattava kilpailija-analyysi tuotteelle [oma tuote]. Kilpailijat: [kilpailija 1], [kilpailija 2], [kilpailija 3].\n\nVertailtavat dimensiot:\n1. Hinnoittelu ja paketit\n2. Ominaisuudet (feature matrix)\n3. Kohderyhmä ja positiointi\n4. Go-to-market strategia\n5. Vahvuudet ja heikkoudet\n6. Asiakasarviot (mitä asiakkaat sanovat)\n7. Kasvun merkit\n\nLopuksi: 3 konkreettista erottautumismahdollisuutta meille.",
  },
  {
    id: "analysis-swot",
    title: "SWOT + strategia",
    category: "Analyysi",
    description: "SWOT-analyysi konkreettisiin toimenpiteisiin asti",
    template:
      "Tee SWOT-analyysi yritykselle/tuotteelle [nimi] tilanteessa [konteksti].\n\nJokaiselle kvadrantille (S/W/O/T):\n- 5 konkreettista havaintoa\n- Tärkeysjärjestys\n- Lyhyt perustelu\n\nAnalyysin jälkeen luo:\n- SO-strategia: vahvuudet × mahdollisuudet\n- ST-strategia: vahvuudet × uhat\n- WO-strategia: heikkoudet × mahdollisuudet\n- WT-strategia: suojautuminen\n\nPriorisoi top 3 toimenpidettä seuraavalle 90 päivälle.",
  },
  {
    id: "analysis-metrics",
    title: "Metrics framework",
    category: "Analyysi",
    description: "KPI-mittaristo ja North Star Metric",
    template:
      "Rakenna metrics framework tuotteelle [tuote] / yritykselle [nimi].\n\nBusiness-konteksti: [mitä mitataan ja miksi]\n\nDefineoi:\n1. North Star Metric (yksi luku joka kuvaa asiakkaan arvoa)\n2. L1-mittarit (3-5 KPI:tä jotka ohjaavat NSM:ää)\n3. L2-mittarit (diagnostiset mittarit per tiimi)\n4. Counter metrics (mitä ei saa huonontua)\n\nJokaiselle mittarille: määritelmä, miten mitataan, tavoite ja varoitusraja.",
  },
];

export const CATEGORIES: PresetCategory[] = [
  "Koodaus",
  "Rakentaminen",
  "Supabase",
  "n8n",
  "Marketing",
  "Myynti",
  "Some",
  "Sähköposti",
  "Rekrytointi",
  "Sisältö",
  "Tuote",
  "Analyysi",
];

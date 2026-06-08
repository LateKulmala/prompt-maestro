export type PresetCategory =
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
};

export const PRESETS: Preset[] = [
  // Marketing
  {
    id: "mkt-landing",
    title: "Laskeutumissivun copy",
    category: "Marketing",
    description: "Konvertoiva hero + CTA SaaS-tuotteelle",
    template:
      "Kirjoita konvertoiva laskeutumissivun copy SaaS-tuotteelle [tuotteen nimi]. Kohderyhmä: [kuvaile]. Sisällytä hero-otsikko, alaotsikko, 3 hyötypistettä ja CTA-painikkeen teksti.",
  },
  {
    id: "mkt-ads",
    title: "Google Ads -kampanja",
    category: "Marketing",
    description: "5 hakumainosvariaatiota A/B-testiin",
    template:
      "Luo 5 Google Ads -hakumainosvariaatiota tuotteelle [tuote]. Kohderyhmä: [kuvaile]. Jokaiselle 3 otsikkoa (max 30 merkkiä) ja 2 kuvausta (max 90 merkkiä).",
  },
  {
    id: "mkt-positioning",
    title: "Brändin positiointi",
    category: "Marketing",
    description: "Selkeä positiointilauseke ja erottuvuustekijät",
    template:
      "Auta minua määrittelemään brändin positiointi yritykselle [nimi], joka tekee [mitä]. Anna positiointilauseke, 3 erottuvuustekijää ja kilpailijoiden vertailu.",
  },

  // Myynti / Scouting
  {
    id: "sales-outreach",
    title: "Kylmä outreach -viesti",
    category: "Myynti",
    description: "Personoitu LinkedIn/email-avaus",
    template:
      "Kirjoita personoitu kylmä outreach -viesti LinkedIniin. Lähettäjä: [rooli ja yritys]. Vastaanottaja: [rooli/yritys]. Tavoite: [tapaaminen/demo]. Pidä lyhyenä (max 100 sanaa) ja arvoa korostavana.",
  },
  {
    id: "sales-scout",
    title: "Liidi-scouting kriteerit",
    category: "Myynti",
    description: "ICP ja hakukriteerit liidilistan rakentamiseen",
    template:
      "Määrittele ideaali asiakasprofiili (ICP) yritykselle, joka myy [tuote/palvelu]. Sisällytä: toimiala, yrityskoko, rooli päättäjässä, signaalit ostovalmiudesta ja hakukriteerit Apolloa/LinkedIn Sales Navigatoria varten.",
  },
  {
    id: "sales-objection",
    title: "Vastaväitteiden käsittely",
    category: "Myynti",
    description: "Vastaukset 5 yleisimpään vastaväitteeseen",
    template:
      "Anna myyntiskripti, jossa käsitellään 5 yleisintä vastaväitettä tuotteelle [tuote]. Jokaiseen: vastaväite, empaattinen vastaus ja siirtymä eteenpäin.",
  },

  // Some
  {
    id: "social-linkedin",
    title: "LinkedIn-postaus",
    category: "Some",
    description: "Sitouttava ammattilaispostaus tarinamuodossa",
    template:
      "Kirjoita sitouttava LinkedIn-postaus aiheesta [aihe]. Tyyli: henkilökohtainen tarina + opetus. Aloita koukuttavalla hookilla, käytä lyhyitä kappaleita ja päätä kysymykseen.",
  },
  {
    id: "social-instagram",
    title: "Instagram-kuvateksti",
    category: "Some",
    description: "Caption + hashtagit + CTA",
    template:
      "Luo Instagram-kuvateksti postaukselle aiheesta [aihe]. Sävy: [casual/inspiroiva/hauska]. Sisällytä koukku ensimmäisellä rivillä, 3-5 riviä sisältöä, CTA ja 15 relevanttia hashtagia.",
  },
  {
    id: "social-tiktok",
    title: "TikTok-skripti",
    category: "Some",
    description: "30 sek video-skripti hook + arvo + CTA",
    template:
      "Kirjoita 30 sekunnin TikTok-skripti aiheesta [aihe]. Rakenne: 3 sek hook, 20 sek arvoa/opetusta, 7 sek CTA. Lisää ehdotukset visuaaleille ja teksteille ruudulla.",
  },

  // Sähköposti
  {
    id: "email-newsletter",
    title: "Uutiskirje",
    category: "Sähköposti",
    description: "Viikoittainen newsletter -muotti",
    template:
      "Kirjoita uutiskirje aiheesta [aihe] kohderyhmälle [kuvaile]. Sisällytä: koukuttava otsikkorivi, esipuhe, 3 pääkohtaa ja CTA.",
  },
  {
    id: "email-sequence",
    title: "Onboarding-sekvenssi",
    category: "Sähköposti",
    description: "5 email -sarja uusille käyttäjille",
    template:
      "Suunnittele 5-osainen onboarding-emailsekvenssi tuotteelle [tuote]. Jokaiselle: aihe, lähetysajankohta, otsikkorivi ja viestin sisältö (lyhyt).",
  },

  // Rekrytointi
  {
    id: "recruit-jobad",
    title: "Työpaikkailmoitus",
    category: "Rekrytointi",
    description: "Houkutteleva ja inklusiivinen ilmoitus",
    template:
      "Kirjoita työpaikkailmoitus rooliin [rooli] yrityksessä [nimi]. Sisällytä: tehtävänkuvaus, vaadittu osaaminen, eduksi katsottava, mitä tarjoamme ja hakuohjeet. Sävy inklusiivinen ja innostava.",
  },

  // Sisältö
  {
    id: "content-blog",
    title: "Blogiartikkeli (outline)",
    category: "Sisältö",
    description: "SEO-optimoitu artikkelirunko",
    template:
      "Luo SEO-optimoitu blogiartikkelin runko aiheesta [aihe]. Pääavainsana: [avainsana]. Sisällytä: meta-otsikko, meta-kuvaus, H1, 5-7 H2-osiota lyhyillä kuvauksilla ja FAQ-osio.",
  },

  // Tuote
  {
    id: "product-prd",
    title: "PRD: Tuotemääritys",
    category: "Tuote",
    description: "Product Requirements Document -runko",
    template:
      "Kirjoita PRD (Product Requirements Document) ominaisuudelle [ominaisuus] tuotteessa [tuote]. Sisällytä: ongelma, kohderyhmä, tavoitteet, käyttötapaukset, vaatimukset, success metrics ja rajaukset.",
  },

  // Analyysi
  {
    id: "analysis-competitor",
    title: "Kilpailija-analyysi",
    category: "Analyysi",
    description: "Strukturoitu vertailu 3 kilpailijaan",
    template:
      "Tee kilpailija-analyysi tuotteelle [oma tuote]. Vertaa 3 kilpailijaa: [kilpailija 1, 2, 3]. Vertailtavat dimensiot: hinnoittelu, ominaisuudet, kohderyhmä, vahvuudet, heikkoudet ja erottautumismahdollisuudet.",
  },
];

export const CATEGORIES: PresetCategory[] = [
  "Marketing",
  "Myynti",
  "Some",
  "Sähköposti",
  "Rekrytointi",
  "Sisältö",
  "Tuote",
  "Analyysi",
];

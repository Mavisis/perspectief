import type { Outlet, Article, NewsEvent } from "./types";

export const outlets: Outlet[] = [
  { id: "volkskrant", name: "de Volkskrant", bias: "center-left",  ideology: { x: -0.6, y: -0.4 } },
  { id: "nrc",        name: "NRC",           bias: "center-left",  ideology: { x: -0.3, y: -0.2 } },
  { id: "trouw",      name: "Trouw",         bias: "center",       ideology: { x: -0.2,  y:  0.2 } },
  { id: "ad",         name: "AD",            bias: "center",       ideology: { x:  0.1,  y:  0.0 } },
  { id: "nos",        name: "NOS",           bias: "center",       ideology: { x:  0.0,  y: -0.1 } },
  { id: "telegraaf",  name: "De Telegraaf",  bias: "center-right", ideology: { x:  0.7,  y:  0.4 } },
  { id: "rd",         name: "Reformatorisch Dagblad", bias: "religious",   ideology: { x:  0.4,  y:  0.8 } },
  { id: "geenstijl",  name: "GeenStijl",            bias: "right",        ideology: { x:  0.85, y:  0.5 } },
  { id: "nd",         name: "Nederlands Dagblad",    bias: "religious",   ideology: { x:  0.3,  y:  0.7 } },
  { id: "fd",         name: "Het Financieele Dagblad", bias: "center-right", ideology: { x: 0.4, y: -0.1 } },
];

export const articles: Article[] = [
  // Event 1: Housing crisis
  {
    id: "a1",
    headline: "Woningcrisis treft jongeren het hardst: 'We worden vergeten'",
    summary: "Jongeren voelen zich in de steek gelaten door de overheid in de woningcrisis.",
    content: `De woningcrisis in Nederland raakt jongeren onevenredig hard, blijkt uit nieuw onderzoek. Starters op de woningmarkt moeten gemiddeld 12 jaar wachten op een sociale huurwoning, terwijl koopprijzen blijven stijgen.\n\nVolgens onderzoekers is structurele investering in betaalbare woningbouw de enige oplossing. "De markt lost dit niet op," zegt hoogleraar volkshuisvesting Marja de Vries. "We hebben een actieve overheid nodig die ingrijpt."\n\nHet rapport pleit voor strengere regulering van de vrije huursector en meer investering in corporatiewoningen. Critici noemen dit echter 'symptoombestrijding' en pleiten voor fundamentele hervormingen van het hele woningstelsel.`,
    outletId: "volkskrant",
    publishedAt: "2025-02-01",
    eventId: "e1",
  },
  {
    id: "a2",
    headline: "Doorgeschoten regulering remt woningbouw: bouwers luiden noodklok",
    summary: "Bouwbedrijven waarschuwen dat overregulering nieuwbouw vertraagt.",
    content: `Bouwbedrijven slaan alarm over de toenemende regeldruk die nieuwbouwprojecten vertraagt en duurder maakt. "Elke vergunning kost maanden extra door bureaucratie," aldus branchevoorzitter Kees Jansen.\n\nDe sector pleit voor deregulering en fiscale prikkels om investeerders aan te trekken. "De markt kan dit oplossen, maar dan moet de overheid wel ruimte geven," zegt Jansen.\n\nOndertussen stijgen de huizenprijzen verder. Volgens makelaarsvereniging NVM is de gemiddelde vraagprijs nu boven de €430.000 gestegen. Kopers die geen hulp van ouders krijgen, vallen steeds vaker buiten de boot.`,
    outletId: "telegraaf",
    publishedAt: "2025-02-01",
    eventId: "e1",
  },
  {
    id: "a3",
    headline: "Woningnood: overheid moet bouwen én reguleren",
    summary: "NOS analyseert de woningcrisis vanuit meerdere perspectieven.",
    content: `De Nederlandse woningmarkt zit vast in een impasse. Uit cijfers van het CBS blijkt dat er jaarlijks 100.000 woningen bijgebouwd moeten worden, maar dat de realisatie op slechts 70.000 blijft steken.\n\nExperts zijn verdeeld over de oplossing. Links pleit voor meer overheidsregie en sociale woningbouw. Rechts wil deregulering en marktwerking. De realiteit is dat beide benaderingen nodig zijn, zeggen onafhankelijke onderzoekers.\n\n"Dit is geen links of rechts probleem," zegt planoloog dr. Van den Berg. "Het is een systeemfalen dat structurele hervormingen vereist."`,
    outletId: "nos",
    publishedAt: "2025-02-01",
    eventId: "e1",
  },
  {
    id: "a4",
    headline: "Gezinnen in de knel: woningnood bedreigt gemeenschapsleven",
    summary: "De woningcrisis ondermijnt het gezinsleven en lokale gemeenschappen.",
    content: `De woningcrisis raakt niet alleen individuen maar hele gemeenschappen. Kerken en lokale organisaties zien steeds meer gezinnen die geen passende woning kunnen vinden.\n\n"Jonge gezinnen trekken weg uit dorpen omdat er simpelweg geen betaalbare woningen zijn," zegt dominee Hendrik van der Wal. "Dat ondermijnt het gemeenschapsleven."\n\nHet Reformatorisch Dagblad pleit voor meer aandacht voor de sociale dimensie van de woningcrisis. "Wonen gaat niet alleen over stenen, maar over samenleven."`,
    outletId: "rd",
    publishedAt: "2025-02-02",
    eventId: "e1",
  },

  // Event 2: Climate policy
  {
    id: "a5",
    headline: "Nederland haalt klimaatdoelen niet: strengere maatregelen nodig",
    summary: "Milieuorganisaties eisen strengere klimaatmaatregelen van de overheid.",
    content: `Nederland dreigt zijn klimaatdoelen voor 2030 niet te halen, waarschuwt het Planbureau voor de Leefomgeving. De huidige maatregelen zijn onvoldoende om de CO2-uitstoot met 55% te verminderen.\n\nMilieuorganisaties eisen snellere actie. "Elke dag uitstel kost mensenlevens," zegt directeur van Milieudefensie. Het PBL adviseert een combinatie van hogere CO2-belasting, strengere normen voor industrie, en versnelde energietransitie.\n\nDe landbouwsector, verantwoordelijk voor een aanzienlijk deel van de uitstoot, moet volgens het rapport "fundamenteel hervormd" worden.`,
    outletId: "nrc",
    publishedAt: "2025-01-28",
    eventId: "e2",
  },
  {
    id: "a6",
    headline: "Klimaatwahnsinn: burger betaalt de rekening van onhaalbare doelen",
    summary: "Kritiek op de kosten van klimaatbeleid voor gewone burgers.",
    content: `De klimaatambities van Den Haag dreigen de gewone burger te ruïneren. Hogere energiebelasting, duurdere boodschappen en verplichte woningisolatie: het klimaatbeleid raakt de portemonnee hard.\n\n"De mensen die het minst verdienen, betalen het meest," stelt econoom Pieter de Groot. Uit berekeningen blijkt dat een gemiddeld huishouden €1.200 per jaar meer kwijt is aan klimaatmaatregelen.\n\nTerwijl Nederland zichzelf kapot bezuinigt, stoten China en India meer uit dan ooit. "Wij zijn een druppel op een gloeiende plaat," concludeert De Groot.`,
    outletId: "geenstijl",
    publishedAt: "2025-01-28",
    eventId: "e2",
  },
  {
    id: "a7",
    headline: "Rentmeesterschap vraagt om duurzaam klimaatbeleid",
    summary: "Christelijke oproep tot verantwoord omgaan met de schepping.",
    content: `Als rentmeesters van de schepping hebben wij de plicht om de aarde goed achter te laten voor volgende generaties. Het klimaatdebat wordt te veel gedomineerd door economische argumenten.\n\n"Zorg voor de schepping is geen links of rechts thema," betoogt theoloog prof. dr. De Bruijn. "Het is een morele plicht."\n\nHet Reformatorisch Dagblad pleit voor een benadering die zowel economische als ecologische belangen weegt, maar de morele dimensie niet vergeet.`,
    outletId: "rd",
    publishedAt: "2025-01-29",
    eventId: "e2",
  },

  // Event 3: Immigration debate
  {
    id: "a8",
    headline: "Asielinstroom daalt, maar druk op gemeenten blijft hoog",
    summary: "Ondanks dalende cijfers worstelen gemeenten met asielopvang.",
    content: `De asielinstroom in Nederland is in 2024 met 15% gedaald ten opzichte van het jaar ervoor. Toch blijft de druk op gemeenten groot door achterstanden in de procedures en een tekort aan opvanglocaties.\n\nHet COA waarschuwt dat zonder structurele oplossingen de situatie nijpend blijft. "We hebben meer locaties nodig en snellere procedures," zegt COA-directeur.\n\nGemeenten zijn verdeeld: sommige willen meer opvangen, andere verzetten zich.`,
    outletId: "trouw",
    publishedAt: "2025-02-03",
    eventId: "e3",
  },
  {
    id: "a9",
    headline: "Nederland vol: asielcrisis vraagt om harde keuzes",
    summary: "Pleidooi voor strenger asielbeleid en lagere instroom.",
    content: `Nederland kan de huidige asielinstroom niet aan. Dat is geen mening maar een feit, gezien de wachtlijsten voor woningen, de druk op de zorg en het onderwijs.\n\n"We moeten eerlijk zijn: er zijn grenzen aan wat een klein land kan opvangen," stelt commentator Hans Verbeek. "Dat is geen racisme, dat is realisme."\n\nDe roep om strengere grensbewaking en snellere uitzetting van uitgeprocedeerden wordt luider. Het draagvlak voor het huidige asielbeleid brokkelt af.`,
    outletId: "telegraaf",
    publishedAt: "2025-02-03",
    eventId: "e3",
  },
  {
    id: "a10",
    headline: "Vluchtelingen verdienen menswaardige opvang, geen politiek spel",
    summary: "Oproep om het asieldebat te ontdoen van populistisch sentiment.",
    content: `Het asieldebat in Nederland is verworden tot een politiek steekspel waarin de menselijke maat verloren gaat. Vluchtelingen worden gereduceerd tot cijfers en problemen.\n\n"Achter elk asielnummer zit een mens met een verhaal," schrijft columnist Fatima el Haouari. "We mogen kritisch zijn over beleid, maar nooit onmenselijk."\n\nDe Volkskrant pleit voor een nuchtere, humane benadering: snellere procedures, betere integratie, en eerlijke spreiding over gemeenten.`,
    outletId: "volkskrant",
    publishedAt: "2025-02-04",
    eventId: "e3",
  },

  // Event 4: Education
  {
    id: "a11",
    headline: "Lerarentekort loopt op: klassen worden steeds groter",
    summary: "Het lerarentekort bereikt een kritiek punt in het basisonderwijs.",
    content: `Het lerarentekort in het basisonderwijs is opgelopen tot bijna 10.000 fte. Scholen worden gedwongen klassen samen te voegen, vierdaagse schoolweken in te voeren of onbevoegde krachten voor de klas te zetten.\n\n"Dit is een crisis die we al jaren zien aankomen," zegt AOb-voorzitter Eugenie Stolk. "Maar er is te weinig gedaan."\n\nHet tekort treft vooral scholen in achterstandswijken, waardoor de kansenongelijkheid groeit.`,
    outletId: "ad",
    publishedAt: "2025-02-05",
    eventId: "e4",
  },
  {
    id: "a12",
    headline: "Salarisverhoging alleen lost lerarentekort niet op",
    summary: "NRC analyseert de structurele oorzaken van het lerarentekort.",
    content: `Hoewel de salarissen van leraren de afgelopen jaren zijn verhoogd, blijft het tekort groeien. De oorzaken liggen dieper: hoge werkdruk, beperkte autonomie, en een gebrek aan waardering.\n\n"Geld is belangrijk, maar het gaat ook om werkplezier," zegt onderwijskundige dr. Adriana Kok. "Leraren willen minder bureaucratie en meer ruimte om hun vak uit te oefenen."\n\nHet NRC pleit voor een integrale aanpak: betere arbeidsvoorwaarden, minder administratielast, en meer professionele vrijheid.`,
    outletId: "nrc",
    publishedAt: "2025-02-05",
    eventId: "e4",
  },
];

export const events: NewsEvent[] = [
  {
    id: "e1",
    title: "Woningcrisis in Nederland",
    date: "2025-02-01",
    summary: "De Nederlandse woningmarkt staat onder extreme druk. Starters, jongeren en gezinnen kunnen nauwelijks een betaalbare woning vinden.",
    articleIds: ["a1", "a2", "a3", "a4"],
    sharedFacts: [
      "Er is een tekort van honderdduizenden woningen in Nederland",
      "De gemiddelde huizenprijs is boven €400.000 gestegen",
      "Wachttijden voor sociale huur lopen op tot meer dan 10 jaar",
      "De nieuwbouwproductie blijft achter bij de doelstelling van 100.000 per jaar",
    ],
  },
  {
    id: "e2",
    title: "Klimaatbeleid en de energietransitie",
    date: "2025-01-28",
    summary: "Nederland worstelt met de vraag hoe klimaatdoelen gehaald kunnen worden zonder de samenleving te veel te belasten.",
    articleIds: ["a5", "a6", "a7"],
    sharedFacts: [
      "Nederland dreigt de klimaatdoelen voor 2030 niet te halen",
      "Het Planbureau voor de Leefomgeving (PBL) waarschuwt voor onvoldoende voortgang",
      "De energiekosten voor huishoudens zijn de afgelopen jaren gestegen",
    ],
  },
  {
    id: "e3",
    title: "Asieldebat en migratiebeleid",
    date: "2025-02-03",
    summary: "Het debat over asielopvang en migratie blijft Nederland verdelen, met uiteenlopende visies over draagvlak en menselijkheid.",
    articleIds: ["a8", "a9", "a10"],
    sharedFacts: [
      "De asielinstroom is in 2024 met 15% gedaald",
      "Het COA kampt met een tekort aan opvanglocaties",
      "Gemeenten zijn verdeeld over de spreiding van asielzoekers",
    ],
  },
  {
    id: "e4",
    title: "Lerarentekort in het onderwijs",
    date: "2025-02-05",
    summary: "Het groeiende lerarentekort bedreigt de kwaliteit van het Nederlandse onderwijs en vergroot de kansenongelijkheid.",
    articleIds: ["a11", "a12"],
    sharedFacts: [
      "Het tekort in het basisonderwijs bedraagt bijna 10.000 fte",
      "Scholen in achterstandswijken worden het hardst getroffen",
      "Leraarssalarissen zijn de afgelopen jaren verhoogd",
    ],
  },
];

export function getOutlet(id: string): Outlet | undefined {
  return outlets.find((o) => o.id === id);
}

export function getArticle(id: string): Article | undefined {
  return articles.find((a) => a.id === id);
}

export function getEvent(id: string): NewsEvent | undefined {
  return events.find((e) => e.id === id);
}

export function getArticlesForEvent(eventId: string): Article[] {
  return articles.filter((a) => a.eventId === eventId);
}

export function searchEvents(query: string): NewsEvent[] {
  const q = query.toLowerCase();
  return events.filter(
    (e) =>
      e.title.toLowerCase().includes(q) ||
      e.summary.toLowerCase().includes(q)
  );
}

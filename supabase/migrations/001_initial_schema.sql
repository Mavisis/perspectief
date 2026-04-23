-- ============================================================
-- Perspectief — initial schema
-- Run this in: Supabase dashboard → SQL Editor
-- ============================================================

-- ── Tables ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS outlets (
  id          TEXT        PRIMARY KEY,
  name        TEXT        NOT NULL,
  bias        TEXT        NOT NULL CHECK (bias IN ('left','center-left','center','center-right','right','religious')),
  ideology_x  NUMERIC(4,2) NOT NULL,
  ideology_y  NUMERIC(4,2) NOT NULL,
  rss_url     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS events (
  id           TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  title        TEXT        NOT NULL,
  date         DATE        NOT NULL,
  summary      TEXT        NOT NULL,
  shared_facts TEXT[]      NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS articles (
  id           TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  headline     TEXT        NOT NULL,
  summary      TEXT        NOT NULL,
  content      TEXT        NOT NULL,
  outlet_id    TEXT        NOT NULL REFERENCES outlets(id),
  event_id     TEXT        REFERENCES events(id),
  published_at TIMESTAMPTZ NOT NULL,
  source_url   TEXT        UNIQUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes ──────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS articles_event_id_idx    ON articles(event_id);
CREATE INDEX IF NOT EXISTS articles_outlet_id_idx   ON articles(outlet_id);
CREATE INDEX IF NOT EXISTS articles_published_at_idx ON articles(published_at DESC);
CREATE INDEX IF NOT EXISTS events_date_idx           ON events(date DESC);

-- ── Row-Level Security ───────────────────────────────────────

ALTER TABLE outlets  ENABLE ROW LEVEL SECURITY;
ALTER TABLE events   ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- Public read (anon key can read, used by Edge Functions with anon key)
CREATE POLICY "outlets_public_read"  ON outlets  FOR SELECT USING (true);
CREATE POLICY "events_public_read"   ON events   FOR SELECT USING (true);
CREATE POLICY "articles_public_read" ON articles FOR SELECT USING (true);

-- Service role full write (pipeline uses service key)
CREATE POLICY "outlets_service_write"  ON outlets  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "events_service_write"   ON events   FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "articles_service_write" ON articles FOR ALL USING (auth.role() = 'service_role');

-- ── Seed: Outlets ────────────────────────────────────────────

INSERT INTO outlets (id, name, bias, ideology_x, ideology_y, rss_url) VALUES
  ('volkskrant', 'de Volkskrant',         'center-left',  -0.60, -0.40, 'https://www.volkskrant.nl/rss.xml'),
  ('nrc',        'NRC',                   'center-left',  -0.30, -0.20, 'https://www.nrc.nl/rss/'),
  ('trouw',      'Trouw',                 'center',       -0.20,  0.20, 'https://www.trouw.nl/rss.xml'),
  ('ad',         'AD',                    'center',        0.10,  0.00, 'https://www.ad.nl/rss.xml'),
  ('nos',        'NOS',                   'center',        0.00, -0.10, 'https://feeds.nos.nl/nosnieuwsalgemeen'),
  ('telegraaf',  'De Telegraaf',          'center-right',  0.70,  0.40, 'https://www.telegraaf.nl/rss'),
  ('rd',         'Reformatorisch Dagblad','religious',     0.40,  0.80, 'https://www.rd.nl/rss.xml'),
  ('geenstijl',  'GeenStijl',             'right',         0.85,  0.50, 'https://www.geenstijl.nl/rss.xml')
ON CONFLICT (id) DO NOTHING;

-- ── Seed: Events ─────────────────────────────────────────────

INSERT INTO events (id, title, date, summary, shared_facts) VALUES
  ('e1', 'Woningcrisis in Nederland', '2025-02-01',
   'De Nederlandse woningmarkt staat onder extreme druk. Starters, jongeren en gezinnen kunnen nauwelijks een betaalbare woning vinden.',
   ARRAY[
     'Er is een tekort van honderdduizenden woningen in Nederland',
     'De gemiddelde huizenprijs is boven €400.000 gestegen',
     'Wachttijden voor sociale huur lopen op tot meer dan 10 jaar',
     'De nieuwbouwproductie blijft achter bij de doelstelling van 100.000 per jaar'
   ]),
  ('e2', 'Klimaatbeleid en de energietransitie', '2025-01-28',
   'Nederland worstelt met de vraag hoe klimaatdoelen gehaald kunnen worden zonder de samenleving te veel te belasten.',
   ARRAY[
     'Nederland dreigt de klimaatdoelen voor 2030 niet te halen',
     'Het Planbureau voor de Leefomgeving (PBL) waarschuwt voor onvoldoende voortgang',
     'De energiekosten voor huishoudens zijn de afgelopen jaren gestegen'
   ]),
  ('e3', 'Asieldebat en migratiebeleid', '2025-02-03',
   'Het debat over asielopvang en migratie blijft Nederland verdelen, met uiteenlopende visies over draagvlak en menselijkheid.',
   ARRAY[
     'De asielinstroom is in 2024 met 15% gedaald',
     'Het COA kampt met een tekort aan opvanglocaties',
     'Gemeenten zijn verdeeld over de spreiding van asielzoekers'
   ]),
  ('e4', 'Lerarentekort in het onderwijs', '2025-02-05',
   'Het groeiende lerarentekort bedreigt de kwaliteit van het Nederlandse onderwijs en vergroot de kansenongelijkheid.',
   ARRAY[
     'Het tekort in het basisonderwijs bedraagt bijna 10.000 fte',
     'Scholen in achterstandswijken worden het hardst getroffen',
     'Leraarssalarissen zijn de afgelopen jaren verhoogd'
   ])
ON CONFLICT (id) DO NOTHING;

-- ── Seed: Articles ───────────────────────────────────────────

INSERT INTO articles (id, headline, summary, content, outlet_id, event_id, published_at) VALUES
('a1',
 'Woningcrisis treft jongeren het hardst: ''We worden vergeten''',
 'Jongeren voelen zich in de steek gelaten door de overheid in de woningcrisis.',
 $body$De woningcrisis in Nederland raakt jongeren onevenredig hard, blijkt uit nieuw onderzoek. Starters op de woningmarkt moeten gemiddeld 12 jaar wachten op een sociale huurwoning, terwijl koopprijzen blijven stijgen.

Volgens onderzoekers is structurele investering in betaalbare woningbouw de enige oplossing. "De markt lost dit niet op," zegt hoogleraar volkshuisvesting Marja de Vries. "We hebben een actieve overheid nodig die ingrijpt."

Het rapport pleit voor strengere regulering van de vrije huursector en meer investering in corporatiewoningen. Critici noemen dit echter 'symptoombestrijding' en pleiten voor fundamentele hervormingen van het hele woningstelsel.$body$,
 'volkskrant', 'e1', '2025-02-01T00:00:00Z'),

('a2',
 'Doorgeschoten regulering remt woningbouw: bouwers luiden noodklok',
 'Bouwbedrijven waarschuwen dat overregulering nieuwbouw vertraagt.',
 $body$Bouwbedrijven slaan alarm over de toenemende regeldruk die nieuwbouwprojecten vertraagt en duurder maakt. "Elke vergunning kost maanden extra door bureaucratie," aldus branchevoorzitter Kees Jansen.

De sector pleit voor deregulering en fiscale prikkels om investeerders aan te trekken. "De markt kan dit oplossen, maar dan moet de overheid wel ruimte geven," zegt Jansen.

Ondertussen stijgen de huizenprijzen verder. Volgens makelaarsvereniging NVM is de gemiddelde vraagprijs nu boven de €430.000 gestegen. Kopers die geen hulp van ouders krijgen, vallen steeds vaker buiten de boot.$body$,
 'telegraaf', 'e1', '2025-02-01T00:00:00Z'),

('a3',
 'Woningnood: overheid moet bouwen én reguleren',
 'NOS analyseert de woningcrisis vanuit meerdere perspectieven.',
 $body$De Nederlandse woningmarkt zit vast in een impasse. Uit cijfers van het CBS blijkt dat er jaarlijks 100.000 woningen bijgebouwd moeten worden, maar dat de realisatie op slechts 70.000 blijft steken.

Experts zijn verdeeld over de oplossing. Links pleit voor meer overheidsregie en sociale woningbouw. Rechts wil deregulering en marktwerking. De realiteit is dat beide benaderingen nodig zijn, zeggen onafhankelijke onderzoekers.

"Dit is geen links of rechts probleem," zegt planoloog dr. Van den Berg. "Het is een systeemfalen dat structurele hervormingen vereist."$body$,
 'nos', 'e1', '2025-02-01T00:00:00Z'),

('a4',
 'Gezinnen in de knel: woningnood bedreigt gemeenschapsleven',
 'De woningcrisis ondermijnt het gezinsleven en lokale gemeenschappen.',
 $body$De woningcrisis raakt niet alleen individuen maar hele gemeenschappen. Kerken en lokale organisaties zien steeds meer gezinnen die geen passende woning kunnen vinden.

"Jonge gezinnen trekken weg uit dorpen omdat er simpelweg geen betaalbare woningen zijn," zegt dominee Hendrik van der Wal. "Dat ondermijnt het gemeenschapsleven."

Het Reformatorisch Dagblad pleit voor meer aandacht voor de sociale dimensie van de woningcrisis. "Wonen gaat niet alleen over stenen, maar over samenleven."$body$,
 'rd', 'e1', '2025-02-02T00:00:00Z'),

('a5',
 'Nederland haalt klimaatdoelen niet: strengere maatregelen nodig',
 'Milieuorganisaties eisen strengere klimaatmaatregelen van de overheid.',
 $body$Nederland dreigt zijn klimaatdoelen voor 2030 niet te halen, waarschuwt het Planbureau voor de Leefomgeving. De huidige maatregelen zijn onvoldoende om de CO2-uitstoot met 55% te verminderen.

Milieuorganisaties eisen snellere actie. "Elke dag uitstel kost mensenlevens," zegt directeur van Milieudefensie. Het PBL adviseert een combinatie van hogere CO2-belasting, strengere normen voor industrie, en versnelde energietransitie.

De landbouwsector, verantwoordelijk voor een aanzienlijk deel van de uitstoot, moet volgens het rapport "fundamenteel hervormd" worden.$body$,
 'nrc', 'e2', '2025-01-28T00:00:00Z'),

('a6',
 'Klimaatwahnsinn: burger betaalt de rekening van onhaalbare doelen',
 'Kritiek op de kosten van klimaatbeleid voor gewone burgers.',
 $body$De klimaatambities van Den Haag dreigen de gewone burger te ruïneren. Hogere energiebelasting, duurdere boodschappen en verplichte woningisolatie: het klimaatbeleid raakt de portemonnee hard.

"De mensen die het minst verdienen, betalen het meest," stelt econoom Pieter de Groot. Uit berekeningen blijkt dat een gemiddeld huishouden €1.200 per jaar meer kwijt is aan klimaatmaatregelen.

Terwijl Nederland zichzelf kapot bezuinigt, stoten China en India meer uit dan ooit. "Wij zijn een druppel op een gloeiende plaat," concludeert De Groot.$body$,
 'geenstijl', 'e2', '2025-01-28T00:00:00Z'),

('a7',
 'Rentmeesterschap vraagt om duurzaam klimaatbeleid',
 'Christelijke oproep tot verantwoord omgaan met de schepping.',
 $body$Als rentmeesters van de schepping hebben wij de plicht om de aarde goed achter te laten voor volgende generaties. Het klimaatdebat wordt te veel gedomineerd door economische argumenten.

"Zorg voor de schepping is geen links of rechts thema," betoogt theoloog prof. dr. De Bruijn. "Het is een morele plicht."

Het Reformatorisch Dagblad pleit voor een benadering die zowel economische als ecologische belangen weegt, maar de morele dimensie niet vergeet.$body$,
 'rd', 'e2', '2025-01-29T00:00:00Z'),

('a8',
 'Asielinstroom daalt, maar druk op gemeenten blijft hoog',
 'Ondanks dalende cijfers worstelen gemeenten met asielopvang.',
 $body$De asielinstroom in Nederland is in 2024 met 15% gedaald ten opzichte van het jaar ervoor. Toch blijft de druk op gemeenten groot door achterstanden in de procedures en een tekort aan opvanglocaties.

Het COA waarschuwt dat zonder structurele oplossingen de situatie nijpend blijft. "We hebben meer locaties nodig en snellere procedures," zegt COA-directeur.

Gemeenten zijn verdeeld: sommige willen meer opvangen, andere verzetten zich.$body$,
 'trouw', 'e3', '2025-02-03T00:00:00Z'),

('a9',
 'Nederland vol: asielcrisis vraagt om harde keuzes',
 'Pleidooi voor strenger asielbeleid en lagere instroom.',
 $body$Nederland kan de huidige asielinstroom niet aan. Dat is geen mening maar een feit, gezien de wachtlijsten voor woningen, de druk op de zorg en het onderwijs.

"We moeten eerlijk zijn: er zijn grenzen aan wat een klein land kan opvangen," stelt commentator Hans Verbeek. "Dat is geen racisme, dat is realisme."

De roep om strengere grensbewaking en snellere uitzetting van uitgeprocedeerden wordt luider. Het draagvlak voor het huidige asielbeleid brokkelt af.$body$,
 'telegraaf', 'e3', '2025-02-03T00:00:00Z'),

('a10',
 'Vluchtelingen verdienen menswaardige opvang, geen politiek spel',
 'Oproep om het asieldebat te ontdoen van populistisch sentiment.',
 $body$Het asieldebat in Nederland is verworden tot een politiek steekspel waarin de menselijke maat verloren gaat. Vluchtelingen worden gereduceerd tot cijfers en problemen.

"Achter elk asielnummer zit een mens met een verhaal," schrijft columnist Fatima el Haouari. "We mogen kritisch zijn over beleid, maar nooit onmenselijk."

De Volkskrant pleit voor een nuchtere, humane benadering: snellere procedures, betere integratie, en eerlijke spreiding over gemeenten.$body$,
 'volkskrant', 'e3', '2025-02-04T00:00:00Z'),

('a11',
 'Lerarentekort loopt op: klassen worden steeds groter',
 'Het lerarentekort bereikt een kritiek punt in het basisonderwijs.',
 $body$Het lerarentekort in het basisonderwijs is opgelopen tot bijna 10.000 fte. Scholen worden gedwongen klassen samen te voegen, vierdaagse schoolweken in te voeren of onbevoegde krachten voor de klas te zetten.

"Dit is een crisis die we al jaren zien aankomen," zegt AOb-voorzitter Eugenie Stolk. "Maar er is te weinig gedaan."

Het tekort treft vooral scholen in achterstandswijken, waardoor de kansenongelijkheid groeit.$body$,
 'ad', 'e4', '2025-02-05T00:00:00Z'),

('a12',
 'Salarisverhoging alleen lost lerarentekort niet op',
 'NRC analyseert de structurele oorzaken van het lerarentekort.',
 $body$Hoewel de salarissen van leraren de afgelopen jaren zijn verhoogd, blijft het tekort groeien. De oorzaken liggen dieper: hoge werkdruk, beperkte autonomie, en een gebrek aan waardering.

"Geld is belangrijk, maar het gaat ook om werkplezier," zegt onderwijskundige dr. Adriana Kok. "Leraren willen minder bureaucratie en meer ruimte om hun vak uit te oefenen."

Het NRC pleit voor een integrale aanpak: betere arbeidsvoorwaarden, minder administratielast, en meer professionele vrijheid.$body$,
 'nrc', 'e4', '2025-02-05T00:00:00Z')
ON CONFLICT (id) DO NOTHING;

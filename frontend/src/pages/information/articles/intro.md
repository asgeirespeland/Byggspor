# Hva er Byggspor?

Byggspor er et webbasert verktøy for å beregne CO₂-utslipp fra materialleveranser til byggeprosjekter. Det leser elektroniske leveransefakturaer i [EHF/BEAst-format](/wiki/ehf-beast), identifiserer produkter via [NOBB- eller GTIN-nummer](/wiki/nobb), og kobler disse mot utslippsfaktorer fra [EPD-databaser](/wiki/epd) for å produsere et klimaregnskap per prosjekt. Vi gjør også liknende beregninger for transport, avfall og energi, basert på data fra kjørebøker, avfallsrapporter og strømmålere.

## Bakgrunn
CO₂-utslipp fra byggematerialer oppstår gjerne i produksjonsfasen, lenge før et bygg tas i bruk, og er allerede dokumentert gjennom miljødeklarasjoner (EPD-er). Å knytte disse deklarasjonene til leveranser på et konkret prosjekt krever normalt manuelt arbeid: fakturaer må leses, produkter identifiseres, og utslippsfaktorer slås opp og summeres.

Byggspor automatiserer dette ved å lese fakturaformatet leverandørene allerede bruker.

## Slik bruker du det

1. Du oppretter et prosjekt og laster opp EHF-fakturaer fra materialleverandørene dine, kjørelogg fra kjøreboken din, avfallsrapporter og målinger fra strømmålere på anleggsplassen.
2. Systemet beregner CO₂-utslipp basert på de identifiserte produktene, kjøretøyene, avfallsmengdene og strømforbruket. Du kan lese mer om [hvordan beregningene fungerer her](/wiki/co2-calc).
3. Du får en rapport med CO₂-ekvivalenter for hele prosjektet, fordelt på materialer, transport, avfall og energi. Rapporten inkluderer også en konfidensscore som indikerer hvor mye av utslippet som er basert på konkrete data. Les mer om [hvordan du tolker rapporten](/wiki/report).

## Struktur

Byggspor er organisert rundt prosjekter og organisasjoner. En organisasjon samler brukere og prosjekter under ett selskap eller én avdeling, med felles innstillinger som arves av alle prosjektene under. Hvert prosjekt representerer ett byggeprosjekt. Det er også mulig å bruke Byggspor uten organisasjon. Se [Funksjoner](/wiki/features) for en fullstendig gjennomgang av hva applikasjonen tilbyr.

## Forutsetninger og begrensninger

For å få meningsfulle resultater kreves fakturaer i EHF format i XML med gyldige NOBB- eller GTIN-numre. Produkter uten gyldige numre vil gi mer usikre estimater og disse flagges slik at du kan redigere dem om nødvendig. Rapportens konfidensscore gjenspeiler dette.

Byggspor er et analyseverktøy for intern bruk. Det er ikke et sertifiseringssystem, og beregningene er ikke ment som grunnlag for ekstern klimarapportering uten videre kvalitetssikring. Les mer under [Begrensninger](/wiki/limitations).

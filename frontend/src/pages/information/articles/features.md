# Funksjoner

## Organisasjoner og prosjekter

Byggspor er organisert i to nivåer. En *organisasjon* samler brukere og prosjekter under en felles enhet, typisk et selskap eller en avdeling. Prosjekter opprettes under organisasjonen og representerer ett byggeprosjekt eller én anleggsplass.
Medlemmer av en organisasjon kan ha ulike roller (eier, administrator, bidragsyter) som gir forskjellige rettigheter i forhold til prosjektene under organisasjonen. Innstillinger som gjelder for alle prosjektene, som hvilke EPD-livssyklusstadier som skal inkluderes i materialberegningen, kan settes på organisasjonsnivå og arves av alle prosjektene under.

Det er også mulig å bruke Byggspor uten organisasjon, for eksempel som enkeltbruker. Prosjekter knyttes da til brukerkontoen direkte. Du kan når som helst opprette en organisasjon. Se [Slik kommer du i gang](/wiki/getting-started) for mer informasjon om hvordan du setter opp organisasjoner og prosjekter.

## Dataregistrering

Hvert prosjekt har fire kategorier for dataregistrering:

**Materialer**: Last opp EHF-fakturaer fra leverandørene dine. Systemet leser hver leveranselinje, identifiserer produktet via GTIN eller NOBB-nummer, og henter utslippsfaktorer fra EPD-databasen automatisk. Linjer som ikke kan identifiseres flagges for manuell gjennomgang. Du kan også snart laste opp materialdata manuelt.

**Transport**: Last opp kjørebok fra Abax i XML-format. Hvert kjøreoppdrag kobles mot kjøretøyets CO₂-utslipp per kilometer fra Statens vegvesens kjøretøyregister. Per i dag støttes kun kjørebok fra Abax.

**Avfall**: Last opp avfallsrapporter med NS9431-fraksjoner, eller med GTIN- eller NOBB-nummer, eller registrer avfallsmengder manuelt per materialkategori.

**Energi**: Registrer strømforbruk i kWh manuelt for en periode.

## Rapport og analyse

Rapporten gir en samlet oversikt over CO₂-utslipp for prosjektet, fordelt på de fire kategoriene. Hver kategori viser totalt utslipp, antall registrerte poster og et konfidenspoeng som indikerer datakvaliteten.

I rapporten kan du også se en oversikt over hvordan utslippene fordeler seg på materialer, transport, avfall og energi. Du får også oversikt over hvilke kategorier som bidrar til beregningen mest, samt innsikt i hvor mye av utslippet som dekkes av karbonbindende materialer.

Ved å klikke på "Metode og instillinger" kan du se hvilke metoder vi har brukt i våre utregninger. Dersom du ønsker å lese mer om dette, kan du finne detaljer under [Slik beregnes CO₂](/wiki/co2-calc).

Poster som mangler nødvendig data vises som flaggede i rapporten. Disse kan redigeres der du lastet dem opp, og vil da oppdatere rapporten umiddelbart.

## Eksport

Rapporten kan eksporteres som PDF eller XML på EHF/BEAst-format for videre bruk i dokumentasjon eller rapportering til byggherren.

## Innstillinger

Beregningsparametrene kan justeres per prosjekt eller per organisasjon. Dette inkluderer hvilke EPD-livssyklusstadier som inkluderes i materialberegningen, valg mellom fysisk og residual strømmix samt utslippsfaktor for energi, og hvilken vektingsmetode som brukes for konfidensscoren. Se [Slik beregnes CO₂](/wiki/co2-calc) for detaljer om hva disse innstillingene påvirker.

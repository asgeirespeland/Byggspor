# Slik beregnes CO₂

Byggspor beregner CO₂-utslipp i fire kategorier: materialer, transport, avfall og energi. Hver kategori har sin egen datakilde og beregningslogikk, men felles for alle er at resultatet oppgis i kilogram CO₂-ekvivalenter (kg CO₂eq), en enhet som inkluderer alle klimagasser omregnet til den oppvarmingseffekten CO₂ ville hatt over 100 år.

## Materialer

Grunnlaget for materialberegningen er EPD-data hentet via [NOBB-databasen](/wiki/nobb). Når en leveransefaktura lastes opp, brukes NOBB-nummeret til å slå opp produktets miljødeklarasjon. Derfra hentes et GWP-tall (Global Warming Potential): utslipp per enhet av produktet, typisk per kg, m², m³ eller stykk.

Utslippet for en leveranselinje beregnes som:

**GWP per enhet × levert mengde = kg CO₂eq**

Som standard inkluderer Byggspor kun livssyklusstadiene A1–A3 fra EPD-en. Disse dekker råvareproduksjon, transport til fabrikk og selve produksjonsprosessen, det som ofte kalles *cradle-to-gate*. Stadiet A4 (transport fra fabrikk til byggeplass) er deaktivert som standard fordi den faktiske transporten til byggeplassen varierer med avstanden og kan være bedre å regne ut på andre måter. Hvis du har lastet opp transportdata, vil A4-beregningen være delvis inkludert gjennom transportkategorien. Du kan aktivere A4 i prosjektinnstillingene.

Biogent karbon er inkludert som standard. Dette betyr at trematerialer kan vise negativt CO₂-bidrag, fordi treet binder karbon under vekst. Du kan endre begge disse innstillingene under prosjektinnstillinger. Viktig å merke seg er at ikke alle EPD-er skiller mellom fossilt og biogent karbon, og i slike tilfeller vil det ikke være mulig å ekskludere biogent karbon uten å miste all CO₂-data for den linjen. Vi har da valgt å beholde total CO₂ på slike materialer selv om det da inkluderer biogent karbon (alternativet er å ekskludere materialet helt). Dette er ikke ideelt, og vi jobber med å forbedre dette i fremtiden.

Hvis et produkt ikke har en produktspesifikk EPD knyttet til seg i NOBB, beregnes det ingen CO₂ for den linjen. Linjen flagges for manuell vurdering. Verdt å merke seg at dette ikke nødvendigvis er et problem: etter EUs krav er det forsøket på å beregne Co₂ som er viktig, og det er kan ofte være bedre å ha ingen verdi og flagge linjen, enn å bruke en usikker faktor som kan gi et misvisende inntrykk av nøyaktighet. Over tid vil NOBB-databasen utvides med flere EPD-er og vi regner med at dekningsgraden vil øke betydelig i årene som kommmer.

## Transport

Transportberegningen bruker kjørelogg fra Abax i XML-format. For hvert kjøreoppdrag i loggen slår systemet opp kjøretøyet i Statens vegvesens kjøretøyregister og henter det oppgitte CO₂-utslippet per kilometer (WLTP- eller NEDC-verdi).

**Kjørte km × kg CO₂/km = kg CO₂eq**

Dersom et kjøretøy ikke finnes i registeret, eller mangler CO₂-data, beregnes ingen verdi for det oppdraget. Oppdraget flagges.

Vi støtter per i dag kun kjørebok fra Abax, men ønsker å utvide til flere leverandører i fremtiden. Dersom du har transportdata i et annet maskinlesbart format, ta kontakt så skal vi se på muligheten for å støtte det også. I mellomtiden kan du manuelt registrere transportdata i avsnittet for manuell registrering under transport.

## Avfall

Avfallsberegningen støtter tre datakilder.

Den primære er avfallsrapporter med NS9431-fraksjoner. Disse bruker faktorer per avfallstype i kg CO₂eq per tonn, basert på norske og europeiske kilder (SSB avfallsregnskap, DEFRA 2023, Asplan Viak/Byggemiljø). Faktoren varierer mye mellom materialtyper: fra 3 kg CO₂eq/t for rene betongrester til 80 kg CO₂eq/t for PVC.

Den andre er manuell registrering med forenklede kategorier (metall, treverk, betong). Disse faktorene er estimater og bør brukes med forsiktighet. De er merket som plassholderverdier i rapportens metodikkoversikt.

Den tredje er avfallslinjer med GTIN- eller NOBB-nummer. Disse slår opp en avfalls-EPD i NOBB og henter GWP per enhet, som multipliseres med mengden for å gi CO₂. Dette gir mer presise verdier for avfall som kan klassifiseres på denne måten, men regnes i dag utifra enhet og ikke vekt. Vi jobber med å forbedre dette i fremtiden. **Merk:** *Dette er ikke et ekte format i bruk i industrien i dag, men et format vi selv har utviklet som vi tenker er det beste mulige formatet for fremtiden.*

## Energi

Energiforbruk på byggeplassen registreres som kWh fra strømmålere. CO₂ beregnes som:

**kWh × utslippsfaktor = kg CO₂eq**

Standardfaktoren er **0,0119 kg CO₂eq/kWh**, som er den norske fysiske mixen fra NVEs klimadeklarasjon for 2024. Denne reflekterer den faktiske sammensetningen av den norske kraftproduksjonen, i all hovedsak vannkraft, som gir en svært lav faktor. Som du kanskje har sett så har vi også felter for pris-sone: Dette påvirker ikke CO₂-beregningen i dag, men vi har lagt det til for å kunne støtte reverse-kompatibilitet med antatte fremtidig rapporteringskrav i Norge og Europa, der det kan bli krav om å rapportere strømforbruk fordelt på pris-sone.

Et alternativ er den europeiske residualmixen (AIB), som gir en vesentlig høyere faktor (typisk 300–500 g CO₂/kWh). Residualmixen baserer seg på sertifikater for ikke-sertifisert strøm i Europa og er relevant dersom prosjektet rapporterer etter europeiske standarder. Du kan bytte mellom de to metodene under prosjektinnstillinger. (Dette er ikke implementert ennå, men kommer i en fremtidig oppdatering.)

## Konfidenspoeng

**Det følgende avsnittet må tas med en stor klype salt. Dette er ikke en offisiell rapportering, men en interaktiv demo. Konfidenspoeng er ikke standardisert og er kun våre egne estimater. Disse vil forbedres i fremtiden**

Hvert beregnet utslipp får et konfidenspoeng som reflekterer datakvaliteten bak beregningen:

| Poeng | Betyr |
|-------|-------|
| 100 | Beregnet fra en produktspesifikk EPD, eller fra strømmåler × utslippsfaktor (deterministisk) |
| 90 | Manuell overstyring av verdi av bruker |
| 80 | Beregnet fra tilgjengelig GWP-data uten verifisert EPD, transport med fullstendig kjøretøydata, eller avfall med kjent faktor |
| 50 | Ikke nok data tilgjengelig for beregning |
| 20 | Ikke nok data, og linjen er flagget for gjennomgang |

Det samlede konfidenspoenget for et prosjekt er et vektet gjennomsnitt der poster med høyt CO₂-bidrag veier tyngre enn poster med lavt bidrag. En linje uten CO₂-data påvirker dermed totalscoren lite, mens en stor betongleveranse uten EPD vil trekke den betydelig ned.

Les mer om [hvordan du tolker rapporten](/wiki/report) og [hva EPD-er er og hvor pålitelige de er](/wiki/epd).

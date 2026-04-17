/**
 * Static content for the climate-tab tour: five category-step descriptions consumed by ClimateTabTour.
 * Icon + color theming is resolved from entities/report/theme via the `category` key.
 */
import type { CategoryOrTotal } from '@/shared/categories'

export interface TourStep {
  category: CategoryOrTotal
  title: string
  what: string
  how: string
  note?: { type: 'warning' | 'info'; text: string }
}

export const TOUR_STEPS: TourStep[] = [
  {
    category: 'total',
    title: 'Klimasporing for prosjektet',
    what: 'Byggspor beregner CO\u2082-avtrykket til byggeprosjektet ditt fordelt p\u00e5 fire kategorier: Materialer, Transport, Avfall og Energi.',
    how: 'Vi tar deg gjennom \u00e9n kategori om gangen slik at du vet hva du skal registrere og hvilke filer du trenger.',
    note: {
      type: 'info',
      text: 'Alle kategorier er valgfrie \u2014 registrer det du har tilgang til. Konfidenspoenget i sidepanelet viser hvor fullstendig datagrunnlaget er.',
    },
  },
  {
    category: 'materials',
    title: 'Materialer',
    what: 'Sporer CO\u2082-utslipp fra innkj\u00f8pte byggematerialer (gr\u00e5 energi). Data hentes fra EPD-databaser via NOBB-nummeret p\u00e5 fakturaen.',
    how: 'Last opp EHF-fakturaer i XML-format, eller legg inn materialer manuelt med NOBB-nummer og mengde.',
    note: {
      type: 'warning',
      text: 'Mangler EPD: Noen materialer har ikke EPD-data i NOBB og markeres med et varselflagg. Du kan da manuelt tildele en EPD-verdi eller skrive inn CO\u2082-mengden direkte.',
    },
  },
  {
    category: 'transport',
    title: 'Transport',
    what: 'Sporer utslipp fra kj\u00f8ret\u00f8y og maskiner brukt p\u00e5 og til byggeplassen. CO\u2082-data hentes fra Statens vegvesen basert p\u00e5 kj\u00f8ret\u00f8yets registreringsnummer.',
    how: 'Last opp Abax-rapporter i XML-format, eller legg til turer manuelt med kj\u00f8ret\u00f8ytype og kj\u00f8rt avstand.',
    note: {
      type: 'warning',
      text: 'Lav konfidens: Hvis et kj\u00f8ret\u00f8y ikke finnes i Statens vegvesen, brukes gjennomsnittsverdier. Verifiser kj\u00f8ret\u00f8ytypen manuelt for \u00e5 forbedre n\u00f8yaktigheten.',
    },
  },
  {
    category: 'waste',
    title: 'Avfall',
    what: 'Sporer CO\u2082-utslipp knyttet til avfall generert p\u00e5 byggeplassen, fordelt p\u00e5 avfallsfraksjoner med tilh\u00f8rende utslippsfaktorer.',
    how: 'Last opp avfallsrapporter i XML-format, eller logg avfallsfraksjoner manuelt med type og vekt i tonn.',
    note: {
      type: 'info',
      text: 'Ukjent fraksjon: Fraksjoner som ikke gjenkjennes knyttes til standardfaktorer fra NS 9431. Du kan overstyre med en egendefinert CO\u2082-faktor om du har mer spesifikk informasjon.',
    },
  },
  {
    category: 'energy',
    title: 'Energi',
    what: 'Sporer utslipp fra energiforbruk p\u00e5 byggeplassen \u2014 inkludert norsk str\u00f8m, diesel og andre energikilder.',
    how: 'Registrer energiforbruk manuelt per kilde (kWh eller liter). Velg riktig prisone (NO1\u2013NO5) for norsk str\u00f8m.',
    note: {
      type: 'info',
      text: 'Norsk str\u00f8m beregnes med NVEs nasjonale utslippsfaktor: 0,0119 kg CO\u2082/kWh. Prisonen brukes til fremtidig kostnadssporing.',
    },
  },
]

export const TOUR_STEP_COUNT = TOUR_STEPS.length

import { Package, Truck, Trash2, Zap, Leaf, AlertTriangle, Info, ChevronRight, ChevronLeft } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { TOUR_STEP_COUNT } from '../hooks/useClimateTabTour'

interface StepDef {
  icon: React.ReactNode
  iconBg: string
  title: string
  what: string
  how: string
  note?: { type: 'warning' | 'info'; text: string }
}

const STEPS: StepDef[] = [
  {
    icon: <Leaf className="h-7 w-7 text-emerald-500" />,
    iconBg: 'bg-emerald-50',
    title: 'Klimasporing for prosjektet',
    what: 'Byggspor beregner CO₂-avtrykket til byggeprosjektet ditt fordelt på fire kategorier: Materialer, Transport, Avfall og Energi.',
    how: 'Vi tar deg gjennom én kategori om gangen slik at du vet hva du skal registrere og hvilke filer du trenger.',
    note: {
      type: 'info',
      text: 'Alle kategorier er valgfrie — registrer det du har tilgang til. Konfidenspoenget i sidepanelet viser hvor fullstendig datagrunnlaget er.',
    },
  },
  {
    icon: <Package className="h-7 w-7 text-blue-500" />,
    iconBg: 'bg-blue-50',
    title: 'Materialer',
    what: 'Sporer CO₂-utslipp fra innkjøpte byggematerialer (grå energi). Data hentes fra EPD-databaser via NOBB-nummeret på fakturaen.',
    how: 'Last opp EHF-fakturaer i XML-format, eller legg inn materialer manuelt med NOBB-nummer og mengde.',
    note: {
      type: 'warning',
      text: 'Mangler EPD: Noen materialer har ikke EPD-data i NOBB og markeres med et varselflagg. Du kan da manuelt tildele en EPD-verdi eller skrive inn CO₂-mengden direkte.',
    },
  },
  {
    icon: <Truck className="h-7 w-7 text-orange-500" />,
    iconBg: 'bg-orange-50',
    title: 'Transport',
    what: 'Sporer utslipp fra kjøretøy og maskiner brukt på og til byggeplassen. CO₂-data hentes fra Statens vegvesen basert på kjøretøyets registreringsnummer.',
    how: 'Last opp Abax-rapporter i XML-format, eller legg til turer manuelt med kjøretøytype og kjørt avstand.',
    note: {
      type: 'warning',
      text: 'Lav konfidens: Hvis et kjøretøy ikke finnes i Statens vegvesen, brukes gjennomsnittsverdier. Verifiser kjøretøytypen manuelt for å forbedre nøyaktigheten.',
    },
  },
  {
    icon: <Trash2 className="h-7 w-7 text-red-500" />,
    iconBg: 'bg-red-50',
    title: 'Avfall',
    what: 'Sporer CO₂-utslipp knyttet til avfall generert på byggeplassen, fordelt på avfallsfraksjoner med tilhørende utslippsfaktorer.',
    how: 'Last opp avfallsrapporter i XML-format, eller logg avfallsfraksjoner manuelt med type og vekt i tonn.',
    note: {
      type: 'info',
      text: 'Ukjent fraksjon: Fraksjoner som ikke gjenkjennes knyttes til standardfaktorer fra NS 9431. Du kan overstyre med en egendefinert CO₂-faktor om du har mer spesifikk informasjon.',
    },
  },
  {
    icon: <Zap className="h-7 w-7 text-yellow-500" />,
    iconBg: 'bg-yellow-50',
    title: 'Energi',
    what: 'Sporer utslipp fra energiforbruk på byggeplassen — inkludert norsk strøm, diesel og andre energikilder.',
    how: 'Registrer energiforbruk manuelt per kilde (kWh eller liter). Velg riktig prisone (NO1–NO5) for norsk strøm.',
    note: {
      type: 'info',
      text: 'Norsk strøm beregnes med NVEs nasjonale utslippsfaktor: 0,0119 kg CO₂/kWh. Prisonen brukes til fremtidig kostnadssporing.',
    },
  },
]

interface Props {
  open: boolean
  step: number
  onNext: () => void
  onPrev: () => void
  onClose: () => void
}

export default function ClimateTabTour({ open, step, onNext, onPrev, onClose }: Props) {
  const current = STEPS[step]
  const isFirst = step === 0
  const isLast = step === TOUR_STEP_COUNT - 1

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent
        className="sm:max-w-md w-full"
        showCloseButton={true}
      >
        <DialogHeader>
          <div className="flex items-center gap-2 text-xs font-medium text-gray-400 mb-1">
            <span>Omvisning</span>
            <span>·</span>
            <span>Steg {step + 1} av {TOUR_STEP_COUNT}</span>
          </div>
          <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ${current.iconBg} mb-1`}>
            {current.icon}
          </div>
          <DialogTitle className="text-center text-base font-semibold text-gray-900 leading-snug">
            {current.title}
          </DialogTitle>
        </DialogHeader>

        {/* Body */}
        <div className="space-y-3 text-sm">
          <p className="text-gray-600 leading-relaxed">{current.what}</p>

          <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">
              Hva legger du inn?
            </p>
            <p className="text-gray-700 leading-relaxed">{current.how}</p>
          </div>

          {current.note && (
            <div className={`flex gap-2.5 rounded-lg px-3 py-2.5 ${
              current.note.type === 'warning'
                ? 'bg-amber-50 border border-amber-100'
                : 'bg-blue-50 border border-blue-100'
            }`}>
              {current.note.type === 'warning' ? (
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
              ) : (
                <Info className="h-4 w-4 shrink-0 mt-0.5 text-blue-400" />
              )}
              <p className={`text-xs leading-relaxed ${
                current.note.type === 'warning' ? 'text-amber-800' : 'text-blue-800'
              }`}>
                {current.note.text}
              </p>
            </div>
          )}
        </div>

        {/* Step dots */}
        <div className="flex justify-center gap-1.5 pt-1">
          {Array.from({ length: TOUR_STEP_COUNT }).map((_, i) => (
            <span
              key={i}
              className={`block h-1.5 rounded-full transition-all duration-200 ${
                i === step ? 'w-4 bg-gray-700' : 'w-1.5 bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Footer navigation */}
        <div className="flex items-center justify-between gap-2 -mx-4 -mb-4 px-4 py-3 border-t bg-muted/50 rounded-b-xl">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            Hopp over
          </Button>

          <div className="flex gap-2">
            {!isFirst && (
              <Button variant="outline" size="sm" onClick={onPrev}>
                <ChevronLeft className="h-3.5 w-3.5" />
                Forrige
              </Button>
            )}
            <Button size="sm" onClick={onNext}>
              {isLast ? 'Ferdig' : (
                <>
                  Neste
                  <ChevronRight className="h-3.5 w-3.5" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

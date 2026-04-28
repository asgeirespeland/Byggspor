import {
  BookOpen,
  FileText,
  Database,
  Leaf,
  FileBarChart2,
  AlertTriangle,
  BarChart2,
  Puzzle,
  Rocket,
} from 'lucide-react'

export type ArticleId =
  | 'intro'
  | 'features'
  | 'getting-started'
  | 'ehf-beast'
  | 'nobb'
  | 'epd'
  | 'co2-calc'
  | 'report'
  | 'limitations'

export interface ArticleDef {
  id: ArticleId
  label: string
  icon: React.ReactNode
}

export const articleDefs: ArticleDef[] = [
  {
    id: 'intro',
    label: 'Hva er Byggspor?',
    icon: <BookOpen className="h-4 w-4 shrink-0" />,
  },
  {
    id: 'features',
    label: 'Funksjoner',
    icon: <Puzzle className="h-4 w-4 shrink-0" />,
  },
  {
    id: 'getting-started',
    label: 'Slik kommer du i gang',
    icon: <Rocket className="h-4 w-4 shrink-0" />,
  },
  {
    id: 'ehf-beast',
    label: 'EHF og BEAst',
    icon: <FileText className="h-4 w-4 shrink-0" />,
  },
  {
    id: 'nobb',
    label: 'NOBB-databasen',
    icon: <Database className="h-4 w-4 shrink-0" />,
  },
  {
    id: 'epd',
    label: 'Miljødeklarasjoner (EPD)',
    icon: <Leaf className="h-4 w-4 shrink-0" />,
  },
  {
    id: 'co2-calc',
    label: 'Slik beregnes CO₂',
    icon: <BarChart2 className="h-4 w-4 shrink-0" />,
  },
  {
    id: 'report',
    label: 'Forstå rapporten din',
    icon: <FileBarChart2 className="h-4 w-4 shrink-0" />,
  },
  {
    id: 'limitations',
    label: 'Begrensninger',
    icon: <AlertTriangle className="h-4 w-4 shrink-0" />,
  },
]

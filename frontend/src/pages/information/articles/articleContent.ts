import introContent from './intro.md?raw'
import featuresContent from './features.md?raw'
import gettingStartedContent from './getting-started.md?raw'
import ehfBeastContent from './ehf-beast.md?raw'
import nobbContent from './nobb.md?raw'
import epdContent from './epd.md?raw'
import co2CalcContent from './co2-calc.md?raw'
import reportContent from './report.md?raw'
import limitationsContent from './limitations.md?raw'
import type { ArticleId } from './articleDefs'

export const articleContent: Record<ArticleId, string> = {
  intro: introContent,
  features: featuresContent,
  'getting-started': gettingStartedContent,
  'ehf-beast': ehfBeastContent,
  nobb: nobbContent,
  epd: epdContent,
  'co2-calc': co2CalcContent,
  report: reportContent,
  limitations: limitationsContent,
}

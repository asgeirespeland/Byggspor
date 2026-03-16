import { Leaf, FileBarChart2, Hash, Building2 } from 'lucide-react'
import type { Project } from '@/features/project/hooks/useProjects'
import ConfidenceGauge from './ConfidenceGauge'

export default function ProjectSidebar({ project }: { project: Project }) {
  const confidenceScore = 72

  return (
    <div className="flex w-full lg:w-60 shrink-0 flex-col gap-3 self-stretch">
      {/* Confidence score */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
          CO₂ Konfidens
        </p>
        <div className="flex justify-center">
          <ConfidenceGauge score={confidenceScore} />
        </div>
        <p className="mt-3 text-center text-xs leading-relaxed text-gray-400">
          Basert på EPD-dekning og NOBB-kobling
        </p>
      </div>

      {/* Project info */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          Prosjektinfo
        </p>
        <div className="flex items-start gap-2">
          <Building2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-300" />
          <div>
            <p className="text-xs text-gray-400">Navn</p>
            <p className="text-sm font-medium text-gray-800 leading-tight">
              {project.name}
            </p>
          </div>
        </div>
        {project.project_number && (
          <div className="flex items-start gap-2">
            <Hash className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-300" />
            <div>
              <p className="text-xs text-gray-400">Prosjektnummer</p>
              <p className="text-sm font-medium text-gray-800">
                {project.project_number}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Flexible spacer */}
      <div className="flex-1" />

      {/* Generate climate report button */}
      <button
        type="button"
        className="group relative w-full overflow-hidden rounded-xl bg-gray-900 px-4 py-4 text-left shadow-md transition-all hover:bg-gray-800 active:scale-[0.98]"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-transparent opacity-20 pointer-events-none" />
        <div className="relative flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20">
            <Leaf className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white">
              Generer klimarapport
            </p>
            <p className="text-xs text-gray-400">Eksporter som PDF</p>
          </div>
          <FileBarChart2 className="ml-auto h-4 w-4 shrink-0 text-gray-500 transition-colors group-hover:text-emerald-400" />
        </div>
      </button>
    </div>
  )
}

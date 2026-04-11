import FileUploadShell from '@/shared/components/FileUploadShell'
import { useParseWasteReport } from '../hooks/useWaste'

type Props = {
  projectId: number
}

type WasteParseResult = {
  items: unknown[]
  fileName: string
}

export default function WasteUpload({ projectId }: Props) {
  const { parse, reset, data, loading, error } = useParseWasteReport(projectId)

  return (
    <FileUploadShell<WasteParseResult>
      title="Avfallsrapport"
      description="Last opp en CSV-fil for å beregne avfall og CO₂-utslipp automatisk, eller registrer avfall manuelt."
      accept={['.csv', 'text/csv', 'text/plain', 'application/vnd.ms-excel']}
      dropDescription="Dra og slipp CSV-filen her"
      fileErrorMessage="Filen må være i CSV-format."
      analyzeLabel="Analyser"
      analyzingLabel="Analyserer…"
      parse={parse}
      reset={reset}
      data={data}
      loading={loading}
      error={error ? new Error(error) : null}
      errorFallback="Kunne ikke analysere avfallsrapport"
    >
      {({ data }) => (
        <div className="space-y-3 rounded-xl border border-green-100 bg-green-50/60 p-4">
          <p className="text-sm font-medium text-gray-900">
            Avfallsrapport analysert
          </p>
          <p className="text-sm text-gray-500">
            Fant {data.items.length} avfallsposter i filen{' '}
            <span className="font-medium text-gray-700">{data.fileName}</span>.
          </p>
        </div>
      )}
    </FileUploadShell>
  )
}
/**
 * Abax transport-log import flow: upload → parse → preview → confirm.
 * Wraps FileUploadShell around useTransportParse, renders TransportPreview on success,
 * posts confirmTrips on user confirm and invalidates transport/report queries.
 */
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import FileUploadShell from '@/widgets/file-upload/FileUploadShell'
import { qk } from '@/shared/api/queryKeys'
import { confirmTrips } from '@/entities/transport/api/transport'
import { useTransportParse } from '../hooks/useTransportParse'
import TransportPreview from './TransportPreview'

interface Props {
  projectId: number
}

export default function ImportTransport({ projectId }: Props) {
  const queryClient = useQueryClient()
  const { parse, reset, data, setData, loading, error } = useTransportParse()
  const [confirming, setConfirming] = useState(false)

  const invalidateTransportData = () => {
    queryClient.invalidateQueries({ queryKey: qk.co2Summary(projectId) })
    queryClient.invalidateQueries({ queryKey: qk.transports(projectId) })
    queryClient.invalidateQueries({ queryKey: qk.detailedReport(projectId) })
  }

  return (
    <FileUploadShell
      title="Transportlogg"
      description="Last opp en Abax Turrapport (XML) for å se kjøreturer med CO₂-utslipp, eller legg til turer manuelt."
      accept=".xml"
      dropDescription="Dra og slipp Abax XML-filen her"
      fileErrorMessage="Filen må være i XML-format."
      parse={parse}
      reset={reset}
      data={data}
      loading={loading}
      error={error}
      errorFallback="Kunne ikke analysere transportfil"
    >
      {({ data: transportData, clear, requireToken }) => (
        <TransportPreview
          data={transportData}
          setData={setData}
          onConfirm={async () => {
            setConfirming(true)
            try {
              const token = await requireToken()
              await confirmTrips(
                projectId,
                transportData.trips,
                transportData.file_name,
                token,
              )
              invalidateTransportData()
              clear()
              toast.success('Transportlogg bekreftet og lagret')
            } catch {
              toast.error('Kunne ikke lagre transportloggen')
            } finally {
              setConfirming(false)
            }
          }}
          confirming={confirming}
          onCancel={clear}
        />
      )}
    </FileUploadShell>
  )
}

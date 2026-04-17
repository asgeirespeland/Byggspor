import ReportView from '@/entities/report/ui/ReportView'

interface ReportTabProps {
  projectId: number
}

export default function ReportTab({ projectId }: ReportTabProps) {
  return <ReportView projectId={projectId} />
}

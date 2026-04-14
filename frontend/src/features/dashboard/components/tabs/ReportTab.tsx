import { ReportView } from '@/features/report'

interface ReportTabProps {
  projectId: number
}

export default function ReportTab({ projectId }: ReportTabProps) {
  return <ReportView projectId={projectId} />
}

import TransportUpload from '@/features/transport/components/TransportUpload'
import type { Project } from '@/features/project/hooks/useProjects'

type Props = { project: Project }

export default function TransportTab({ project }: Props) {
  return <TransportUpload projectId={project.id} />
}

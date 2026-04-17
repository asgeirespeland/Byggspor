import TransportUpload from '@/entities/transport/components/TransportUpload'
import type { Project } from '@/entities/project/hooks/useProjects'

type Props = { project: Project }

export default function TransportTab({ project }: Props) {
  return <TransportUpload projectId={project.id} />
}

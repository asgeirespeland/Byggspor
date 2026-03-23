import { EnergyInput } from '@/features/energy'

interface EnergyTabProps {
  projectId: number
}

export default function EnergyTab({ projectId }: EnergyTabProps) {
  return <EnergyInput projectId={projectId} />
}

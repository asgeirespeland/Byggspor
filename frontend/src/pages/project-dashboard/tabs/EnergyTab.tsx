import EnergyInput from '@/entities/energy/components/EnergyInput'

interface EnergyTabProps {
  projectId: number
}

export default function EnergyTab({ projectId }: EnergyTabProps) {
  return <EnergyInput projectId={projectId} />
}

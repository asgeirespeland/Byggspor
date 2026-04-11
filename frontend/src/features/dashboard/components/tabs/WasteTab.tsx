import WasteInput from '@/features/waste/components/WasteInput'

type WasteTabProps = {
  projectId: number
}

export default function WasteTab({ projectId }: WasteTabProps) {
  return <WasteInput projectId={projectId} />
}
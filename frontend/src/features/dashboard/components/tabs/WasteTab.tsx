import WasteUpload from '@/features/waste/components/WasteUpload'

type WasteTabProps = {
  projectId: number
}

export default function WasteTab({ projectId }: WasteTabProps) {
  return <WasteUpload projectId={projectId} />
}

import WasteManualInput from './WasteManualInput'
import WasteList from './WasteGroupCard'
import WasteUpload from './WasteUpload'

type Props = {
  projectId: number
}

export default function WasteInput({ projectId }: Props) {
  return (
    <div className="space-y-6">
      <WasteUpload projectId={projectId} />
      <WasteManualInput projectId={projectId} />
      <WasteList projectId={projectId} />
    </div>
  )
}

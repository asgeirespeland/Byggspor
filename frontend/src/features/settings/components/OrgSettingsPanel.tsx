import {
  useOrgSettings,
  useUpdateOrgSettings,
  useResetOrgSettings,
} from '../hooks/useOrgSettings'
import CalculationSettingsPanel from './CalculationSettingsPanel'

export default function OrgSettingsPanel({ orgId }: { orgId: number }) {
  const { data, isLoading } = useOrgSettings(orgId)
  const update = useUpdateOrgSettings(orgId)
  const resetAll = useResetOrgSettings(orgId)

  return (
    <CalculationSettingsPanel
      settings={data?.settings}
      loading={isLoading}
      level="organization"
      onSave={(changes) => update.mutate(changes)}
      onResetAll={() => resetAll.mutate(undefined as never)}
      saving={update.isPending || resetAll.isPending}
    />
  )
}

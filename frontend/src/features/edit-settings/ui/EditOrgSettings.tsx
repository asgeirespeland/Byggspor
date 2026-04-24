import { useOrgSettings } from '@/entities/settings/hooks/useOrgSettings'
import {
  useUpdateOrgSettings,
  useResetOrgSettings,
} from '../hooks/useOrgSettingsMutations'
import SettingsEditor from './SettingsEditor'

export default function EditOrgSettings({ orgId }: { orgId: number }) {
  const { data, isLoading } = useOrgSettings(orgId)
  const update = useUpdateOrgSettings(orgId)
  const resetAll = useResetOrgSettings(orgId)

  return (
    <SettingsEditor
      settings={data?.settings}
      loading={isLoading}
      level="organization"
      onSave={(changes) => update.mutate(changes)}
      onResetAll={() => resetAll.mutate(undefined as never)}
      saving={update.isPending || resetAll.isPending}
    />
  )
}

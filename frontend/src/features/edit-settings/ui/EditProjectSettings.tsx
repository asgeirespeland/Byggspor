import {
  useProjectSettings,
  useUpdateProjectSettings,
  useResetProjectSetting,
  useResetAllProjectSettings,
} from '@/entities/settings/hooks/useProjectSettings'
import SettingsEditor from './SettingsEditor'

export default function EditProjectSettings({
  projectId,
}: {
  projectId: number
}) {
  const { data, isLoading } = useProjectSettings(projectId)
  const update = useUpdateProjectSettings(projectId)
  const reset = useResetProjectSetting(projectId)
  const resetAll = useResetAllProjectSettings(projectId)

  return (
    <SettingsEditor
      settings={data?.settings}
      loading={isLoading}
      level="project"
      onSave={(changes) => update.mutate(changes)}
      onReset={(key) => reset.mutate(key)}
      onResetAll={() => resetAll.mutate(undefined as never)}
      saving={update.isPending || reset.isPending || resetAll.isPending}
    />
  )
}

import {
  useProjectSettings,
  useUpdateProjectSettings,
  useResetProjectSetting,
  useResetAllProjectSettings,
} from './hooks/useProjectSettings'
import CalculationSettingsPanel from './CalculationSettingsPanel'

export default function ProjectSettingsPanel({
  projectId,
}: {
  projectId: number
}) {
  const { data, isLoading } = useProjectSettings(projectId)
  const update = useUpdateProjectSettings(projectId)
  const reset = useResetProjectSetting(projectId)
  const resetAll = useResetAllProjectSettings(projectId)

  return (
    <CalculationSettingsPanel
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

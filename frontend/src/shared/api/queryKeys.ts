export const qk = {
  projects: () => ['projects'] as const,
  project: (id: number) => ['projects', id] as const,
  co2Summary: (id: number) => ['co2-summary', id] as const,
  detailedReport: (id: number) => ['detailed-report', id] as const,
  materials: (id: number) => ['project-materials', id] as const,
  transports: (id: number) => ['project-transports', id] as const,
  waste: (id: number) => ['project-waste', id] as const,
  energies: (id: number) => ['energies', id] as const,
  priceZones: () => ['price-zones'] as const,
  orgMembers: (orgId: number) => ['organizations', orgId, 'members'] as const,
  orgMemberCandidates: (orgId: number, query: string) =>
    ['organizations', orgId, 'member-candidates', query] as const,
  orgSettings: (orgId: number | undefined) => ['org-settings', orgId] as const,
  projectSettings: (id: number | undefined) =>
    ['project-settings', id] as const,
  currentUser: () => ['users', 'me'] as const,
  organization: (id: number) => ['organizations', id] as const,
}

export const qkPrefix = {
  orgSettings: () => ['org-settings'] as const,
  projectSettings: () => ['project-settings'] as const,
  energies: () => ['energies'] as const,
  materials: () => ['project-materials'] as const,
  waste: () => ['project-waste'] as const,
  co2Summary: () => ['co2-summary'] as const,
  detailedReport: () => ['detailed-report'] as const,
}

export function projectReportKeys(projectId: number) {
  return [qk.co2Summary(projectId), qk.detailedReport(projectId)]
}

export function projectDataKeys(projectId: number) {
  return [
    qk.materials(projectId),
    qk.transports(projectId),
    qk.waste(projectId),
    qk.energies(projectId),
    qk.co2Summary(projectId),
    qk.detailedReport(projectId),
  ]
}

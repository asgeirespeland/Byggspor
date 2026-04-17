# Frontend Architecture Migration: Feature-Sliced Design

## Context

The app was built with per-domain feature folders (`features/invoice/`, `features/transport/`, etc.) when each domain had bespoke UI. After unifying tables, columns, tab layouts, and the parse-preview-confirm pipeline, those feature boundaries no longer match reality. Additionally, `shared/` became a catch-all dumping ground mixing pipeline components, generic UI, auth hooks, and utilities with no organizational principle.

After evaluating several approaches (page-based, domain-based, hybrid), we adopted **Feature-Sliced Design (FSD)** — a layered architecture with a strict one-directional dependency rule:

```
pages → widgets → features → entities → shared
```

Each layer has a clear role. The folder name tells you what's inside. Imports only flow downward.

## Phase 1: Dead Code Cleanup ✅ (complete)

Deleted orphaned components, hooks, and barrel exports left over from the DataTable/column unification.

## Phase 2: File Tree Restructure (current)

### Target structure

```
src/
  app/                                    (unchanged)
  components/ui/                          (unchanged — shadcn primitives)

  ── shared/ ──────────────────────────   generic infra, no business logic
  shared/
    api/
      client.ts
      queryClient.ts
    components/
      ErrorMessage.tsx
      FormDialog.tsx
      FullscreenDialog.tsx
      ItemListPanel.tsx
      TabBar.tsx
      layout/Sidebar.tsx
    hooks/
      useAppContext.ts
      useAuthMutation.ts
      useAuthQuery.ts
      useDeferredLoading.ts
      useRequireToken.ts
      useScrollIndicators.ts
      useUserSync.ts
    context/
      AppContext.tsx
      appContextValue.ts
    types/
      index.ts
      organization.ts
      user.ts

  ── entities/ ────────────────────────   business data + domain-specific UI
  entities/
    materials/                            ← features/invoice/
      api.ts
      types.ts
      columns.tsx                         ← materialColumns.tsx
      utils.ts
      hooks/
        useInvoiceParse.ts
        useProjectMaterials.ts
      components/
        InvoiceUpload.tsx
        InvoicePreview.tsx
        InvoiceGroupCard.tsx
        EpdBadge.tsx
      __tests__/
        useInvoiceParse.test.ts
        utils.test.ts

    transport/                            ← features/transport/
      api/
        transport.ts
        projectTransports.ts
      types.ts
      columns.tsx                         ← tripColumns.tsx
      hooks/
        useTransportParse.ts
        useProjectTransports.ts
      components/
        TransportUpload.tsx
        TransportPreview.tsx
        TransportGroupCard.tsx
        TransportManualInput.tsx
      __tests__/
        useTransportParse.test.ts

    waste/                                ← features/waste/
      api.ts
      types.ts
      columns.tsx                         ← wasteColumns.tsx
      hooks/
        useWasteParse.ts
        useWaste.ts
      components/
        WasteUpload.tsx
        WastePreview.tsx
        WasteGroupCard.tsx
        WasteManualInput.tsx

    energy/                               ← features/energy/
      api.ts
      types.ts
      hooks/
        useEnergies.ts
      components/
        EnergyInput.tsx
        EnergyForm.tsx
        EnergySummary.tsx

    project/                              ← features/project/
      api.ts
      constants.ts
      hooks/
        useCreateProject.ts
        useProject.ts
        useProjects.ts

    report/                               ← features/report/ + dashboard/api/report.ts
      api/
        co2Summary.ts                     ← dashboard/api/report.ts
        detailedReport.ts                 ← report/api/report.ts
      types.ts
      utils.tsx
      hooks/
        useCo2Summary.ts                  ← dashboard/hooks/useCo2Summary.ts
        useDetailedReport.ts

    export/                               ← features/export/
      api.ts
      types.ts
      hooks/
        useGenerateInvoice.ts
        useProjectLineItems.ts
      components/
        GenerateInvoiceDialog.tsx

  ── features/ ────────────────────────   user interaction patterns
  features/
    file-upload/
      FileDropZone.tsx
      SelectedFileBar.tsx
      FileUploadShell.tsx
      useFileParse.ts
      useFileSelect.ts

    inline-edit/
      RowActions.tsx
      InlineUndoBar.tsx
      useInlineEdit.ts
      useOptimisticDelete.ts
      useInlineUndo.ts
      useDismiss.ts

  ── widgets/ ─────────────────────────   composed UI blocks (business-aware)
  widgets/
    DataTable.tsx
    DataTabShell.tsx
    ParsePreviewShell.tsx
    CollapsibleGroupCard.tsx
    Co2TotalBadge.tsx
    ManualEntry.tsx

  ── pages/ ───────────────────────────   user-facing compositions
  pages/
    auth/
      AuthLayout.tsx
      ProtectedRoute.tsx

    global-dashboard/
      GlobalDashboard.tsx
      ProjectCard.tsx
      ProjectCardDrawer.tsx
      CreateProjectDialog.tsx

    project-dashboard/
      ProjectDashboard.tsx
      ProjectSidebar.tsx
      KpiCard.tsx
      ConfidenceGauge.tsx
      ConfidenceInfo.tsx
      ResponsiveConfidenceGauge.tsx
      FlaggedItems.tsx
      FlaggedMaterialRow.tsx
      FlaggedTripRow.tsx
      tabs/
        MaterialsTab.tsx
        TransportTab.tsx
        WasteTab.tsx
        EnergyTab.tsx
        report/
          ReportView.tsx
          ReportDataTable.tsx             ← renamed from DataTable.tsx
          CategoryDonut.tsx
          CollapsibleGroup.tsx
          InfoCard.tsx
          MaterialsSection.tsx
          MethodologySection.tsx
          Section.tsx
          TopEmitters.tsx
          TransportSection.tsx
          WasteFactorsTables.tsx
          WasteSection.tsx

    settings/                             ← features/settings/ (colocated, page-specific)
      SettingsPage.tsx
      CalculationSettingsPanel.tsx
      OrgSettingsPanel.tsx
      ProjectSettingsPanel.tsx
      SettingRow.tsx
      SourceBadge.tsx
      api/settings.ts
      hooks/
        useOrgSettings.ts
        useProjectSettings.ts
      settings-meta.ts

    profile/                              ← features/user/
      UserProfile.tsx
      ProfileForm.tsx
      hooks/useUserProfile.ts

    organization/                         ← features/organization/
      OrgSettings.tsx
      MemberCard.tsx
      AddMemberDialog.tsx
      hooks/useOrgMembers.ts

    onboarding/                           ← features/onboarding/
      OnboardingPage.tsx
      ClimateTabTour.tsx
      hooks/useClimateTabTour.ts
      tourSteps.ts
```

### Migration order

Each step: move files with `git mv`, update all `@/` import paths, run `pnpm tsc --noEmit`.

1. **shared/** — remove pipeline components/hooks (moved in steps 3-4), keep only generic infra
2. **entities/** — move `features/invoice/` → `entities/materials/`, `features/transport/` → `entities/transport/`, etc. Merge report data layers. Move `features/project/` and `features/export/`.
3. **features/** — move pipeline interaction files from `shared/` into `features/file-upload/` and `features/inline-edit/`
4. **widgets/** — move composed UI blocks from `shared/` into `widgets/`
5. **pages/** — split `features/dashboard/` into `pages/global-dashboard/` + `pages/project-dashboard/`. Move `features/report/` UI into `pages/project-dashboard/tabs/report/`. Move `features/settings/`, `features/user/`, `features/organization/`, `features/onboarding/`, `features/auth/` into `pages/`.
6. **Cleanup** — update `routes.tsx`, remove old barrel `index.ts` files, verify no orphaned imports.

### Dependency rule

```
pages/        → can import from widgets, features, entities, shared
widgets/      → can import from features, entities, shared
features/     → can import from entities, shared
entities/     → can import from shared
shared/       → can import from nothing (except external packages)
```

## Phase 3: DRY Refactor (future, after file tree is settled)

With the FSD structure in place, these duplication patterns are already visible and become mechanical extractions:

- **Parse hooks** (`useInvoiceParse`, `useTransportParse`, `useWasteParse`) — trivial wrappers around `useFileParse` with different API functions. May not need to exist as separate hooks at all.
- **Preview components** (`InvoicePreview`, `TransportPreview`, `WastePreview`) — all wrap `ParsePreviewShell` + `Co2TotalBadge` + domain columns + item-to-row mapping. Extractable into a generic `DataPreview` widget parameterized by columns and mapping function.
- **GroupCard components** (`InvoiceGroupCard`, `TransportGroupCard`, `WasteGroupCard`) — all wrap `CollapsibleGroupCard` + `DataTable` + `InlineUndoBar` + optimistic delete. Extractable into a generic `DataGroupCard` widget.
- **Upload components** (`InvoiceUpload`, `TransportUpload`, `WasteUpload`) — identical skeleton: `DataTabShell` → `FileUploadShell` → Preview → GroupCards → confirm handler. The confirm handler (`getToken → API → invalidate → toast`) is copy-pasted three times.
- **Domain hooks** (`useProjectMaterials`, `useProjectTransports`, `useWaste`) — all follow the same shape: `useAuthQuery` for list, `useOptimisticDelete` for delete, `useAuthMutation` for update.

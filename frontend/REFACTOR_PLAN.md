# Frontend File Tree Refactor Plan

## Context
The app was built with per-domain feature folders (invoice, transport, waste, energy) when each had bespoke UI. Now that tables, columns, tab layout, and the parse-preview-confirm pipeline are unified, the feature boundaries no longer match reality. The app is more page-based than feature-based.

## Phase 1: Delete Dead Code

Files to delete (orphaned after DataTable/column unification):
- `features/invoice/components/InvoiceTable.tsx` — old table, replaced by DataTable + materialColumns
- `features/invoice/components/InvoicePreviewRow.tsx` — old row component, absorbed into DataTable
- `features/invoice/components/Co2Value.tsx` — only used by InvoiceTable
- `features/invoice/components/InvoiceTotalCo2.tsx` — only used by InvoiceTable
- `features/transport/components/Co2Badge.tsx` — unused after TransportRow deletion
- `features/transport/components/TransportTotalCo2.tsx` — unused after TransportRow deletion
- `features/transport/components/VehicleInfoModal.tsx` — verify usage first

Hooks to check for dead usage:
- `features/invoice/hooks/useOverrides.ts` — was used by old InvoicePreview, may be dead now
- `shared/hooks/useInlineEdit.ts` — only used by FlaggedMaterialRow (keep if so)
- `shared/hooks/useSelection.ts` — check if anything imports it

Index files to update after deletions:
- `features/invoice/index.ts` — remove InvoiceTable export
- `features/transport/index.ts` — remove VehicleInfoModal, TransportPreview, TransportManualInput if only used internally

Also: `features/report/components/DataTable.tsx` shadows the shared DataTable — should be renamed or consolidated in Phase 2.

## Phase 2: Restructure File Tree

### Target structure

```
src/
  app/                          (unchanged)
  components/ui/                (unchanged — shadcn primitives)

  domains/                      lightweight per-domain data configs
    materials/
      api.ts                    invoice API + project materials API
      hooks.ts                  useInvoiceParse, useProjectMaterials, useDeleteInvoice, useUpdateMaterial, useDeleteMaterial
      columns.tsx               materialColumns + MaterialRow
      types.ts
    transport/
      api.ts
      hooks.ts
      columns.tsx               tripColumns + TripRow
      types.ts
    waste/
      api.ts
      hooks.ts
      columns.tsx               wasteColumns + WasteRow
      types.ts
    energy/
      api.ts
      hooks.ts
      columns.tsx               inline columns (uses zones data)
      types.ts

  features/
    data-pipeline/              the parse→preview→confirm→view engine
      components/
        DataTable.tsx
        DataTabShell.tsx
        ParsePreviewShell.tsx
        FileUploadShell.tsx
        FileDropZone.tsx
        SelectedFileBar.tsx
        CollapsibleGroupCard.tsx
        Co2TotalBadge.tsx
        ManualEntry.tsx
        RowActions.tsx
        InlineUndoBar.tsx
      hooks/
        useFileParse.ts
        useOptimisticDelete.ts
        useInlineUndo.ts
        useDismiss.ts
    project/                    project CRUD hooks + constants (unchanged)
    auth/                       (unchanged)
    onboarding/                 (unchanged)
    organization/               (unchanged)
    settings/                   (unchanged)
    user/                       (unchanged)
    export/                     (unchanged)

  pages/
    GlobalDashboard/
      GlobalDashboard.tsx
      ProjectCard.tsx
      ProjectCardDrawer.tsx
      CreateProjectDialog.tsx
    ProjectDashboard/
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
        MaterialsTab.tsx        composition: domain data + pipeline components
        TransportTab.tsx
        WasteTab.tsx
        EnergyTab.tsx
        ReportTab/              report has many sub-components
          ReportView.tsx
          CategoryDonut.tsx
          CollapsibleGroup.tsx
          ReportDataTable.tsx   renamed from report/DataTable.tsx to avoid shadowing
          InfoCard.tsx
          MaterialsSection.tsx
          MethodologySection.tsx
          Section.tsx
          TopEmitters.tsx
          TransportSection.tsx
          WasteFactorsTables.tsx
          WasteSection.tsx

  shared/                       truly generic, reusable anywhere
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
      useFileSelect.ts
      useInlineEdit.ts         (if still used by FlaggedMaterialRow)
      useRequireToken.ts
      useScrollIndicators.ts
      useUserSync.ts
    context/                    (unchanged)
    types/                      (unchanged)
```

### What each move accomplishes

1. `features/invoice/` → `domains/materials/` — name matches the domain, not the input format
2. `features/transport/` → `domains/transport/` — thins down to just data config
3. `features/waste/` → `domains/waste/` — same
4. `features/energy/` → `domains/energy/` — same
5. `shared/components/` pipeline files → `features/data-pipeline/components/` — pipeline is a feature, not generic shared code
6. `shared/hooks/` pipeline hooks → `features/data-pipeline/hooks/` — same reasoning
7. `features/dashboard/` → `pages/GlobalDashboard/` + `pages/ProjectDashboard/` — pages are pages
8. Tab wrapper components become the actual composition point in `pages/ProjectDashboard/tabs/`
9. `features/report/` → `pages/ProjectDashboard/tabs/ReportTab/` — it's a tab, not a standalone feature

### Migration approach

- Move files one folder at a time
- Update all `@/` import paths after each move
- Run `tsc --noEmit` after each batch to catch broken imports
- Update barrel `index.ts` files
- Update `routes.tsx`

## Phase 3: DRY Refactor (separate effort, after file tree is settled)

With the new structure in place, duplication patterns will be visible:
- Preview vs GroupCard components per domain (near-identical mapping logic)
- Confirm handlers across tabs (same pattern: setConfirming → token → API → invalidate → toast)
- Query invalidation patterns
- Column definition similarities across domains

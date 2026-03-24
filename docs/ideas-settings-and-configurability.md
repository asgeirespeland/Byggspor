# Settings & Configurability — Ideas / Design Notes

> Status: Ideation — not yet scoped into issues. All of this is **could-have** territory.

## Vision

The application should be **maximally configurable** while remaining **effortless by default**. A small subcontractor who just wants drag-and-drop invoice upload and a quick report should never have to touch a setting. But a sustainability consultant, an experienced environmental advisor, or a contractor working under a specific standard should be able to configure the calculation model almost exactly to their needs — and have full transparency into how every number is derived.

Two core principles:

1. **Sensible defaults, full override** — every hardcoded parameter today should eventually become a configurable value with its current value as the default.
2. **Total calculation transparency** — users should be able to see exactly how every result is computed: which formula, which inputs, which assumptions, and why.

---

## Configuration Hierarchy

Settings should cascade with increasing specificity:

```
System defaults (hardcoded fallbacks)
  → Organization-level defaults
    → Project-level overrides
```

- A user who configures nothing gets sensible system defaults.
- A large contractor sets org-wide policies (e.g., "we always report A1-D, use residual mix").
- A project manager overrides for a specific project that has different requirements.

This requires a settings model that supports scoping (org / project) and merging (project inherits from org, org inherits from system defaults).

---

## Configurable Parameters

### EPD Lifecycle Stages

**Current state:** Only A1-A3 (production phase) is used. The NOBB API response contains all stages (A1-A3, A4, A5, C1-C4, D) and the backend parses them, but discards everything except A1-A3 when storing `gwp_per_unit`.

**Goal:** Let users choose which stages to include in the material CO2 calculation.

Common configurations:
- **A1-A3** — Production only (current default, simplest)
- **A1-A3 + C1-C4** — Production + end-of-life (common for waste-aware reporting)
- **A1-A3 + C1-C4 + D** — Full lifecycle including benefits/loads beyond system boundary
- **A1-D** — Complete lifecycle (required by some standards)
- **Custom selection** — Pick individual stages

Implementation notes:
- Backend already fetches all stages from NOBB — need to persist them instead of discarding
- `Material.gwp_per_unit` (single float) would need to become per-stage storage or the calculation would need to sum selected stages on the fly
- Frontend `getGwpA1A3()` utility would generalize to `getGwp(stages[])`

### Energy Emission Factors

**Current state:** Hardcoded national physical mix at 11.9 g CO2/kWh (NVE 2024). Price zones (NO1-NO5) are stored per energy entry but not used.

**Goal:** Let users choose which emission factor methodology to apply.

Options:
- **Physical mix — national** (current: 11.9 g/kWh) — what's physically produced in Norway
- **Physical mix — regional** — per price zone (NO1-NO5), using zone-specific NVE data
- **Residual mix** (~300-500 g/kWh) — accounts for traded guarantees of origin
- **Custom factor** — user provides their own value (e.g., from a specific energy supplier)

Implementation notes:
- Zone data is already stored per energy entry
- Need a source for regional and residual mix factors (NVE publishes these)
- Calculation in `energy.py` currently multiplies by a single constant — would read from project/org settings instead

### Confidence Scoring

**Current state:** Fixed thresholds (20/50/80/100) hardcoded across material, transport, and energy services.

**Goal:** Allow advanced users to adjust confidence thresholds or weighting.

Lower priority — most users won't touch this. But for auditability, the thresholds and their reasoning should at least be visible.

### Transport Emission Parameters

**Current state:** Vehicle-specific CO2/km from Vegvesen API. Fallback confidence of 50.

**Goal:** Possibly allow users to set default vehicle emission profiles when API data is unavailable (e.g., "assume diesel van at X g/km for unmatched vehicles").

### Uploaded Data — Line-Level Editing

**Current state:** Invoice lines are parsed and matched automatically. Users can delete entries but cannot edit individual line details or annotate them.

**Goal:** All uploaded data should be editable at the line level.

- Edit parsed values (quantities, units, descriptions) when OCR/parsing gets it wrong
- Add notes/annotations to individual invoice lines (e.g., "this was a replacement for defective batch", "allocated to phase 2")
- Override or manually assign material matches when automatic NOBB lookup fails or is wrong
- Flag lines for review or exclude them from calculations

This gives users full ownership of their data rather than being locked into whatever the parser produced.

### Report Generation & Export

**Current state:** Basic dashboard with category-level CO2 totals.

**Goal:** Full report generation with multiple output formats and complete traceability.

**EHF output:**
- Generated EHF follows the BEAst Supply standard
- Includes all configured metadata and calculation parameters

**Full project report:**
- All configuration details: which preset/standard, which EPD stages, which emission factors
- Complete calculation methodology: how every number was derived
- Per-line detail with data sources, confidence scores, and any user overrides/notes
- Audit trail of settings changes

**Display preferences:**
- Units: kg vs. tonnes CO2eq
- Grouping: by category, by lifecycle stage, by supplier
- Which categories to show/hide
- Export format preferences

---

## Standards-Based Presets

Instead of requiring users to configure individual parameters, offer presets aligned with known standards:

| Preset | EPD Stages | Emission Factor | Notes |
|--------|-----------|----------------|-------|
| Quick Estimate | A1-A3 | Physical mix (national) | Current behavior, simplest |
| NS 3720 | A1-A3 + B4 + C1-C4 + D | Depends on scope | Norwegian standard for GHG calculations in buildings |
| BREEAM-NOR | Per BREEAM requirements | Per BREEAM requirements | Green building certification |
| Custom | User-defined | User-defined | Full control |

Presets pre-fill all settings but remain fully editable. Power users start from a preset and tweak.

### Scenario Comparison

A natural extension of presets — let users run the same project data through different configurations side by side (e.g., "your project under NS 3720 vs. quick estimate vs. BREEAM-NOR"). Useful for consultants advising on which standard to target. Low marginal effort once the settings infrastructure exists, since it's the same calculation with different parameters.

### Material Substitution / What-If Analysis

Adjacent to scenario comparison but at the material level — "what if I used stone wool instead of glass wool for insulation?" Let users swap a material for an alternative and instantly see the CO2 impact delta. Builds on the same infrastructure (re-running the calculation with one variable changed).

This is where the tool creates arguably the most real-world value — not just measuring emissions but helping reduce them. A builder with procurement flexibility can make informed material choices before ordering, rather than just accounting for what already arrived on site.

---

## Data Coverage & Gaps

**EPD stage availability will be the practical bottleneck.** Switching from A1-A3 to A1-D is only useful if the EPDs in NOBB actually contain stage C and D data. Many products don't.

The system must surface coverage gaps clearly when users select broader stage configurations:
- e.g., "You selected A1-D but 37 of 84 materials have no data beyond A1-A3 — your results are incomplete."
- Coverage gaps should feed into confidence scoring (a material with partial stage data gets lower confidence when broader stages are selected)
- Consider visual indicators per material row showing which stages have data vs. which are missing

Without this, users get false confidence in numbers that are silently partial.

---

## Calculation Transparency

### In-App Documentation

Every calculated value in the UI should be traceable. Two layers:

1. **Contextual** — Click/hover on any CO2 value to see:
   - The formula used (e.g., `gwp_per_unit × quantity`)
   - The specific inputs (e.g., `42.5 kg CO2eq/unit × 150 units`)
   - Which EPD stages are included
   - The confidence score and why it's at that level
   - Data source (e.g., "EPD from NOBB, product X, EPD ID Y")

2. **Methodology page** — A dedicated section explaining:
   - How material emissions are calculated (EPD lookup, stage selection, fallback behavior)
   - How transport emissions are calculated (Vegvesen API, distance × factor)
   - How energy emissions are calculated (emission factor × consumption)
   - How confidence scoring works and what the thresholds mean
   - How the overall project score is weighted
   - What assumptions are made and where data gaps exist

This serves both as user documentation and as audit support for third-party verification. The methodology page could even be generated/templated from the active project settings — so it always reflects the actual calculation configuration in use.

### Export & Audit Trail

For formal reporting and verification:
- Export a calculation methodology statement alongside the report
- Include which settings/preset were active
- Log when settings were changed and by whom (audit trail)

### Line-Edit Versioning

Once users can edit parsed invoice lines, preserve original parsed values alongside user overrides:
- **Auditability:** "Here's what the invoice said vs. what the user corrected"
- **Re-processing:** If the parser improves, re-run on originals and show users what changed
- **Diff view:** Let users see all manual overrides at a glance for a given invoice

---

## Current Hardcoded Values (Reference)

| Parameter | Current Value | Location |
|-----------|--------------|----------|
| EPD stages used | A1-A3 only | `material_service.py:80-86` |
| Energy emission factor | 0.0119 kg CO2eq/kWh | `energy.py:27` |
| Material confidence (EPD available) | 80 | `material_service.py:147` |
| Material confidence (no EPD) | 50 | `material_service.py:149` |
| Material confidence (flagged) | 20 | `material_service.py:149` |
| Transport confidence (vehicle data) | 80 | `transport_service.py:36` |
| Transport confidence (no vehicle data) | 20 | `transport_service.py:39` |
| Transport confidence (fallback) | 50 | `transport_service.py:41` |
| Energy confidence (manual entry) | 100 | `energy.py:149` |

---

## Regulatory Context

Norway is moving towards mandatory climate accounting for buildings (TEK revisions, Statsbygg requirements). The exact parameters keep shifting. A tool with configurable calculation parameters that can adapt to new regulatory requirements without code changes is significantly more future-proof than one with hardcoded assumptions. This is a strong argument for the settings infrastructure investment — the question isn't whether flexibility will be needed, but when.

---

## Incremental Implementation Path

The end state described here is large. A practical ordering:

1. **Settings model + cascade logic** — `ProjectSettings` model with org-level inheritance and system defaults as fallback. This is the plumbing — once it exists, every new configurable parameter is just a new field.
2. **One configurable parameter** — EPD stage selection is the natural first candidate (data is already fetched, just discarded). Proves out the full stack: backend model → API → settings UI → calculation reads from settings.
3. **Energy emission factor toggle** — Second parameter, validates that the cascade/inheritance works for multiple settings.
4. **Line-level editing** — Independent of the settings infrastructure, can be built in parallel.
5. **Presets** — Layer on top once multiple parameters are configurable.
6. **Transparency / methodology page** — Can start simple (static explanation) and evolve to reflect active configuration.
7. **Report generation with full config details** — Builds on everything above.
8. **Scenario comparison + material substitution** — The capstone features, require all the infrastructure to be in place.

---

## Open Questions

- How granular should org-level settings be? Per-department? Per-team?
- Should settings changes propagate retroactively to existing calculations, or only apply going forward?
- How to handle settings conflicts when a project is shared across orgs?
- Should there be role-based access to settings (e.g., only project admins can change calculation parameters)?
- Is there value in versioning settings configurations (snapshot what was active when a report was generated)?
- What level of BEAst Supply compliance is needed for EHF generation — minimum viable or full spec?
- How to handle line edits conflicting with re-uploads of the same invoice?

# Report Info/Methodology Section — Ideas

## EPD & Material Data
- List EPD numbers used per material with links to EPD-Norge where available
- Flag materials missing EPDs (no GWP data)
- Show declared unit and conversion factors used

## Emission Factors
- Transport: emission factor per vehicle type (kg CO₂/km), source (Abax, manual)
- Energy: grid emission factor source and value (NVE physical mix vs residual mix)
- Waste: C3+C4 stage factors, per-waste-type breakdown

## Calculation Method
- Materials scope: A1-A3 (cradle-to-gate)
- How biogenic carbon / sequestration is handled (negative GWP in A1-A3)
- Gross vs net distinction explained

## Data Sources & Confidence
- Breakdown of data origin: EHF/XML invoice, Abax API, manual entry
- How confidence scores are calculated per category
- What "flagged" items mean (missing NOBB match, no EPD, etc.)

## Project Settings (future: editable per project)

Currently hardcoded, but should eventually live as per-project config
that can be edited in a project settings panel.

- Grid emission factor choice (physical mix vs residual mix) and value
- Default transport emission factor per vehicle class
- Whether to include A4 (transport of materials) from EPD in material CO₂
  - Default: off. Tooltip: "Include CO₂ from transport of materials to site
    based on EPD data. If unsure, leave this off."
- Whether to include biogenic carbon in totals
- Waste emission factor overrides per waste type
- Confidence score weighting strategy (per-entry average vs CO₂-weighted)

### Implementation path
1. Hardcode defaults in a shared config object (e.g. `DEFAULT_PROJECT_SETTINGS`)
2. Backend: add a `project_settings` JSON column to the project model
3. Frontend: read settings from project, fall back to defaults
4. Later: add a settings UI inside the project dashboard

### Report & invoice transparency
The report info section should show which settings were active when it was
generated — acts as a methodology receipt:
- Which toggles were on (e.g. "A4 material transport: included")
- Which emission factors were used and their source
- Grid mix type chosen and factor value
- Confidence weighting method

The same settings should feed into the generated EHF invoice (#26) so the
buyer can verify the calculation methodology. The invoice attachment or
supplementary data should reference the same settings snapshot.

## Unused NOBB/EPD Data Already Available

The NOBB API returns rich EPD data that we fetch and could display but
don't yet surface in the report:

- **Full lifecycle GWP stages**: A1-A3, A4, A5, C1-C4, D (currently only A1-A3 total is used)
- **Fossil vs biogenic breakdown**: per stage, enables separating biogenic carbon properly
- **Declared unit & conversion factor to kg**: useful for showing calculation transparency
- **Price unit factor**: maps NOBB price unit to declared unit
- **Reference service life**: relevant for lifecycle comparisons
- **Environment labels**: e.g. Svanemerket, BREEAM-related labels
- **EPD registration number**: linkable to EPD-Norge for verification

### What to surface in the info section
- Per-material: EPD number (linked), declared unit, which stages were included, fossil vs biogenic split
- Summary: total GWP per stage across all materials (show what A4/A5/C/D would add)
- Flag items where only A1-A3 is available vs items with full lifecycle data

### Material transport (A4) as a new data source
- Currently transport only covers Abax driving logs (on-site vehicle trips)
- EPD A4 stage gives transport-to-site GWP per declared unit for materials
- Could calculate material delivery CO₂ from invoice quantities × A4 GWP without
  needing GPS data — this is a separate transport category from Abax
- Makes the report more complete: A1-A3 (production) + A4 (delivery) per material
- Could show this as a sub-breakdown under materials or as a separate "material
  transport" line in the transport section

### Longer term
- Store full EPD stage data in the DB (currently only `gwp_per_unit` = A1-A3 total is persisted)
- Allow report to include additional stages when data is available
- Show biogenic carbon separately from fossil to avoid misleading sequestration numbers

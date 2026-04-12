# BEAst Supply 4: Research Findings

**Date:** 2026-04-12
**Researcher:** Kristian Tufte Sterud, assisted by Claude.
**Related issue:** #26

---

## 1. Version & Status

The latest version is **BEAst Supply 4.0.6**, published December 17, 2025 and mandatory from March 16, 2026. It is based on:
- Peppol Post Award Community 3.0.20
- Peppol Logistics Community 1.2
- ISO/IEC 19845:2015 (UBL 2.1)

BEAst Supply 4 is an extension of PEPPOL BIS, adding construction-industry-specific fields on top of the standard PEPPOL transactions.

## 2. How Environmental Data is Carried on Invoices

### 2.1 Invoice AdditionalItemProperty (simple key-value)

On the **invoice** (`ubl-invoice`), the `AdditionalItemProperty` element supports **only two child elements**:

```xml
<cac:AdditionalItemProperty>
  <cbc:Name>EPDNumber</cbc:Name>            <!-- 1..1, mandatory -->
  <cbc:Value>NEPD-1717-700-SE</cbc:Value>   <!-- 1..1, mandatory -->
</cac:AdditionalItemProperty>
```

The invoice does **NOT** support `cbc:NameCode`, `cbc:ValueQuantity`, `cbc:ValueQualifier`, or `cbc:ID` on `AdditionalItemProperty`. This means all environmental data on invoices is encoded as simple string key-value pairs.

The element is repeatable (0..n), so multiple properties can be attached to each invoice line item.

### 2.2 Catalogue AdditionalItemProperty (richer structure)

The **Catalogue** transaction (T19) supports the full structure:

| Element | Cardinality | Description |
|---------|-------------|-------------|
| `cbc:ID` | 0..1 | Property ID (e.g., a GUID) |
| `cbc:Name` | 1..1 | Property name (e.g., "EPD Number") |
| `cbc:NameCode` | 0..1 | Coded property name from IPNC codelist |
| `cbc:Value` | 1..1 | Property value |
| `cbc:ValueQuantity` | 0..1 | Numeric value with unitCode attribute |
| `cbc:ValueQualifier` | 0..1 | Classification (e.g., "Climate Data") |

Example from the Catalogue spec:
- Name: `"EPD Number"`, NameCode: `"EPDNumber"`, Value: `"NEPD-1717-700-SE"`, ValueQualifier: `"Climate Data"`

### 2.3 Implication

The invoice is the simpler of the two. For the EHF generator, we only need to produce `Name` + `Value` pairs. The property names should follow the IPNC codelist (section 3) for interoperability.

## 3. IPNC Codelist: Item Property Name Codes

The IPNC (version 1.1.1) defines the standardized property names for `AdditionalItemProperty`. These are used in the `cbc:Name` field on invoices and in the `cbc:NameCode` field on catalogues.

### 3.1 EPD / Environmental Codes

| Code | Description | Expected Value |
|------|-------------|----------------|
| `EPDNumber` | EPD registration number | e.g., `"NEPD-1717-700-SE"` |
| `EPDDataSetID` | EPD data set identifier | UUID or registry ID |
| `EPDDataSetURL` | Machine-readable EPD data URL | URL |
| `EPDHRURL` | Human-readable EPD URL | URL to EPD document |
| `EPDProductName` | Product name as stated in EPD | Text |
| `ProgramOperator` | EPD program operator | e.g., `"EPD Norge"`, `"EPD International"` |
| `MotherEPDID` | Parent/generic EPD ID | ID (for sector/generic EPDs covering multiple products) |
| `GWP-GHG_A1-3_vA1` | GWP GHG A1-3, value A1 | Numeric (kg CO₂e), see section 3.2 |
| `GWP-GHG_A1-3_vA2` | GWP GHG A1-3, value A2 | Numeric (kg CO₂e), see section 3.2 |
| `GWP-GHG_A1-3_vA3` | GWP GHG A1-3, value A3 | Numeric (kg CO₂e), see section 3.2 |
| `BoVResourceID` | Boverket resource ID | Swedish building authority reference |
| `TrVResourceID` | Trafikverket resource ID | Swedish transport authority reference |

### 3.2 GWP Field Interpretation

The three GWP codes (`vA1`, `vA2`, `vA3`) likely represent the individual lifecycle sub-stages:
- **A1** = Raw material extraction and processing
- **A2** = Transport to manufacturing
- **A3** = Manufacturing

**[NEEDS CONFIRMATION]** The "v" prefix is ambiguous. It could mean "value for stage A1/A2/A3" or "version A1/A2/A3" (different assessment methodologies). The naming convention `GWP-GHG_A1-3_vA1` suggests "GWP for the A1-3 scope, broken out for stage A1." This aligns with EN 15804+A2, which requires reporting GWP per lifecycle stage.

Units are not explicitly declared on the invoice (since `ValueQuantity` is not available). Convention is **kg CO₂e per declared unit** as per EN 15804.

### 3.3 Non-Environmental Codes

| Code | Description |
|------|-------------|
| `ConfigurationValue` | Configuration value |
| `GUIDIdentifier` | GUID identifier |
| `TreatmentCode` | Treatment code |
| `Price` | Price information |
| `Rental` | Rental information |

### 3.4 Example: Complete Invoice Line with Environmental Data

```xml
<cac:InvoiceLine>
  <cbc:ID>1</cbc:ID>
  <cbc:InvoicedQuantity unitCode="EA">100</cbc:InvoicedQuantity>
  <cbc:LineExtensionAmount currencyID="NOK">50000.00</cbc:LineExtensionAmount>
  <cac:Item>
    <cbc:Name>Isolasjonsplate XPS 50mm</cbc:Name>
    <cac:StandardItemIdentification>
      <cbc:ID schemeID="0160">7038010012345</cbc:ID>  <!-- GTIN -->
    </cac:StandardItemIdentification>

    <!-- EPD identification -->
    <cac:AdditionalItemProperty>
      <cbc:Name>EPDNumber</cbc:Name>
      <cbc:Value>NEPD-1717-700-SE</cbc:Value>
    </cac:AdditionalItemProperty>
    <cac:AdditionalItemProperty>
      <cbc:Name>EPDDataSetURL</cbc:Name>
      <cbc:Value>https://www.environdec.com/Detail/epd1717</cbc:Value>
    </cac:AdditionalItemProperty>
    <cac:AdditionalItemProperty>
      <cbc:Name>ProgramOperator</cbc:Name>
      <cbc:Value>EPD Norge</cbc:Value>
    </cac:AdditionalItemProperty>

    <!-- GWP values per lifecycle stage (kg CO₂e per declared unit) -->
    <cac:AdditionalItemProperty>
      <cbc:Name>GWP-GHG_A1-3_vA1</cbc:Name>
      <cbc:Value>3.2</cbc:Value>
    </cac:AdditionalItemProperty>
    <cac:AdditionalItemProperty>
      <cbc:Name>GWP-GHG_A1-3_vA2</cbc:Name>
      <cbc:Value>0.8</cbc:Value>
    </cac:AdditionalItemProperty>
    <cac:AdditionalItemProperty>
      <cbc:Name>GWP-GHG_A1-3_vA3</cbc:Name>
      <cbc:Value>1.5</cbc:Value>
    </cac:AdditionalItemProperty>
  </cac:Item>

  <cac:Price>
    <cbc:PriceAmount currencyID="NOK">500.00</cbc:PriceAmount>
  </cac:Price>
</cac:InvoiceLine>
```

**Note:** This example is constructed from the spec. No complete example invoice with environmental data was found in public BEAst documentation.

## 4. Transport Emissions in the Advanced Despatch Advice

BEAst handles transport emissions in the **Advanced Despatch Advice** (T120), NOT in the invoice. The despatch advice has a dedicated `EnvironmentalEmission` element:

```xml
<cac:Shipment>
  <cac:Consignment>
    <cac:OriginalDespatchTransportationService>
      <cac:EnvironmentalEmission>
        <cbc:EnvironmentalEmissionTypeCode>CO2</cbc:EnvironmentalEmissionTypeCode>
        <cbc:ValueMeasure>2.8</cbc:ValueMeasure>
      </cac:EnvironmentalEmission>
    </cac:OriginalDespatchTransportationService>
  </cac:Consignment>
</cac:Shipment>
```

Supported emission types: `CO2`, `NOX`, `PM` (Particulate Matter), `HC` (Hydro Carbon).

The despatch advice also carries transport metadata:
- `FuelConsumption`, `DrivingDistance`, `DrivingTime`
- `EnergyContent`, `ConversionFactor`
- `EngineType` (Euro2–Euro7, EV, FuelCell, Hybrid, PHEV)

## 5. What BEAst Does NOT Cover

The following categories tracked by byggspor have **no standardized BEAst fields**:

| Category | BEAst Coverage | Byggspor Approach |
|----------|---------------|-------------------|
| **Materials** | Full coverage via IPNC EPD/GWP codes | Use IPNC codes on invoice lines |
| **Transport** | Covered in Despatch Advice (T120), NOT on invoice | Include as invoice line items with CO₂ in AdditionalItemProperty (byggspor extension) |
| **Waste** | No specific fields | Include as invoice line items with CO₂ in AdditionalItemProperty (byggspor extension) |
| **Energy** | No specific fields | Include as invoice line items with CO₂ in AdditionalItemProperty (byggspor extension) |

For transport, waste, and energy on invoices, byggspor would use the same `AdditionalItemProperty` mechanism but with custom (non-IPNC) property names. These would be byggspor-specific extensions, not part of the BEAst standard. The receiving system would need to understand these custom properties.

## 6. Implications for Development

### 6.1 EHF Generator is Simpler Than Expected

The invoice AdditionalItemProperty only supports `Name` + `Value` string pairs. No complex XML nesting needed. The generator just loops through EPD properties and emits key-value pairs per line item. This is good news for implementation.

### 6.2 Use IPNC Codes for Material Lines

For interoperability with systems like Skanska's (who were a BEAst Supply 4.0 pilot partner and selected 53 BEAst entities as required data points), use the standardized IPNC code names: `EPDNumber`, `GWP-GHG_A1-3_vA1`, etc.

### 6.3 Transport/Waste/Energy are Byggspor Extensions

BEAst defines transport emissions only on the Despatch Advice, not the invoice. We need to decide:

**Option A (pragmatic):** Include transport, waste, and energy as regular invoice line items (service lines) with AdditionalItemProperty for CO₂ data. Use descriptive but non-standardized names like `TransportCO2`, `WasteCO2`, `EnergyCO2`. This is technically valid UBL (custom properties are allowed) but not part of BEAst.

**Option B (standards-purist):** Only include materials with BEAst EPD data on the invoice. Transport emissions would be a separate Despatch Advice document. Waste and energy would be report-only (PDF appendix). This is more standards-compliant but requires multiple document types.

**Recommendation for PoC:** Option A. The whole point is demonstrating that environmental data flows with the invoice. Marking our custom fields clearly as extensions is sufficient. A production system could evolve toward Option B.

### 6.4 Receiving Systems

Skanska was a pilot partner for BEAst Supply 4.0, and their systems can ingest BEAst environmental fields from invoices. Veidekke's sustainability department confirmed that machine-readable EHF is what they need for automated climate reporting. The IPNC codes give us a standardized vocabulary they can parse.

### 6.5 CustomizationID and ProfileID

BEAst Supply 4.0.6 reuses the standard PEPPOL BIS Billing 3.0 identifiers without modification:

- **CustomizationID (BT-24):** `urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0`
- **ProfileID (BT-23):** `urn:fdc:peppol.eu:2017:poacc:billing:01:1.0`

BEAst does not define its own URNs despite adding construction-specific fields. This is technically at odds with the PEPPOL extension methodology (e.g., the Dutch NLCIUS/SETU extensions append their own URN segments to signal their presence), but it works because the PEPPOL schematron rule (PEPPOL-EN16931-R004) uses `starts-with()` matching, not exact string comparison.

For byggspor, this means we use the standard PEPPOL identifiers. No special header values needed.

### 6.6 EHF and PEPPOL BIS 3.0 Compatibility

**A single invoice can be both valid EHF and valid BEAst. They are not mutually exclusive.**

- **EHF Billing 3.0 IS PEPPOL BIS Billing 3.0.** Norway contributed its rules directly into the PEPPOL base standard rather than maintaining a separate national layer. Norwegian EHF invoices use the exact same CustomizationID and ProfileID as standard PEPPOL.
- **BEAst environmental data uses `AdditionalItemProperty`**, which is a standard UBL extension point with 0..n cardinality. Adding extra name-value pairs does not violate any EHF or PEPPOL validation rules.
- **The Byggstand pilot explicitly targets Norway.** Pilot partners include Skanska Norway, BYGGMA Group, and Saint-Gobain Distribution Norway. The Business Norway article confirms the intent is putting climate data "on the electronic EHF invoice."
- **`Byggspor_` prefixed extensions** are equally safe. They are just more `AdditionalItemProperty` entries that receivers can ignore if they don't recognize them.

**Caveat: validation is permissive, not prescriptive.** PEPPOL/EHF validation will not reject BEAst or byggspor fields, but it also will not validate them. There is no schematron rule checking that `GWP-GHG_A1-3_vA1` contains a valid number, for example. BEAst-specific validation would need to be a separate layer. A receiver has no metadata-level signal (like a distinct CustomizationID) that environmental data is present; they discover it by finding the relevant `AdditionalItemProperty` names.

### 6.7 No Need for Custom Schema Extensions

Since `AdditionalItemProperty` is a standard UBL element with free-form name-value pairs, we don't need to modify the XML schema or define custom namespaces. Our invoices will be valid PEPPOL BIS Billing 3.0 documents. The BEAst environmental data is additional metadata, not a schema change.

### 6.8 Mapping Byggspor Data to IPNC Fields

| Byggspor Field | IPNC Code | Source |
|----------------|-----------|--------|
| `material.epd_id` | `EPDNumber` | Material catalog / NOBB API |
| `material.gwp_per_unit` | `GWP-GHG_A1-3_vA1` (+ vA2, vA3 if stage-level data available) | NOBB API EPD data |
| EPD source URL | `EPDHRURL` | Constructed from EPD registry |
| EPD program | `ProgramOperator` | NOBB API or default "EPD Norge" |
| Generic EPD reference | `MotherEPDID` | When using sector/generic EPDs |

**Gap:** Byggspor currently stores a single `gwp_per_unit` value (total A1-A3). BEAst expects three separate stage values (vA1, vA2, vA3). If the NOBB API provides stage-level GWP data, we can map it directly. If not, we may need to report the total as `GWP-GHG_A1-3_vA1` and leave vA2/vA3 empty, or report it as a single combined total. This needs clarification.

## 7. Byggspor Extensions Beyond BEAst: The Data Richness Gap

### 7.1 The Gap

BEAst Supply 4 covers a narrow slice of the environmental data that byggspor tracks. The standard provides fields for EPD identification and GWP A1-A3 values on material line items. Byggspor captures significantly more:

| Data Point | BEAst Coverage | Byggspor Has It |
|------------|---------------|-----------------|
| EPD ID / number | Yes (IPNC) | Yes |
| GWP A1, A2, A3 | Yes (IPNC) | Yes (combined A1-A3; stage-level TBD) |
| GWP C3, C4 (end-of-life) | No | Yes (via NOBB API) |
| Recycled content % | No | Data fields exist, no source for values yet (future support) |
| Confidence score per item | No | Yes |
| Data source provenance | No | Yes (EHF invoice / manual / CSV / NOBB API) |
| Flagged / uncertain items | No | Yes |
| Transport CO₂ on invoice | No (Despatch Advice only) | Yes |
| Waste disposal CO₂ | No | Yes |
| Site energy CO₂ | No | Yes |
| Overall project CO₂ | No | Yes |

### 7.2 Why the Extra Data Matters to Main Contractors

A main contractor like Veidekke or Skanska aggregates CO₂ data from hundreds of subcontractors for regulatory climate reporting (Norwegian building regulations, EU CSRD). The BEAst standard gives them raw GWP numbers, but not the context they need to trust and audit those numbers:

- **Confidence scores** tell them whether a CO₂ value is backed by a verified EPD (confidence 80-90) or is a rough generic estimate (confidence 20-50). When signing off on a regulatory filing, this distinction is critical. A report built from 90%-confidence data is fundamentally different from one built from 50%-confidence guesses.

- **Data provenance** provides the audit trail that EU CSRD increasingly demands. Knowing that a value came from "EPD NEPD-1717-700-SE, looked up via NOBB API from uploaded EHF invoice #12345" is verifiable. "Someone typed 12.5 kg CO₂e" is not.

- **Transport, waste, and energy** are real contributors to a project's total footprint. Materials are the largest share, but ignoring the rest gives an incomplete picture. A main contractor producing a whole-project climate report needs all categories, not just materials.

- **End-of-life stages (C3, C4)** matter for lifecycle assessments required by Norwegian TEK17 and EU taxonomy. BEAst only covers A1-A3 (production phase), missing the disposal/recycling phase entirely.

### 7.3 Our Approach: BEAst-Compliant Core + Byggspor Extensions

Since `AdditionalItemProperty` is free-form (any name-value pair is valid UBL), we can layer our extra data on top of the standard without breaking compatibility:

1. **Use IPNC codes for everything BEAst covers** (`EPDNumber`, `GWP-GHG_A1-3_vA1`, etc.). This ensures existing BEAst-aware systems (Skanska, etc.) can parse the standard fields.

2. **Add prefixed custom properties for everything else**, using a `Byggspor_` prefix to avoid future IPNC collisions:

| Custom Property Name | Value | Purpose |
|---------------------|-------|---------|
| `Byggspor_ConfidenceScore` | `80` | Data quality indicator (0-100) |
| `Byggspor_DataSource` | `EHF_INVOICE` | Provenance (EHF_INVOICE / MANUAL / CSV_IMPORT / NOBB_API) |
| `Byggspor_RecycledContentPercent` | `35.0` | Recycled content % (field exists, no data source yet) |
| `Byggspor_GWP_C3` | `1.2` | End-of-life processing (kg CO₂e) |
| `Byggspor_GWP_C4` | `0.3` | End-of-life disposal (kg CO₂e) |
| `Byggspor_Flagged` | `true` | Item has data quality issues |
| `Byggspor_TransportCO2` | `45.2` | Transport emissions for service line (kg CO₂e) |
| `Byggspor_WasteCO2` | `120.0` | Waste handling emissions for service line (kg CO₂e) |
| `Byggspor_EnergyCO2` | `890.0` | Site energy emissions for service line (kg CO₂e) |

3. **The result:** an invoice that is fully BEAst-compliant (standard IPNC fields parse correctly in existing systems) but also carries richer data for systems that know how to read the `Byggspor_` fields. A contractor with a basic BEAst setup gets the GWP values. A contractor who integrates with byggspor's extended fields gets confidence, provenance, and the full picture.

### 7.4 Implications for the BEAst Standard

This gap is not a criticism of BEAst. The standard is relatively new (IPNC codelist is v1.1.1) and still evolving. But it highlights areas where the standard may need to grow:

- **Data quality/confidence indicators** are absent from all construction industry invoice standards, not just BEAst. As climate reporting becomes mandatory, the industry will need to distinguish verified data from estimates.
- **Non-material categories** (transport, waste, energy) will likely need standardized invoice representation as whole-lifecycle climate reporting becomes the norm.
- **End-of-life stages** (C3, C4) are required by EN 15804+A2 but not covered in IPNC.

Byggspor's extended fields serve as a proof-of-concept for what future versions of BEAst might standardize. Demonstrating their value in practice, with real contractors and real invoices, provides evidence for standards evolution.

## 8. Open Questions

1. **GWP field semantics (vA1/vA2/vA3):** Are `vA1`, `vA2`, `vA3` individual lifecycle stages or assessment versions? Likely stages based on EN 15804 conventions, but needs confirmation against real BEAst example data.

2. **GWP units on invoice:** Since `ValueQuantity` is not available on invoices, is the convention that GWP values are always kg CO₂e per declared unit? Or per unit of the invoice line quantity?

3. **Stage-level GWP data availability:** Does the NOBB API return A1, A2, A3 values separately, or only a combined A1-A3 total? This determines whether we can populate all three BEAst fields. Can be resolved during #56 implementation by inspecting actual NOBB responses.

4. **Skanska's 53 entities:** Which of the IPNC codes does Skanska actually require? This would tell us the minimum viable set of fields. The full list is not publicly available.

---

## Sources

- [BEAst Supply 4.0.6 — Main page](https://bis.beast.se/)
- [BEAst Supply 4 — Invoice tree structure](https://bis.beast.se/syntax/Invoice/tree/)
- [BEAst Supply 4 — Invoice AdditionalItemProperty](https://bis.beast.se/syntax/ubl-invoice/cac-InvoiceLine/cac-Item/cac-AdditionalItemProperty/)
- [BEAst Supply 4 — IPNC Codelist](https://bis.beast.se/codelist/IPNC/)
- [BEAst Supply 4 — Catalogue AdditionalItemProperty](https://bis.beast.se/syntax/Catalogue/cac-CatalogueLine/cac-Item/cac-AdditionalItemProperty/)
- [BEAst Supply 4 — Release notes](https://bis.beast.se/release-notes/)
- [BEAst Supply 4 — EnvironmentalEmission in Despatch Advice](https://bis.beast.se/syntax/AdvancedDespatchAdvice/cac-Shipment/cac-Consignment/cac-OriginalDespatchTransportationService/cac-EnvironmentalEmission/)
- [BEAst Supply 4 — Codelists overview](https://bis.beast.se/codelist/)
- [BEAst Supply 4.0 enables environmental data sharing — Business Norway](https://businessnorway.com/articles/byggstand-beast-supply-environmental-data-sharing-in-building-and-construction-industry)
- [Skanska PEPPOL invoice requirements (PDF)](https://www.skanska.no/4a4fa0/contentassets/02acc8b383f74f839d06644723553554/peppol-invoice-requierments-2024-09.pdf)
- [Skanska environmental requirements for suppliers](https://www.skanska.se/4a2e51/siteassets/skanska-in-sweden/suppliers/environmental-requirements-for-suppliers.pdf)

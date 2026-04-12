/**
 * Reference: WasteUpload inline preview table (v1)
 *
 * Saved for style inspiration — the green summary banner + compact table
 * with CO₂ source labels. Not imported anywhere; delete when no longer useful.
 */

const CO2_SOURCE_LABELS: Record<string, string> = {
  epd_c3c4: 'EPD',
  fraction_factor: 'Generisk',
}

/*
  <div className="space-y-4">
    <div className="rounded-xl border border-green-100 bg-green-50/60 p-4">
      <p className="text-sm font-medium text-gray-900">
        Avfallsrapport analysert
      </p>
      <p className="mt-1 text-sm text-gray-500">
        {wasteData.line_items.length} poster
        {wasteData.receiver?.name && <> fra {wasteData.receiver.name}</>}
        {wasteData.issue_date && <> ({wasteData.issue_date})</>}
      </p>
    </div>

    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b">
          <th className="py-2">Materiale</th>
          <th className="py-2">Tonn</th>
          <th className="py-2">CO₂ (kg)</th>
          <th className="py-2">Kilde</th>
        </tr>
      </thead>
      <tbody>
        {wasteData.line_items.map((item, i) => (
          <tr
            key={i}
            className={`border-b ${item.flagged ? 'bg-amber-50' : ''}`}
          >
            <td className="py-2">
              {item.name ?? '—'}
              {item.fraction_code && (
                <span className="ml-1 text-xs text-gray-400">
                  ({item.fraction_code})
                </span>
              )}
            </td>
            <td className="py-2">
              {item.quantity_tons?.toFixed(3) ?? '—'}
            </td>
            <td className="py-2">
              {item.co2_kg != null ? item.co2_kg.toFixed(2) : '—'}
            </td>
            <td className="py-2">
              {item.co2_source
                ? (CO2_SOURCE_LABELS[item.co2_source] ?? item.co2_source)
                : '—'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>

    {wasteData.line_items.some((i) => i.flagged) && (
      <p className="text-xs text-amber-600">
        Poster markert med gul bakgrunn mangler CO₂-data og trenger
        manuell gjennomgang.
      </p>
    )}
  </div>
*/

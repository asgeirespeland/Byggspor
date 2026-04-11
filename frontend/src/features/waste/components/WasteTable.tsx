import { useProjectWaste } from '../hooks/useWaste'

type Props = {
  projectId: number
}

export default function WasteTable({ projectId }: Props) {
  const wasteQuery = useProjectWaste(projectId)

  return (
    <div className="rounded-2xl border p-6">
      <h2 className="mb-4 text-xl font-semibold">Registrert avfall</h2>

      {wasteQuery.isLoading && <p>Laster avfallsdata...</p>}

      {wasteQuery.isError && (
        <p className="text-sm text-red-600">Kunne ikke hente avfallsdata.</p>
      )}

      {wasteQuery.data && wasteQuery.data.length === 0 && (
        <p>Ingen avfallsposter registrert ennå.</p>
      )}

      {wasteQuery.data && wasteQuery.data.length > 0 && (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-2">Type</th>
              <th className="py-2">Tonn</th>
              <th className="py-2">CO₂ (kg)</th>
              <th className="py-2">Kilde</th>
            </tr>
          </thead>
          <tbody>
            {wasteQuery.data.map((item) => (
              <tr key={item.id} className="border-b">
                <td className="py-2">{item.waste_type}</td>
                <td className="py-2">{item.quantity_tons}</td>
                <td className="py-2">{item.total_co2_kg}</td>
                <td className="py-2">{item.source_type}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
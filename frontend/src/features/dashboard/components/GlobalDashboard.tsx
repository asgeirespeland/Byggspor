export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Velkommen til Byggspor</p>
      </div>

      {/* Stat placeholders */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Prosjekter', value: '—' },
          { label: 'Transport', value: '—' },
          { label: 'Faktura', value: '—' },
          { label: 'CO₂ Estimat', value: '—' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border bg-white p-5 shadow-sm"
          >
            <p className="text-sm font-medium text-gray-500">{stat.label}</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Project list placeholder */}
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-gray-700">Prosjekter</h2>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-sm text-gray-400">Ingen prosjekter enda</p>
          <p className="mt-1 text-xs text-gray-300">
            Prosjekter vil vises her når de er lagt til
          </p>
        </div>
      </div>
    </div>
  )
}

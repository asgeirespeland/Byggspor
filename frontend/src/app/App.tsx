import { InvoiceUpload } from '../features/invoice'

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Byggspor</h1>
          <p className="mt-2 text-gray-600">
            Construction CO₂ footprint calculator
          </p>
        </div>
        <InvoiceUpload />
      </div>
    </div>
  )
}

export default App

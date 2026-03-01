import MaterialFile from './components/MaterialFile'

function App() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">Byggspor</h1>
        <p className="mt-2 text-gray-600">
          Construction CO₂ footprint calculator
        </p>
      </div>
      <div className="mt-20">
        <MaterialFile />
      </div>
    </div>
  )
}

export default App

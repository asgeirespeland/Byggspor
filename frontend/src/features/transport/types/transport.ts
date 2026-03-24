export interface Vehicle {
  id: number
  registration_number: string
  vehicle_type: string | null
  make: string | null
  model: string | null
  fuel_type: string | null
  co2_per_km: number | null
}

export interface Trip {
  trip_index: number
  driver_name: string | null
  registration_number: string
  start_address: string | null
  end_address: string | null
  distance_km: number | null
  duration_minutes: number | null
  toll_kr: number | null
  ferry_kr: number | null
  parking_kr: number | null
  total_co2_kg: number | null
  confidence_score: number
  flagged: boolean
  vehicle_id: number | null
  vehicle: Vehicle | null
}

export interface TransportParseResponse {
  project_transports_count: number
  vehicles_count: number
  flagged_count: number
  file_name: string | null
  trips: Trip[]
}

export interface ManualTripInput {
  project_id: number
  driver_name: string
  registration_number: string
  start_address: string
  end_address: string
  distance_km: number
  trip_date: string
}

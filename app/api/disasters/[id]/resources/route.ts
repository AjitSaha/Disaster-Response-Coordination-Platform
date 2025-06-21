import { type NextRequest, NextResponse } from "next/server"

// Mock resources data
const mockResources = [
  {
    id: "1",
    disaster_id: "1",
    name: "Red Cross Emergency Shelter",
    location_name: "Washington Square Park, NYC",
    location: { lat: 40.7308, lng: -73.9973 },
    type: "shelter",
    created_at: new Date().toISOString(),
  },
  {
    id: "2",
    disaster_id: "1",
    name: "FEMA Distribution Center",
    location_name: "Madison Square Garden, NYC",
    location: { lat: 40.7505, lng: -73.9934 },
    type: "supplies",
    created_at: new Date().toISOString(),
  },
  {
    id: "3",
    disaster_id: "2",
    name: "Brooklyn Community Center",
    location_name: "Prospect Park, Brooklyn",
    location: { lat: 40.6602, lng: -73.969 },
    type: "charging-station",
    created_at: new Date().toISOString(),
  },
  {
    id: "4",
    disaster_id: "2",
    name: "Emergency Medical Station",
    location_name: "Brooklyn Bridge Park, Brooklyn",
    location: { lat: 40.7023, lng: -73.9969 },
    type: "medical",
    created_at: new Date().toISOString(),
  },
]

async function getSupabaseClient() {
  if (!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)) {
    return null
  }

  try {
    const { createClient } = await import("@supabase/supabase-js")
    return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  } catch (error) {
    console.error("Failed to initialize Supabase client:", error)
    return null
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(request.url)
    const lat = searchParams.get("lat")
    const lon = searchParams.get("lon")
    const radius = searchParams.get("radius") || "10000" // 10km default

    const supabase = await getSupabaseClient()

    if (!supabase) {
      console.log("Using mock resources data - Supabase not configured")
      let filteredResources = mockResources.filter((resource) => resource.disaster_id === params.id)

      // If coordinates provided, simulate proximity filtering
      if (lat && lon) {
        const targetLat = Number.parseFloat(lat)
        const targetLon = Number.parseFloat(lon)
        const radiusKm = Number.parseInt(radius) / 1000

        filteredResources = filteredResources.filter((resource) => {
          const distance =
            Math.sqrt(Math.pow(resource.location.lat - targetLat, 2) + Math.pow(resource.location.lng - targetLon, 2)) *
            111 // Rough km conversion
          return distance <= radiusKm
        })
      }

      return NextResponse.json(filteredResources)
    }

    const query = supabase.from("resources").select("*").eq("disaster_id", params.id)

    // If coordinates provided, use geospatial query
    if (lat && lon) {
      // Use PostGIS ST_DWithin for proximity search
      const { data, error } = await supabase.rpc("get_nearby_resources", {
        disaster_id: params.id,
        lat: Number.parseFloat(lat),
        lng: Number.parseFloat(lon),
        radius_meters: Number.parseInt(radius),
      })

      if (error) {
        console.error("Geospatial query error:", error)
        // Fallback to regular query
        const { data: fallbackData, error: fallbackError } = await query
        if (fallbackError) {
          return NextResponse.json(
            { error: "Failed to fetch resources", details: fallbackError.message },
            { status: 500 },
          )
        }
        return NextResponse.json(fallbackData || [])
      }

      return NextResponse.json(data || [])
    }

    const { data, error } = await query

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to fetch resources", details: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

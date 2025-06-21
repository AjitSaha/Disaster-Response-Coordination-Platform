import { type NextRequest, NextResponse } from "next/server"

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

async function extractLocationWithGemini(description: string) {
  // In a real implementation, you would use Google Gemini API
  // This is a mock implementation that extracts common location patterns

  try {
    // Mock location extraction logic
    const locationPatterns = [
      { pattern: /manhattan|nyc|new york city/i, location: "Manhattan, NYC", lat: 40.7831, lng: -73.9712 },
      { pattern: /brooklyn/i, location: "Brooklyn, NYC", lat: 40.6782, lng: -73.9442 },
      { pattern: /queens/i, location: "Queens, NYC", lat: 40.7282, lng: -73.7949 },
      { pattern: /bronx/i, location: "Bronx, NYC", lat: 40.8448, lng: -73.8648 },
      { pattern: /times square/i, location: "Times Square, NYC", lat: 40.758, lng: -73.9855 },
      { pattern: /central park/i, location: "Central Park, NYC", lat: 40.7829, lng: -73.9654 },
      { pattern: /lower east side/i, location: "Lower East Side, NYC", lat: 40.7209, lng: -73.9896 },
      { pattern: /washington square/i, location: "Washington Square Park, NYC", lat: 40.7308, lng: -73.9973 },
      { pattern: /union square/i, location: "Union Square, NYC", lat: 40.7359, lng: -73.9911 },
      { pattern: /wall street/i, location: "Wall Street, NYC", lat: 40.7074, lng: -74.0113 },
      { pattern: /chinatown/i, location: "Chinatown, NYC", lat: 40.7158, lng: -73.997 },
      { pattern: /soho/i, location: "SoHo, NYC", lat: 40.723, lng: -74.003 },
    ]

    for (const { pattern, location, lat, lng } of locationPatterns) {
      if (pattern.test(description)) {
        console.log(`Location extracted: ${location} from "${description}"`)
        return { location_name: location, coordinates: { lat, lng } }
      }
    }

    // Default fallback
    return {
      location_name: "New York City",
      coordinates: { lat: 40.7128, lng: -74.006 },
    }
  } catch (error) {
    console.error("Gemini location extraction error:", error)
    throw error
  }
}

async function geocodeWithMappingService(locationName: string) {
  // In a real implementation, you would use:
  // - Google Maps Geocoding API
  // - Mapbox Geocoding API
  // - OpenStreetMap Nominatim API

  try {
    // Mock geocoding - in reality you'd make API calls
    const commonLocations: Record<string, { lat: number; lng: number }> = {
      "Manhattan, NYC": { lat: 40.7831, lng: -73.9712 },
      "Brooklyn, NYC": { lat: 40.6782, lng: -73.9442 },
      "Queens, NYC": { lat: 40.7282, lng: -73.7949 },
      "Bronx, NYC": { lat: 40.8448, lng: -73.8648 },
      "Times Square, NYC": { lat: 40.758, lng: -73.9855 },
      "Central Park, NYC": { lat: 40.7829, lng: -73.9654 },
      "Lower East Side, NYC": { lat: 40.7209, lng: -73.9896 },
      "Washington Square Park, NYC": { lat: 40.7308, lng: -73.9973 },
      "Union Square, NYC": { lat: 40.7359, lng: -73.9911 },
      "Wall Street, NYC": { lat: 40.7074, lng: -74.0113 },
      "Chinatown, NYC": { lat: 40.7158, lng: -73.997 },
      "SoHo, NYC": { lat: 40.723, lng: -74.003 },
      "New York City": { lat: 40.7128, lng: -74.006 },
    }

    const coordinates = commonLocations[locationName] || { lat: 40.7128, lng: -74.006 }

    console.log(`Geocoded ${locationName} to ${coordinates.lat}, ${coordinates.lng}`)

    return coordinates
  } catch (error) {
    console.error("Geocoding error:", error)
    throw error
  }
}

async function checkCache(supabase: any, key: string) {
  if (!supabase) return null

  try {
    const { data } = await supabase.from("cache").select("value, expires_at").eq("key", key).single()

    if (data && new Date(data.expires_at) > new Date()) {
      return data.value
    }
  } catch (error) {
    console.error("Cache check error:", error)
  }

  return null
}

async function setCache(supabase: any, key: string, value: any, ttlMinutes = 60) {
  if (!supabase) return

  try {
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000)

    await supabase.from("cache").upsert({
      key,
      value,
      expires_at: expiresAt.toISOString(),
    })
  } catch (error) {
    console.error("Cache set error:", error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { description } = body

    if (!description) {
      return NextResponse.json({ error: "Description is required" }, { status: 400 })
    }

    const supabase = await getSupabaseClient()
    const cacheKey = `geocode_${Buffer.from(description).toString("base64").slice(0, 50)}`

    if (!supabase) {
      console.log("Using mock geocoding - Supabase not configured")

      // Step 1: Extract location name using Gemini API
      const extractionResult = await extractLocationWithGemini(description)

      // Step 2: Geocode the location name to coordinates
      const coordinates = await geocodeWithMappingService(extractionResult.location_name)

      const result = {
        location_name: extractionResult.location_name,
        coordinates,
        extracted_from: description,
        mock_mode: true,
      }

      console.log(
        `Mock geocoding completed: ${extractionResult.location_name} -> ${coordinates.lat}, ${coordinates.lng}`,
      )

      return NextResponse.json(result)
    }

    // Check cache first
    const cachedResult = await checkCache(supabase, cacheKey)
    if (cachedResult) {
      console.log("Returning cached geocoding result")
      return NextResponse.json(cachedResult)
    }

    // Step 1: Extract location name using Gemini API
    const extractionResult = await extractLocationWithGemini(description)

    // Step 2: Geocode the location name to coordinates
    const coordinates = await geocodeWithMappingService(extractionResult.location_name)

    const result = {
      location_name: extractionResult.location_name,
      coordinates,
      extracted_from: description,
    }

    // Cache the result
    await setCache(supabase, cacheKey, result, 1440) // Cache for 24 hours

    console.log(`Geocoding completed: ${extractionResult.location_name} -> ${coordinates.lat}, ${coordinates.lng}`)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Geocoding API error:", error)
    return NextResponse.json(
      {
        error: "Geocoding failed",
        message: error instanceof Error ? error.message : "Unknown error",
        details: "Location extraction and geocoding service encountered an error",
      },
      { status: 500 },
    )
  }
}

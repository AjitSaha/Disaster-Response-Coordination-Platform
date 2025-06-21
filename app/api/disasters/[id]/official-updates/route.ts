import { type NextRequest, NextResponse } from "next/server"

// Mock official updates for demonstration
const mockOfficialUpdates = [
  "FEMA has deployed emergency response teams to affected areas. Evacuation centers are operational at Madison Square Garden and Brooklyn Bridge Park.",
  "NYC Emergency Management: All subway lines below 14th Street are suspended due to flooding. Alternative transportation is being arranged.",
  "Red Cross Update: 15 emergency shelters are now open across Manhattan and Brooklyn. Food and medical supplies are being distributed.",
  "National Weather Service: Flood warning remains in effect until 6 PM EST. Residents in low-lying areas should remain vigilant.",
  "NYC Mayor's Office: Emergency hotline 311 is operational 24/7 for assistance requests. Non-emergency services are temporarily suspended.",
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

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await getSupabaseClient()

    if (!supabase) {
      console.log("Using mock official updates - Supabase not configured")
      return NextResponse.json(mockOfficialUpdates)
    }

    const cacheKey = `official_updates_${params.id}`

    // Check cache first
    const cachedData = await checkCache(supabase, cacheKey)
    if (cachedData) {
      console.log("Returning cached official updates")
      return NextResponse.json(cachedData)
    }

    // Get disaster info for context
    const { data: disaster } = await supabase
      .from("disasters")
      .select("title, location_name, tags")
      .eq("id", params.id)
      .single()

    if (!disaster) {
      return NextResponse.json({ error: "Disaster not found" }, { status: 404 })
    }

    // In a real implementation, you would:
    // 1. Use web scraping (Cheerio, Puppeteer) to fetch from official sources
    // 2. Parse RSS feeds from FEMA, Red Cross, local emergency services
    // 3. Use APIs from government agencies if available
    // 4. Filter updates based on disaster location and type

    // For demonstration, return mock data
    let relevantUpdates = mockOfficialUpdates

    // Filter updates based on disaster tags and location
    if (disaster.tags.includes("flood")) {
      relevantUpdates = mockOfficialUpdates.filter(
        (update) =>
          update.toLowerCase().includes("flood") ||
          update.toLowerCase().includes("water") ||
          update.toLowerCase().includes("evacuation"),
      )
    }

    // Add location-specific filtering
    if (
      disaster.location_name.toLowerCase().includes("nyc") ||
      disaster.location_name.toLowerCase().includes("manhattan")
    ) {
      relevantUpdates = relevantUpdates.filter(
        (update) =>
          update.toLowerCase().includes("nyc") ||
          update.toLowerCase().includes("manhattan") ||
          update.toLowerCase().includes("brooklyn"),
      )
    }

    // Cache the results
    await setCache(supabase, cacheKey, relevantUpdates, 60) // Cache for 1 hour

    console.log(`Official updates: Found ${relevantUpdates.length} updates for disaster ${params.id}`)

    return NextResponse.json(relevantUpdates)
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

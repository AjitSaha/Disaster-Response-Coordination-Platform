import { type NextRequest, NextResponse } from "next/server"

// Mock data for when Supabase is not configured
const mockDisasters = [
  {
    id: "1",
    title: "NYC Flood Emergency",
    location_name: "Manhattan, NYC",
    location: { lat: 40.7831, lng: -73.9712 },
    description:
      "Heavy flooding in Manhattan due to storm surge. Multiple subway lines affected, residents in low-lying areas need evacuation assistance.",
    tags: ["flood", "urgent", "evacuation"],
    owner_id: "netrunnerX",
    created_at: new Date().toISOString(),
    audit_trail: [{ action: "create", user_id: "netrunnerX", timestamp: new Date().toISOString() }],
  },
  {
    id: "2",
    title: "Brooklyn Power Outage",
    location_name: "Brooklyn, NYC",
    location: { lat: 40.6782, lng: -73.9442 },
    description:
      "Widespread power outage affecting 50,000+ residents in Brooklyn. Emergency shelters needed for vulnerable populations.",
    tags: ["power-outage", "shelter"],
    owner_id: "reliefAdmin",
    created_at: new Date(Date.now() - 3600000).toISOString(),
    audit_trail: [
      { action: "create", user_id: "reliefAdmin", timestamp: new Date(Date.now() - 3600000).toISOString() },
    ],
  },
  {
    id: "3",
    title: "Queens Building Collapse",
    location_name: "Queens, NYC",
    location: { lat: 40.7282, lng: -73.7949 },
    description:
      "Partial building collapse in Queens following structural damage. Search and rescue operations in progress.",
    tags: ["building-collapse", "search-rescue", "urgent"],
    owner_id: "netrunnerX",
    created_at: new Date(Date.now() - 7200000).toISOString(),
    audit_trail: [{ action: "create", user_id: "netrunnerX", timestamp: new Date(Date.now() - 7200000).toISOString() }],
  },
]

// Check if Supabase is configured
function isSupabaseConfigured() {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
}

// Initialize Supabase client only if configured
async function getSupabaseClient() {
  if (!isSupabaseConfigured()) {
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tag = searchParams.get("tag")

    const supabase = await getSupabaseClient()

    if (!supabase) {
      console.log("Using mock data - Supabase not configured")
      let filteredData = mockDisasters

      if (tag) {
        filteredData = mockDisasters.filter((disaster) => disaster.tags.includes(tag))
      }

      return NextResponse.json(filteredData)
    }

    let query = supabase.from("disasters").select("*").order("created_at", { ascending: false })

    if (tag) {
      query = query.contains("tags", [tag])
    }

    const { data, error } = await query

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to fetch disasters", details: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
        usingMockData: !isSupabaseConfigured(),
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, location_name, description, tags, owner_id } = body

    const supabase = await getSupabaseClient()

    if (!supabase) {
      console.log("Creating mock disaster - Supabase not configured")
      const newDisaster = {
        id: Date.now().toString(),
        title,
        location_name,
        description,
        tags: tags || [],
        owner_id,
        created_at: new Date().toISOString(),
        audit_trail: [
          {
            action: "create",
            user_id: owner_id,
            timestamp: new Date().toISOString(),
          },
        ],
      }

      // In a real app, you'd store this somewhere
      mockDisasters.unshift(newDisaster)

      return NextResponse.json(newDisaster)
    }

    // Extract location using Gemini API and geocode it
    let location = null
    try {
      const geocodeResponse = await fetch(`${request.nextUrl.origin}/api/geocode`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: `${location_name} ${description}` }),
      })

      if (geocodeResponse.ok) {
        const geocodeData = await geocodeResponse.json()
        if (geocodeData.coordinates) {
          location = `POINT(${geocodeData.coordinates.lng} ${geocodeData.coordinates.lat})`
        }
      }
    } catch (geocodeError) {
      console.error("Geocoding error:", geocodeError)
    }

    const auditTrail = [
      {
        action: "create",
        user_id: owner_id,
        timestamp: new Date().toISOString(),
      },
    ]

    const { data, error } = await supabase
      .from("disasters")
      .insert({
        title,
        location_name,
        location,
        description,
        tags: tags || [],
        owner_id,
        audit_trail: auditTrail,
      })
      .select()
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to create disaster", details: error.message }, { status: 500 })
    }

    console.log(`Disaster created: ${data.title}`)

    return NextResponse.json(data)
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

import { type NextRequest, NextResponse } from "next/server"

// Mock reports data
const mockReports = [
  {
    id: "1",
    disaster_id: "1",
    user_id: "citizen1",
    content: "Water level rising rapidly on 14th Street. Need immediate evacuation assistance for elderly residents.",
    image_url: "https://example.com/flood-image-1.jpg",
    verification_status: "pending",
    created_at: new Date().toISOString(),
  },
  {
    id: "2",
    disaster_id: "1",
    user_id: "witness123",
    content: "Subway entrance at Union Square completely flooded. People trapped on platform.",
    image_url: "https://example.com/subway-flood.jpg",
    verification_status: "verified",
    created_at: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: "3",
    disaster_id: "2",
    user_id: "brooklyn_resident",
    content: "No power for 6 hours. Medical equipment failing. Need generator urgently.",
    verification_status: "verified",
    created_at: new Date(Date.now() - 3600000).toISOString(),
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
    const supabase = await getSupabaseClient()

    if (!supabase) {
      console.log("Using mock reports data - Supabase not configured")
      const filteredReports = mockReports.filter((report) => report.disaster_id === params.id)
      return NextResponse.json(filteredReports)
    }

    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .eq("disaster_id", params.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to fetch reports", details: error.message }, { status: 500 })
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

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { content, image_url, user_id } = body

    const supabase = await getSupabaseClient()

    if (!supabase) {
      console.log("Creating mock report - Supabase not configured")
      const newReport = {
        id: Date.now().toString(),
        disaster_id: params.id,
        user_id,
        content,
        image_url,
        verification_status: "pending",
        created_at: new Date().toISOString(),
      }

      mockReports.unshift(newReport)
      return NextResponse.json(newReport)
    }

    const { data, error } = await supabase
      .from("reports")
      .insert({
        disaster_id: params.id,
        user_id,
        content,
        image_url,
        verification_status: "pending",
      })
      .select()
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to create report", details: error.message }, { status: 500 })
    }

    console.log(`Report created for disaster ${params.id}`)

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

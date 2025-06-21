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

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await getSupabaseClient()

    if (!supabase) {
      // Mock single disaster data
      const mockDisaster = {
        id: params.id,
        title: "NYC Flood Emergency",
        location_name: "Manhattan, NYC",
        location: { lat: 40.7831, lng: -73.9712 },
        description: "Heavy flooding in Manhattan due to storm surge. Multiple subway lines affected.",
        tags: ["flood", "urgent", "evacuation"],
        owner_id: "netrunnerX",
        created_at: new Date().toISOString(),
        audit_trail: [{ action: "create", user_id: "netrunnerX", timestamp: new Date().toISOString() }],
      }

      console.log("Returning mock disaster data")
      return NextResponse.json(mockDisaster)
    }

    const { data, error } = await supabase.from("disasters").select("*").eq("id", params.id).single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to fetch disaster", details: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Disaster not found" }, { status: 404 })
    }

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

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { title, location_name, description, tags } = body

    const supabase = await getSupabaseClient()

    if (!supabase) {
      console.log("Mock disaster update - Supabase not configured")
      return NextResponse.json({
        id: params.id,
        title,
        location_name,
        description,
        tags: tags || [],
        updated_at: new Date().toISOString(),
        mock_mode: true,
      })
    }

    // Get current disaster for audit trail
    const { data: currentDisaster } = await supabase
      .from("disasters")
      .select("audit_trail")
      .eq("id", params.id)
      .single()

    const auditTrail = [
      ...(currentDisaster?.audit_trail || []),
      {
        action: "update",
        user_id: "netrunnerX", // In real app, get from auth
        timestamp: new Date().toISOString(),
        changes: { title, location_name, description, tags },
      },
    ]

    const { data, error } = await supabase
      .from("disasters")
      .update({
        title,
        location_name,
        description,
        tags: tags || [],
        audit_trail: auditTrail,
      })
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to update disaster", details: error.message }, { status: 500 })
    }

    console.log(`Disaster updated: ${data.title}`)

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

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await getSupabaseClient()

    if (!supabase) {
      console.log("Mock disaster deletion - Supabase not configured")
      return NextResponse.json({ success: true, mock_mode: true })
    }

    const { error } = await supabase.from("disasters").delete().eq("id", params.id)

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to delete disaster", details: error.message }, { status: 500 })
    }

    console.log(`Disaster deleted: ${params.id}`)

    return NextResponse.json({ success: true })
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

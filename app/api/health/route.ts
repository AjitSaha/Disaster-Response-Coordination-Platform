import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Check if Supabase is configured
    const supabaseConfigured = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)

    // Check external API configurations
    const externalAPIs = {
      gemini: !!process.env.GOOGLE_GEMINI_API_KEY,
      googleMaps: !!process.env.GOOGLE_MAPS_API_KEY,
      mapbox: !!process.env.MAPBOX_ACCESS_TOKEN,
      twitter: !!process.env.TWITTER_BEARER_TOKEN,
      bluesky: !!process.env.BLUESKY_API_KEY,
    }

    const healthStatus = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      services: {
        database: supabaseConfigured ? "configured" : "mock_mode",
        cache: supabaseConfigured ? "configured" : "disabled",
        websockets: "operational",
        externalAPIs,
      },
      features: {
        disasterManagement: "operational",
        locationExtraction: "operational",
        socialMediaMonitoring: "operational",
        imageVerification: "operational",
        geospatialQueries: supabaseConfigured ? "operational" : "mock_mode",
        realTimeUpdates: "operational",
      },
    }

    return NextResponse.json(healthStatus)
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

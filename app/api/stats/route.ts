import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Mock statistics for demonstration
    const stats = {
      disasters: {
        total: 3,
        active: 2,
        resolved: 1,
        byType: {
          flood: 1,
          "power-outage": 1,
          "building-collapse": 1,
        },
      },
      reports: {
        total: 12,
        verified: 8,
        pending: 3,
        rejected: 1,
      },
      resources: {
        total: 15,
        shelters: 4,
        medical: 3,
        supplies: 5,
        "charging-stations": 2,
        "command-centers": 1,
      },
      socialMedia: {
        postsMonitored: 156,
        highPriority: 23,
        mediumPriority: 67,
        lowPriority: 66,
      },
      coverage: {
        areas: ["Manhattan", "Brooklyn", "Queens", "Bronx"],
        activeAlerts: 5,
        lastUpdated: new Date().toISOString(),
      },
    }

    return NextResponse.json(stats)
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch statistics",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

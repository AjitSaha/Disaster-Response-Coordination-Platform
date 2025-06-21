import { type NextRequest, NextResponse } from "next/server"

// Mock Twitter API endpoint for testing
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q") || ""
  const count = Number.parseInt(searchParams.get("count") || "10")

  // Mock social media posts
  const mockPosts = [
    {
      id: "1",
      text: "#floodrelief Need food and water in Lower East Side NYC. Families stranded on 3rd floor.",
      user: { screen_name: "citizen1", name: "NYC Resident" },
      created_at: new Date().toISOString(),
      location: "Lower East Side, NYC",
    },
    {
      id: "2",
      text: "Offering shelter for 5 people in Brooklyn. DM me if you need help. #disasterrelief",
      user: { screen_name: "helper_nyc", name: "Brooklyn Helper" },
      created_at: new Date(Date.now() - 3600000).toISOString(),
      location: "Brooklyn, NYC",
    },
    {
      id: "3",
      text: "Red Cross station set up at Washington Square Park. Medical aid available. #emergency",
      user: { screen_name: "redcross_ny", name: "Red Cross NY" },
      created_at: new Date(Date.now() - 7200000).toISOString(),
      location: "Washington Square Park, NYC",
    },
    {
      id: "4",
      text: "SOS! Elderly person trapped in apartment building on 42nd Street. Need immediate help! #emergency",
      user: { screen_name: "witness123", name: "Witness" },
      created_at: new Date(Date.now() - 1800000).toISOString(),
      location: "Midtown, NYC",
    },
    {
      id: "5",
      text: "Power restored in Midtown area. Charging stations available at local community center.",
      user: { screen_name: "nyc_updates", name: "NYC Updates" },
      created_at: new Date(Date.now() - 5400000).toISOString(),
      location: "Midtown, NYC",
    },
  ]

  // Filter posts based on query
  let filteredPosts = mockPosts
  if (query) {
    filteredPosts = mockPosts.filter(
      (post) =>
        post.text.toLowerCase().includes(query.toLowerCase()) ||
        post.location.toLowerCase().includes(query.toLowerCase()),
    )
  }

  // Limit results
  const results = filteredPosts.slice(0, count)

  return NextResponse.json({
    statuses: results,
    search_metadata: {
      count: results.length,
      query,
      completed_in: 0.1,
    },
  })
}

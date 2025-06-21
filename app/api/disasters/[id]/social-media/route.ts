import { type NextRequest, NextResponse } from "next/server"

// Mock social media data for demonstration
const mockSocialMediaPosts = [
  {
    post: "#floodrelief Need food and water in Lower East Side NYC. Families stranded on 3rd floor.",
    user: "citizen1",
    timestamp: new Date().toISOString(),
    priority: "high" as const,
  },
  {
    post: "Offering shelter for 5 people in Brooklyn. DM me if you need help. #disasterrelief",
    user: "helper_nyc",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    priority: "medium" as const,
  },
  {
    post: "Red Cross station set up at Washington Square Park. Medical aid available. #emergency",
    user: "redcross_ny",
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    priority: "medium" as const,
  },
  {
    post: "SOS! Elderly person trapped in apartment building on 42nd Street. Need immediate help! #emergency",
    user: "witness123",
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    priority: "high" as const,
  },
  {
    post: "Power restored in Midtown area. Charging stations available at local community center.",
    user: "nyc_updates",
    timestamp: new Date(Date.now() - 5400000).toISOString(),
    priority: "low" as const,
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
      console.log("Using mock social media data - Supabase not configured")

      // Simple filtering based on disaster ID for mock data
      const filteredPosts = mockSocialMediaPosts.map((post) => ({
        ...post,
        timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(), // Random time within last 24h
      }))

      return NextResponse.json(filteredPosts)
    }

    const cacheKey = `social_media_${params.id}`

    // Check cache first
    const cachedData = await checkCache(supabase, cacheKey)
    if (cachedData) {
      console.log("Returning cached social media data")
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
    // 1. Use Twitter API, Bluesky API, or other social media APIs
    // 2. Search for posts containing disaster-related keywords
    // 3. Filter by location if possible
    // 4. Classify priority based on keywords (SOS, urgent, help, etc.)

    // For now, return mock data with some filtering based on disaster tags
    let filteredPosts = mockSocialMediaPosts

    // Simple keyword matching based on disaster tags
    if (disaster.tags.includes("flood")) {
      filteredPosts = mockSocialMediaPosts.filter(
        (post) =>
          post.post.toLowerCase().includes("flood") ||
          post.post.toLowerCase().includes("water") ||
          post.post.toLowerCase().includes("relief"),
      )
    }

    // Add priority classification based on keywords
    const priorityKeywords = {
      high: ["sos", "urgent", "trapped", "emergency", "help needed"],
      medium: ["need", "offering", "available", "shelter"],
      low: ["update", "restored", "information"],
    }

    const processedPosts = filteredPosts.map((post) => {
      const content = post.post.toLowerCase()
      let priority: "high" | "medium" | "low" = "low"

      if (priorityKeywords.high.some((keyword) => content.includes(keyword))) {
        priority = "high"
      } else if (priorityKeywords.medium.some((keyword) => content.includes(keyword))) {
        priority = "medium"
      }

      return { ...post, priority }
    })

    // Cache the results
    await setCache(supabase, cacheKey, processedPosts, 60) // Cache for 1 hour

    console.log(`Social media monitoring: Found ${processedPosts.length} posts for disaster ${params.id}`)

    return NextResponse.json(processedPosts)
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

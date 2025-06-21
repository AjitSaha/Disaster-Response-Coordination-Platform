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

async function verifyImageWithGemini(imageUrl: string) {
  // In a real implementation, you would use Google Gemini API for image verification
  // This is a mock implementation

  try {
    // Mock verification logic
    const mockVerificationResults = [
      { status: "verified", confidence: 0.95, reason: "Image shows consistent flood damage patterns" },
      { status: "verified", confidence: 0.87, reason: "Metadata and visual elements appear authentic" },
      { status: "rejected", confidence: 0.23, reason: "Image appears to be digitally manipulated" },
      { status: "pending", confidence: 0.65, reason: "Requires manual review - inconclusive automated analysis" },
    ]

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Return random result for demonstration
    const result = mockVerificationResults[Math.floor(Math.random() * mockVerificationResults.length)]

    console.log(`Image verification result: ${result.status} (confidence: ${result.confidence})`)

    return result
  } catch (error) {
    console.error("Gemini API error:", error)
    return { status: "pending", confidence: 0, reason: "Verification service temporarily unavailable" }
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { report_id, image_url } = body

    if (!image_url) {
      return NextResponse.json({ error: "Image URL is required" }, { status: 400 })
    }

    const supabase = await getSupabaseClient()

    // Verify the image using Gemini API
    const verificationResult = await verifyImageWithGemini(image_url)

    if (!supabase) {
      console.log("Mock image verification - Supabase not configured")
      return NextResponse.json({
        success: true,
        verification: verificationResult,
        message: "Image verification completed (mock mode)",
      })
    }

    // Update the report with verification status
    const { data, error } = await supabase
      .from("reports")
      .update({
        verification_status: verificationResult.status,
        verification_details: {
          confidence: verificationResult.confidence,
          reason: verificationResult.reason,
          verified_at: new Date().toISOString(),
        },
      })
      .eq("id", report_id)
      .eq("disaster_id", params.id)
      .select()
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json(
        { error: "Failed to update verification status", details: error.message },
        { status: 500 },
      )
    }

    console.log(`Image verified for report ${report_id}: ${verificationResult.status}`)

    return NextResponse.json({
      success: true,
      verification: verificationResult,
      report: data,
    })
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

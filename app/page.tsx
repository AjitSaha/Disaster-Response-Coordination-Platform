"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MapPin, AlertTriangle, Users, MessageSquare, ImageIcon, Globe } from "lucide-react"
import { io, type Socket } from "socket.io-client"

interface Disaster {
  id: string
  title: string
  location_name: string
  location?: { lat: number; lng: number }
  description: string
  tags: string[]
  owner_id: string
  created_at: string
  audit_trail: any[]
}

interface Report {
  id: string
  disaster_id: string
  user_id: string
  content: string
  image_url?: string
  verification_status: "pending" | "verified" | "rejected"
  created_at: string
}

interface Resource {
  id: string
  disaster_id: string
  name: string
  location_name: string
  location?: { lat: number; lng: number }
  type: string
  created_at: string
}

interface SocialMediaPost {
  post: string
  user: string
  timestamp: string
  priority?: "high" | "medium" | "low"
}

export default function DisasterResponsePlatform() {
  const [disasters, setDisasters] = useState<Disaster[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [resources, setResources] = useState<Resource[]>([])
  const [socialMedia, setSocialMedia] = useState<SocialMediaPost[]>([])
  const [officialUpdates, setOfficialUpdates] = useState<string[]>([])
  const [selectedDisaster, setSelectedDisaster] = useState<string>("")
  const [socket, setSocket] = useState<Socket | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  // Form states
  const [newDisaster, setNewDisaster] = useState({
    title: "",
    location_name: "",
    description: "",
    tags: "",
  })
  const [newReport, setNewReport] = useState({
    content: "",
    image_url: "",
  })

  useEffect(() => {
    // Initialize WebSocket connection
    const socketConnection = io()
    setSocket(socketConnection)

    // Listen for real-time updates
    socketConnection.on("disaster_updated", (data) => {
      setMessage(`Disaster updated: ${data.title}`)
      fetchDisasters()
    })

    socketConnection.on("social_media_updated", (data) => {
      setMessage("New social media reports available")
      if (selectedDisaster) {
        fetchSocialMedia(selectedDisaster)
      }
    })

    socketConnection.on("resources_updated", (data) => {
      setMessage("Resources updated")
      if (selectedDisaster) {
        fetchResources(selectedDisaster)
      }
    })

    // Initial data fetch
    fetchDisasters()

    return () => {
      socketConnection.disconnect()
    }
  }, [])

  useEffect(() => {
    if (selectedDisaster) {
      fetchReports(selectedDisaster)
      fetchResources(selectedDisaster)
      fetchSocialMedia(selectedDisaster)
      fetchOfficialUpdates(selectedDisaster)
    }
  }, [selectedDisaster])

  const fetchDisasters = async () => {
    try {
      const response = await fetch("/api/disasters")

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text()
        throw new Error(`Expected JSON, got: ${text.substring(0, 100)}...`)
      }

      const data = await response.json()

      if (data.error) {
        console.error("API returned error:", data.error)
        setMessage(`Error: ${data.error}${data.usingMockData ? " (Using mock data)" : ""}`)
      }

      setDisasters(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Error fetching disasters:", error)
      setMessage(`Failed to load disasters: ${error instanceof Error ? error.message : "Unknown error"}`)
      // Set empty array as fallback
      setDisasters([])
    }
  }

  const fetchReports = async (disasterId: string) => {
    try {
      const response = await fetch(`/api/disasters/${disasterId}/reports`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.error) {
        console.error("API returned error:", data.error)
        setMessage(`Error loading reports: ${data.error}`)
      }

      setReports(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Error fetching reports:", error)
      setMessage(`Failed to load reports: ${error instanceof Error ? error.message : "Unknown error"}`)
      setReports([])
    }
  }

  const fetchResources = async (disasterId: string) => {
    try {
      const response = await fetch(`/api/disasters/${disasterId}/resources`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.error) {
        console.error("API returned error:", data.error)
        setMessage(`Error loading resources: ${data.error}`)
      }

      setResources(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Error fetching resources:", error)
      setMessage(`Failed to load resources: ${error instanceof Error ? error.message : "Unknown error"}`)
      setResources([])
    }
  }

  const fetchSocialMedia = async (disasterId: string) => {
    try {
      const response = await fetch(`/api/disasters/${disasterId}/social-media`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.error) {
        console.error("API returned error:", data.error)
        setMessage(`Error loading social media: ${data.error}`)
      }

      setSocialMedia(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Error fetching social media:", error)
      setMessage(`Failed to load social media: ${error instanceof Error ? error.message : "Unknown error"}`)
      setSocialMedia([])
    }
  }

  const fetchOfficialUpdates = async (disasterId: string) => {
    try {
      const response = await fetch(`/api/disasters/${disasterId}/official-updates`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.error) {
        console.error("API returned error:", data.error)
        setMessage(`Error loading official updates: ${data.error}`)
      }

      setOfficialUpdates(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Error fetching official updates:", error)
      setMessage(`Failed to load official updates: ${error instanceof Error ? error.message : "Unknown error"}`)
      setOfficialUpdates([])
    }
  }

  const createDisaster = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/disasters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newDisaster,
          tags: newDisaster.tags.split(",").map((tag) => tag.trim()),
          owner_id: "netrunnerX",
        }),
      })

      if (response.ok) {
        setNewDisaster({ title: "", location_name: "", description: "", tags: "" })
        setMessage("Disaster created successfully")
        fetchDisasters()
      }
    } catch (error) {
      console.error("Error creating disaster:", error)
      setMessage("Error creating disaster")
    } finally {
      setLoading(false)
    }
  }

  const createReport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDisaster) return

    setLoading(true)

    try {
      const response = await fetch(`/api/disasters/${selectedDisaster}/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newReport,
          user_id: "citizen1",
        }),
      })

      if (response.ok) {
        setNewReport({ content: "", image_url: "" })
        setMessage("Report submitted successfully")
        fetchReports(selectedDisaster)
      }
    } catch (error) {
      console.error("Error creating report:", error)
      setMessage("Error submitting report")
    } finally {
      setLoading(false)
    }
  }

  const verifyImage = async (reportId: string, imageUrl: string) => {
    if (!selectedDisaster) return

    setLoading(true)

    try {
      const response = await fetch(`/api/disasters/${selectedDisaster}/verify-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report_id: reportId, image_url: imageUrl }),
      })

      if (response.ok) {
        setMessage("Image verification initiated")
        fetchReports(selectedDisaster)
      }
    } catch (error) {
      console.error("Error verifying image:", error)
      setMessage("Error verifying image")
    } finally {
      setLoading(false)
    }
  }

  const geocodeLocation = async (description: string) => {
    setLoading(true)

    try {
      const response = await fetch("/api/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      })

      const data = await response.json()
      setMessage(`Location extracted: ${data.location_name} (${data.coordinates.lat}, ${data.coordinates.lng})`)
    } catch (error) {
      console.error("Error geocoding:", error)
      setMessage("Error extracting location")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Disaster Response Coordination Platform</h1>
          <p className="text-gray-600">Real-time disaster management and resource coordination</p>
          {message && (
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Disaster Management */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Disaster Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={createDisaster} className="space-y-4 mb-6">
                  <Input
                    placeholder="Disaster title"
                    value={newDisaster.title}
                    onChange={(e) => setNewDisaster({ ...newDisaster, title: e.target.value })}
                    required
                  />
                  <Input
                    placeholder="Location (e.g., Manhattan, NYC)"
                    value={newDisaster.location_name}
                    onChange={(e) => setNewDisaster({ ...newDisaster, location_name: e.target.value })}
                    required
                  />
                  <Textarea
                    placeholder="Description"
                    value={newDisaster.description}
                    onChange={(e) => setNewDisaster({ ...newDisaster, description: e.target.value })}
                    required
                  />
                  <Input
                    placeholder="Tags (comma-separated)"
                    value={newDisaster.tags}
                    onChange={(e) => setNewDisaster({ ...newDisaster, tags: e.target.value })}
                  />
                  <Button type="submit" disabled={loading} className="w-full">
                    Create Disaster
                  </Button>
                </form>

                <div className="space-y-3">
                  {disasters.map((disaster) => (
                    <Card
                      key={disaster.id}
                      className={`cursor-pointer transition-colors ${
                        selectedDisaster === disaster.id ? "ring-2 ring-blue-500" : ""
                      }`}
                      onClick={() => setSelectedDisaster(disaster.id)}
                    >
                      <CardContent className="p-4">
                        <h3 className="font-semibold">{disaster.title}</h3>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {disaster.location_name}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {disaster.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            {selectedDisaster ? (
              <Tabs defaultValue="reports" className="space-y-4">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="reports">Reports</TabsTrigger>
                  <TabsTrigger value="resources">Resources</TabsTrigger>
                  <TabsTrigger value="social">Social Media</TabsTrigger>
                  <TabsTrigger value="updates">Official Updates</TabsTrigger>
                </TabsList>

                <TabsContent value="reports">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Reports & Verification
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={createReport} className="space-y-4 mb-6">
                        <Textarea
                          placeholder="Report content"
                          value={newReport.content}
                          onChange={(e) => setNewReport({ ...newReport, content: e.target.value })}
                          required
                        />
                        <Input
                          placeholder="Image URL (optional)"
                          value={newReport.image_url}
                          onChange={(e) => setNewReport({ ...newReport, image_url: e.target.value })}
                        />
                        <Button type="submit" disabled={loading}>
                          Submit Report
                        </Button>
                      </form>

                      <div className="space-y-4">
                        {reports.map((report) => (
                          <Card key={report.id}>
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start mb-2">
                                <Badge
                                  variant={
                                    report.verification_status === "verified"
                                      ? "default"
                                      : report.verification_status === "rejected"
                                        ? "destructive"
                                        : "secondary"
                                  }
                                >
                                  {report.verification_status}
                                </Badge>
                                <span className="text-xs text-gray-500">by {report.user_id}</span>
                              </div>
                              <p className="text-sm mb-2">{report.content}</p>
                              {report.image_url && (
                                <div className="flex items-center gap-2">
                                  <ImageIcon className="h-4 w-4" />
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => verifyImage(report.id, report.image_url!)}
                                    disabled={loading}
                                  >
                                    Verify Image
                                  </Button>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="resources">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Resources & Shelters
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {resources.map((resource) => (
                          <Card key={resource.id}>
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-semibold">{resource.name}</h4>
                                  <p className="text-sm text-gray-600 flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {resource.location_name}
                                  </p>
                                  <Badge variant="outline" className="mt-1">
                                    {resource.type}
                                  </Badge>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="social">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Social Media Monitoring
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {socialMedia.map((post, index) => (
                          <Card key={index}>
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start mb-2">
                                <span className="text-sm font-medium">@{post.user}</span>
                                {post.priority && (
                                  <Badge
                                    variant={
                                      post.priority === "high"
                                        ? "destructive"
                                        : post.priority === "medium"
                                          ? "default"
                                          : "secondary"
                                    }
                                  >
                                    {post.priority} priority
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm">{post.post}</p>
                              <span className="text-xs text-gray-500">{post.timestamp}</span>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="updates">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Globe className="h-5 w-5" />
                        Official Updates
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {officialUpdates.map((update, index) => (
                          <Card key={index}>
                            <CardContent className="p-4">
                              <p className="text-sm">{update}</p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <AlertTriangle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Disaster</h3>
                  <p className="text-gray-600">
                    Choose a disaster from the left panel to view reports, resources, and updates.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Geocoding Test */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Location Extraction & Geocoding Test</CardTitle>
            <CardDescription>Test the Gemini API location extraction and geocoding functionality</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Enter description with location (e.g., 'Flooding in downtown Manhattan near Times Square')"
                className="flex-1"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    geocodeLocation((e.target as HTMLInputElement).value)
                  }
                }}
              />
              <Button
                onClick={() => {
                  const input = document.querySelector('input[placeholder*="Enter description"]') as HTMLInputElement
                  if (input?.value) {
                    geocodeLocation(input.value)
                  }
                }}
                disabled={loading}
              >
                Extract Location
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

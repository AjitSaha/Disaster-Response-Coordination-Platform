# Disaster Response Coordination Platform

A comprehensive backend-heavy MERN stack application for disaster response coordination that aggregates real-time data to aid disaster management.

## Features

### Core Functionality
- **Disaster Data Management**: Full CRUD operations for disaster records with ownership and audit trails
- **Location Extraction & Geocoding**: Uses Google Gemini API to extract locations from descriptions and convert to coordinates
- **Real-Time Social Media Monitoring**: Fetches and processes social media reports with priority classification
- **Geospatial Resource Mapping**: Uses Supabase PostGIS for location-based resource queries
- **Official Updates Aggregation**: Fetches updates from government and relief websites
- **Image Verification**: Uses Google Gemini API to analyze disaster images for authenticity
- **Real-Time Updates**: WebSocket integration for live data updates

### Technical Implementation
- **Backend**: Next.js API routes with Express.js-style functionality
- **Database**: Supabase (PostgreSQL) with PostGIS for geospatial queries
- **Caching**: Supabase-based caching system with TTL support
- **Real-Time**: Socket.IO for WebSocket connections
- **External APIs**: Google Gemini, mapping services, social media APIs

## API Endpoints

### Disasters
- `GET /api/disasters` - List all disasters (supports ?tag= filter)
- `POST /api/disasters` - Create new disaster
- `PUT /api/disasters/:id` - Update disaster
- `DELETE /api/disasters/:id` - Delete disaster

### Reports & Verification
- `GET /api/disasters/:id/reports` - Get reports for disaster
- `POST /api/disasters/:id/reports` - Submit new report
- `POST /api/disasters/:id/verify-image` - Verify image authenticity

### Resources & Geospatial
- `GET /api/disasters/:id/resources` - Get resources (supports ?lat=&lon= for proximity)

### Social Media & Updates
- `GET /api/disasters/:id/social-media` - Get social media reports
- `GET /api/disasters/:id/official-updates` - Get official updates

### Utilities
- `POST /api/geocode` - Extract location from description and geocode
- `GET /api/mock-social-media` - Mock Twitter API for testing

## Database Schema

### Tables
- **disasters**: Main disaster records with geospatial location data
- **reports**: User-submitted reports with verification status
- **resources**: Available resources with geospatial coordinates
- **cache**: API response caching with expiration

### Geospatial Features
- PostGIS GEOGRAPHY columns for precise location storage
- Geospatial indexes (GIST) for fast proximity queries
- Custom function `get_nearby_resources()` for radius-based searches
- Support for ST_DWithin queries within specified distances

## Setup Instructions

### 1. Supabase Setup
1. Create a new Supabase project at https://supabase.com
2. Run the SQL scripts in the `scripts/` folder:
   - `01-create-tables.sql` - Creates tables and indexes
   - `02-seed-data.sql` - Inserts sample data
3. Copy your Supabase URL and keys to `.env.local`

### 2. Environment Variables
Copy `.env.example` to `.env.local` and fill in your API keys:

\`\`\`bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
\`\`\`

### 3. Installation & Development
\`\`\`bash
npm install
npm run dev
\`\`\`

Visit http://localhost:3000 to access the platform.

## Usage Guide

### Creating Disasters
1. Fill out the disaster form with title, location, description, and tags
2. The system automatically extracts and geocodes the location
3. Real-time updates notify connected clients

### Submitting Reports
1. Select a disaster from the list
2. Submit reports with optional image URLs
3. Use the image verification feature to check authenticity

### Monitoring Resources
1. View resources associated with each disaster
2. Use geospatial queries to find nearby resources
3. Resources are automatically mapped based on coordinates

### Real-Time Features
- WebSocket connections provide live updates
- Social media monitoring shows prioritized posts
- Official updates are cached and refreshed hourly

## Technical Architecture

### Backend Optimization
- **Caching Strategy**: Supabase-based caching with 1-hour TTL
- **Geospatial Indexes**: GIST indexes on location columns
- **Rate Limiting**: Built-in error handling for external APIs
- **Structured Logging**: Comprehensive logging for all operations

### External Integrations
- **Google Gemini API**: Location extraction and image verification
- **Mapping Services**: Support for Google Maps, Mapbox, or OpenStreetMap
- **Social Media**: Mock Twitter API with priority classification
- **Web Scraping**: Official updates from government websites

### Performance Features
- Database connection pooling
- Efficient geospatial queries using PostGIS
- Response caching for external API calls
- Optimized indexes for common query patterns

## Testing

The platform includes comprehensive testing capabilities:

### Mock Data
- Sample disasters with realistic locations
- Mock social media posts with priority classification
- Simulated official updates from relief agencies

### API Testing
- Use the frontend interface to test all endpoints
- Geocoding test interface for location extraction
- Image verification testing with mock responses

### Real-Time Testing
- WebSocket connections show live updates
- Multi-client testing supported
- Event broadcasting for disaster updates

## Deployment

### Frontend (Vercel)
\`\`\`bash
vercel --prod
\`\`\`

### Backend Considerations
- Supabase handles database hosting
- API routes deploy with the Next.js application
- WebSocket server may require separate hosting for production

## AI Tool Usage

This project was built using AI coding assistants:
- **Cursor/Windsurf**: Generated API routes, database queries, and WebSocket logic
- **AI-Generated Components**: Location extraction, geospatial queries, caching logic
- **Automated Testing**: Mock data generation and API endpoint testing

## Future Enhancements

### Bonus Features Implemented
- Priority alert system for urgent social media reports
- Keyword-based classification for report prioritization
- Interactive mapping interface for resource visualization
- Advanced caching strategy with intelligent TTL

### Potential Improvements
- Real Twitter/Bluesky API integration
- Advanced image verification with ML models
- Mobile app companion
- Multi-language support
- Advanced analytics dashboard

## Contributing

1. Fork the repository
2. Create a feature branch
3. Implement changes with proper testing
4. Submit a pull request with detailed description

## License

This project is built for educational and disaster response purposes. Please ensure proper API key management and rate limiting in production use.

---

**Built for disaster response coordination - helping communities prepare, respond, and recover together.** 🚀

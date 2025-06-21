-- Insert sample disasters with geospatial data
INSERT INTO disasters (title, location_name, location, description, tags, owner_id, audit_trail) VALUES
(
    'NYC Flood Emergency',
    'Manhattan, NYC',
    ST_SetSRID(ST_Point(-73.9712, 40.7831), 4326),
    'Heavy flooding in Manhattan due to storm surge. Multiple subway lines affected, residents in low-lying areas need evacuation assistance.',
    ARRAY['flood', 'urgent', 'evacuation'],
    'netrunnerX',
    '[{"action": "create", "user_id": "netrunnerX", "timestamp": "2025-06-18T10:00:00Z"}]'::jsonb
),
(
    'Brooklyn Power Outage',
    'Brooklyn, NYC',
    ST_SetSRID(ST_Point(-73.9442, 40.6782), 4326),
    'Widespread power outage affecting 50,000+ residents in Brooklyn. Emergency shelters needed for vulnerable populations.',
    ARRAY['power-outage', 'shelter'],
    'reliefAdmin',
    '[{"action": "create", "user_id": "reliefAdmin", "timestamp": "2025-06-18T09:30:00Z"}]'::jsonb
),
(
    'Queens Building Collapse',
    'Queens, NYC',
    ST_SetSRID(ST_Point(-73.7949, 40.7282), 4326),
    'Partial building collapse in Queens following structural damage. Search and rescue operations in progress.',
    ARRAY['building-collapse', 'search-rescue', 'urgent'],
    'netrunnerX',
    '[{"action": "create", "user_id": "netrunnerX", "timestamp": "2025-06-18T08:45:00Z"}]'::jsonb
);

-- Insert sample reports
INSERT INTO reports (disaster_id, user_id, content, image_url, verification_status) VALUES
(
    (SELECT id FROM disasters WHERE title = 'NYC Flood Emergency' LIMIT 1),
    'citizen1',
    'Water level rising rapidly on 14th Street. Need immediate evacuation assistance for elderly residents.',
    'https://example.com/flood-image-1.jpg',
    'pending'
),
(
    (SELECT id FROM disasters WHERE title = 'NYC Flood Emergency' LIMIT 1),
    'witness123',
    'Subway entrance at Union Square completely flooded. People trapped on platform.',
    'https://example.com/subway-flood.jpg',
    'verified'
),
(
    (SELECT id FROM disasters WHERE title = 'Brooklyn Power Outage' LIMIT 1),
    'brooklyn_resident',
    'No power for 6 hours. Medical equipment failing. Need generator urgently.',
    NULL,
    'verified'
),
(
    (SELECT id FROM disasters WHERE title = 'Queens Building Collapse' LIMIT 1),
    'first_responder',
    'Confirmed 3 people rescued. Still searching for 2 missing residents.',
    'https://example.com/rescue-operation.jpg',
    'verified'
);

-- Insert sample resources with geospatial data
INSERT INTO resources (disaster_id, name, location_name, location, type) VALUES
(
    (SELECT id FROM disasters WHERE title = 'NYC Flood Emergency' LIMIT 1),
    'Red Cross Emergency Shelter',
    'Washington Square Park, NYC',
    ST_SetSRID(ST_Point(-73.9973, 40.7308), 4326),
    'shelter'
),
(
    (SELECT id FROM disasters WHERE title = 'NYC Flood Emergency' LIMIT 1),
    'FEMA Distribution Center',
    'Madison Square Garden, NYC',
    ST_SetSRID(ST_Point(-73.9934, 40.7505), 4326),
    'supplies'
),
(
    (SELECT id FROM disasters WHERE title = 'Brooklyn Power Outage' LIMIT 1),
    'Brooklyn Community Center',
    'Prospect Park, Brooklyn',
    ST_SetSRID(ST_Point(-73.9690, 40.6602), 4326),
    'charging-station'
),
(
    (SELECT id FROM disasters WHERE title = 'Brooklyn Power Outage' LIMIT 1),
    'Emergency Medical Station',
    'Brooklyn Bridge Park, Brooklyn',
    ST_SetSRID(ST_Point(-73.9969, 40.7023), 4326),
    'medical'
),
(
    (SELECT id FROM disasters WHERE title = 'Queens Building Collapse' LIMIT 1),
    'Search and Rescue Command Center',
    'Queens Borough Hall, Queens',
    ST_SetSRID(ST_Point(-73.8370, 40.7489), 4326),
    'command-center'
),
(
    (SELECT id FROM disasters WHERE title = 'Queens Building Collapse' LIMIT 1),
    'Emergency Shelter',
    'Flushing Meadows Park, Queens',
    ST_SetSRID(ST_Point(-73.8448, 40.7505), 4326),
    'shelter'
);

-- Insert sample cache entries
INSERT INTO cache (key, value, expires_at) VALUES
(
    'social_media_sample',
    '[{"post": "#floodrelief Need food in NYC", "user": "citizen1", "timestamp": "2025-06-18T10:00:00Z", "priority": "high"}]'::jsonb,
    NOW() + INTERVAL '1 hour'
),
(
    'official_updates_sample',
    '["FEMA teams deployed to affected areas", "Emergency shelters operational"]'::jsonb,
    NOW() + INTERVAL '1 hour'
);

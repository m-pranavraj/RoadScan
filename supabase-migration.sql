-- Supabase SQL migration for RoadScan detections table
-- Run this in the Supabase SQL Editor if the columns below do not already exist.

-- Add geolocation columns if missing
ALTER TABLE detections ADD COLUMN IF NOT EXISTS latitude double precision;
ALTER TABLE detections ADD COLUMN IF NOT EXISTS longitude double precision;

-- Index for faster map/geo queries
CREATE INDEX IF NOT EXISTS idx_detections_coordinates
  ON detections (latitude, longitude)
  WHERE latitude IS NOT NULL;

-- Optional: human-readable location string for popup display
-- (Not required by current server code; add only if you want it)
-- ALTER TABLE detections ADD COLUMN IF NOT EXISTS location text;

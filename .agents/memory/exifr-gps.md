---
name: Exifr GPS extraction
description: How to extract GPS coordinates from EXIF in the Node.js API server
---

# Exifr GPS Extraction

**Rule:** `exifr` is an ESM-first package; use dynamic import in the CJS bundle: `const exifr = await import("exifr")`.

**Why:** Static `import Exifr from "exifr"` fails at runtime in esbuild CJS bundle.

**How to apply:**
- Call `exifr.gps(filePath)` after upload, before DB insert
- Returns `{ latitude, longitude }` or null if no GPS tag
- Store as `lat` / `lon` real columns in detections table
- Map page at `/map` fetches `/api/detections/map` which filters `WHERE lat IS NOT NULL`

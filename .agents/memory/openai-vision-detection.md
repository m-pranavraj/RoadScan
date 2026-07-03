---
name: OpenAI Vision detection
description: Real GPT-4o Vision-based detection engine replacing simulation; how it falls back gracefully
---

# OpenAI Vision Detection

**Rule:** detector.ts checks `process.env.OPENAI_API_KEY` at runtime. If set → GPT-4o Vision API call returning real bounding boxes. If not set → simulation fallback (still works, just random).

**Why:** Hackathon requirement for real AI detection; but app must still work during dev without key.

**How to apply:**
- API key goes in Secrets as `OPENAI_API_KEY`
- Camera live feed uses `/api/analyze/frame` (POST multipart, field=`frame`, no DB save)
- Image upload uses `/api/analyze/image` (POST multipart, field=`file`, saves to DB)
- Both reuse `detectWithOpenAI()` in detector.ts
- Prompt asks GPT-4o to return JSON array with className, confidence, normalized bbox

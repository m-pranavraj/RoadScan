import { Router } from "express";
import { requireAuth } from "../middlewares/auth";

const router = Router();

const VALID_MODELS = ["llama3-8b-8192", "llama-3.2-3b-preview", "mixtral-8x7b-32768"];

const ERROR_PATTERNS = [
  /ERROR:/i,
  /does not support image input/i,
  /Cannot read.*\.(png|jpg|jpeg|gif|bmp|webp)/i,
  /this model does not support/i,
];

function containsErrorText(text: string): boolean {
  return ERROR_PATTERNS.some((p) => p.test(text));
}

router.post("/chat", requireAuth, async (req, res) => {
  const { message } = req.body;
  if (!message || typeof message !== "string" || message.length > 2000) {
    res.status(400).json({ error: "Message must be a string under 2000 characters" });
    return;
  }

  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey) {
    res.status(500).json({ error: "GROQ_API_KEY not configured" });
    return;
  }

  const model = process.env.GROQ_MODEL || "llama3-8b-8192";
  if (!VALID_MODELS.includes(model)) {
    req.log.warn({ model }, "Using non-default Groq model");
  }

  const systemPrompt = "You are a helpful AI assistant for RoadScan, a pothole and litter detection app. Help users understand their scan results, explain detection categories (pothole, plastic_waste, other_litter), and guide them through onboarding. Keep responses concise (2-3 sentences).";

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        max_tokens: 256,
        temperature: 0.7,
      }),
    });

    const rawBody = await response.text();
    let data: any;
    try {
      data = JSON.parse(rawBody);
    } catch {
      req.log.error({ status: response.status, body: rawBody }, "Groq returned non-JSON");
      res.status(502).json({ error: "AI assistant temporarily unavailable" });
      return;
    }

    if (data.error) {
      req.log.error({ status: response.status, groqError: data.error }, "Groq API returned error");
      res.status(502).json({ error: "AI assistant temporarily unavailable" });
      return;
    }

    if (!response.ok || !data.choices?.[0]?.message?.content) {
      req.log.error({ status: response.status, body: rawBody }, "Groq request failed or empty reply");
      res.status(502).json({ error: "AI assistant temporarily unavailable" });
      return;
    }

    const reply = data.choices[0].message.content;

    if (containsErrorText(reply)) {
      req.log.error({ reply }, "Groq returned error text as response content");
      res.status(502).json({ error: "AI assistant temporarily unavailable" });
      return;
    }

    res.json({ reply });
  } catch (err) {
    req.log.error({ err }, "Chat request failed");
    res.status(502).json({ error: "AI assistant temporarily unavailable" });
  }
});

export default router;

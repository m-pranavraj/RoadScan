import { Router } from "express";

const router = Router();

router.post("/chat", async (req, res) => {
  const { message, userContext } = req.body;
  if (!message || typeof message !== "string") {
    res.status(400).json({ error: "Message is required" });
    return;
  }

  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey) {
    res.status(500).json({ error: "GROQ_API_KEY not configured" });
    return;
  }

  const systemPrompt = `You are a helpful AI assistant for RoadScan, a pothole and litter detection app. 
Help users understand their scan results, explain detection categories (pothole, plastic_waste, other_litter), 
and guide them through onboarding. Keep responses concise (2-3 sentences).`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify({
        model: "mixtral-8x7b-32768",
        messages: [
          { role: "system", content: systemPrompt },
          ...(userContext ? [{ role: "user", content: `My username is ${userContext.username}. I have ${userContext.scanCount || 0} scans.` }] : []),
          { role: "user", content: message },
        ],
        max_tokens: 256,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      res.status(502).json({ error: `Groq API error: ${errText}` });
      return;
    }

    const data = await response.json();
    res.json({ reply: data.choices[0].message.content });
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : "Chat request failed" });
  }
});

export default router;

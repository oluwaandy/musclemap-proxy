const express = require("express");
const cors    = require("cors");
const fetch   = require("node-fetch");

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.post("/generate-workout", async (req, res) => {
  const { muscle, equipment, nickname } = req.body;
  const apiKey = process.env.ANTHROPIC_API_KEY;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type":      "application/json",
        "x-api-key":         apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model:      "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system:     "You are a beginner fitness coach. Respond ONLY with valid JSON — no markdown, no preamble.",
        messages: [{
          role:    "user",
          content: `Create a 3-4 exercise beginner HOME workout for ${nickname || "the user"}, targeting ${muscle} with equipment: ${equipment}.\nReturn ONLY:\n{"exercises":[{"name":"Name","targetMuscle":"${muscle}","secondaryMuscles":["M1"],"sets":3,"reps":12,"tip":"Short tip under 12 words"}]}`,
        }],
      }),
    });
    const data = await response.json();
    const raw  = data.content.map(b => b.text || "").join("");
    res.json(JSON.parse(raw.replace(/```json|```/g, "").trim()));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.listen(PORT, () => console.log(`Proxy running on port ${PORT}`));

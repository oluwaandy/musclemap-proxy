const express = require("express");
const cors    = require("cors");
const fetch   = require("node-fetch");

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.post("/generate-workout", async (req, res) => {
  const { muscle, equipment, nickname } = req.body;
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    console.error("ERROR: GROQ_API_KEY is not set");
    return res.status(500).json({ error: "API key not configured" });
  }

  console.log("Generating workout for:", muscle, equipment);

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model:      "llama-3.3-70b-versatile",
        max_tokens: 1000,
        messages: [
          {
            role:    "system",
            content: `You are a fitness coach. Return ONLY a JSON object with exactly 4 exercises. No explanation, no markdown, just raw JSON.

{"exercises":[
  {"name":"Exercise 1","targetMuscle":"${muscle}","secondaryMuscles":["muscle1"],"sets":3,"reps":12,"tip":"tip under 12 words"},
  {"name":"Exercise 2","targetMuscle":"${muscle}","secondaryMuscles":["muscle1"],"sets":3,"reps":10,"tip":"tip under 12 words"},
  {"name":"Exercise 3","targetMuscle":"${muscle}","secondaryMuscles":["muscle1"],"sets":3,"reps":12,"tip":"tip under 12 words"},
  {"name":"Exercise 4","targetMuscle":"${muscle}","secondaryMuscles":["muscle1"],"sets":3,"reps":10,"tip":"tip under 12 words"}
]}

Equipment available: ${equipment}. User name: ${nickname || "the user"}. Return ONLY the JSON, nothing else.`
          },
          {
            role:    "user",
            content: `Create a 3-4 exercise beginner HOME workout for ${nickname || "the user"}, targeting ${muscle} with equipment: ${equipment}.\nReturn ONLY:\n{"exercises":[{"name":"Name","targetMuscle":"${muscle}","secondaryMuscles":["M1"],"sets":3,"reps":12,"tip":"Short tip under 12 words"}]}`
          }
        ],
      }),
    });

    const data = await response.json();
    console.log("Groq response status:", response.status);

    if (!response.ok) {
      console.error("Groq error:", JSON.stringify(data));
      return res.status(500).json({ error: data.error?.message || "Groq API error" });
    }

    const raw = data.choices[0].message.content;
    console.log("Groq raw response:", raw);
    res.json(JSON.parse(raw.replace(/```json|```/g, "").trim()));

  } catch (err) {
    console.error("Server error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.listen(PORT, () => console.log(`Proxy running on port ${PORT}`));

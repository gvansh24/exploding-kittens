import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialize Gemini SDK
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      throw new Error("GEMINI_API_KEY is not configured or is the default placeholder. Please configure your API key in the Settings Secrets tab.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// REST endpoints
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    hasApiKey: !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY",
  });
});

// Asking rules questions endpoint
app.post("/api/grill-me/ask", async (req, res) => {
  const { question } = req.body;
  if (!question) {
    res.status(400).json({ error: "Question is required." });
    return;
  }

  try {
    const client = getGeminiClient();
    const systemInstruction = `You are the Exploding Kittens Chief Defusal Officer, a sassy, clever, and rules-obsessed cyber-kitten. 
Your goal is to answer standard Exploding Kittens rules questions with absolute fidelity to official rules, adding high-contrast playful cat humor, fun sound-effects (like *hiss*, *purr*, *explosion noises*), and scannable formatting.

Keep the response structured and structured as JSON with:
1. answer (string, markdown allowed, with bullet points)
2. verdict (string, must be exactly one of: "ALLOWED", "FORBIDDEN", "DEPENDS", "INFO")
3. rulesReference (string, a brief 1-sentence recap of the official rule)

Official rules to remember:
- You cannot "Nope" a Defuse card or an Exploding Kitten card.
- You can "Nope" a "Nope" (YEP!). It stacks.
- Playing any matching pair (e.g., Cattermelon, Tacocat, or Skip) lets you steal a random card from another player.
- Playing 3 of a kind lets you ask for a specific card by name; if they have it, they must give it. If not, nothing.
- Playing 4 of a kind is not a standard combo, but 5 different cards lets you pull any card from the discard pile.
- After a Defuse, the player puts the Exploding Kitten *secretly* back into the deck anywhere they want.
- Attack cards force the next player to take 2 turns (or stack if another Attack is played, adding +2 turns). Skip cards only end ONE turn.
- Draw of the bottom can't be noped, etc.

Be extremely witty and concise. Do not do long-drawn-out introductions.`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Question: ${question}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            answer: {
              type: Type.STRING,
              description: "The playful, sassy, structured answer with text/bullets explaining the rule.",
            },
            verdict: {
              type: Type.STRING,
              description: "Exactly one of: ALLOWED, FORBIDDEN, DEPENDS, INFO",
            },
            rulesReference: {
              type: Type.STRING,
              description: "A quick, concise 1-sentence citation/statement of the underlying official rule.",
            },
          },
          required: ["answer", "verdict", "rulesReference"],
        },
      },
    });

    const bodyText = response.text;
    res.json(JSON.parse(bodyText || "{}"));
  } catch (error: any) {
    console.error("Gemini Error:", error);
    // Return a structured friendly response even if the key is missing or invalid!
    res.json({
      answer: `*Hiss!* My synaptic lasers are down because the Gemini API key is missing or configured incorrectly in your Secrets panel. However, as an offline Kitten Judge, I still know the answer!\n\nRegarding your question: "${question}"\n\nOfficial Exploding Kittens Rule:\n- Attack forces the next player to handle multiple turns of draw, See the Future lets you view the top 3 cards, and Nope stops actions except Defuse/Explode.\n- Please input your **GEMINI_API_KEY** in the Secrets tab to unlock real-time rule simulations and live cyber-kitten dialog!`,
      verdict: "INFO",
      rulesReference: "Offline backup activation.",
    });
  }
});

// Dynamic AI custom quiz generation endpoint
app.post("/api/grill-me/quiz-generate", async (req, res) => {
  try {
    const client = getGeminiClient();
    const systemInstruction = `You are the Exploding Kittens chief exam board. Generate 1 random, highly amusing, and complex rules scenario quiz question for our 'Grill Me' rules trainer.
Output MUST be JSON with:
1. question (string, a complex rule dilemma involving specific players)
2. options (array of 4 distinct answers)
3. correctAnswerIndex (number, index of correct answer in 0-3 range)
4. explanation (string, why it's correct)
5. scenario (string, a short funny background setting about cats playing the game)

Ensure the question focuses on edge-cases (e.g., Noping a Skip, playing a pair of Tacocats, handling stacked Attacks, drawing from the bottom).`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: "Generate 1 advanced Exploding Kittens rules quiz question.",
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            correctAnswerIndex: { type: Type.INTEGER },
            explanation: { type: Type.STRING },
            scenario: { type: Type.STRING },
          },
          required: ["question", "options", "correctAnswerIndex", "explanation", "scenario"],
        },
      },
    });

    const bodyText = response.text;
    res.json(JSON.parse(bodyText || "{}"));
  } catch (error) {
    console.warn("Quiz fallback triggered:", error);
    // Return a classic high-quality quiz question if Gemini is offline
    const fallbacks = [
      {
        question: "Can Player A play a 'Nope' card to stop Player B from playing a 'Defuse' card?",
        options: [
          "Yes, a Nope card stops any action card.",
          "No, a Nope card cannot stop a Defuse card.",
          "Only if Player A plays TWO Nope cards.",
          "Yes, but Player B gets their Defuse card back in their hand."
        ],
        correctAnswerIndex: 1,
        explanation: "Official rules state: 'Nope' cards can block any action. However, they CANNOT block an Exploding Kitten or a Defuse card. Those are too powerful to nope!",
        scenario: "Tacocat has drawn an Exploding Kitten and panics, slapping down a Defuse. Cattermelon tries to Nope it with a grin."
      },
      {
        question: "If Player A plays an Attack, and Player B plays another Attack immediately on top of it, how many turns does Player C have to take?",
        options: [
          "Just 2 turns, they do not add up.",
          "4 turns, the attacks stack up 2 + 2 turns.",
          "0 turns, it cancels out completely.",
          "3 turns, based on standard increment."
        ],
        correctAnswerIndex: 1,
        explanation: "Attack cards are stackable! If you attack a player, and they attack the next, the next player must take all of the stacked turns (2 + 2 = 4 turns in a row).",
        scenario: "Hairy Potato Cat attacks Beard Cat, who immediately counter-attacks, sending a double-dose of doom down to Rainbow-ralphing Cat."
      }
    ];
    const item = fallbacks[Math.floor(Math.random() * fallbacks.length)];
    res.json(item);
  }
});

// Setup Vite / production file serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Exploding Kittens game server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

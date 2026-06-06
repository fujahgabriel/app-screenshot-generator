import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

const LOCALE_NAMES: Record<string, string> = {
  en: "English", es: "Español", fr: "Français", "pt-BR": "Português (Brasil)",
  de: "Deutsch", it: "Italiano", ja: "日本語", ko: "한국어",
  "zh-CN": "简体中文", "zh-TW": "繁體中文", ar: "العربية", ru: "Русский",
  nl: "Nederlands", pl: "Polski", sv: "Svenska", da: "Dansk",
  fi: "Suomi", nb: "Norsk", tr: "Türkçe", th: "ไทย",
  vi: "Tiếng Việt", hi: "हिन्दी",
};

const PROVIDER_DEFAULTS: Record<string, { model: string; envKey: string }> = {
  google: { model: "gemini-3.5-flash", envKey: "GEMINI_API_KEY" },
  openai: { model: "gpt-5.4-mini", envKey: "OPENAI_API_KEY" },
  anthropic: { model: "claude-sonnet-4-20250514", envKey: "ANTHROPIC_API_KEY" },
  openrouter: { model: "openai/gpt-4o-mini", envKey: "OPENROUTER_API_KEY" },
};

const SYSTEM_PROMPT =
  "You are a professional App Store Optimization (ASO) copywriting expert. " +
  "Your goal is to write highly persuasive, high-impact captions for a set of 5 App Store screenshots. " +
  "First, identify the 3-5 absolute CORE benefits that will drive downloads and increase conversions. " +
  "Rules for every headline:\n" +
  "1. Lead with an action verb — TRACK, SEARCH, ADD, CREATE, BOOST, TURN, PLAY, SORT, FIND, BUILD, SHARE, SAVE, LEARN, etc.\n" +
  "2. Focus on what the USER gets, not what the app does technically.\n" +
  "3. Be specific enough to be compelling — 'TRACK TRADING CARD PRICES' not 'MANAGE YOUR COLLECTION'.\n" +
  "4. Answer the user's unspoken question: 'Why should I download this instead of scrolling past?'\n" +
  "For each screen, write a headline (3-6 words, all-caps action verb lead) " +
  "and a descriptive subtext (6-12 words) that expands on the benefit. " +
  "Avoid empty marketing fluff; be hyper-specific and engaging. Create a direct, cohesive progression across the 5 captions " +
  "ranging from initial introduction/core benefit to main features to social proof/call-to-action. " +
  "Respond ONLY with a JSON object in the following exact format: " +
  '{ "captions": [{ "headline": "...", "subtext": "...", "focus": "..." }] }';

function buildPrompt(appName: string, appDescription: string, category: string, tone: string, language: string, targetAge: string, targetGender: string, targetParent: string) {
  const ageLabels: Record<string, string> = {
    "kids-4-8": "Kids aged 4-8", "tweens-9-12": "Tweens aged 9-12", "teens-13-17": "Teens aged 13-17",
    "adults-18-24": "Adults aged 18-24", "adults-25-34": "Adults aged 25-34", "adults-35-44": "Adults aged 35-44",
    "adults-45-54": "Adults aged 45-54", "adults-55+": "Adults aged 55+", "all-ages": "All ages",
  };
  const genderLabel = targetGender === "all" ? "All genders" : targetGender === "male" ? "Male" : "Female";
  const parentLabel = targetParent === "all" ? "" : " (especially parents)";

  const audience = `${ageLabels[targetAge] || "All ages"}, ${genderLabel}${parentLabel}`;

  return `Generate a set of 5 screenshots copy.
App Name: ${appName || "Unnamed App"}
App Category: ${category}
Tone: ${tone}
Target Audience: ${audience}
Language: Write all text in ${language}.
Description about the app:
${appDescription}

Respond ONLY with valid JSON.`;
}

async function callGoogle(client: GoogleGenAI, model: string, prompt: string): Promise<any[]> {
  const response = await client.models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          captions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                headline: { type: Type.STRING },
                subtext: { type: Type.STRING },
                focus: { type: Type.STRING },
              },
              required: ["headline", "subtext", "focus"],
            },
          },
        },
        required: ["captions"],
      },
    },
  });
  const parsed = JSON.parse(response.text || "{}");
  return parsed.captions || [];
}

async function callOpenAI(apiKey: string, model: string, prompt: string, baseUrl: string): Promise<any[]> {
  const response = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${err}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenAI returned empty response");
  const parsed = JSON.parse(content);
  return parsed.captions || [];
}

async function callAnthropic(apiKey: string, model: string, prompt: string): Promise<any[]> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Anthropic API error (${response.status}): ${err}`);
  }

  const data = await response.json();
  const content = data.content?.[0]?.text;
  if (!content) throw new Error("Anthropic returned empty response");
  const parsed = JSON.parse(content);
  return parsed.captions || [];
}

// API endpoint to generate captions
app.post("/api/generate-captions", async (req: any, res: any) => {
  try {
    const { appName, appDescription, category, tone, locales, provider, model, apiKey, targetAge, targetGender, targetParent } = req.body;

    if (!appDescription) {
      return res.status(400).json({ error: "App description is required" });
    }

    const prov = provider || "google";
    const defaults = PROVIDER_DEFAULTS[prov];
    if (!defaults) {
      return res.status(400).json({ error: `Unknown provider: ${prov}. Supported: google, openai, anthropic, openrouter` });
    }

    const effectiveModel = model || defaults.model;
    const effectiveKey = apiKey || process.env[defaults.envKey] || "";

    if (!effectiveKey) {
      return res.status(400).json({
        error: `${prov} API key is not configured. Set ${defaults.envKey} in .env or provide it in the request.`,
      });
    }

    const localeList: string[] = locales && Array.isArray(locales) ? locales : ["en"];
    const localeCaptions: Record<string, any[]> = {};

    for (const locale of localeList) {
      const language = LOCALE_NAMES[locale] || locale;
      const prompt = buildPrompt(appName, appDescription, category, tone, language, targetAge, targetGender, targetParent);

      let captions: any[];

      switch (prov) {
        case "google": {
          const aiClient = new GoogleGenAI({
            apiKey: effectiveKey,
            httpOptions: { headers: { "User-Agent": "aistudio-build" } },
          });
          captions = await callGoogle(aiClient, effectiveModel, prompt);
          break;
        }
        case "openai":
          captions = await callOpenAI(effectiveKey, effectiveModel, prompt, "https://api.openai.com");
          break;
        case "openrouter":
          captions = await callOpenAI(effectiveKey, effectiveModel, prompt, "https://openrouter.ai/api");
          break;
        case "anthropic":
          captions = await callAnthropic(effectiveKey, effectiveModel, prompt);
          break;
        default:
          captions = [];
      }

      localeCaptions[locale] = captions;
    }

    res.json({ locale_captions: localeCaptions });
  } catch (error: any) {
    console.error("Caption generation failed:", error);
    res.status(500).json({ error: error.message || "Failed to generate captions" });
  }
});

// Vite middleware or static files
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
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();

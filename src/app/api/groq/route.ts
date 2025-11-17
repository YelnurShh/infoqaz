// app/api/groq/route.ts
import { NextRequest, NextResponse } from "next/server";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GOOGLE_TRANSLATE_URL = "https://translation.googleapis.com/language/translate/v2";

type Body = {
  prompt?: string; // user prompt in Kazakh
  // optional: prefered target/ source languages, etc.
};

async function translateText(text: string, target: string, source?: string) {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error("Missing GOOGLE_API_KEY");

  const url = `${GOOGLE_TRANSLATE_URL}?key=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      q: text,
      target,
      source,
      format: "text",
      // model: "nmt" // optional param historically; not needed usually
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Translate API error: ${res.status} ${txt}`);
  }

  const data = await res.json();
  // response structure: data.data.translations[0].translatedText
  const translated = data?.data?.translations?.[0]?.translatedText;
  return translated ?? "";
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;
    const userKaz = body.prompt?.trim() ?? "";
    if (!userKaz) {
      return NextResponse.json({ error: "prompt required" }, { status: 400 });
    }

    // 1) Translate user prompt (Kazakh -> English)
    const userEn = await translateText(userKaz, "en", "kk").catch(async (err) => {
      // кейде source белгілемесек автоматты анықтайды — fallback
      console.warn("Translate failed with source=kk, retrying without source:", err);
      return translateText(userKaz, "en");
    });

    // 2) Build messages for Groq (system + user) — system message in English
    const systemMessage = {
      role: "system",
      content:
        "You are a concise, accurate computer science teacher. Answer in clear English. If asked for code, provide runnable code blocks and mark language. Keep the reply friendly and not too long (aim ~200-600 words).",
    };

    const userMessage = { role: "user", content: userEn };

    // 3) Call Groq API
    const apiKey = process.env.GROQ_API_KEY;
    const model = process.env.GROQ_MODEL ?? "llama-3.1";
    if (!apiKey) return NextResponse.json({ error: "server missing GROQ_API_KEY" }, { status: 500 });

    const groqResp = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [systemMessage, userMessage],
        temperature: 0.2,
        max_tokens: 900,
      }),
    });

    if (!groqResp.ok) {
      const txt = await groqResp.text();
      return NextResponse.json({ error: "groq api error", status: groqResp.status, body: txt }, { status: 502 });
    }

    const groqData = await groqResp.json();
    const contentEn =
      groqData?.choices?.[0]?.message?.content ??
      groqData?.choices?.[0]?.text ??
      JSON.stringify(groqData);

    // 4) Translate Groq's English response back to Kazakh
    const contentKk = await translateText(contentEn, "kk", "en").catch(async (err) => {
      console.warn("Back-translation failed, returning English with warning:", err);
      return ""; // we'll fall back to returning English as well
    });

    // 5) Return both variants (useful for debugging)
    return NextResponse.json({
      ok: true,
      prompt_kz: userKaz,
      prompt_en: userEn,
      answer_en: contentEn,
      answer_kz: contentKk || null,
      raw_groq: groqData,
    });
  } catch (err: any) {
    console.error("API route error:", err);
    return NextResponse.json({ error: err.message ?? String(err) }, { status: 500 });
  }
}

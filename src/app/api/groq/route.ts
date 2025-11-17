// app/api/groq/route.ts
import { NextRequest, NextResponse } from "next/server";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GOOGLE_TRANSLATE_URL =
  "https://translation.googleapis.com/language/translate/v2";

interface RequestBody {
  prompt?: string;
}

/** Google Translate API — Text Translation */
async function translateText(
  text: string,
  target: string,
  source?: string
): Promise<string> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GOOGLE_API_KEY");
  }

  const url = `${GOOGLE_TRANSLATE_URL}?key=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      q: text,
      target,
      source,
      format: "text",
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Translate API error (${res.status}): ${txt}`);
  }

  const data = await res.json();
  const translated =
    data?.data?.translations?.[0]?.translatedText ?? "";
  return translated;
}

/** Main POST Handler */
export async function POST(req: NextRequest) {
  try {
    const body: RequestBody = await req.json();
    const userKaz = body.prompt?.trim() ?? "";

    if (!userKaz) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    // 1) Қазақ -> Ағылшын
    let userEn: string;
    try {
      userEn = await translateText(userKaz, "en", "kk");
    } catch (error) {
      console.warn("Translate (kk->en) failed, retrying without source.");
      userEn = await translateText(userKaz, "en");
    }

    // 2) Groq API запросы
    const groqKey = process.env.GROQ_API_KEY;
    const model = process.env.GROQ_MODEL ?? "llama-3.1";

    if (!groqKey) {
      return NextResponse.json(
        { error: "Missing GROQ_API_KEY" },
        { status: 500 }
      );
    }

    const systemMessage = {
      role: "system",
      content:
        "You are a concise, accurate computer science teacher. Answer in clear English with simple structure. Provide examples when helpful.",
    };

    const userMessage = {
      role: "user",
      content: userEn,
    };

    const groqResp = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${groqKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [systemMessage, userMessage],
        temperature: 0.2,
        max_tokens: 900,
      }),
    });

    if (!groqResp.ok) {
      const errorText = await groqResp.text();
      return NextResponse.json(
        {
          error: "Groq API error",
          status: groqResp.status,
          body: errorText,
        },
        { status: 502 }
      );
    }

    const groqData = await groqResp.json();
    const answerEn: string =
      groqData?.choices?.[0]?.message?.content ??
      groqData?.choices?.[0]?.text ??
      "";

    // 3) Ағылшын -> Қазақ
    let answerKz = "";
    try {
      answerKz = await translateText(answerEn, "kk", "en");
    } catch (error) {
      console.warn("Translate (en->kk) failed. Returning EN version only.");
      answerKz = "";
    }

    // 4) Return JSON
    return NextResponse.json({
      ok: true,
      prompt_kz: userKaz,
      prompt_en: userEn,
      answer_en: answerEn,
      answer_kz: answerKz || null,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown server error";
    console.error("API error:", message);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

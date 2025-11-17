// app/api/groq/route.ts
import { NextRequest, NextResponse } from "next/server";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GOOGLE_TRANSLATE_URL =
  "https://translation.googleapis.com/language/translate/v2";

interface RequestBody {
  prompt?: string;
}

/** Try parse JSON, otherwise return raw text. No 'any' used. */
async function safeJsonOrText(
  res: Response
): Promise<{ json?: unknown; text?: string }> {
  try {
    const json = await res.clone().json();
    return { json };
  } catch {
    try {
      const text = await res.clone().text();
      return { text };
    } catch {
      return {};
    }
  }
}

/** Safely traverse nested unknown object and return string if present */
function getNestedString(root: unknown, path: (string | number)[]): string | undefined {
  let cur: unknown = root;
  for (const key of path) {
    if (typeof key === "number") {
      if (!Array.isArray(cur)) return undefined;
      cur = cur[key];
    } else {
      if (cur === null || typeof cur !== "object") return undefined;
      const obj = cur as Record<string, unknown>;
      if (!(key in obj)) return undefined;
      cur = obj[key];
    }
  }
  return typeof cur === "string" ? cur : undefined;
}

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

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ q: text, target, source, format: "text" }),
  }).catch((err) => {
    throw new Error("Network error calling Google Translate: " + String(err));
  });

  if (!resp.ok) {
    const body = await safeJsonOrText(resp);
    const txt = body.text ?? (body.json ? JSON.stringify(body.json) : "");
    throw new Error(`Translate API error (${resp.status}): ${txt}`);
  }

  const body = await safeJsonOrText(resp);
  // Try to read translations[0].translatedText
  const translated = getNestedString(body.json, ["data", "translations", 0, "translatedText"]) ??
    (typeof body.text === "string" ? body.text : "");
  return translated ?? "";
}

export async function POST(req: NextRequest) {
  try {
    const bodyRaw = await req.text().catch(() => "");
    const parsed = (() => {
      try {
        return bodyRaw ? (JSON.parse(bodyRaw) as RequestBody) : {};
      } catch {
        return {};
      }
    })();

    const userKaz = (parsed.prompt ?? "").trim();

    if (!userKaz) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // 1) Қазақ -> ағылшын (robust)
    let userEn = "";
    try {
      userEn = await translateText(userKaz, "en", "kk");
      if (!userEn) {
        // fallback: try without source
        userEn = await translateText(userKaz, "en");
      }
    } catch (tErr) {
      console.warn(
        "Translate (kk->en) failed — using original kazakh as prompt. Error:",
        tErr instanceof Error ? tErr.message : String(tErr)
      );
      // fallback: use original kazakh as prompt to Groq
      userEn = userKaz;
    }

    // 2) Call Groq
    const groqKey = process.env.GROQ_API_KEY;
    const model = process.env.GROQ_MODEL ?? "llama-3.1";

    if (!groqKey) {
      return NextResponse.json({ error: "Missing GROQ_API_KEY" }, { status: 500 });
    }

    const systemMessage = {
      role: "system",
      content:
        "You are a concise, accurate computer science teacher. Answer in clear English with simple structure. Provide examples when helpful.",
    };

    const userMessage = { role: "user", content: userEn };

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
    }).catch((err) => {
      throw new Error("Network error when calling Groq: " + String(err));
    });

    if (!groqResp.ok) {
      const body = await safeJsonOrText(groqResp);
      const txt = body.text ?? (body.json ? JSON.stringify(body.json) : "");
      return NextResponse.json(
        { error: "Groq API error", status: groqResp.status, body: txt },
        { status: 502 }
      );
    }

    const groqBody = await safeJsonOrText(groqResp);
    const answerEn =
      getNestedString(groqBody.json, ["choices", 0, "message", "content"]) ??
      getNestedString(groqBody.json, ["choices", 0, "text"]) ??
      (typeof groqBody.text === "string" ? groqBody.text : "") ??
      "";

    // 3) Translate answer back to Kazakh only if answerEn exists
    let answerKz: string | null = null;
    if (answerEn) {
      try {
        answerKz = await translateText(answerEn, "kk", "en");
      } catch (tErr) {
        console.warn(
          "Translate (en->kk) failed; returning English only. Error:",
          tErr instanceof Error ? tErr.message : String(tErr)
        );
        answerKz = null;
      }
    } else {
      console.warn("Groq returned empty answerEn. Returning empty answer_kz.");
      answerKz = null;
    }

    return NextResponse.json({
      ok: true,
      prompt_kz: userKaz,
      prompt_en: userEn,
      answer_en: answerEn || null,
      answer_kz: answerKz,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("API error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

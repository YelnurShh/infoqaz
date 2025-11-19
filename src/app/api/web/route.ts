// app/api/wiki/route.ts
import { NextRequest, NextResponse } from "next/server";

/**
 * POST { query: string, lang?: string, limit?: number }
 * Returns: { ok: true, query, lang, results: Array<{ title, snippet, pageUrl, thumbnail?, extract? }> }
 */

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { query?: string; lang?: string; limit?: number };
    const q = (body?.query ?? "").trim();
    if (!q) return NextResponse.json({ error: "query required" }, { status: 400 });

    const lang = (body.lang || "kk").toLowerCase(); // default Kazakh; можно "en","ru" т.б.
    const limit = Math.max(1, Math.min(20, Number(body.limit || 5)));

    // 1) поиск: action=query&list=search
    const searchUrl = `https://${lang}.wikipedia.org/w/api.php?` +
      new URLSearchParams({
        action: "query",
        list: "search",
        srsearch: q,
        srlimit: String(limit),
        format: "json",
        origin: "*",
        utf8: "1",
      }).toString();

    const searchResp = await fetch(searchUrl, { method: "GET" });
    if (!searchResp.ok) {
      const txt = await searchResp.text().catch(() => "");
      return NextResponse.json({ error: `wikipedia search failed: ${searchResp.status}`, body: txt }, { status: 502 });
    }
    const searchJson = await safeJson(searchResp);
    const hits = (searchJson?.query?.search ?? []) as any[];

    // 2) For each hit get summary from REST API (/page/summary/{title})
    const results = await Promise.all(
      hits.map(async (h: any) => {
        const title = h.title as string;
        const pageUrl = `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`;

        // REST summary endpoint
        const sumUrl = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
        try {
          const r = await fetch(sumUrl, { method: "GET", headers: { Accept: "application/json" } });
          if (!r.ok) {
            const txt = await r.text().catch(() => "");
            return { title, pageUrl, snippet: h.snippet ?? "", extract: null, thumbnail: null, error: `summary fetch ${r.status}` };
          }
          const j = await safeJson(r);
          return {
            title,
            pageUrl,
            snippet: (h.snippet ?? "").replace(/<\/?[^>]+(>|$)/g, ""), // from search (html)
            extract: j?.extract ?? null,
            thumbnail: j?.thumbnail?.source ?? null,
          };
        } catch (err: any) {
          return { title, pageUrl, snippet: (h.snippet ?? "").replace(/<\/?[^>]+(>|$)/g, ""), extract: null, thumbnail: null, error: String(err?.message ?? err) };
        }
      })
    );

    return NextResponse.json({ ok: true, query: q, lang, results }, { status: 200 });
  } catch (err: any) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("wiki api error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

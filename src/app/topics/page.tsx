"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type AIResult = {
  kz?: string; // қазақша жауап
  en?: string; // ағылшынша жауап (debug)
};

type WikiSearchItem = {
  title: string;
  snippet: string;
  pageid: number;
};

type WikiApiResponse = {
  query?: {
    search?: WikiSearchItem[];
  };
};

const topics = [
  { id: "computer-history", title: "Компьютердің даму тарихы" },
  { id: "internet", title: "Интернеттің пайда болуы" },
  { id: "programming", title: "Бағдарламалау негіздері" },
  { id: "cybersecurity", title: "Киберқауіпсіздік" },
  { id: "ai", title: "Жасанды интеллект" },

  // ЖАҢА тақырыптар:
  { id: "info-our-world", title: "Біздің айналамыздағы ақпарат" },
  { id: "info-giving", title: "Ақпарат беру" },
  { id: "info-encryption", title: "Ақпаратты шифрлау" },
  { id: "binary-representation", title: "Екілік ақпаратты ұсыну" },
  { id: "raster-processing", title: "Растрлық суреттерді өңдеу" },
  { id: "vector-creation", title: "Векторлық суреттерді құру" },
  { id: "page-layout", title: "Қисық бетімен жұмыс" },
];

export default function TopicsPage() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<AIResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Wikipedia search state
  const [wikiQuery, setWikiQuery] = useState("");
  const [wikiLoading, setWikiLoading] = useState(false);
  const [wikiError, setWikiError] = useState<string | null>(null);
  const [wikiResults, setWikiResults] = useState<WikiSearchItem[]>([]);
  const [wikiLang, setWikiLang] = useState<"kk" | "en">("kk");

  const wikiDebounceRef = useRef<number | null>(null);

  // (TopicsPage ішінде ғана handleSearch функциясының толық нұсқасы)
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/groq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: query }),
      });

      // Лог: статус (dev үшін пайдалы)
      console.log("API status:", res.status, res.statusText);

      // raw текст ретінде аламыз (json парсинг қателерін болдырмау үшін)
      const raw = await res.text();

      if (!raw) {
        setError(`Бос жауап алынды (status ${res.status})`);
        return;
      }

      // Қауіпсіз JSON парсинг
      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch (_err) {
        const snippet = raw.length > 300 ? raw.slice(0, 300) + "…" : raw;
        setError(`Жауап JSON емес: ${snippet}`);
        return;
      }

      // parsed объект пе екенін тексереміз
      if (!parsed || typeof parsed !== "object") {
        setError(`Серверден күтілмеген жауап келді.`);
        return;
      }

      // Қазір TypeScript үшін parsed-ты нақты типке түрлендіреміз
      const obj = parsed as {
        error?: string;
        answer_kz?: string | null;
        answer_en?: string | null;
      };

      if (!res.ok || obj.error) {
        setError(obj.error ?? `Сервер қатесі (status ${res.status})`);
        return;
      }

      setResult({
        kz: obj.answer_kz ?? undefined,
        en: obj.answer_en ?? undefined,
      });
    } catch (fetchErr) {
      const message = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
      setError(`Fetch қатесі: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  // Wikipedia search function (uses MediaWiki API with origin=* to avoid CORS issues)
  const performWikiSearch = async (q: string, lang: string) => {
    if (!q.trim()) {
      setWikiResults([]);
      setWikiError(null);
      return;
    }

    setWikiLoading(true);
    setWikiError(null);

    try {
      // using "query" + "search" to get snippets
      const endpoint = `https://${lang}.wikipedia.org/w/api.php?action=query&format=json&list=search&utf8=1&srsearch=${encodeURIComponent(
        q,
      )}&srlimit=8&origin=*`;

      const res = await fetch(endpoint);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as WikiApiResponse;

      const search = data?.query?.search ?? [];
      // search already typed as WikiSearchItem[]
      const mapped: WikiSearchItem[] = search.map((item) => ({
        title: item.title,
        snippet: item.snippet,
        pageid: item.pageid,
      }));
      setWikiResults(mapped);
    } catch (err) {
      setWikiError(err instanceof Error ? err.message : String(err));
    } finally {
      setWikiLoading(false);
    }
  };

  // debounce wikiQuery
  useEffect(() => {
    if (wikiDebounceRef.current) window.clearTimeout(wikiDebounceRef.current);
    wikiDebounceRef.current = window.setTimeout(() => {
      performWikiSearch(wikiQuery, wikiLang);
    }, 400);

    return () => {
      if (wikiDebounceRef.current) window.clearTimeout(wikiDebounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wikiQuery, wikiLang]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-600 to-blue-500 text-white px-4 py-12 md:px-12 lg:px-24">
      <header className="max-w-5xl mx-auto mb-8">
        <h1 className="text-3xl md:text-5xl font-extrabold text-center mb-2 drop-shadow-sm">
          Информатика тақырыптары
          <span className="ml-2 text-3xl">💻</span>
        </h1>
        <p className="text-center text-indigo-100/90 max-w-2xl mx-auto mt-2">
          Оқушыларға арналған қысқа тақырыптар, практикумдар және AI арқылы жауап алуға болатын іздеу.
        </p>
      </header>

      {/* Тақырып блоктары */}
      <section className="max-w-5xl mx-auto mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {topics.map((topic) => (
            <Link
              key={topic.id}
              href={`/topics/${topic.id}`}
              className="group relative block bg-white/95 text-indigo-800 p-4 rounded-2xl shadow-md transform transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg md:text-xl font-semibold leading-tight">{topic.title}</h3>
                <span className="ml-2 inline-flex items-center justify-center w-9 h-9 rounded-full bg-indigo-50 text-indigo-600 font-bold text-sm">
                  →
                </span>
              </div>
              <div className="mt-3 text-sm text-indigo-600/80 opacity-0 group-hover:opacity-100 transition">
                Тақырыпты ашу үшін басыңыз
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* --- ВИКИПЕДИЯ ІЗДЕУ БЛОКЫ --- */}
      <section className="max-w-5xl mx-auto mb-8 bg-white/5 p-6 rounded-2xl shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Википедиядан іздеу</h2>
          <div className="flex items-center gap-2">
            <label className="text-sm">Тіл:</label>
            <select
              value={wikiLang}
              onChange={(e) => setWikiLang(e.target.value as "kk" | "en")}
              className="rounded-md bg-white/90 text-indigo-800 px-2 py-1 text-sm"
            >
              <option value="kk">Қазақша (kk)</option>
              <option value="en">Ағылшынша (en)</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3">
          <input
            value={wikiQuery}
            onChange={(e) => setWikiQuery(e.target.value)}
            placeholder="Википедиядан іздеу — тақырып атауын енгізіңіз..."
            className="flex-1 rounded-md px-4 py-3 text-indigo-900 bg-white/95 placeholder:text-indigo-500/60 shadow-inner"
          />
          <button
            onClick={() => performWikiSearch(wikiQuery, wikiLang)}
            className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
          >
            Іздеу
          </button>
        </div>

        <div className="mt-4">
          {wikiLoading && <div>Жүктелуде...</div>}
          {wikiError && <div className="text-red-300">Қате: {wikiError}</div>}

          {!wikiLoading && wikiResults.length === 0 && wikiQuery.trim() !== "" && !wikiError && (
            <div className="text-indigo-100/80">Нәтиже табылмады.</div>
          )}

          <ul className="mt-3 space-y-3">
            {wikiResults.map((r) => (
              <li key={r.pageid} className="bg-white/90 text-indigo-900 p-3 rounded-lg shadow-sm">
                <a href={`https://${wikiLang}.wikipedia.org/?curid=${r.pageid}`} target="_blank" rel="noreferrer" className="block">
                  <h3 className="font-semibold">{r.title}</h3>
                  <p className="text-sm mt-1" dangerouslySetInnerHTML={{ __html: r.snippet + (r.snippet.endsWith("...") ? "" : "...") }} />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* AI search form (original) */}
      <section className="max-w-5xl mx-auto mb-8 bg-white/5 p-6 rounded-2xl shadow-lg">
        <form onSubmit={handleSearch} className="flex flex-col gap-4">
          <label className="font-medium">AI арқылы сұрау жіберу</label>
          <div className="flex gap-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Сұрағыңызды жазыңыз... (мысалы: 'Екілік жүйе деген не?')"
              className="flex-1 rounded-md px-4 py-3 text-indigo-900 bg-white/95 placeholder:text-indigo-500/60 shadow-inner"
            />
            <button type="submit" className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-medium">
              Жіберу
            </button>
          </div>

          {loading && <div>AI жауап жүктелуде...</div>}
          {error && <div className="text-red-300">{error}</div>}

          {result && (
            <div className="mt-2 bg-white/90 text-indigo-900 p-4 rounded-md shadow-sm">
              {result.kz && (
                <div>
                  <h4 className="font-semibold">Қазақша жауап</h4>
                  <p className="mt-1">{result.kz}</p>
                </div>
              )}

              {result.en && (
                <div className="mt-3">
                  <h4 className="font-semibold">English (debug)</h4>
                  <pre className="mt-1 whitespace-pre-wrap text-sm">{result.en}</pre>
                </div>
              )}
            </div>
          )}
        </form>
      </section>

      <footer className="max-w-5xl mx-auto text-center text-indigo-100/70">
        <small>© {new Date().getFullYear()} InfoQaz — оқушыларға арналған білім материалы</small>
      </footer>
    </main>
  );
}

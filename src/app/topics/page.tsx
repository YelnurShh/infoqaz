// src/app/topics/page.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import Image from "next/image";

type WikiResult = {
  title: string;
  extract?: string | null;
  thumbnail?: { source?: string } | string | null;
  content_urls?: { desktop?: { page?: string } };
  error?: string | null;
};

/** Type guard: API жауап объектісі WikiApiResponse тәрізді ме */
function isWikiApiResponse(obj: unknown): obj is Record<string, unknown> {
  return !!obj && typeof obj === "object" && typeof (obj as any).title === "string";
}

/** thumbnail-дан URL алу */
function getThumbnailUrl(thumbnail: WikiResult["thumbnail"]): string | null {
  if (!thumbnail) return null;
  if (typeof thumbnail === "string") return thumbnail;
  if (typeof thumbnail === "object" && thumbnail !== null) {
    return (thumbnail as any).source ?? null;
  }
  return null;
}

const topics = [
  { id: "computer-history", title: "Компьютердің даму тарихы" },
  { id: "internet", title: "Интернеттің пайда болуы" },
  { id: "programming", title: "Бағдарламалау негіздері" },
  { id: "cybersecurity", title: "Киберқауіпсіздік" },
  { id: "ai", title: "Жасанды интеллект" },
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
  const [result, setResult] = useState<WikiResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = query.trim();
    if (!q) {
      setError("Іздеу сұрауын енгізіңіз");
      setResult(null);
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(
        `https://kk.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q)}`
      );

      if (!res.ok) {
        if (res.status === 404) {
          setError("Мақала табылмады (404). Басқа сөзбен іздеп көріңіз.");
        } else {
          setError(`Сервер қатесі: ${res.status} ${res.statusText}`);
        }
        return;
      }

      const raw: unknown = await res.json();

      if (!isWikiApiResponse(raw)) {
        setError("Серверден күтілмеген жауап келді.");
        return;
      }

      const api = raw as Record<string, unknown>;
      const title = typeof api.title === "string" ? api.title : "Тақырып";
      const extract = typeof api.extract === "string" ? api.extract : null;
      const thumbnail = api.thumbnail ?? null;
      const content_urls = typeof api.content_urls === "object" ? (api.content_urls as any) : undefined;

      if (!extract && api.type !== "disambiguation") {
        setError("Мәлімет табылмады.");
        return;
      }

      setResult({
        title,
        extract,
        thumbnail,
        content_urls,
      });
    } catch (err) {
      const msg =
        err && typeof err === "object" && "message" in err && typeof (err as any).message === "string"
          ? (err as any).message
          : String(err);
      setError(msg || "Белгісіз қате");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-600 to-blue-500 text-white px-4 py-12 md:px-12 lg:px-24">
      <header className="max-w-5xl mx-auto mb-8 text-center">
        <h1 className="text-3xl md:text-5xl font-extrabold mb-2">Информатика тақырыптары</h1>
        <p className="text-indigo-100/90 max-w-2xl mx-auto mt-2">
          Оқушыларға арналған қысқа тақырыптар мен практикумдар — ашып, оқи аласыз.
        </p>
      </header>

      <section className="max-w-5xl mx-auto mb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {topics.map((topic) => (
            <Link
              key={topic.id}
              href={`/topics/${topic.id}`}
              className="group block bg-white/95 text-indigo-800 p-5 rounded-2xl shadow-md hover:-translate-y-1 transform transition"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg md:text-xl font-semibold">{topic.title}</h3>
                <span className="ml-2 inline-flex items-center justify-center w-9 h-9 rounded-full bg-indigo-50 text-indigo-600 font-bold text-sm">→</span>
              </div>
              <p className="mt-3 text-sm text-indigo-700/90 opacity-90 group-hover:opacity-100 transition">Тақырыпты ашу үшін басыңыз</p>
            </Link>
          ))}
        </div>
      </section>

      <h2 className="text-center text-2xl font-bold mb-4">🟦 Википедиядан іздеу</h2>

      <form onSubmit={handleSearch} className="max-w-3xl mx-auto mb-6 flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Кез келген тарихи немесе IT тақырыпты іздеңіз..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 p-3 rounded-lg text-white border-2 border-white placeholder-white caret-white bg-transparent text-sm md:text-base"
        />

        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-white text-blue-700 font-bold rounded-lg shadow hover:bg-blue-100 transition text-sm md:text-base disabled:opacity-60"
        >
          {loading ? "Ізделуде..." : "🔍 Іздеу"}
        </button>
      </form>

      {error && (
        <div className="max-w-3xl mx-auto text-center bg-red-200/20 border border-red-400 text-white p-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading && (
        <div className="max-w-3xl mx-auto flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-white" />
        </div>
      )}

      {!loading && result && (
        <div className="max-w-3xl mx-auto bg-white text-black p-4 md:p-6 rounded-lg shadow">
          {getThumbnailUrl(result.thumbnail) ? (
            // Next/Image қолдансаңыз: next.config.js-ке домен қосыңыз (төменде мысал)
            <div className="w-full h-48 md:h-64 mb-4 overflow-hidden rounded">
              <Image
                src={getThumbnailUrl(result.thumbnail) as string}
                alt={result.title}
                width={1200}
                height={600}
                className="w-full h-full object-cover rounded"
              />
            </div>
          ) : null}

          <h2 className="text-lg md:text-2xl font-bold mb-2">{result.title}</h2>
          <p className="text-sm md:text-base mb-3 leading-relaxed">{result.extract ?? "Мәтін табылмады."}</p>

          {result.content_urls?.desktop?.page && (
            <a href={result.content_urls.desktop.page} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-sm md:text-base">Wikipedia бетіне өту</a>
          )}
        </div>
      )}
    </main>
  );
}

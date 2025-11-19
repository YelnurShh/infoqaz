"use client";

import Link from "next/link";
import { useState } from "react";

type WikiResult = {
  title: string;
  extract?: string | null;
  thumbnail?: { source: string } | string | null;
  content_urls?: { desktop?: { page?: string } };
  error?: string | null;
};

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

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
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

      // HTTP қателерін тексеру
      if (!res.ok) {
        if (res.status === 404) {
          setError("Мақала табылмады (404). Басқа сөзбен іздеп көріңіз.");
        } else {
          setError(`Сервер қатесі: ${res.status} ${res.statusText}`);
        }
        return;
      }

      // JSON парсинг қауіпсіздігі
      let data: any = null;
      try {
        data = await res.json();
      } catch (err) {
        setError("Сервер жауапты өңдей алмады (JSON парсинг қатесі).");
        return;
      }

      // Қарапайым тексеріс: title / extract бар ма
      if (data?.title && (data?.extract || data?.type === "disambiguation")) {
        // Wikipedia кейде "disambiguation" түрін қайтарады — сол кезде де көрсетуге болады
        setResult({
          title: data.title,
          extract: data.extract ?? null,
          thumbnail: data.thumbnail ?? null,
          content_urls: data.content_urls ?? null,
        });
      } else {
        setError("Мәлімет табылмады.");
      }
    } catch (err: any) {
      setError(err?.message ?? "Белгісіз қате");
    } finally {
      setLoading(false);
    }
  };

  // thumbnail-дан URL-ды алу (түрі әртүрлі болуы мүмкін)
  const thumbnailUrl = (t: WikiResult["thumbnail"]) => {
    if (!t) return null;
    if (typeof t === "string") return t;
    return (t as any).source ?? null;
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-600 to-blue-500 text-white px-4 py-12 md:px-12 lg:px-24">
      {/* ----------- ЖОҒАРҒЫ БӨЛІК (Тақырыптар) ----------- */}
      <header className="max-w-5xl mx-auto mb-8 text-center">
        <h1 className="text-3xl md:text-5xl font-extrabold mb-2">
          Информатика тақырыптары
        </h1>
        <p className="text-indigo-100/90 max-w-2xl mx-auto mt-2">
          Оқушыларға арналған қысқа тақырыптар мен практикумдар — ашып, оқи аласыз.
        </p>
      </header>

      {/* Topics grid */}
      <section className="max-w-5xl mx-auto mb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {topics.map((topic) => (
            <Link
              key={topic.id}
              href={`/topics/${topic.id}`}
              className="group block bg-white/95 text-indigo-800 p-5 rounded-2xl shadow-md hover:-translate-y-1 transform transition"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg md:text-xl font-semibold">
                  {topic.title}
                </h3>
                <span className="ml-2 inline-flex items-center justify-center w-9 h-9 rounded-full bg-indigo-50 text-indigo-600 font-bold text-sm">
                  →
                </span>
              </div>
              <p className="mt-3 text-sm text-indigo-700/90 opacity-90 group-hover:opacity-100 transition">
                Тақырыпты ашу үшін басыңыз
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* ----------- ВИКИПЕДИЯ ІЗДЕУ БЛОГЫ ----------- */}
      <h2 className="text-center text-2xl font-bold mb-4">🟦 Википедиядан іздеу</h2>

      {/* Search input */}
      <form
        onSubmit={handleSearch}
        className="max-w-3xl mx-auto mb-6 flex flex-col sm:flex-row gap-3"
      >
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

      {/* Қате хабар */}
      {error && (
        <div className="max-w-3xl mx-auto text-center bg-red-200/20 border border-red-400 text-white p-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Ойлану индикаторы */}
      {loading && (
        <div className="max-w-3xl mx-auto flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-white"></div>
        </div>
      )}

      {/* Нәтиже карточкасы */}
      {!loading && result && (
        <div className="max-w-3xl mx-auto bg-white text-black p-4 md:p-6 rounded-lg shadow">
          {thumbnailUrl(result.thumbnail) && (
            <div className="w-full h-48 md:h-64 mb-4 overflow-hidden rounded">
              {/* Next/Image қолдану үшін next.config.js-ке домен қосу керек.
                  Қарапайым әрі сенімді — <img> қолдандым. */}
              <img
                src={thumbnailUrl(result.thumbnail) as string}
                alt={result.title}
                className="w-full h-full object-cover rounded"
              />
            </div>
          )}

          <h2 className="text-lg md:text-2xl font-bold mb-2">{result.title}</h2>
          <p className="text-sm md:text-base mb-3 leading-relaxed">
            {result.extract ?? "Мәтін табылмады."}
          </p>

          {result.content_urls?.desktop?.page && (
            <a
              href={result.content_urls.desktop.page}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline text-sm md:text-base"
            >
              Wikipedia бетіне өту
            </a>
          )}
        </div>
      )}
    </main>
  );
}

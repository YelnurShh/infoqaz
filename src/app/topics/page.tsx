"use client";

import Link from "next/link";
import { useState } from "react";

type AIResult = {
  kz?: string; // қазақша жауап
  en?: string; // ағылшынша жауап (debug)
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
  { id: "vector-creation", title: "Векторлық суреттерді құру" },

  { id: "page-layout", title: "Қисық бетімен жұмыс" },


];

export default function TopicsPage() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<AIResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      {/* Іздеу формасы */}
      <section className="max-w-3xl mx-auto mb-8">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 items-center">
          <label htmlFor="topic-search" className="sr-only">
            Іздеу
          </label>

          <div className="flex-1 w-full">
            <input
              id="topic-search"
              type="text"
              placeholder="Информатика бойынша кез келген сұрақты жазыңыз..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-xl px-4 py-4 text-indigo-900 placeholder-indigo-500 bg-white/90 border border-white/60 focus:outline-none focus:ring-4 focus:ring-indigo-200 transition"
            />
            <p className="mt-2 text-sm text-indigo-100/80">
              AI жауаптарын қазақша аламыз — қажет болса, ағылшынша нұсқасын көруге болады.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 sm:mb-9 inline-flex items-center gap-2 px-5 py-3 bg-white text-indigo-700 font-semibold rounded-xl shadow hover:shadow-lg transition disabled:opacity-60"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 text-indigo-700"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                </svg>
                Жауап күтіліп жатыр...
              </>
            ) : (
              <>
                <span className="text-lg">🔍</span>
                <span>Сұрау</span>
              </>
            )}
          </button>
        </form>
      </section>

      {/* Қате */}
      {error && (
        <section className="max-w-3xl mx-auto mb-6">
          <div className="rounded-lg bg-red-50 text-red-900 p-4 shadow">
            <strong className="block font-semibold mb-1">Қате</strong>
            <div className="text-sm">{error}</div>
          </div>
        </section>
      )}

      {/* Нәтиже */}
      <section className="max-w-3xl mx-auto mb-12">
        {result ? (
          <article className="bg-white rounded-2xl shadow-lg p-6 text-indigo-900">
            <div className="flex items-start justify-between">
              <h3 className="font-bold text-xl md:text-2xl">Жауап</h3>
              <span className="text-sm text-indigo-600/80">AI арқылы генерацияланған</span>
            </div>

            <div className="mt-4 text-sm md:text-base leading-relaxed whitespace-pre-wrap">
              {result.kz ?? "Қазақша жауап жоқ"}
            </div>

            {result.en && (
              <details className="mt-6 text-sm">
                <summary className="cursor-pointer font-medium">Ағылшынша нұсқа (кеңейту)</summary>
                <pre className="mt-3 whitespace-pre-wrap text-xs bg-indigo-50 p-3 rounded">{result.en}</pre>
              </details>
            )}
          </article>
        ) : (
          <div className="rounded-2xl bg-white/10 border border-white/10 p-6 text-center text-indigo-100">
            <p className="text-lg font-medium">AI-дан жауап әлі алынбады</p>
            <p className="mt-2 text-sm text-indigo-100/80"> Сұрақ енгізіп, {'"'}Сұрау{'"'} батырмасын басыңыз </p>
          </div>
        )}
      </section>

      <footer className="max-w-5xl mx-auto text-center text-indigo-100/70">
        <small>© {new Date().getFullYear()} InfoQaz — оқушыларға арналған білім материалы</small>
      </footer>
    </main>
  );
}

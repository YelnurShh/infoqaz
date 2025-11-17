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
];

export default function TopicsPage() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<AIResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      const data = (await res.json()) as {
        error?: string;
        answer_kz?: string | null;
        answer_en?: string | null;
      };

      if (!res.ok || data?.error) {
        setError(data?.error ?? "Серверде қате пайда болды");
      } else {
        setResult({
          kz: data.answer_kz ?? undefined,
          en: data.answer_en ?? undefined,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Белгісіз қате";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-600 to-blue-500 text-white px-4 py-8 md:px-8">
      <h1 className="text-2xl md:text-4xl font-bold text-center mb-6">
        Информатика тақырыптары 💻
      </h1>

      {/* Тақырып блоктары */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto mb-8">
        {topics.map((topic) => (
          <Link
            key={topic.id}
            href={`/topics/${topic.id}`}
            className="block bg-white text-indigo-700 text-center font-semibold p-3 md:p-4 rounded-xl shadow-md hover:shadow-lg hover:bg-indigo-100 transition duration-200"
          >
            {topic.title}
          </Link>
        ))}
      </div>

      {/* Іздеу формасы */}
      <form
        onSubmit={handleSearch}
        className="max-w-3xl mx-auto mb-6 flex flex-col sm:flex-row gap-3"
      >
        <input
          type="text"
          placeholder="Информатика бойынша кез келген сұрақты жазыңыз..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 p-3 rounded-lg text-white border-2 border-white placeholder-white caret-white bg-transparent text-sm md:text-base"
        />

        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-white text-indigo-700 font-bold rounded-lg shadow hover:bg-indigo-100 transition text-sm md:text-base disabled:opacity-50"
        >
          {loading ? "Жауап күтіліп жатыр..." : "🔍 Сұрау"}
        </button>
      </form>

      {/* Қате */}
      {error && (
        <div className="max-w-3xl mx-auto bg-red-100 text-red-900 p-4 rounded mb-4">
          Қате: {error}
        </div>
      )}

      {/* Нәтиже */}
      {result && (
        <div className="max-w-3xl mx-auto bg-white text-black p-4 md:p-6 rounded-lg shadow">
          <h3 className="font-bold mb-2 text-lg">Жауап:</h3>

          <pre className="whitespace-pre-wrap text-sm md:text-base leading-relaxed">
            {result.kz}
          </pre>

          {/* Debug — ағылшынша нұсқа */}
          {result.en && (
            <details className="mt-4 text-gray-700">
              <summary className="cursor-pointer">Ағылшынша</summary>
              <pre className="whitespace-pre-wrap text-xs mt-2">{result.en}</pre>
            </details>
          )}
        </div>
      )}
    </main>
  );
}

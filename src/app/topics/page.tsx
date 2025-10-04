"use client";

import Link from "next/link";
import { useState } from "react";
import Image from "next/image";

// ✅ Wikipedia API нәтижесінің типі
type WikiResult = {
  title: string;
  extract: string;
  thumbnail?: { source: string };
  content_urls?: { desktop?: { page?: string } };
};

// 🧠 Информатика тақырыптары
const topics = [
  { id: "computer-history", title: "Компьютердің даму тарихы" },
  { id: "internet", title: "Интернеттің пайда болуы" },
  { id: "programming", title: "Бағдарламалау негіздері" },
  { id: "cybersecurity", title: "Киберқауіпсіздік" },
  { id: "ai", title: "Жасанды интеллект" },
];

export default function TopicsPage() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<WikiResult | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;

    try {
      const res = await fetch(
        `https://kk.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`
      );
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ title: "Қате", extract: "Ақпарат табылмады." });
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-600 to-blue-500 text-white px-4 py-8 md:px-8">
      {/* 🟦 Тақырып */}
      <h1 className="text-2xl md:text-4xl font-bold text-center mb-6">
        Информатика тақырыптары 💻
      </h1>

      {/* 📚 Статикалық тақырыптар */}
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

      {/* 🔍 Wikipedia іздеу жолағы */}
      <form
        onSubmit={handleSearch}
        className="max-w-3xl mx-auto mb-6 flex flex-col sm:flex-row gap-3"
      >
        <input
          type="text"
          placeholder="Информатика бойынша кез келген тақырыпты іздеңіз..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 p-3 rounded-lg text-white border-2 border-white placeholder-white caret-white bg-transparent text-sm md:text-base"
        />

        <button
          type="submit"
          className="flex items-center justify-center gap-2 px-4 py-2 bg-white text-indigo-700 font-bold rounded-lg shadow hover:bg-indigo-100 transition text-sm md:text-base"
        >
          🔍 Іздеу
        </button>
      </form>

      {/* 📄 Іздеу нәтижесі */}
      {result && (
        <div className="max-w-3xl mx-auto bg-white text-black p-4 md:p-6 rounded-lg shadow">
          {result.thumbnail && (
            <div className="relative w-full h-48 md:h-64 mb-4">
              <Image
                src={result.thumbnail.source}
                alt={result.title}
                fill
                className="object-cover rounded"
              />
            </div>
          )}
          <h2 className="text-lg md:text-2xl font-bold mb-2">{result.title}</h2>
          <p className="text-sm md:text-base mb-3 leading-relaxed">
            {result.extract}
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

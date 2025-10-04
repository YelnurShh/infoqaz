"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [fact, setFact] = useState<string>("");

  useEffect(() => {
    const facts = [
      "1946 жылы ENIAC — әлемдегі алғашқы электронды әмбебап компьютер құрылды.",
      "1969 жылы ARPANET желісінің негізінде қазіргі интернеттің бастамасы қаланды.",
      "1989 жылы Тим Бернерс-Ли World Wide Web жүйесін ойлап тапты.",
      "1971 жылы алғашқы электрондық хат (e-mail) жіберілді.",
      "1991 жылы Linux операциялық жүйесінің алғашқы нұсқасы шықты.",
      "2007 жылы алғашқы iPhone смартфоны жарық көріп, мобильді интернет дәуірін ашты."
    ];
    setFact(facts[Math.floor(Math.random() * facts.length)]);

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <main className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-600 to-blue-500 text-white px-4 md:px-8">
      {/* 🔹 Контент */}
      <div className="flex flex-col items-center justify-center flex-1 text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 md:mb-4 leading-tight">
          Информатика пәнін заманауи тәсілмен үйрен!
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-blue-100 max-w-2xl mb-6 md:mb-8">
          Деректер, технологиялар, викториналар және қызықты IT фактілері 🚀
        </p>

        {/* 🧠 Информатика фактісі */}
        <section className="bg-white text-indigo-800 rounded-2xl shadow-lg mt-6 md:mt-10 max-w-2xl w-full p-5 md:p-8 mx-auto">
          <h2 className="text-xl md:text-2xl font-bold mb-3">🧠 Бүгінгі IT факті</h2>
          <p className="text-base md:text-lg leading-relaxed">{fact}</p>
        </section>

        {/* 📚 Сабақтарға өту */}
        <section className="mt-6 md:mt-8">
          <Link
            href="/topics"
            className="bg-yellow-400 text-blue-900 font-semibold px-5 md:px-6 py-3 rounded-xl shadow hover:bg-yellow-300 transition text-base md:text-lg"
          >
            💻 Сабақтарға өту
          </Link>
        </section>
      </div>
    </main>
  );
}

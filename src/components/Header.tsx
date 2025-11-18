"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/auth/sign_in");
  };

  return (
    <header className="w-full bg-gradient-to-br from-indigo-600 to-blue-500 text-white py-4 shadow-md">
      <div className="relative max-w-6xl mx-auto flex justify-between items-center px-6">

        {/* Сол жақ — Logo */}
        <h1>
          <Link
            href="/"
            className="text-xl md:text-2xl font-bold hover:underline whitespace-nowrap"
          >
            ⚡︎ InfoQaz
          </Link>
        </h1>

        {/* 🔥 ОРТАДА ТҰРАТЫН МАТИН */}
        <div className="absolute left-1/2 transform -translate-x-1/2 text-center hidden md:block">
          <p className="text-sm font-medium opacity-90">
            Информатика пәнінің мұғалімі: <br />
            <span className="font-semibold">Шахарова Гүлпайна Өтегенқызы</span>
          </p>
        </div>

        {/* Оң жақ — Навигация (ПК) */}
        <nav className="hidden md:flex gap-6 items-center text-sm md:text-base">
          <Link href="/" className="hover:underline">Басты бет</Link>
          <Link href="/topics" className="hover:underline">Тақырыптар</Link>

          {!loading && !user && (
            <Link href="/auth/sign_in" className="hover:underline">
              Кіру / Тіркелу
            </Link>
          )}

          {!loading && user && (
            <Link href="/profile" className="hover:underline">
              Профиль
            </Link>
          )}
        </nav>

        {/* Мобиль мәзір батырмасы */}
        <button
          className="md:hidden flex items-center justify-center p-2 rounded hover:bg-blue-700 transition text-lg"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? "✖️" : "☰"}
        </button>
      </div>

      {/* Мобиль мәзір */}
      {menuOpen && (
        <nav className="md:hidden flex flex-col items-center bg-blue-700 py-4 space-y-3 text-base">
          <Link href="/" onClick={() => setMenuOpen(false)}>Басты бет</Link>
          <Link href="/topics" onClick={() => setMenuOpen(false)}>Тақырыптар</Link>

          {!loading && !user && (
            <Link href="/auth/sign_in" onClick={() => setMenuOpen(false)}>
              Кіру/Тіркелу
            </Link>
          )}

          {!loading && user && (
            <Link href="/profile" onClick={() => setMenuOpen(false)}>
              Профиль
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}

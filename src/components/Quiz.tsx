"use client";

import { useState } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, updateDoc, increment } from "firebase/firestore";

type Question = {
  q: string;
  options: string[];
  a: string;
};

export default function Quiz({
  questions,
  topicId: _topicId,
}: {
  questions: Question[];
  topicId: string;
}) {
  const [answers, setAnswers] = useState<string[]>(Array(questions.length).fill(""));
  const [score, setScore] = useState<number | null>(null);
  const [pointsEarned, setPointsEarned] = useState<number>(0);
  const [results, setResults] = useState<boolean[]>([]);
  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const handleFinish = async () => {
    const user = auth.currentUser;
    if (!user) {
      setErrorMsg("Тестті аяқтау үшін алдымен жүйеге кіріңіз ✅");
      return;
    }

    let correct = 0;
    const res: boolean[] = [];

    questions.forEach((q, i) => {
      if (answers[i] === q.a) {
        correct++;
        res.push(true);
      } else {
        res.push(false);
      }
    });

    const pointsToAdd = correct * 10;
    setScore(correct);
    setResults(res);
    setPointsEarned(pointsToAdd);

    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        points: increment(pointsToAdd),
      });
      setSaved(true);
    } catch (error) {
      console.error("Ұпайды сақтау кезінде қате:", error);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <h2 className="text-xl font-bold mb-4">📝 Тест</h2>

      {questions.map((q, i) => (
        <div
          key={i}
          className={`mb-6 p-3 rounded-lg ${
            results.length > 0
              ? results[i]
                ? "bg-green-100 border border-green-400"
                : "bg-red-100 border border-red-400"
              : "bg-gray-50"
          }`}
        >
          <p className="font-medium">{i + 1}. {q.q}</p>
          <div className="mt-2 space-y-2">
            {q.options.map((opt, j) => (
              <label key={j} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={`q-${i}`}
                  value={opt}
                  checked={answers[i] === opt}
                  onChange={() => {
                    const newAnswers = [...answers];
                    newAnswers[i] = opt;
                    setAnswers(newAnswers);
                  }}
                />
                {opt}
              </label>
            ))}
          </div>

          {results.length > 0 && !results[i] && (
            <p className="mt-2 text-sm text-red-700">
              ❌ Дұрыс жауап: <b>{q.a}</b>
            </p>
          )}
        </div>
      ))}

      {/* ✅ Аяқтау батырмасы */}
      <button
        onClick={handleFinish}
        disabled={score !== null}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
      >
        ✅ Аяқтау
      </button>

      {/* 📢 Қате немесе ескерту */}
      {errorMsg && (
        <p className="mt-3 text-red-600 font-medium">{errorMsg}</p>
      )}

      {score !== null && (
        <div className="mt-4 font-bold space-y-2">
          <p>Сіздің нәтижеңіз: {score}/{questions.length} сұрақ ✅</p>
          <p>Жиналған ұпай: {pointsEarned} 🏅</p>
        </div>
      )}

      {saved && (
        <p className="mt-2 text-green-600 font-medium">
          ✅ Ұпай сәтті профильге қосылды!
        </p>
      )}
    </div>
  );
}

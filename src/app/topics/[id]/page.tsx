// src/app/topics/[id]/page.tsx
import { topicsData } from "@/data/topics";
import Quiz from "@/components/Quiz";
import React from "react";

export function generateStaticParams() {
  return Object.keys(topicsData).map((id) => ({ id } as { id: keyof typeof topicsData }));
}

// ⚠️ Бетті async қыламыз және params-ты await етеміз
export default async function TopicDetailPage({
  params,
}: {
  params: Promise<{ id: keyof typeof topicsData }>;
}) {
  // Important: await params before using
  const { id } = await params;
  const topic = topicsData[id];

  if (!topic) {
    return <p className="text-center p-10">Тақырып табылмады 😢</p>;
  }

  // Егер topic.video бос/undefined/null болса, iframe шығармаймыз
  const videoSrc: string | undefined =
    typeof topic.video === "string" && topic.video.trim() !== "" ? topic.video : undefined;

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 text-gray-900 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-4 text-blue-800">{topic.title}</h1>
        <p className="mb-6 text-lg text-gray-700">{topic.description}</p>

        {videoSrc ? (
          <iframe
            width="100%"
            height="400"
            src={videoSrc}
            title={topic.title}
            className="w-full rounded-xl shadow-lg mb-8"
            allowFullScreen
          />
        ) : null}

        <Quiz questions={topic.questions} topicId={id} />
      </div>
    </main>
  );
}

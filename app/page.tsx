"use client";

import { useEffect, useState } from "react";
import DefaultPlayPage from "./play/FreeResponseMode";
import MultipleChoicePlayPage from "./play/MultipleChoiceMode";

export default function TriviaHomePage() {
  const [mode, setMode] = useState<"regular" | "multiple-choice">("multiple-choice");
  const [questionCount, setQuestionCount] = useState<number | null>(null);
  const [loadingCount, setLoadingCount] = useState(true);

  // Fetch question count
  const fetchQuestionCount = async () => {
    setLoadingCount(true);
    try {
      const res = await fetch("/api/trivia_questions/count");
      if (!res.ok) throw new Error("Failed to fetch question count");
      const data = await res.json();
      setQuestionCount(data.count);
    } catch (err: any) {
      console.error("Failed to get count:", err);
    } finally {
      setLoadingCount(false);
    }
  };

  useEffect(() => {
    fetchQuestionCount();
  }, []);

  const renderMode = () => {
    switch (mode) {
      case "regular":
        return <DefaultPlayPage />;
      default:
        return <MultipleChoicePlayPage />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col p-4 sm:p-6">
      {/* Top Controls: Left spacer | Center question count | Right buttons */}
      <div className="flex items-center justify-between mb-6 flex-wrap sm:flex-nowrap gap-4 select-none">
        {/* Left spacer */}
        <div className="flex-1"></div>

        {/* Question Count */}
        <div className="flex flex-col items-center text-center bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl shadow-md px-4 py-2">
          <span className="text-gray-500 text-xs">Total Questions</span>
          {loadingCount ? (
            <span className="text-blue-600 font-bold text-lg animate-pulse">Counting...</span>
          ) : (
            <span className="text-blue-600 font-bold text-lg">{questionCount}</span>
          )}
        </div>

        {/* Mode Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button
            onClick={() => setMode("multiple-choice")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm
              ${
                mode === "multiple-choice"
                  ? "bg-blue-600 text-white shadow-lg scale-105"
                  : "bg-white text-gray-800 hover:bg-gray-100 hover:scale-105"
              }`}>
            Multiple Choice
          </button>
          <button
            onClick={() => setMode("regular")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm
              ${
                mode === "regular"
                  ? "bg-blue-600 text-white shadow-lg scale-105"
                  : "bg-white text-gray-800 hover:bg-gray-100 hover:scale-105"
              }`}>
            Free Response
          </button>
        </div>
      </div>

      {/* Game Container */}
      <div className="flex-1 flex justify-center items-start">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-md p-6 border border-gray-200">{renderMode()}</div>
      </div>
    </div>
  );
}

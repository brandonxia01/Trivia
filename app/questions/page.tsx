"use client";

import { useEffect, useState } from "react";
import { Question } from "../api/trivia_questions/QuestionsDb";

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchQuestions() {
      try {
        const res = await fetch("/api/trivia_questions"); // adjust API route if needed
        if (!res.ok) {
          throw new Error("Failed to fetch questions");
        }
        const data: Question[] = await res.json();
        setQuestions(data);
      } catch (err: any) {
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchQuestions();
  }, []);

  if (loading) return <div className="p-4 text-center">Loading questions...</div>;
  if (error) return <div className="p-4 text-center text-red-500">{error}</div>;
// create a new question on a nother page
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Trivia Questions</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-2 text-left">ID</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Question</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Answer</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Multiple Choice</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Verse References</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Difficulty</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Attempts</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Correct Attempts</th>
            </tr>
          </thead>
          <tbody>
            {questions.map((q) => (
              <tr key={q.id} className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-2">{q.id}</td>
                <td className="border border-gray-300 px-4 py-2">{q.question}</td>
                <td className="border border-gray-300 px-4 py-2">{q.answer}</td>
                <td className="border border-gray-300 px-4 py-2">
                  {q.multiple_choice_answers.length > 0
                    ? q.multiple_choice_answers.map((item) => item.options.join(", ")).join(" | ")
                    : "—"}
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  {q.verse_references.length > 0 ? q.verse_references.join(", ") : "—"}
                </td>
                <td className="border border-gray-300 px-4 py-2">{q.difficulty}</td>
                <td className="border border-gray-300 px-4 py-2">{q.attempts}</td>
                <td className="border border-gray-300 px-4 py-2">{q.correct_attempts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

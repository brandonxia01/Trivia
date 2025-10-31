"use client";

import { useEffect, useState } from "react";
import { Question } from "./api/trivia_questions/QuestionsDb";

export default function Home() {
  const [question, setQuestion] = useState<Question | null>(null);
  const [answerInput, setAnswerInput] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRandomQuestion() {
      try {
        const res = await fetch("/api/trivia_questions/random"); // adjust API route
        if (!res.ok) throw new Error("Failed to fetch question");
        const data: Question = await res.json();
        setQuestion(data);
      } catch (err: any) {
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchRandomQuestion();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question) return;

    const isCorrect = answerInput.trim().toLowerCase() === question.answer.trim().toLowerCase();
    setFeedback(isCorrect ? "Correct!" : `Incorrect. The correct answer is: ${question.answer}`);
  };

  if (loading) return <div className="p-4 text-center">Loading question...</div>;
  if (error) return <div className="p-4 text-center text-red-500">{error}</div>;
  if (!question) return <div className="p-4 text-center">No question found.</div>;

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Trivia Question</h1>

      <div className="bg-gray-50 p-4 rounded border border-gray-300">
        <p className="mb-4 font-medium">{question.question}</p>

        {question.multiple_choice_answers.length > 0 && (
          <ul className="mb-4 space-y-2">
            {question.multiple_choice_answers[0].options.map((opt) => (
              <li
                key={opt}
                className="px-3 py-1 border rounded bg-white hover:bg-gray-100 cursor-pointer"
                onClick={() => setAnswerInput(opt)}
              >
                {opt}
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={handleSubmit} className="space-y-2">
          <input
            type="text"
            placeholder="Your answer"
            value={answerInput}
            onChange={(e) => setAnswerInput(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2"
            required
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Submit Answer
          </button>
        </form>

        {feedback && <p className="mt-4 font-medium">{feedback}</p>}
      </div>
    </div>
  );
}


// export default function Home() {
//   return (
//     <div className="flex min-h-screen items-center justify-center font-serif">
//       <main className="flex min-h-screen w-full flex-col items-center justify-between py-32 px-16 sm:items-start">
//         <div>
//           Hey there
//           {/* Question introduction —
//           1. Query database for a random question, display it
//           2. Have text field for answers, skip or show answer button
//           3. "close enough" checker
//           4. Pencil button for suggest feedback or error.
//           5. Feedback/update page
//           6. have a default question
//           7. Once they get it right or wrong rate the difficulty
//           8. Maybe other game mode.
//           */}
//         </div>
//       </main>
//     </div>
//   );
// }

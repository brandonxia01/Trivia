"use client";

import { useEffect, useState } from "react";
import { Question } from "./api/trivia_questions/QuestionsDb";

export default function RandomQuestionPage() {
  const [question, setQuestion] = useState<Question | null>(null);
  const [answerInput, setAnswerInput] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [upvotes, setUpvotes] = useState<number>(0);
  const [downvotes, setDownvotes] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<string>("");

  useEffect(() => {
    async function fetchRandomQuestion() {
      try {
        const res = await fetch("/api/trivia_questions/random");
        if (!res.ok) throw new Error("Failed to fetch question");
        const data: Question = await res.json();
        setQuestion(data);
        setUpvotes(data.upvotes ?? 0);
        setDownvotes(data.downvotes ?? 0);
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
    setFeedback(isCorrect ? "✅ Correct!" : `❌ Incorrect. Correct answer: ${question.answer}`);
  };

  const handleUpvote = () => {
    setUpvotes((prev) => prev + 1);
    // TODO: call API to persist vote
  };

  const handleDownvote = () => {
    setDownvotes((prev) => prev + 1);
    // TODO: call API to persist vote
  };

  const handleSuggestEdit = () => {
    // TODO: navigate to edit page or open modal
    alert("Suggest edit feature coming soon!");
  };

  if (loading) return <div className="p-4 text-center">Loading question...</div>;
  if (error) return <div className="p-4 text-center text-red-500">{error}</div>;
  if (!question) return <div className="p-4 text-center">No question found.</div>;

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-center">Trivia Question</h1>

      <div className="bg-white p-6 rounded-xl shadow border border-gray-200 space-y-4">
        <p className="text-lg font-medium">{question.question}</p>

        {/* Multiple Choice */}
        {question.multiple_choice_answers.length > 0 && (
          <ul className="grid grid-cols-1 gap-2 mb-4">
            {question.multiple_choice_answers[0].options.map((opt) => (
              <li
                key={opt}
                className={`px-3 py-2 border rounded cursor-pointer text-center transition 
                  ${
                    selectedOption === opt
                      ? "bg-blue-200 border-blue-400 font-semibold"
                      : "bg-gray-50 hover:bg-gray-100"
                  }`}
                onClick={() => {
                  setAnswerInput(opt);
                  setSelectedOption(opt);
                }}>
                {opt}
              </li>
            ))}
          </ul>
        )}

        {/* Answer Input */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <input
            type="text"
            placeholder="Your answer"
            value={answerInput}
            onChange={(e) => {
              setAnswerInput(e.target.value);
              setSelectedOption(""); // clear highlight if typed manually
            }}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            required
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition font-semibold">
            Reveal Answer
          </button>
        </form>

        {feedback && <p className="mt-2 font-medium text-center">{feedback}</p>}

        {/* Votes & Actions */}
        <div className="flex justify-between items-center mt-4">
          <div className="flex gap-4">
            <button
              onClick={handleUpvote}
              className="flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200 transition">
              ▲ {upvotes}
            </button>
            <button
              onClick={handleDownvote}
              className="flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200 transition">
              ▼ {downvotes}
            </button>
          </div>
          <button
            onClick={handleSuggestEdit}
            className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded hover:bg-yellow-200 transition">
            Suggest Edit
          </button>
        </div>
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

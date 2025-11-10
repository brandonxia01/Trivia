"use client";

import { useEffect, useState } from "react";
import { Question } from "./api/trivia_questions/QuestionsDb";
import { bibleBookTags, getBooksForTag } from "./utils/BibleBookTags";
import BibleVerseSelector from "./components/BibleVerseSelector";
import { isSimilarAnswer } from "./utils/Strings";

export default function RandomQuestionPage() {
  const [question, setQuestion] = useState<Question | null>(null);
  const [answerInput, setAnswerInput] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingAnswer, setLoadingAnswer] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<string>("");

  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [minDifficulty, setMinDifficulty] = useState(1);
  const [maxDifficulty, setMaxDifficulty] = useState(10);
  const [showFilters, setShowFilters] = useState(false);

  // --- Suggest Edit States ---
  const [showSuggestEdit, setShowSuggestEdit] = useState(false);
  const [editValues, setEditValues] = useState({
    question: "",
    answer: "",
    multiple_choice: [] as string[],
    verse_references: [] as string[],
    difficulty: 1,
  });
  const [submittingEdit, setSubmittingEdit] = useState(false);

  const fetchRandomQuestion = async () => {
    setLoading(true);
    setFeedback(null);
    setAnswerInput("");
    setSelectedOption("");
    try {
      const books = selectedTags.flatMap(getBooksForTag);
      const res = await fetch("/api/trivia_questions/random", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ books, minDifficulty, maxDifficulty }),
      });

      if (!res.ok) throw new Error("Failed to fetch question");
      const data: Question = await res.json();
      setQuestion(data);
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRandomQuestion();
  }, []);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question || feedback) return;

    let isCorrect = false;

    try {
      if (answerInput.trim()) {
        setLoadingAnswer(true); // start loading

        // Only call the similarity API if the input is non-empty
        const similarityRes = await fetch("/api/similar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userInput: answerInput.trim(),
            correctAnswer: question.answer,
          }),
        });

        if (!similarityRes.ok) {
          console.error("Similarity API failed:", await similarityRes.text());
          setFeedback("⚠️ Error checking your answer. Try again.");
          return;
        }

        const similarityData = await similarityRes.json();
        isCorrect = similarityData.similar;
      } else {
        // Empty input, automatically treat as incorrect
        isCorrect = false;
      }

      // Show feedback
      setLoadingAnswer(false); // stop loading
      setFeedback(isCorrect ? `✅ Correct! ${question.answer}` : `❌ Incorrect: ${question.answer}`);

      // Record the attempt
      await fetch("/api/trivia_questions/answered", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: question.id,
          correct: isCorrect,
        }),
      });
    } catch (err) {
      console.error("Error submitting answer:", err);
      setFeedback("⚠️ Error submitting your answer. Try again.");
    } finally {
      setLoadingAnswer(false); // stop loading
    }
  };

  const handleNewQuestion = () => fetchRandomQuestion();

  // --- Suggest Edit Handlers ---
  const openSuggestEdit = () => {
    if (!question) return;
    setEditValues({
      question: question.question,
      answer: question.answer,
      multiple_choice: question.multiple_choice_answers[0]?.options || [],
      verse_references: question.verse_references,
      difficulty: question.difficulty,
    });
    setShowSuggestEdit(true);
  };

  const handleEditChange = (field: string, value: any) => {
    setEditValues((prev) => ({ ...prev, [field]: value }));
  };

  const submitSuggestedEdit = async () => {
    if (!question) return;
    setSubmittingEdit(true);
    try {
      const payload = {
        question_id: question.id,
        question: editValues.question,
        answer: editValues.answer,
        multiple_choice_answers: editValues.multiple_choice.length
          ? [{ options: editValues.multiple_choice, correct: editValues.answer }]
          : [],
        verse_references: editValues.verse_references,
        difficulty: editValues.difficulty,
        attempts: question.attempts,
        correct_attempts: question.correct_attempts,
        upvotes: question.upvotes,
        downvotes: question.downvotes,
        verified: false,
      };

      const res = await fetch("/api/trivia_questions/suggested_edits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to submit suggested edit");
      setShowSuggestEdit(false);
      alert("✅ Suggested edit submitted!");
    } catch (err: any) {
      alert(`Failed to submit edit: ${err.message}`);
    } finally {
      setSubmittingEdit(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-center">Random Question:</h1>

      {/* Filter toggle button */}
      <div className="flex justify-end mb-2 space-x-2">
        <button
          onClick={() => setShowFilters((prev) => !prev)}
          className="text-gray-600 hover:text-gray-800 text-sm px-2 py-1 rounded transition">
          {showFilters ? "Hide Filters" : "Show Filters"}
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-gray-50 p-4 rounded-xl shadow space-y-4 mt-2 transition-all">
          <div>
            <div className="text-center pb-4">
              <h1 className="text-2xl font-bold text-gray-800">Question Filters</h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <h2 className="font-semibold mb-2">Book Tags:</h2>
              {bibleBookTags.map((tag) => (
                <button
                  key={tag.label}
                  onClick={() => toggleTag(tag.label)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                    selectedTags.includes(tag.label)
                      ? "bg-blue-600 text-white"
                      : "bg-blue-100 text-blue-800 hover:bg-blue-200"
                  }`}>
                  {tag.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-4 items-center flex-wrap">
            <label className="flex-1 min-w-[120px]">
              Min Difficulty:
              <input
                type="number"
                min={1}
                max={10}
                value={minDifficulty}
                onChange={(e) => setMinDifficulty(Number(e.target.value))}
                className="ml-2 border rounded px-2 py-1 w-16"
              />
            </label>
            <label className="flex-1 min-w-[120px]">
              Max Difficulty:
              <input
                type="number"
                min={1}
                max={10}
                value={maxDifficulty}
                onChange={(e) => setMaxDifficulty(Number(e.target.value))}
                className="ml-2 border rounded px-2 py-1 w-16"
              />
            </label>

            <div className="flex gap-2 flex-wrap">
              <button
                onClick={handleNewQuestion}
                className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition font-semibold">
                New Question
              </button>
              <button
                onClick={() => {
                  setSelectedTags([]);
                  setMinDifficulty(1);
                  setMaxDifficulty(10);
                }}
                className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 transition font-semibold">
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Question Card */}
      {loading ? (
        <div className="p-4 text-center">Loading question...</div>
      ) : error ? (
        <div className="p-4 text-center text-red-500">{error}</div>
      ) : !question ? (
        <div className="p-4 text-center">No question found.</div>
      ) : (
        <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
          <p className="text-lg font-medium">{question.question}</p>
          <p className="text-md font-medium text-gray-500">{`Difficulty: ${question.difficulty}`}</p>

          {/* Multiple Choice */}
          {question.multiple_choice_answers.length > 0 && (
            <ul className="grid grid-cols-1 gap-2 mb-4">
              {question.multiple_choice_answers[0].options.map((opt) => (
                <li
                  key={opt}
                  className={`px-3 py-2 border rounded cursor-pointer text-center transition ${
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
                setSelectedOption("");
              }}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              disabled={loadingAnswer} // optionally disable input while checking
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition font-semibold"
              disabled={loadingAnswer} // disable button while checking
            >
              {loadingAnswer ? "Checking your answer..." : "Reveal Answer"}
            </button>
          </form>

          {feedback && (
            <div className="mt-6 text-center">
              <p className="text-lg font-medium">{feedback}</p>
              {feedback.startsWith("❌") && (
                <p className="text-sm text-gray-500 mt-2 italic">
                  (Note: The app checks if your answer is close enough, so it’s possible your answer is still correct
                  but worded differently.)
                </p>
              )}
              {question?.verse_references?.length > 0 && (
                <div className="mt-3 text-gray-700">
                  <p className="font-semibold mb-1">📖 Verse References:</p>
                  <ul className="list-none space-y-1">
                    {question.verse_references.map((ref, i) => (
                      <li key={i}>{ref}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Votes & Actions */}
          <div className="flex items-center mt-4">
            {/* Left placeholder to balance the center */}
            <div className="flex-1"></div>

            {/* Center button */}
            <div>
              <button
                onClick={handleNewQuestion}
                className="bg-green-100 text-green-800 px-3 py-1 rounded hover:bg-green-200 transition font-semibold">
                Next Question
              </button>
            </div>

            {/* Right button */}
            <div className="flex-1 flex justify-end">
              <button
                onClick={openSuggestEdit}
                className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded hover:bg-yellow-200 transition">
                Suggest Edit
              </button>
            </div>
          </div>

          {/* Suggest Edit Form */}
          {showSuggestEdit && (
            <div className="bg-gray-50 p-4 rounded-xl shadow mt-4 space-y-2 border border-gray-200">
              <h2 className="font-semibold text-lg mb-2">Suggest an Edit</h2>

              <input
                type="text"
                placeholder="Question"
                value={editValues.question}
                onChange={(e) => handleEditChange("question", e.target.value)}
                className="w-full border rounded px-2 py-1"
              />
              <input
                type="text"
                placeholder="Answer"
                value={editValues.answer}
                onChange={(e) => handleEditChange("answer", e.target.value)}
                className="w-full border rounded px-2 py-1"
              />
              <input
                type="text"
                placeholder="Multiple Choice Options (comma separated)"
                value={editValues.multiple_choice.join(", ")}
                onChange={(e) =>
                  handleEditChange(
                    "multiple_choice",
                    e.target.value.split(",").map((s) => s.trim())
                  )
                }
                className="w-full border rounded px-2 py-1"
              />

              {/* Replace verse references input with BibleVerseSelector */}
              <BibleVerseSelector
                selectedVerses={editValues.verse_references}
                onChange={(verses) => handleEditChange("verse_references", verses)}
              />
              <div className="flex items-center">
                <p className="pr-2">Difficulty:</p>
                <input
                  type="number"
                  min={1}
                  max={10}
                  placeholder="Difficulty"
                  value={editValues.difficulty}
                  onChange={(e) => handleEditChange("difficulty", Number(e.target.value))}
                  className="w-20 border rounded px-2 py-1"
                />
              </div>

              <div className="flex gap-2 mt-2">
                <button
                  onClick={submitSuggestedEdit}
                  disabled={submittingEdit}
                  className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition font-semibold">
                  Submit
                </button>
                <button
                  onClick={() => setShowSuggestEdit(false)}
                  disabled={submittingEdit}
                  className="bg-gray-300 text-gray-700 px-3 py-1 rounded hover:bg-gray-400 transition font-semibold">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

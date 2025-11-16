"use client";

import { useEffect, useState } from "react";
import { Question } from "../api/trivia_questions/QuestionsDb";
import { bibleBookTags, getBooksForTag } from "../utils/BibleBookTags";
import BibleVerseSelector from "../components/BibleVerseSelector";
import toast from "react-hot-toast";

export default function DefaultPlayPage() {
  const [question, setQuestion] = useState<Question | null>(null);
  const [answerInput, setAnswerInput] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingAnswer, setLoadingAnswer] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<string>("");

  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [minDifficulty, setMinDifficulty] = useState(1);
  const [maxDifficulty, setMaxDifficulty] = useState(7);
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
    setError("");
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
      toast.success("Suggested edit submitted!");
    } catch (err: any) {
      toast.error(`Failed to submit edit: ${err.message}`);
    } finally {
      setSubmittingEdit(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6 mb-40">
      <h1 className="text-2xl md:text-3xl font-semibold text-center text-gray-800">Welcome To Bible Trivia</h1>
      <h1 className="text-xl md:text-2xl font-semibold text-center text-gray-800">Free Response Mode</h1>
      {/* Filter toggle button */}
      <div className="flex justify-end mb-3">
        <button
          onClick={() => setShowFilters((prev) => !prev)}
          className="flex items-center gap-2 text-gray-700 hover:text-gray-900 text-sm px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition">
          {showFilters ? (
            <>
              <span>Hide Filters</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </>
          ) : (
            <>
              <span>Show Filters</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </>
          )}
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white p-6 rounded-2xl shadow-md space-y-6 mt-2 border border-gray-200 transition-all">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-xl font-bold text-gray-800">Question Filters</h1>
          </div>

          {/* Book Tags */}
          <div>
            <h2 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
              Book Tags
              <span className="text-xs text-gray-500 font-normal">(Tap to filter)</span>
            </h2>

            <div className="flex flex-wrap gap-2">
              {bibleBookTags.map((tag) => {
                const isSelected = selectedTags.includes(tag.label);
                return (
                  <button
                    key={tag.label}
                    onClick={() => toggleTag(tag.label)}
                    className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-all duration-150
            backdrop-blur-sm border ${
              isSelected
                ? "bg-blue-600 text-white border-blue-600 shadow-md hover:brightness-110"
                : "bg-blue-50/60 text-blue-800 border-blue-200 hover:bg-blue-100"
            }`}>
                    {tag.label}
                    {isSelected && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="inline-block w-3.5 h-3.5 ml-1 text-white opacity-80"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Difficulty Filter */}
          <div>
            <h2 className="font-semibold text-gray-700 mb-3">Difficulty</h2>

            <div className="flex items-center justify-between gap-1 sm:gap-2 select-none">
              {[...Array(10)].map((_, i) => {
                const level = i + 1;
                const isSelected = level >= minDifficulty && level <= maxDifficulty;

                // Softer, more balanced color gradient based on intensity
                const intensityColors = [
                  "from-blue-200 to-blue-300",
                  "from-sky-200 to-sky-300",
                  "from-teal-200 to-teal-300",
                  "from-green-200 to-green-300",
                  "from-lime-200 to-lime-300",
                  "from-yellow-200 to-amber-300",
                  "from-orange-200 to-orange-300",
                  "from-red-200 to-red-300",
                  "from-rose-200 to-rose-300",
                  "from-pink-200 to-pink-300",
                ];

                return (
                  <button
                    key={level}
                    onClick={() => {
                      if (minDifficulty === maxDifficulty) {
                        // Single number case
                        if (level === minDifficulty) {
                          // Clicking same again resets to full range
                          setMinDifficulty(1);
                          setMaxDifficulty(10);
                        } else if (level < minDifficulty) {
                          setMinDifficulty(level);
                        } else {
                          setMaxDifficulty(level);
                        }
                      } else {
                        // Range case
                        if (level === minDifficulty && minDifficulty < maxDifficulty) {
                          setMinDifficulty(minDifficulty + 1);
                        } else if (level === maxDifficulty && maxDifficulty > minDifficulty) {
                          setMaxDifficulty(maxDifficulty - 1);
                        } else if (level < minDifficulty) {
                          setMinDifficulty(level);
                        } else if (level > maxDifficulty) {
                          setMaxDifficulty(level);
                        } else {
                          // Click inside range → collapse to that number
                          setMinDifficulty(level);
                          setMaxDifficulty(level);
                        }
                      }
                    }}
                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-150
            ${
              isSelected
                ? `text-gray-800 scale-110 shadow-inner bg-gradient-to-b ${intensityColors[i]} border border-gray-300 hover:brightness-95`
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}>
                    {level}
                  </button>
                );
              })}
            </div>

            <div className="text-center text-sm text-gray-600 mt-2">
              {minDifficulty === maxDifficulty ? (
                <>
                  Difficulty: <span className="font-medium">{minDifficulty}</span>
                </>
              ) : (
                <>
                  Range: <span className="font-medium">{minDifficulty}</span> –{" "}
                  <span className="font-medium">{maxDifficulty}</span>
                </>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-wrap justify-end gap-3 pt-2">
            <button
              onClick={handleNewQuestion}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition font-semibold">
              New Question
            </button>
            <button
              onClick={() => {
                setSelectedTags([]);
                setMinDifficulty(1);
                setMaxDifficulty(7);
              }}
              className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition font-semibold">
              Clear Filters
            </button>
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

          <div className="flex items-center justify-between mt-6 gap-3">
            {/* Left spacer to keep Next Question centered */}
            <div className="flex-1"></div>

            {/* Center button */}
            <button
              onClick={handleNewQuestion}
              className="flex-1 max-w-[180px] px-4 py-2 rounded-lg bg-green-600 text-white font-semibold shadow hover:bg-green-700 transition mx-auto">
              Next Question
            </button>

            {/* Right button */}
            <div className="flex-1 flex justify-end">
              <button
                onClick={openSuggestEdit}
                className="w-full max-w-[180px] px-4 py-2 rounded-lg bg-yellow-200 text-gray-800 font-medium shadow hover:bg-yellow-300 transition">
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
              <div className="flex items-center gap-3">
                <p className="font-medium text-gray-700">Difficulty:</p>

                <div className="grid grid-cols-10 gap-1">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleEditChange("difficulty", num)}
                      className={`px-2 py-1 rounded-md text-sm font-semibold transition border
                          ${
                            editValues.difficulty === num
                              ? "bg-blue-600 text-white border-blue-700 shadow"
                              : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
                          }
                        `}>
                      {num}
                    </button>
                  ))}
                </div>
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

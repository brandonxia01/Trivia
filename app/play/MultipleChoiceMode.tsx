"use client";

import { useEffect, useState } from "react";
import { Question } from "../api/trivia_questions/QuestionsDb";
import { bibleBookTags, getBooksForTag } from "../utils/BibleBookTags";
import BibleVerseSelector from "../components/BibleVerseSelector";
import toast from "react-hot-toast";

export default function MultipleChoiceModePage() {
  // Preload system
  const [currentQ, setCurrentQ] = useState<Question | null>(null);
  const [onDeckQ, setOnDeckQ] = useState<Question | null>(null);

  // UI state
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(true); // page-level loading while initial preload
  const [loadingNext, setLoadingNext] = useState(false); // when fetching next on-deck
  const [loadingAnswer, setLoadingAnswer] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Counts + filters
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [minDifficulty, setMinDifficulty] = useState(1);
  const [maxDifficulty, setMaxDifficulty] = useState(7);
  const [showFilters, setShowFilters] = useState(false);

  // Suggest edit states
  const [showSuggestEdit, setShowSuggestEdit] = useState(false);
  const [editValues, setEditValues] = useState({
    question: "",
    answer: "",
    multiple_choice: [] as string[],
    verse_references: [] as string[],
    difficulty: 1,
  });
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // Helpers
  function shuffleArray<T>(array: T[]): T[] {
    return array
      .map((value) => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value);
  }

  // Load one question and attach MC answers
  const loadOneCompleteQuestion = async (): Promise<Question> => {
    const books = selectedTags.flatMap(getBooksForTag);
    const res = await fetch("/api/trivia_questions/random", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ books, minDifficulty, maxDifficulty }),
    });

    if (!res.ok) {
      throw new Error("Failed to fetch question");
    }

    const data: Question = await res.json();

    // Generate MC answers
    try {
      const mcRes = await fetch("/api/trivia_questions/mc_answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: data.question, correctAnswer: data.answer }),
      });

      let multipleChoiceOptions: string[] = [];

      if (mcRes.ok) {
        const mcData = await mcRes.json();
        multipleChoiceOptions = shuffleArray([data.answer, ...(mcData.options || [])]);
      } else {
        console.warn("MC API failed, falling back to correct-only");
        multipleChoiceOptions = [data.answer];
      }

      data.multiple_choice_answers = [{ options: multipleChoiceOptions, correct: data.answer }];
    } catch (err) {
      console.error("Error generating MC options, fallback to correct only", err);
      data.multiple_choice_answers = [{ options: [data.answer], correct: data.answer }];
    }

    return data;
  };

  // Preload initial current + on-deck
  const preloadInitial = async () => {
    setLoading(true);
    setError(null);
    try {
      const q1 = await loadOneCompleteQuestion();
      const q2 = await loadOneCompleteQuestion();
      setCurrentQ(q1);
      setOnDeckQ(q2);

      // Reset UI state
      setSelectedOption("");
      setRevealed(false);
    } catch (err: any) {
      console.error("Initial preload failed:", err);
      setError(err.message || "Failed to load questions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // initial load
    preloadInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // note: if you want filters to refetch, you can add them as deps

  // Swap to on-deck and preload another in background
  const handleNextQuestion = async () => {
    if (!onDeckQ) {
      // if no on-deck, try to load one quickly
      setLoadingNext(true);
      try {
        const q = await loadOneCompleteQuestion();
        setCurrentQ(q);
      } catch (err) {
        console.error(err);
        setError("Failed to load next question.");
      } finally {
        setLoadingNext(false);
        setSelectedOption("");
        setRevealed(false);
      }
      return;
    }

    // Promote onDeck -> current immediately (instant)
    setCurrentQ(onDeckQ);
    setSelectedOption("");
    setRevealed(false);

    // Preload another onDeck in background
    setLoadingNext(true);
    try {
      const newOnDeck = await loadOneCompleteQuestion();
      setOnDeckQ(newOnDeck);
    } catch (err) {
      console.error("Failed to preload on-deck:", err);
      setOnDeckQ(null);
    } finally {
      setLoadingNext(false);
    }
  };

  // Reveal answer (user presses Reveal Answer)
  const handleReveal = async () => {
    if (!currentQ || revealed) return;
    setLoadingAnswer(true);
    setRevealed(true);

    const isCorrect = selectedOption === currentQ.answer;

    try {
      await fetch("/api/trivia_questions/answered", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: currentQ.id,
          correct: isCorrect,
        }),
      });
    } catch (err) {
      console.error("Failed to record attempt:", err);
    } finally {
      setLoadingAnswer(false);
    }
  };

  // Toggle tag helper
  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  // Suggest edit helpers (attach to currentQ)
  const openSuggestEdit = () => {
    if (!currentQ) return;
    setEditValues({
      question: currentQ.question,
      answer: currentQ.answer,
      multiple_choice: currentQ.multiple_choice_answers?.[0]?.options || [],
      verse_references: currentQ.verse_references || [],
      difficulty: currentQ.difficulty,
    });
    setShowSuggestEdit(true);
  };

  const handleEditChange = (field: string, value: any) => {
    setEditValues((prev) => ({ ...prev, [field]: value }));
  };

  const submitSuggestedEdit = async () => {
    if (!currentQ) return;
    setSubmittingEdit(true);
    try {
      const payload = {
        question_id: currentQ.id,
        question: editValues.question,
        answer: editValues.answer,
        multiple_choice_answers: editValues.multiple_choice.length
          ? [{ options: editValues.multiple_choice, correct: editValues.answer }]
          : [],
        verse_references: editValues.verse_references,
        difficulty: editValues.difficulty,
        attempts: currentQ.attempts,
        correct_attempts: currentQ.correct_attempts,
        upvotes: currentQ.upvotes,
        downvotes: currentQ.downvotes,
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

  // Derived convenience values for UI
  const currentOptions = currentQ?.multiple_choice_answers?.[0]?.options || [];

  // Rendering
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6 mb-40">
      <h1 className="text-2xl md:text-3xl font-semibold text-center text-gray-800">Welcome To Bible Trivia</h1>
      <h1 className="text-xl md:text-2xl font-semibold text-center text-gray-800">Multiple Choice Mode</h1>

      {/* Filter toggle */}
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
          <div className="text-center">
            <h1 className="text-xl font-bold text-gray-800">Question Filters</h1>
          </div>

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
                    className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-all duration-150 backdrop-blur-sm border ${
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

          <div>
            <h2 className="font-semibold text-gray-700 mb-3">Difficulty</h2>

            <div className="flex items-center justify-between gap-1 sm:gap-2 select-none">
              {[...Array(10)].map((_, i) => {
                const level = i + 1;
                const isSelected = level >= minDifficulty && level <= maxDifficulty;

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
                        if (level === minDifficulty) {
                          setMinDifficulty(1);
                          setMaxDifficulty(10);
                        } else if (level < minDifficulty) {
                          setMinDifficulty(level);
                        } else {
                          setMaxDifficulty(level);
                        }
                      } else {
                        if (level === minDifficulty && minDifficulty < maxDifficulty) {
                          setMinDifficulty(minDifficulty + 1);
                        } else if (level === maxDifficulty && maxDifficulty > minDifficulty) {
                          setMaxDifficulty(maxDifficulty - 1);
                        } else if (level < minDifficulty) {
                          setMinDifficulty(level);
                        } else if (level > maxDifficulty) {
                          setMaxDifficulty(level);
                        } else {
                          setMinDifficulty(level);
                          setMaxDifficulty(level);
                        }
                      }
                    }}
                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-150 ${
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

          <div className="flex flex-wrap justify-end gap-3 pt-2">
            <button
              onClick={handleNextQuestion}
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

      {/* Main card */}
      {loading ? (
        <div className="p-6 text-center">Loading questions...</div>
      ) : error ? (
        <div className="p-4 text-center text-red-500">{error}</div>
      ) : !currentQ ? (
        <div className="p-4 text-center">No question found.</div>
      ) : (
        <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
          <p className="text-lg font-medium">{currentQ.question}</p>
          <p className="text-md font-medium text-gray-500">{`Difficulty: ${currentQ.difficulty}`}</p>

          {/* MC Options */}
          {currentOptions.length > 0 && (
            <ul className="grid grid-cols-1 gap-2 mb-4 select-none">
              {currentOptions.map((opt) => {
                const isCorrect = opt === currentQ.answer;
                const isSelected = selectedOption === opt;

                // Determine styles
                const className = revealed
                  ? isCorrect
                    ? "bg-green-200 border-green-500 font-semibold text-gray-900 animate-pop"
                    : isSelected
                    ? "bg-red-200 border-red-500 font-semibold text-gray-900 animate-shake"
                    : "bg-gray-100 border-gray-300 text-gray-700 opacity-80"
                  : isSelected
                  ? "bg-blue-200 border-blue-400 font-semibold text-gray-900 animate-pop"
                  : "bg-gray-50 hover:bg-gray-100";

                // Determine icons
                let icon = "◻️";
                if (revealed) {
                  if (isCorrect) icon = "✅";
                  else if (isSelected) icon = "✖️";
                } else {
                  if (isSelected) icon = "👉";
                }

                return (
                  <li
                    key={opt}
                    className={`px-3 py-2 border rounded cursor-pointer text-center flex items-center justify-center gap-2 transition ${className}`}
                    onClick={() => {
                      if (revealed) return;
                      setSelectedOption(opt);
                    }}>
                    <span className="text-lg">{icon}</span>
                    <span>{opt}</span>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Reveal / Next controls */}
          <div className="mt-4 flex items-center justify-between w-full">
            {/* Centered Reveal / Next button */}
            <div className="flex-1"></div>
            <div className="flex-1">
              {!revealed ? (
                <button
                  onClick={handleReveal}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition font-semibold disabled:opacity-50">
                  {loadingAnswer ? "Revealing..." : "Reveal Answer"}
                </button>
              ) : (
                <button
                  onClick={handleNextQuestion}
                  disabled={loadingNext}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition font-semibold disabled:opacity-50">
                  {loadingNext ? "Loading next..." : "Next Question"}
                </button>
              )}
            </div>

            {/* Suggest Edit button (right aligned) */}
            <div className="flex justify-end ml-4">
              <button
                onClick={openSuggestEdit}
                className="bg-yellow-200 text-gray-800 px-4 py-2 rounded hover:bg-yellow-300 transition font-medium whitespace-nowrap">
                Suggest Edit
              </button>
            </div>
          </div>

          {/* Show verses once revealed */}
          {revealed && currentQ.verse_references?.length > 0 && (
            <div className="mt-4 text-gray-700">
              <p className="font-semibold mb-1">📖 Verse References:</p>
              <ul className="list-none space-y-1">
                {currentQ.verse_references.map((ref, i) => (
                  <li key={i}>{ref}</li>
                ))}
              </ul>
            </div>
          )}

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
                      className={`px-2 py-1 rounded-md text-sm font-semibold transition border ${
                        editValues.difficulty === num
                          ? "bg-blue-600 text-white border-blue-700 shadow"
                          : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
                      }`}>
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

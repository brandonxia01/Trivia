"use client";

import { useEffect, useState } from "react";
import { Question, MultipleChoiceAnswer } from "./api/trivia_questions/QuestionsDb";
import { bibleBookTags, getBooksForTag } from "./utils/BibleBookTags";
import BibleVerseSelector from "./components/BibleVerseSelector";

export default function RandomQuestionPage() {
  const [question, setQuestion] = useState<Question | null>(null);
  const [answerInput, setAnswerInput] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [upvotes, setUpvotes] = useState<number>(0);
  const [downvotes, setDownvotes] = useState<number>(0);
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
      setUpvotes(data.upvotes ?? 0);
      setDownvotes(data.downvotes ?? 0);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question) return;
    const isCorrect = answerInput.trim().toLowerCase() === question.answer.trim().toLowerCase();
    setFeedback(isCorrect ? "✅ Correct!" : `❌ Incorrect. Correct answer: ${question.answer}`);
  };

  const handleUpvote = () => setUpvotes((prev) => prev + 1);
  const handleDownvote = () => setDownvotes((prev) => prev + 1);
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
      <h1 className="text-3xl font-bold text-center">Trivia Question</h1>

      {/* Filter toggle button */}
      <div className="flex justify-end mb-2">
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
            <h2 className="font-semibold mb-2">Book Tags</h2>
            <div className="flex flex-wrap gap-2">
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

          <div className="flex gap-4 items-center">
            <label className="flex-1">
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
            <label className="flex-1">
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
            <button
              onClick={handleNewQuestion}
              className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition font-semibold">
              New Question
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
        <div className="bg-white p-6 rounded-xl shadow border border-gray-200 space-y-4">
          <p className="text-lg font-medium">{question.question}</p>

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
                onClick={() => setUpvotes((prev) => prev + 1)}
                className="flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200 transition">
                ▲ {upvotes}
              </button>
              <button
                onClick={() => setDownvotes((prev) => prev + 1)}
                className="flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200 transition">
                ▼ {downvotes}
              </button>
            </div>

            <button
              onClick={handleNewQuestion}
              className="bg-green-100 text-green-800 px-3 py-1 rounded hover:bg-green-200 transition font-semibold">
              Next Question
            </button>

            {/* Suggest Edit Button */}
            <button
              onClick={openSuggestEdit}
              className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded hover:bg-yellow-200 transition">
              Suggest Edit
            </button>
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

              <input
                type="number"
                min={1}
                max={10}
                placeholder="Difficulty"
                value={editValues.difficulty}
                onChange={(e) => handleEditChange("difficulty", Number(e.target.value))}
                className="w-20 border rounded px-2 py-1"
              />

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

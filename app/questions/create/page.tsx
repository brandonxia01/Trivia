"use client";

import { useState, useEffect } from "react";
import { MultipleChoiceAnswer } from "@/app/api/trivia_questions/QuestionsDb";
import BibleVerseSelector from "@/app/components/BibleVerseSelector";
import { prompt } from "@/app/utils/Prompts";
import { difficultyExamples } from "@/app/utils/Difficulties";
import { getBookObscurity, getRandomBibleVerse } from "@/app/utils/BibleUtils";

export default function CreateQuestionPage() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [difficulty, setDifficulty] = useState(1);
  const [verseReferences, setVerseReferences] = useState<string[]>([]);
  const [verseInput, setVerseInput] = useState("");
  const [multipleChoiceOptions, setMultipleChoiceOptions] = useState<string[]>([]);
  const [optionInput, setOptionInput] = useState("");
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const [basePrompt, setBasePrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // --- Duplicate checking ---
  const [duplicateMatches, setDuplicateMatches] = useState<any[]>([]);
  const [override, setOverride] = useState(false);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);

  // --- Tooltip ---
  const [showTooltip, setShowTooltip] = useState(false);
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  // --- Option and Verse handlers ---
  const addOption = () => {
    const trimmed = optionInput.trim();
    if (trimmed && !multipleChoiceOptions.includes(trimmed)) {
      setMultipleChoiceOptions([...multipleChoiceOptions, trimmed]);
      setOptionInput("");
    }
  };
  const removeOption = (option: string) => {
    setMultipleChoiceOptions(multipleChoiceOptions.filter((o) => o !== option));
  };
  const addVerseReference = () => {
    const trimmed = verseInput.trim();
    if (trimmed && !verseReferences.includes(trimmed)) {
      setVerseReferences([...verseReferences, trimmed]);
      setVerseInput("");
    }
  };
  const removeVerseReference = (ref: string) => {
    setVerseReferences(verseReferences.filter((v) => v !== ref));
  };

  // --- Check duplicates whenever question changes ---
  useEffect(() => {
    if (!question.trim()) {
      setDuplicateMatches([]);
      setOverride(false);
      return;
    }

    const timeout = setTimeout(async () => {
      setCheckingDuplicates(true);
      try {
        const res = await fetch("/api/trivia_questions/check_duplicate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question }),
        });
        const data = await res.json();
        setDuplicateMatches(data || []);
        setOverride(false);
      } catch (err) {
        console.error("Error checking duplicates:", err);
      } finally {
        setCheckingDuplicates(false);
      }
    }, 600);

    return () => clearTimeout(timeout);
  }, [question]);

  // --- Submit handler ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!question.trim() || !answer.trim()) {
      setMessage({ text: "Question and answer are required.", type: "error" });
      return;
    }
    if (multipleChoiceOptions.length > 0 && !multipleChoiceOptions.includes(answer.trim())) {
      setMessage({ text: "Answer must be one of the multiple-choice options.", type: "error" });
      return;
    }
    if (verseReferences.length === 0) {
      setMessage({ text: "At least one verse reference is required.", type: "error" });
      return;
    }
    if (duplicateMatches.length > 0 && !override) {
      setMessage({ text: "Duplicate questions detected. Confirm override to submit.", type: "error" });
      return;
    }

    const multipleChoiceAnswers: MultipleChoiceAnswer[] = multipleChoiceOptions.length
      ? [{ options: multipleChoiceOptions, correct: answer }]
      : [];

    try {
      const res = await fetch("/api/trivia_questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          answer,
          difficulty,
          verse_references: verseReferences,
          multiple_choice_answers: multipleChoiceAnswers,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ text: `Error: ${data.error}`, type: "error" });
        return;
      }

      setMessage({ text: `✅ Question created! ID: ${data.id}`, type: "success" });
      setQuestion("");
      setAnswer("");
      setDifficulty(1);
      setVerseReferences([]);
      setVerseInput("");
      setMultipleChoiceOptions([]);
      setOptionInput("");
      setDuplicateMatches([]);
      setBasePrompt("");
      setOverride(false);
    } catch (err: any) {
      setMessage({ text: `Error: ${err.message}`, type: "error" });
    }
  };

  // --- AI generation handler ---
  const handleGenerate = async () => {
    setIsGenerating(true);
    setMessage(null);
    try {
      const randomVerse = getRandomBibleVerse();
      const promptQuery = basePrompt ? basePrompt : `Easy question from ${randomVerse}`;
      const combinedPrompt = `${prompt(`User idea: ${promptQuery}`)}`;
      const res = await fetch("/api/trivia_questions/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: combinedPrompt }),
      });
      const response = await res.json();
      const dataStr = response.result;
      if (!res.ok) throw new Error(dataStr.error || "Failed to generate question.");

      let data;
      try {
        data = JSON.parse(dataStr);
      } catch (err) {
        console.error("Failed to parse generated question:", err);
        return;
      }

      setQuestion(data.question || "");
      setAnswer(data.answer || "");
      setDifficulty(data.difficulty || 1);
      setVerseReferences(data.verse_references || []);
      setMultipleChoiceOptions(data.multiple_choice_answers?.[0]?.options || []);
      setMessage({ text: "✨ Question generated successfully!", type: "success" });
    } catch (err: any) {
      setMessage({ text: `Generation failed: ${err.message}`, type: "error" });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl p-4 sm:p-6 overflow-x-hidden">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-center">Create a New Trivia Question</h1>

      {/* --- AI Generation Section --- */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 sm:p-6 mb-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-2">Generate with AI</h2>
        <p className="text-sm text-gray-600 mb-3">
          Optionally provide a topic or rough idea for your question (e.g., “A question about Paul’s conversion”). Leave
          blank for a random Bible trivia question.
        </p>
        <textarea
          value={basePrompt}
          onChange={(e) => setBasePrompt(e.target.value)}
          placeholder="Type your question idea here..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          rows={2}
        />
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full sm:w-auto bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50">
          {isGenerating ? "Generating..." : "✨ Generate Question"}
        </button>
      </div>

      {/* --- Manual Creation Form --- */}
      <form
        onSubmit={handleSubmit}
        className="space-y-6 bg-white shadow-lg rounded-2xl p-4 sm:p-6 border border-gray-200">
        {/* Question */}
        <div>
          <label className="block font-medium mb-1">Question</label>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="Enter your trivia question"
            rows={6}
            required
          />
        </div>

        {/* Duplicate warning */}
        {checkingDuplicates && <p className="text-gray-500">Checking for duplicate questions...</p>}
        {duplicateMatches.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-300 p-3 sm:p-4 rounded-xl space-y-3">
            <p className="font-semibold text-yellow-800 flex items-center gap-2">⚠️ Similar questions detected</p>
            <p className="text-sm text-gray-700">
              Your question may already exist in the database. Please review the similar questions below. If you still
              believe your question is unique, you can proceed to submit it.
            </p>
            <ul className="list-disc list-inside text-gray-800 space-y-1">
              {duplicateMatches.map((q) => (
                <li key={q.id} className="text-sm">
                  {q.question}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => setOverride(true)}
              disabled={override}
              className={`mt-3 px-4 py-2 rounded-lg font-medium transition ${
                override ? "bg-gray-300 text-gray-600" : "bg-yellow-600 text-white hover:bg-yellow-700"
              }`}>
              {override ? "✅ Marked as unique — you can now submit" : "My question is unique enough — let me continue"}
            </button>
          </div>
        )}

        {/* Answer */}
        <div>
          <label className="block font-medium mb-1">Answer</label>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="Enter the correct answer"
            rows={2}
            required
          />
        </div>

        {/* Difficulty */}
        <div className="relative max-w-sm space-y-2">
          {/* Label + Tooltip */}
          <label className="block font-medium flex items-center gap-2">
            <span className="text-gray-800">Difficulty</span>

            <div className="relative">
              <button
                type="button"
                onClick={() => (isMobile ? setShowTooltip(!showTooltip) : null)}
                onMouseEnter={() => !isMobile && setShowTooltip(true)}
                onMouseLeave={() => !isMobile && setShowTooltip(false)}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-gray-500 cursor-pointer"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z"
                  />
                </svg>
              </button>

              {showTooltip && (
                <div className="absolute left-6 top-0 w-72 sm:w-80 p-3 bg-gray-900 text-white text-xs rounded-xl shadow-lg z-20 animate-fadeIn">
                  {Object.entries(difficultyExamples).map(([level, desc]) => (
                    <div key={level} className="mb-1">
                      <strong>{level}:</strong> {desc}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </label>

          {/* Button Grid */}
          <div className="grid grid-cols-10 gap-1">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setDifficulty(num)}
                className={`py-1 rounded-lg text-sm font-medium transition border
          ${
            difficulty === num
              ? "bg-blue-600 text-white border-blue-700 shadow"
              : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
          }
        `}>
                {num}
              </button>
            ))}
          </div>
        </div>

        {/* Verse References */}
        <BibleVerseSelector selectedVerses={verseReferences} onChange={setVerseReferences} />

        {/* Multiple Choice */}
        <div>
          <label className="block font-medium mb-1">Multiple Choice Options (Optional)</label>
          <div className="flex flex-col sm:flex-row gap-2 mb-2">
            <input
              type="text"
              value={optionInput}
              onChange={(e) => setOptionInput(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Add an option"
            />
            <button
              type="button"
              onClick={addOption}
              className="bg-green-500 text-white px-4 py-3 rounded-lg hover:bg-green-600 transition">
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {multipleChoiceOptions.map((opt) => (
              <span
                key={opt}
                className={`px-3 py-1 rounded-full text-sm cursor-pointer transition ${
                  opt === answer
                    ? "bg-green-200 text-green-800 font-medium"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                onClick={() => removeOption(opt)}
                title="Click to remove">
                {opt} ✕
              </span>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={duplicateMatches.length > 0 && !override}
          className={`w-full py-3 rounded-lg font-semibold text-white ${
            duplicateMatches.length > 0 && !override ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
          }`}>
          Create Question
        </button>
      </form>

      {message && (
        <p className={`mt-4 text-center font-medium ${message.type === "success" ? "text-green-600" : "text-red-600"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}

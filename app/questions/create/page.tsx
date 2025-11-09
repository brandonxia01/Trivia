"use client";

import { useState, useEffect } from "react";
import { MultipleChoiceAnswer } from "@/app/api/trivia_questions/QuestionsDb";
import BibleVerseSelector from "@/app/components/BibleVerseSelector";
import { prompt } from "@/app/utils/Prompts";
import { difficultyExamples } from "@/app/utils/Difficulties";

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
        console.log(JSON.stringify(data));
        setDuplicateMatches(data || []);
        setOverride(false); // reset override if user changes question
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
      const combinedPrompt = `${prompt(`User idea: ${basePrompt || "(none given)"}`)}`;
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
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">Create a New Trivia Question</h1>

      {/* --- AI Generation Section --- */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-6">
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
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50">
          {isGenerating ? "Generating..." : "✨ Generate Question"}
        </button>
      </div>

      {/* --- Manual Creation Form --- */}
      <form onSubmit={handleSubmit} className="space-y-6 bg-white shadow-md rounded-2xl p-6 border border-gray-200">
        {/* Question */}
        <div>
          <label className="block font-medium mb-1">Question</label>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="Enter your trivia question"
            rows={8}
            required
          />
        </div>

        {/* Duplicate warning */}
        {checkingDuplicates && <p className="text-gray-500">Checking for duplicate questions...</p>}
        {duplicateMatches.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-300 p-3 rounded-lg space-y-2">
            <p className="font-medium text-yellow-800">⚠️ Similar questions detected:</p>
            <ul className="list-disc list-inside text-gray-700">
              {duplicateMatches.map((q) => (
                <li key={q.id}>{q.question}</li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => setOverride(true)}
              className="mt-2 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-700 transition">
              Override and submit anyway
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
        <div className="relative w-64">
          <label className="block font-medium mb-1 flex items-center space-x-1">
            <span>{`Difficulty (1–10)`}</span>
            <div className="relative group">
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
              <div
                className="absolute left-6 top-0 w-80 p-2 bg-gray-800 text-white text-xs rounded shadow-lg 
                      opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto 
                      transition-opacity z-10">
                {Object.entries(difficultyExamples).map(([level, desc]) => (
                  <div key={level}>
                    <strong>{level}:</strong> {desc}
                  </div>
                ))}
              </div>
            </div>
          </label>
          <input
            type="number"
            value={difficulty}
            min={1}
            max={10}
            onChange={(e) => setDifficulty(Number(e.target.value))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            required
          />
        </div>

        {/* Verse References */}
        <BibleVerseSelector selectedVerses={verseReferences} onChange={setVerseReferences} />

        {/* Multiple Choice */}
        <div>
          <label className="block font-medium mb-1">Multiple Choice Options (Optional)</label>
          <div className="flex gap-2 mb-2">
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
              className="bg-green-500 text-white px-4 rounded-lg hover:bg-green-600 transition">
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
          className={`w-full py-2 rounded-lg font-semibold text-white ${
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

"use client";

import { MultipleChoiceAnswer } from "@/app/api/trivia_questions/QuestionsDb";
import { useState } from "react";

export default function CreateQuestionPage() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [difficulty, setDifficulty] = useState(1);
  const [verseReferences, setVerseReferences] = useState<string[]>([]);
  const [verseInput, setVerseInput] = useState("");
  const [multipleChoiceOptions, setMultipleChoiceOptions] = useState<string[]>([]);
  const [optionInput, setOptionInput] = useState("");
  const [message, setMessage] = useState("");

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const multipleChoiceAnswers: MultipleChoiceAnswer[] = multipleChoiceOptions.length
      ? [{ options: multipleChoiceOptions, correct: answer }]
      : [];

    if (multipleChoiceOptions.length > 0 && !multipleChoiceOptions.includes(answer)) {
      setMessage("Answer must be one of the multiple-choice options.");
      return;
    }

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
        setMessage(`Error: ${data.error}`);
        return;
      }

      setMessage(`Question created! ID: ${data.id}`);
      setQuestion("");
      setAnswer("");
      setDifficulty(1);
      setVerseReferences([]);
      setVerseInput("");
      setMultipleChoiceOptions([]);
      setOptionInput("");
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Create a New Question</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium">Question</label>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block font-medium">Answer</label>
          <input
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block font-medium">Difficulty (1-10)</label>
          <input
            type="number"
            value={difficulty}
            min={1}
            max={10}
            onChange={(e) => setDifficulty(Number(e.target.value))}
            className="w-full border border-gray-300 rounded px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block font-medium">Verse References</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={verseInput}
              onChange={(e) => setVerseInput(e.target.value)}
              className="flex-1 border border-gray-300 rounded px-3 py-2"
              placeholder="Add a verse"
            />
            <button type="button" onClick={addVerseReference} className="bg-gray-200 px-3 rounded">
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {verseReferences.map((v) => (
              <span
                key={v}
                className="bg-blue-100 text-blue-800 px-2 py-1 rounded cursor-pointer"
                onClick={() => removeVerseReference(v)}
                title="Click to remove">
                {v} &times;
              </span>
            ))}
          </div>
        </div>

        <div>
          <label className="block font-medium">Multiple Choice Options</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={optionInput}
              onChange={(e) => setOptionInput(e.target.value)}
              className="flex-1 border border-gray-300 rounded px-3 py-2"
              placeholder="Add an option"
            />
            <button type="button" onClick={addOption} className="bg-gray-200 px-3 rounded">
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {multipleChoiceOptions.map((opt) => (
              <span
                key={opt}
                className="bg-green-100 text-green-800 px-2 py-1 rounded cursor-pointer"
                onClick={() => removeOption(opt)}
                title="Click to remove">
                {opt} &times;
              </span>
            ))}
          </div>
        </div>

        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Create Question
        </button>
      </form>

      {message && <p className="mt-4 text-center text-red-600">{message}</p>}
    </div>
  );
}

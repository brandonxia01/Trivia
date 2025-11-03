"use client";

import { useEffect, useState } from "react";

interface MultipleChoiceAnswer {
  options: string[];
  correct: string;
}

export interface SuggestedEdit {
  id: number;
  question_id: number;
  question: string;
  answer: string;
  multiple_choice_answers: MultipleChoiceAnswer[];
  verse_references: string[];
  difficulty: number;
  attempts: number;
  correct_attempts: number;
  upvotes: number;
  downvotes: number;
  verified: boolean;
}

export interface Question {
  id: number;
  question: string;
  answer: string;
  multiple_choice_answers: MultipleChoiceAnswer[];
  verse_references: string[];
  difficulty: number;
}

interface SuggestedEditWithOriginal {
  suggested: SuggestedEdit;
  original?: Question;
}

export default function SuggestedEditsPage() {
  const [edits, setEdits] = useState<SuggestedEditWithOriginal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch suggested edits + original questions via API
  const fetchEdits = async () => {
    setLoading(true);
    try {
      const resEdits = await fetch("/api/trivia_questions/suggested_edits");
      if (!resEdits.ok) throw new Error("Failed to fetch suggested edits");
      const editsData: SuggestedEdit[] = await resEdits.json();

      const resQuestions = await fetch("/api/trivia_questions");
      if (!resQuestions.ok) throw new Error("Failed to fetch questions");
      const allQuestions: Question[] = await resQuestions.json();

      const combined: SuggestedEditWithOriginal[] = editsData.map((edit) => ({
        suggested: edit,
        original: allQuestions.find((q) => q.id === edit.question_id),
      }));

      setEdits(combined);
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEdits();
  }, []);

  const handleReject = async (editId: number) => {
    if (!confirm("Are you sure you want to reject this suggested edit?")) return;
    try {
      const res = await fetch(`/api/trivia_questions/suggested_edits?id=${editId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete suggested edit");
      setEdits((prev) => prev.filter((e) => e.suggested.id !== editId));
    } catch (err: any) {
      alert(`Failed to reject edit: ${err.message}`);
    }
  };

  const handleConfirm = async (edit: SuggestedEditWithOriginal) => {
    if (!edit.original) return;
    if (!confirm("Confirm this suggested edit? It will update the original question.")) return;

    try {
      // Update the original question via API
      const resUpdate = await fetch(`/api/trivia_questions/suggested_edits`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: edit.suggested.id,
          updateQuestionData: {
            question_id: edit.original.id,
            question: edit.suggested.question,
            answer: edit.suggested.answer,
            multiple_choice_answers: edit.suggested.multiple_choice_answers,
            verse_references: edit.suggested.verse_references,
            difficulty: edit.suggested.difficulty,
          },
        }),
      });
      if (!resUpdate.ok) throw new Error("Failed to update question");

      // Delete the suggested edit
      const resDelete = await fetch(`/api/trivia_questions/suggested_edits?id=${edit.suggested.id}`, {
        method: "DELETE",
      });
      if (!resDelete.ok) throw new Error("Failed to delete suggested edit");

      // Remove from local state
      setEdits((prev) => prev.filter((e) => e.suggested.id !== edit.suggested.id));
    } catch (err: any) {
      alert(`Failed to confirm edit: ${err.message}`);
    }
  };

  if (loading) return <div className="p-4 text-center">Loading suggested edits...</div>;
  if (error) return <div className="p-4 text-center text-red-500">{error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Suggested Edits</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-2">Edit ID</th>
              <th className="border border-gray-300 px-4 py-2">Original Question</th>
              <th className="border border-gray-300 px-4 py-2">Suggested Question</th>
              <th className="border border-gray-300 px-4 py-2">Original Answer</th>
              <th className="border border-gray-300 px-4 py-2">Suggested Answer</th>
              <th className="border border-gray-300 px-4 py-2">Original Multiple Choice</th>
              <th className="border border-gray-300 px-4 py-2">Suggested Multiple Choice</th>
              <th className="border border-gray-300 px-4 py-2">Original Difficulty</th>
              <th className="border border-gray-300 px-4 py-2">Suggested Difficulty</th>
              <th className="border border-gray-300 px-4 py-2">Original Verses</th>
              <th className="border border-gray-300 px-4 py-2">Suggested Verses</th>
              <th className="border border-gray-300 px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {edits.map(({ suggested, original }) => (
              <tr key={suggested.id} className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-2">{suggested.id}</td>
                <td className="border border-gray-300 px-4 py-2">{original?.question || "—"}</td>
                <td className="border border-gray-300 px-4 py-2">{suggested.question}</td>
                <td className="border border-gray-300 px-4 py-2">{original?.answer || "—"}</td>
                <td className="border border-gray-300 px-4 py-2">{suggested.answer}</td>
                <td className="border border-gray-300 px-4 py-2">
                  {original?.multiple_choice_answers.length
                    ? original.multiple_choice_answers.map((m) => m.options.join(", ")).join(" | ")
                    : "—"}
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  {suggested.multiple_choice_answers.length
                    ? suggested.multiple_choice_answers.map((m) => m.options.join(", ")).join(" | ")
                    : "—"}
                </td>
                <td className="border border-gray-300 px-4 py-2">{original?.difficulty || "—"}</td>
                <td className="border border-gray-300 px-4 py-2">{suggested.difficulty}</td>
                <td className="border border-gray-300 px-4 py-2">
                  {original?.verse_references.length ? original.verse_references.join(", ") : "—"}
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  {suggested.verse_references.length ? suggested.verse_references.join(", ") : "—"}
                </td>
                <td className="border border-gray-300 px-4 py-2 flex gap-2">
                  <button
                    onClick={() => handleConfirm({ suggested, original })}
                    className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 transition">
                    Confirm
                  </button>
                  <button
                    onClick={() => handleReject(suggested.id)}
                    className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition">
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

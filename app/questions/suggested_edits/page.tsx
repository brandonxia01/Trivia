"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

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
      toast.error(`Failed to reject edit: ${err.message}`);
    }
  };

  const handleConfirm = async (edit: SuggestedEditWithOriginal) => {
    if (!edit.original) return;
    if (!confirm("Confirm this suggested edit? It will update the original question.")) return;

    try {
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

      const resDelete = await fetch(`/api/trivia_questions/suggested_edits?id=${edit.suggested.id}`, {
        method: "DELETE",
      });
      if (!resDelete.ok) throw new Error("Failed to delete suggested edit");

      setEdits((prev) => prev.filter((e) => e.suggested.id !== edit.suggested.id));
    } catch (err: any) {
      toast.error(`Failed to confirm edit: ${err.message}`);
    }
  };

  const highlightNewOnly = (oldVal: string | number, newVal: string | number) => {
    if (oldVal === newVal) return <span>{newVal}</span>;
    return (
      <span>
        {oldVal} → <span className="bg-yellow-100 px-1 rounded">{newVal}</span>
      </span>
    );
  };

  const arrayHighlightNewOnly = (oldArr: string[], newArr: string[]) => {
    const oldStr = oldArr.join(", ") || "—";
    const newStr = newArr.join(", ") || "—";
    if (oldStr === newStr) return <span>{newStr}</span>;
    return (
      <span>
        {oldStr} → <span className="bg-yellow-100 px-1 rounded">{newStr}</span>
      </span>
    );
  };

  if (loading) return <div className="p-4 text-center">Loading suggested edits...</div>;
  if (error) return <div className="p-4 text-center text-red-500">{error}</div>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold mb-4">Suggested Edits</h1>

      {edits.map(({ suggested, original }) => (
        <div key={suggested.id} className="bg-white shadow-sm rounded-xl border border-gray-200 p-4 space-y-2">
          {/* Verified Icon */}
          <p className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <strong>Edit ID:</strong> {suggested.id}{" "}
            {suggested.verified ? (
              <span className="text-green-500">✔️ Verified</span>
            ) : (
              <span className="text-yellow-500 animate-pulse">⏳ Pending</span>
            )}
          </p>

          <p className="text-sm text-gray-600">
            <strong>Question:</strong>{" "}
            {original ? highlightNewOnly(original.question, suggested.question) : suggested.question}
          </p>

          <p className="text-sm text-gray-600">
            <strong>Answer:</strong> {original ? highlightNewOnly(original.answer, suggested.answer) : suggested.answer}
          </p>

          <p className="text-sm text-gray-600">
            <strong>Multiple Choice:</strong>{" "}
            {original
              ? arrayHighlightNewOnly(
                  original.multiple_choice_answers.flatMap((m) => m.options),
                  suggested.multiple_choice_answers.flatMap((m) => m.options)
                )
              : suggested.multiple_choice_answers.flatMap((m) => m.options).join(", ")}
          </p>

          <p className="text-sm text-gray-600">
            <strong>Difficulty:</strong>{" "}
            {original ? highlightNewOnly(original.difficulty, suggested.difficulty) : suggested.difficulty}
          </p>

          <p className="text-sm text-gray-600">
            <strong>Verses:</strong>{" "}
            {original
              ? arrayHighlightNewOnly(original.verse_references, suggested.verse_references)
              : suggested.verse_references.join(", ")}
          </p>

          <div className="flex gap-2 pt-2 flex-wrap">
            <button
              onClick={() => handleConfirm({ suggested, original })}
              className="bg-green-500 text-white px-3 py-1 rounded-md text-sm hover:bg-green-600">
              Confirm
            </button>
            <button
              onClick={() => handleReject(suggested.id)}
              className="bg-red-500 text-white px-3 py-1 rounded-md text-sm hover:bg-red-600">
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

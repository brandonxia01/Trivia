"use client";

import { useEffect, useState } from "react";
import { Question, MultipleChoiceAnswer } from "../api/trivia_questions/QuestionsDb";

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<Partial<Question>>({});

  useEffect(() => {
    async function fetchQuestions() {
      try {
        const res = await fetch("/api/trivia_questions");
        if (!res.ok) throw new Error("Failed to fetch questions");
        const data: Question[] = await res.json();
        setQuestions(data);
      } catch (err: any) {
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchQuestions();
  }, []);

  const handleVerify = async (id: number) => {
    try {
      const res = await fetch(`/api/trivia_questions/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Failed to verify question");

      setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, verified: true } : q)));
    } catch (err: any) {
      alert(`Verification failed: ${err.message}`);
    }
  };

  const startEdit = (q: Question) => {
    setEditingId(q.id);
    setEditValues({ ...q }); // copy current values
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValues({});
  };

  const confirmEdit = async () => {
    if (!editingId) return;

    try {
      const res = await fetch("/api/trivia_questions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editValues),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update");

      setQuestions((prev) =>
        prev.map((q) => (q.id === editingId ? { ...(q as Question), ...(editValues as Question) } : q))
      );

      setEditingId(null);
      setEditValues({});
    } catch (err: any) {
      alert(`Update failed: ${err.message}`);
    }
  };

  const handleChange = (field: keyof Question, value: any) => {
    setEditValues((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) return <div className="p-4 text-center">Loading questions...</div>;
  if (error) return <div className="p-4 text-center text-red-500">{error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Trivia Questions</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-2 text-left">ID</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Question</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Answer</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Multiple Choice</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Verse References</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Difficulty</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Attempts</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Correct Attempts</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Upvotes</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Downvotes</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Verified</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Edit</th>
            </tr>
          </thead>
          <tbody>
            {questions.map((q) => {
              const isEditing = editingId === q.id;
              return (
                <tr key={q.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2">{q.id}</td>

                  {/* Question */}
                  <td className="border border-gray-300 px-4 py-2">
                    {isEditing ? (
                      <textarea
                        value={editValues.question || ""}
                        onChange={(e) => handleChange("question", e.target.value)}
                        className="w-full border border-gray-300 rounded px-2 py-1 resize-y"
                        rows={3}
                      />
                    ) : (
                      q.question
                    )}
                  </td>

                  {/* Answer */}
                  <td className="border border-gray-300 px-4 py-2">
                    {isEditing ? (
                      <textarea
                        value={editValues.answer || ""}
                        onChange={(e) => handleChange("answer", e.target.value)}
                        className="w-full border border-gray-300 rounded px-2 py-1 resize-y"
                        rows={2}
                      />
                    ) : (
                      q.answer
                    )}
                  </td>

                  {/* Multiple Choice */}
                  <td className="border border-gray-300 px-4 py-2">
                    {isEditing ? (
                      <textarea
                        value={editValues.multiple_choice_answers?.[0]?.options.join(", ") || ""}
                        onChange={(e) =>
                          handleChange("multiple_choice_answers", [
                            { options: e.target.value.split(",").map((o) => o.trim()) },
                          ])
                        }
                        className="w-full border border-gray-300 rounded px-2 py-1 resize-y"
                        rows={2}
                      />
                    ) : q.multiple_choice_answers.length > 0 ? (
                      q.multiple_choice_answers.map((item) => item.options.join(", ")).join(" | ")
                    ) : (
                      "—"
                    )}
                  </td>

                  {/* Verse References */}
                  <td className="border border-gray-300 px-4 py-2">
                    {isEditing ? (
                      <textarea
                        value={editValues.verse_references?.join(", ") || ""}
                        onChange={(e) =>
                          handleChange(
                            "verse_references",
                            e.target.value.split(",").map((v) => v.trim())
                          )
                        }
                        className="w-full border border-gray-300 rounded px-2 py-1 resize-y"
                        rows={2}
                      />
                    ) : q.verse_references.length > 0 ? (
                      q.verse_references.join(", ")
                    ) : (
                      "—"
                    )}
                  </td>

                  {/* Difficulty */}
                  <td className="border border-gray-300 px-4 py-2">
                    {isEditing ? (
                      <input
                        type="number"
                        value={editValues.difficulty ?? q.difficulty}
                        onChange={(e) => handleChange("difficulty", Number(e.target.value))}
                        className="w-full border border-gray-300 rounded px-2 py-1"
                      />
                    ) : (
                      q.difficulty
                    )}
                  </td>

                  {/* Attempts */}
                  <td className="border border-gray-300 px-4 py-2">
                    {isEditing ? (
                      <input
                        type="number"
                        value={editValues.attempts ?? q.attempts}
                        onChange={(e) => handleChange("attempts", Number(e.target.value))}
                        className="w-full border border-gray-300 rounded px-2 py-1"
                      />
                    ) : (
                      q.attempts
                    )}
                  </td>

                  {/* Correct Attempts */}
                  <td className="border border-gray-300 px-4 py-2">
                    {isEditing ? (
                      <input
                        type="number"
                        value={editValues.correct_attempts ?? q.correct_attempts}
                        onChange={(e) => handleChange("correct_attempts", Number(e.target.value))}
                        className="w-full border border-gray-300 rounded px-2 py-1"
                      />
                    ) : (
                      q.correct_attempts
                    )}
                  </td>

                  {/* Upvotes */}
                  <td className="border border-gray-300 px-4 py-2">
                    {isEditing ? (
                      <input
                        type="number"
                        value={editValues.upvotes ?? q.upvotes}
                        onChange={(e) => handleChange("upvotes", Number(e.target.value))}
                        className="w-full border border-gray-300 rounded px-2 py-1"
                      />
                    ) : (
                      q.upvotes
                    )}
                  </td>

                  {/* Downvotes */}
                  <td className="border border-gray-300 px-4 py-2">
                    {isEditing ? (
                      <input
                        type="number"
                        value={editValues.downvotes ?? q.downvotes}
                        onChange={(e) => handleChange("downvotes", Number(e.target.value))}
                        className="w-full border border-gray-300 rounded px-2 py-1"
                      />
                    ) : (
                      q.downvotes
                    )}
                  </td>

                  {/* Verified */}
                  <td className="border border-gray-300 px-4 py-2">
                    {q.verified ? (
                      <span className="text-green-600 font-semibold">✔ Verified</span>
                    ) : (
                      <button
                        disabled={q.verified}
                        onClick={() => handleVerify(q.id)}
                        className={`px-3 py-1 rounded ${
                          q.verified ? "bg-gray-300 text-gray-600" : "bg-green-500 text-white hover:bg-green-600"
                        }`}>
                        {q.verified ? "Verified" : "Verify"}
                      </button>
                    )}
                  </td>

                  {/* Edit column */}
                  <td className="border border-gray-300 px-4 py-2">
                    {isEditing ? (
                      <div className="flex gap-2">
                        <button
                          onClick={confirmEdit}
                          className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600">
                          Confirm
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="bg-gray-300 text-gray-700 px-3 py-1 rounded hover:bg-gray-400">
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => startEdit(q)} className="text-gray-500 hover:text-gray-700" title="Edit">
                        ✏️
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

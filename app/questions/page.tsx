"use client";

import { useEffect, useState } from "react";
import { Question, MultipleChoiceAnswer } from "../api/trivia_questions/QuestionsDb";

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<Partial<Question>>({});
  const [sortConfig, setSortConfig] = useState<{ key: keyof Question; direction: "asc" | "desc" } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

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
    setEditValues({ ...q });
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

  // Sorting handler
  const handleSort = (key: keyof Question) => {
    setSortConfig((prev) => {
      if (prev && prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  const sortedQuestions = [...questions].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;

    const aVal = a[key];
    const bVal = b[key];

    if (typeof aVal === "number" && typeof bVal === "number") return direction === "asc" ? aVal - bVal : bVal - aVal;
    if (typeof aVal === "boolean" && typeof bVal === "boolean")
      return direction === "asc" ? Number(aVal) - Number(bVal) : Number(bVal) - Number(aVal);
    if (typeof aVal === "string" && typeof bVal === "string")
      return direction === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);

    return 0;
  });

  const totalPages = Math.ceil(sortedQuestions.length / pageSize);
  const paginatedQuestions = sortedQuestions.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getSortArrow = (key: keyof Question) => {
    if (!sortConfig || sortConfig.key !== key) return "⇅";
    return sortConfig.direction === "asc" ? "▲" : "▼";
  };

  if (loading) return <div className="p-4 text-center">Loading questions...</div>;
  if (error) return <div className="p-4 text-center text-red-500">{error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Trivia Questions</h1>
      {/* Modern Pagination controls */}
      <div className="flex justify-center items-center mt-6 gap-2 flex-wrap pb-4">
        {/* Prev button */}
        <button
          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
          disabled={currentPage === 1}
          className="px-4 py-2 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 text-gray-800 hover:from-gray-200 hover:to-gray-300 disabled:opacity-50 shadow-sm transition-all duration-200 transform hover:-translate-y-0.5">
          &larr; Prev
        </button>

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-3 py-1 rounded-lg font-medium transition-all duration-200 ${
                currentPage === page
                  ? "bg-blue-600 text-white shadow-lg transform scale-105"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm hover:-translate-y-0.5"
              }`}>
              {page}
            </button>
          ))}
        </div>

        {/* Next button */}
        <button
          onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="px-4 py-2 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 text-gray-800 hover:from-gray-200 hover:to-gray-300 disabled:opacity-50 shadow-sm transition-all duration-200 transform hover:-translate-y-0.5">
          Next &rarr;
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full table-auto border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100 text-left">
              {[
                "id",
                "question",
                "answer",
                "multiple_choice_answers",
                "verse_references",
                "difficulty",
                "attempts",
                "correct_attempts",
                "upvotes",
                "downvotes",
                "verified",
              ].map((key) => (
                <th
                  key={key}
                  className="border border-gray-300 px-3 py-2 cursor-pointer select-none hover:bg-gray-200"
                  onClick={() => handleSort(key as keyof Question)}>
                  <div className="flex items-center justify-between">
                    <span className="capitalize">{key.replace("_", " ")}</span>
                    <span className="text-xs">{getSortArrow(key as keyof Question)}</span>
                  </div>
                </th>
              ))}
              <th className="border border-gray-300 px-3 py-2">Edit</th>
            </tr>
          </thead>

          <tbody>
            {paginatedQuestions.map((q) => {
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
                      <span className="text-green-600 font-semibold">✔</span>
                    ) : (
                      <button
                        disabled={q.verified}
                        onClick={() => handleVerify(q.id)}
                        className={`px-3 py-1 rounded ${
                          q.verified ? "bg-gray-300 text-gray-600" : "bg-green-500 text-white hover:bg-green-600"
                        }`}>
                        Verify
                      </button>
                    )}
                  </td>

                  {/* Edit */}
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

      {/* Modern Pagination controls */}
      <div className="flex justify-center items-center mt-6 gap-2 flex-wrap">
        {/* Prev button */}
        <button
          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
          disabled={currentPage === 1}
          className="px-4 py-2 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 text-gray-800 hover:from-gray-200 hover:to-gray-300 disabled:opacity-50 shadow-sm transition-all duration-200 transform hover:-translate-y-0.5">
          &larr; Prev
        </button>

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-3 py-1 rounded-lg font-medium transition-all duration-200 ${
                currentPage === page
                  ? "bg-blue-600 text-white shadow-lg transform scale-105"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm hover:-translate-y-0.5"
              }`}>
              {page}
            </button>
          ))}
        </div>

        {/* Next button */}
        <button
          onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="px-4 py-2 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 text-gray-800 hover:from-gray-200 hover:to-gray-300 disabled:opacity-50 shadow-sm transition-all duration-200 transform hover:-translate-y-0.5">
          Next &rarr;
        </button>
      </div>
    </div>
  );
}

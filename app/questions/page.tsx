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

  useEffect(() => {
    setCurrentPage(1);
  }, [sortConfig?.key, sortConfig?.direction]);

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

      <div className="hidden md:block overflow-x-auto">
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
      {/* Mobile-friendly sort controls */}
      <div className="block md:hidden mb-4 p-3 bg-white rounded-xl shadow-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <span>Sort by:</span>
          <select
            value={sortConfig?.key || "id"}
            onChange={(e) =>
              setSortConfig((prev) => ({
                key: e.target.value as keyof Question,
                direction: prev?.direction || "asc",
              }))
            }
            className="ml-1 border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm transition">
            <option value="id">ID</option>
            <option value="difficulty">Difficulty</option>
            <option value="attempts">Attempts</option>
            <option value="correct_attempts">Correct Attempts</option>
          </select>
        </label>

        <button
          onClick={() =>
            setSortConfig((prev) =>
              prev ? { ...prev, direction: prev.direction === "asc" ? "desc" : "asc" } : { key: "id", direction: "asc" }
            )
          }
          className="flex items-center gap-1 bg-gradient-to-br from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-800 px-3 py-1 rounded-lg text-sm font-medium shadow-sm transition transform hover:-translate-y-0.5">
          {sortConfig?.direction === "asc" ? (
            <>
              Ascending <span className="text-xs">↑</span>
            </>
          ) : (
            <>
              Descending <span className="text-xs">↓</span>
            </>
          )}
        </button>
      </div>

      {/* Mobile-friendly cards */}
<div className="block md:hidden space-y-4">
  {paginatedQuestions.map((q) => {
    const isEditing = editingId === q.id;

    return (
      <div key={q.id} className="bg-white shadow-sm rounded-xl border border-gray-200 p-4 space-y-3">
        {/* Question */}
        {isEditing ? (
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Question</label>
            <textarea
              value={editValues.question || ""}
              onChange={(e) => handleChange("question", e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1 resize-y"
              rows={3}
            />
          </div>
        ) : (
          <p className="text-sm font-semibold text-gray-800">{q.question}</p>
        )}

        {/* Answer */}
        {isEditing ? (
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Answer</label>
            <textarea
              value={editValues.answer || ""}
              onChange={(e) => handleChange("answer", e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1 resize-y"
              rows={2}
            />
          </div>
        ) : (
          <p className="text-sm text-gray-600">
            <strong>Answer:</strong> {q.answer}
          </p>
        )}

        {/* Difficulty */}
        {isEditing ? (
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Difficulty</label>
            <input
              type="number"
              value={editValues.difficulty ?? q.difficulty}
              onChange={(e) => handleChange("difficulty", Number(e.target.value))}
              className="w-full border border-gray-300 rounded px-2 py-1"
            />
          </div>
        ) : (
          <p className="text-sm text-gray-600">
            <strong>Difficulty:</strong> {q.difficulty}
          </p>
        )}

        {/* Verse References */}
        {isEditing ? (
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Verse References</label>
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
              placeholder="Comma-separated verses"
            />
          </div>
        ) : (
          <p className="text-sm text-gray-600">
            <strong>Verses:</strong> {q.verse_references.length > 0 ? q.verse_references.join(", ") : "—"}
          </p>
        )}

        {/* Multiple Choice */}
        {isEditing ? (
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Multiple Choice Options</label>
            <textarea
              value={editValues.multiple_choice_answers?.[0]?.options.join(", ") || ""}
              onChange={(e) =>
                handleChange("multiple_choice_answers", [
                  { options: e.target.value.split(",").map((o) => o.trim()) },
                ])
              }
              className="w-full border border-gray-300 rounded px-2 py-1 resize-y"
              rows={2}
              placeholder="Comma-separated options"
            />
          </div>
        ) : q.multiple_choice_answers.length > 0 ? (
          <p className="text-sm text-gray-600">
            <strong>Options:</strong>{" "}
            {q.multiple_choice_answers.map((item) => item.options.join(", ")).join(" | ")}
          </p>
        ) : null}

        {/* Stats and Verified */}
        <div className="grid grid-cols-2 gap-2">
          <p className="text-sm text-gray-600">
            <strong>Attempts:</strong> {isEditing ? (
              <input
                type="number"
                value={editValues.attempts ?? q.attempts}
                onChange={(e) => handleChange("attempts", Number(e.target.value))}
                className="border border-gray-300 rounded px-2 py-1 w-full"
              />
            ) : (
              q.attempts
            )}
          </p>

          <p className="text-sm text-gray-600">
            <strong>Correct:</strong> {isEditing ? (
              <input
                type="number"
                value={editValues.correct_attempts ?? q.correct_attempts}
                onChange={(e) => handleChange("correct_attempts", Number(e.target.value))}
                className="border border-gray-300 rounded px-2 py-1 w-full"
              />
            ) : (
              q.correct_attempts
            )}
          </p>

          <p className="text-sm text-gray-600">
            <strong>Upvotes:</strong> {isEditing ? (
              <input
                type="number"
                value={editValues.upvotes ?? q.upvotes}
                onChange={(e) => handleChange("upvotes", Number(e.target.value))}
                className="border border-gray-300 rounded px-2 py-1 w-full"
              />
            ) : (
              q.upvotes
            )}
          </p>

          <p className="text-sm text-gray-600">
            <strong>Downvotes:</strong> {isEditing ? (
              <input
                type="number"
                value={editValues.downvotes ?? q.downvotes}
                onChange={(e) => handleChange("downvotes", Number(e.target.value))}
                className="border border-gray-300 rounded px-2 py-1 w-full"
              />
            ) : (
              q.downvotes
            )}
          </p>

          {/* Verified Status */}
          <p className="text-sm text-gray-600 col-span-2 flex items-center gap-1">
            <strong>Status:</strong>{" "}
            {q.verified ? (
              <span className="text-green-600 font-semibold">✔ Verified</span>
            ) : (
              <span className="text-yellow-600 font-semibold flex items-center gap-1 animate-pulse">
                ⏳ Pending
              </span>
            )}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 pt-2">
          {!isEditing && !q.verified && (
            <button
              onClick={() => handleVerify(q.id)}
              className="bg-green-500 text-white px-3 py-1 rounded-md text-sm hover:bg-green-600"
            >
              Verify
            </button>
          )}

          {!isEditing && (
            <button
              onClick={() => startEdit(q)}
              className="bg-blue-500 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-600"
            >
              Edit
            </button>
          )}

          {isEditing && (
            <>
              <button
                onClick={confirmEdit}
                className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700"
              >
                Submit
              </button>
              <button
                onClick={cancelEdit}
                className="bg-gray-300 text-gray-700 px-3 py-1 rounded-md text-sm hover:bg-gray-400"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
    );
  })}
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

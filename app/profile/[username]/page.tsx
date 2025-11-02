"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Question } from "@/app/api/trivia_questions/QuestionsDb";

interface UserProfile {
  username: string;
  email: string;
  createdAt: string;
}

export default function UserProfilePage() {
  const params = useParams();
  const username = params.username as string;

  const [user, setUser] = useState<UserProfile | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      try {
        // Fetch user info
        const resUser = await fetch(`/api/users/${username}`); // fix
        if (!resUser.ok) throw new Error("Failed to fetch user profile");
        const userData: UserProfile = await resUser.json();
        setUser(userData);

        // Fetch their created questions
        // const resQuestions = await fetch(`/api/trivia_questions?createdBy=${username}`); // fix or remove
        // if (!resQuestions.ok) throw new Error("Failed to fetch user's questions");
        // const questionData: Question[] = await resQuestions.json();
        // setQuestions(questionData);
      } catch (err: any) {
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [username]);

  if (loading) return <div className="p-6 text-center">Loading profile...</div>;
  if (error) return <div className="p-6 text-center text-red-500">{error}</div>;
  if (!user) return <div className="p-6 text-center">User not found.</div>;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      {/* User Info */}
      <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
        <h1 className="text-2xl font-bold mb-2">{user.username}</h1>
        <p className="text-gray-600">Email: {user.email}</p>
        <p className="text-gray-500 text-sm">Joined: {new Date(user.createdAt).toLocaleDateString()}</p>
      </div>

      {/* User's Questions */}
      <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
        <h2 className="text-xl font-semibold mb-4">{user.username}'s Questions</h2>
        {questions.length === 0 ? (
          <p className="text-gray-500">No questions created yet.</p>
        ) : (
          <ul className="space-y-4">
            {questions.map((q) => (
              <li key={q.id} className="border p-4 rounded hover:shadow-md transition">
                <p className="font-medium mb-2">{q.question}</p>
                <p className="text-gray-700 mb-2">
                  Answer: <span className="font-semibold">{q.answer}</span>
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>Upvotes: {q.upvotes ?? 0}</span>
                  <span>Downvotes: {q.downvotes ?? 0}</span>
                </div>
                <div className="mt-2 flex gap-2">
                  <button
                    className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition text-sm"
                    onClick={() => alert("Suggest edits clicked!")}>
                    Suggest Edit
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
